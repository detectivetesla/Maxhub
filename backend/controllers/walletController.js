const db = require('../db');
const { logActivity } = require('../services/logger');
const notificationService = require('../services/notificationService');
const paystackService = require('../services/paystack');
const CONFIG = require('../config/constants');

const initializeDeposit = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;
        const userEmail = req.user.email;

        if (!amount || Number(amount) < CONFIG.MIN_DEPOSIT_GHC) {
            return res.status(400).json({
                message: `Minimum deposit amount is ${CONFIG.CURRENCY} ${CONFIG.MIN_DEPOSIT_GHC.toFixed(2)}`
            });
        }

        const feePercentage = CONFIG.TRANSACTION_FEE_PERCENTAGE;
        const fee = Number(amount) * feePercentage;
        const totalAmount = Number(amount) + fee;

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
        console.error('Deposit Init Error:', error.message);
        res.status(500).json({
            message: 'Failed to initialize deposit',
            error: error.message,
            paystackError: error.response?.data?.message
        });
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

// Shared logic for funding the wallet
const fundWalletLogic = async (userId, amount, reference, req = null) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Check if this reference has already been processed and is successful
        const checkRef = await client.query(
            'SELECT id FROM transactions WHERE reference = $1 AND status = \'success\'',
            [reference]
        );

        if (checkRef.rows.length > 0) {
            await client.query('COMMIT');
            return { alreadyProcessed: true };
        }

        // 2. Update main wallet balance in users table
        const updateResult = await client.query(
            'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance',
            [amount, userId]
        );

        if (updateResult.rows.length === 0) {
            throw new Error('User not found or balance update failed');
        }

        // 3. Update or Insert transaction status
        // We use UPSERT because the webhook might arrive before the manual verify, or vice versa
        await client.query(
            `INSERT INTO transactions (user_id, type, purpose, amount, status, reference, payment_method)
             VALUES ($1, 'credit', 'wallet_funding', $2, 'success', $3, 'paystack')
             ON CONFLICT (reference) DO UPDATE SET status = 'success', amount = EXCLUDED.amount`,
            [userId, amount, reference]
        );

        // 4. Update profiles if they exist and have wallet relevant info (Optional based on schema)
        await client.query(
            'UPDATE profiles SET last_login = NOW() WHERE id = $1',
            [userId]
        ).catch(() => { });

        await client.query('COMMIT');

        const newBalance = parseFloat(updateResult.rows[0].wallet_balance);

        // Log activity
        logActivity({
            userId,
            type: 'order',
            level: 'success',
            action: 'WALLET_FUND',
            message: `Wallet funded with GHS ${Number(amount).toFixed(2)}`,
            req
        });

        // Create notification
        await notificationService.createNotification({
            userId,
            title: 'Wallet Funded',
            message: `Successfully credited ${Number(amount).toFixed(2)} GHC to your wallet. Reference: ${reference}`,
            type: 'success'
        });

        return { alreadyProcessed: false, newBalance };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Fund Wallet Logic Error:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Webhook Handler or Manual Fund (usually called by verifyDeposit or webhooks)
const fundWallet = async (req, res) => {
    try {
        const { amount, reference } = req.body;
        const userId = req.user?.id || req.body.userId;

        if (!amount || amount <= 0 || !reference) {
            return res.status(400).json({ status: 'error', message: 'Valid amount and reference are required' });
        }

        const result = await fundWalletLogic(userId, amount, reference, req);

        res.json({
            status: 'success',
            message: result.alreadyProcessed ? 'Deposit already processed' : 'Wallet funded successfully',
            newBalance: result.newBalance
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fund wallet', details: error.message });
    }
};

// Explicit Verification Handler (GET /verify/:reference)
const verifyDeposit = async (req, res) => {
    try {
        const { reference } = req.params;
        const userId = req.user.id;

        if (!reference) {
            return res.status(400).json({ status: 'error', message: 'Reference is required' });
        }

        // 1. Verify with Paystack
        const paystackData = await paystackService.verifyTransaction(reference);

        if (paystackData.status !== 'success') {
            return res.status(400).json({
                status: 'error',
                message: `Transaction is ${paystackData.status}. Reason: ${paystackData.gateway_response}`
            });
        }

        // 2. Extract amount and metadata
        const amountInGhc = paystackData.amount / 100;
        let metadata = paystackData.metadata;
        if (typeof metadata === 'string') metadata = JSON.parse(metadata);

        // Ensure this transaction belongs to the requesting user (Security check)
        if (metadata.user_id && metadata.user_id !== userId) {
            return res.status(403).json({ status: 'error', message: 'Transaction ownership mismatch' });
        }

        // 3. Fund wallet using shared logic
        const result = await fundWalletLogic(userId, amountInGhc, reference, req);

        // 4. Get latest balance for response
        const userRes = await db.query('SELECT wallet_balance FROM users WHERE id = $1', [userId]);
        const latestBalance = parseFloat(userRes.rows[0].wallet_balance);

        res.json({
            status: 'success',
            message: result.alreadyProcessed ? 'Deposit already confirmed' : 'Transaction verified and wallet funded!',
            newBalance: latestBalance
        });

    } catch (error) {
        console.error('Verify Deposit Error:', error);
        res.status(500).json({ status: 'error', message: 'Verification failed', details: error.message });
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

module.exports = { initializeDeposit, getBalance, fundWallet, getDeposits, getTransactions, verifyDeposit };
