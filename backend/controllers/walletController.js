const db = require('../db');
const { logActivity } = require('../services/logger');
const notificationService = require('../services/notificationService');
const paystackService = require('../services/paystack');
const CONFIG = require('../config/constants');

// Initialize Deposit (Paystack)
const initializeDeposit = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;
        const userEmail = req.user.email;

        if (!amount || amount < CONFIG.MIN_DEPOSIT_GHC) {
            return res.status(400).json({ message: `Minimum deposit amount is ${CONFIG.CURRENCY} ${CONFIG.MIN_DEPOSIT_GHC.toFixed(2)}` });
        }

        // Note: User asked to remove fees, so we set fee to 0 or use CONFIG if he changes his mind
        // For now, let's keep it consistent with the "remove fees" request
        const fee = 0;
        const totalAmount = Number(amount) + Number(fee);

        const metadata = {
            user_id: userId,
            purpose: 'wallet_funding',
            requested_amount: amount,
            fee: fee
        };

        const paystackData = await paystackService.initializeTransaction(userEmail, totalAmount, metadata);

        // Record pending transaction
        await db.query(
            'INSERT INTO transactions (user_id, type, purpose, amount, status, reference, metadata, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [userId, 'credit', 'wallet_funding', amount, 'initialized', paystackData.reference, JSON.stringify(metadata), 'paystack']
        );

        res.json({
            authorizationUrl: paystackData.authorization_url,
            reference: paystackData.reference,
            fee,
            totalAmount
        });
    } catch (error) {
        console.error('Deposit Init Error:', error);
        res.status(500).json({ message: 'Failed to initialize deposit', error: error.message });
    }
};

// Get wallet balance
const getBalance = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT wallet_balance FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.json({ balance: 0 });
        }

        res.json({
            balance: parseFloat(result.rows[0].wallet_balance) || 0
        });

    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({ error: 'Failed to get balance' });
    }
};

// Fund wallet (adapted from user snippet for PostgreSQL)
const fundWallet = async (req, res) => {
    try {
        const { amount, reference } = req.body;
        const userId = req.user.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Check if this reference has already been processed in transactions or deposits
            const checkRef = await client.query(
                'SELECT id FROM transactions WHERE reference = $1 AND status = \'success\'',
                [reference]
            );

            if (checkRef.rows.length > 0) {
                const userRes = await client.query('SELECT wallet_balance FROM users WHERE id = $1', [userId]);
                await client.query('COMMIT');
                return res.json({
                    message: 'Deposit already processed',
                    newBalance: parseFloat(userRes.rows[0].wallet_balance)
                });
            }

            // 2. Note: The user asked to remove fees, so feePercentage is 0
            const amountToCredit = Number(amount);

            // 3. Update main wallet balance in users table
            const updateResult = await client.query(
                'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance',
                [amountToCredit, userId]
            );

            // 4. Update transaction status
            await client.query(
                'UPDATE transactions SET status = $1 WHERE reference = $2',
                ['success', reference]
            );

            // 5. Update profiles and deposits (as sync/log tables if they exist)
            // This mirrors the user's snippet logic but remains safe if tables are used by other processes
            await client.query(
                'UPDATE profiles SET last_login = NOW() WHERE id = $1',
                [userId]
            ).catch(() => { }); // Profiles might not have wallet_balance as we saw

            await client.query(
                'INSERT INTO deposits (user_id, amount, status, reference) VALUES ($1, $2, $3, $4) ON CONFLICT (reference) DO UPDATE SET status = $3',
                [userId, amountToCredit, 'completed', reference]
            ).catch(err => console.warn('Optional deposits table update skipped:', err.message));

            await client.query('COMMIT');

            const newBalance = parseFloat(updateResult.rows[0].wallet_balance);

            res.json({
                status: 'success',
                message: 'Wallet funded successfully',
                newBalance
            });

            // Log activity
            logActivity({
                userId,
                type: 'order',
                level: 'success',
                action: 'WALLET_FUND',
                message: `Wallet funded with GHS ${amountToCredit.toFixed(2)}`,
                req
            });

            await notificationService.createNotification({
                userId,
                title: 'Wallet Funded',
                message: `Successfully credited ${amountToCredit.toFixed(2)} GHC to your wallet.`,
                type: 'success'
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Fund wallet error details:', error);
        res.status(500).json({
            error: 'Failed to fund wallet',
            details: error.message
        });
    }
};

// Get deposit history
const getDeposits = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM transactions WHERE user_id = $1 AND type = \'credit\' ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );

        const formatted = result.rows.map(d => ({
            id: d.id,
            amount: parseFloat(d.amount),
            reference: d.reference,
            status: d.status,
            createdAt: d.created_at
        }));

        res.json(formatted);

    } catch (error) {
        console.error('Get deposits error:', error);
        res.status(500).json({ error: 'Failed to get deposits' });
    }
};

// Get all user transactions
const getTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(
            'SELECT * FROM transactions WHERE user_id = $1 AND status != \'initialized\' ORDER BY created_at DESC LIMIT 50',
            [userId]
        );
        res.json({ transactions: result.rows });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
    }
};

module.exports = { initializeDeposit, getBalance, fundWallet, getDeposits, getTransactions };
