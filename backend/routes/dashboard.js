const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// Get User Stats
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

module.exports = router;
