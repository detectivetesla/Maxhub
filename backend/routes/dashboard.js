const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const paystackService = require('../services/paystack');
const CONFIG = require('../config/constants');

// Initialize Deposit
router.post('/deposit', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;
        const userEmail = req.user.email;

        if (!amount || amount < CONFIG.MIN_DEPOSIT_GHC) {
            return res.status(400).json({ message: `Minimum deposit amount is ${CONFIG.CURRENCY} ${CONFIG.MIN_DEPOSIT_GHC.toFixed(2)}` });
        }

        // Apply transaction fee
        const fee = amount * CONFIG.TRANSACTION_FEE_PERCENTAGE;
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
            [userId, 'credit', 'wallet_funding', amount, 'processing', paystackData.reference, JSON.stringify(metadata), 'paystack']
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
});
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Wallet Balance
        const balanceResult = await db.query('SELECT wallet_balance FROM users WHERE id = $1', [userId]);
        const walletBalance = balanceResult.rows[0]?.wallet_balance || 0;

        // Total Orders
        const totalOrdersResult = await db.query(
            "SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND purpose = 'data_purchase'",
            [userId]
        );
        const totalOrders = totalOrdersResult.rows[0].count;

        // Processing Orders
        const processingOrdersResult = await db.query(
            "SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND purpose = 'data_purchase' AND status = 'processing'",
            [userId]
        );
        const processingOrders = processingOrdersResult.rows[0].count;

        // Completed Orders
        const completedOrdersResult = await db.query(
            "SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND purpose = 'data_purchase' AND status = 'success'",
            [userId]
        );
        const completedOrders = completedOrdersResult.rows[0].count;

        res.json({
            walletBalance: Number(walletBalance),
            totalOrders: Number(totalOrders),
            processingOrders: Number(processingOrders),
            completedOrders: Number(completedOrders)
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
    }
});

// Get Recent Transactions
router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(
            'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
            [userId]
        );
        res.json({ transactions: result.rows });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
    }
});

// Get Recent Orders (Data Purchases)
router.get('/orders', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(
            `SELECT t.*, b.name as bundle_name, b.network 
             FROM transactions t 
             LEFT JOIN bundles b ON t.bundle_id = b.id 
             WHERE t.user_id = $1 AND t.purpose = 'data_purchase' 
             ORDER BY t.created_at DESC LIMIT 10`,
            [userId]
        );
        res.json({ orders: result.rows });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
    }
});

// Verify Transaction Status
router.get('/verify/:reference', authMiddleware, async (req, res) => {
    try {
        const { reference } = req.params;
        const userId = req.user.id;

        // Fetch transaction from DB
        const txResult = await db.query(
            'SELECT * FROM transactions WHERE reference = $1 AND user_id = $2',
            [reference, userId]
        );

        if (txResult.rows.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        const transaction = txResult.rows[0];

        // If already success or failed, no need to verify again with Paystack for logic, 
        // but we might want to refresh UI state.
        if (transaction.status !== 'processing') {
            return res.json({
                status: transaction.status,
                message: `Transaction is already ${transaction.status}`
            });
        }

        // Verify with Paystack
        const paystackData = await paystackService.verifyTransaction(reference);
        const newStatus = paystackData.status === 'success' ? 'success' :
            (paystackData.status === 'failed' ? 'failed' : 'processing');

        if (newStatus === 'success') {
            // Use a transaction for consistency to avoid double-crediting
            const client = await db.pool.connect();
            try {
                await client.query('BEGIN');

                // Re-check status inside transaction
                const checkTx = await client.query('SELECT status FROM transactions WHERE reference = $1 FOR UPDATE', [reference]);
                if (checkTx.rows[0].status === 'success') {
                    await client.query('COMMIT');
                    return res.json({ status: 'success', message: 'Transaction already processed' });
                }

                // Update wallet
                await client.query(
                    'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
                    [transaction.amount, userId]
                );

                // Update transaction status
                await client.query(
                    'UPDATE transactions SET status = $1 WHERE reference = $2',
                    ['success', reference]
                );

                await client.query('COMMIT');
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            } finally {
                client.release();
            }
        } else if (newStatus === 'failed') {
            await db.query(
                'UPDATE transactions SET status = $1 WHERE reference = $2',
                ['failed', reference]
            );
        } else if (paystackData.status === 'abandoned' || paystackData.status === 'cancelled') {
            // If abandoned, mark as failed in our DB to stop showing as "processing"
            await db.query(
                'UPDATE transactions SET status = $1 WHERE reference = $2',
                ['failed', reference]
            );
            return res.json({ status: 'failed', message: 'Transaction was abandoned' });
        }

        res.json({
            status: newStatus === 'processing' && paystackData.status === 'abandoned' ? 'failed' : newStatus,
            message: `Transaction status in Paystack: ${paystackData.status}`
        });
    } catch (error) {
        console.error('Verify Error:', error);
        res.status(500).json({ message: 'Failed to verify transaction', error: error.message });
    }
});

module.exports = router;
