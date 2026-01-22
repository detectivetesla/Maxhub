const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');

// Admin Check Middleware
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
};

// --- SYSTEM STATS ---

// Get System Stats
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
    try {
        const totalUsersResult = await db.query('SELECT COUNT(*) FROM users');

        const todayOrdersResult = await db.query(
            "SELECT COUNT(*) FROM transactions WHERE purpose = 'data_purchase' AND created_at >= CURRENT_DATE"
        );

        const todayRevenueResult = await db.query(
            "SELECT SUM(amount) FROM transactions WHERE purpose = 'data_purchase' AND status = 'success' AND created_at >= CURRENT_DATE"
        );

        const lifetimeRevenueResult = await db.query(
            "SELECT SUM(amount) FROM transactions WHERE purpose = 'data_purchase' AND status = 'success'"
        );

        res.json({
            totalUsers: Number(totalUsersResult.rows[0].count),
            todayOrders: Number(todayOrdersResult.rows[0].count),
            todayRevenue: Number(todayRevenueResult.rows[0].sum || 0),
            lifetimeRevenue: Number(lifetimeRevenueResult.rows[0].sum || 0)
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch admin stats', error: error.message });
    }
});

// Get Recent System Data (Orders & Users)
router.get('/recent-data', authMiddleware, adminOnly, async (req, res) => {
    try {
        // Recent Orders
        const ordersResult = await db.query(
            `SELECT t.*, u.full_name as user_name, b.network 
             FROM transactions t 
             LEFT JOIN users u ON t.user_id = u.id 
             LEFT JOIN bundles b ON t.bundle_id = b.id 
             WHERE t.purpose = 'data_purchase' 
             ORDER BY t.created_at DESC LIMIT 10`
        );

        // New Users
        const usersResult = await db.query(
            'SELECT full_name, email, created_at FROM users ORDER BY created_at DESC LIMIT 5'
        );

        res.json({
            recentOrders: ordersResult.rows,
            newUsers: usersResult.rows
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch recent data', error: error.message });
    }
});

// --- USERS CRUD ---

// Get All Users
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
    try {
        const result = await db.query('SELECT id, email, full_name, role, wallet_balance, created_at FROM users ORDER BY created_at DESC');
        res.json({ users: result.rows });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
});

// Update User Wallet
router.post('/users/:id/balance', authMiddleware, adminOnly, async (req, res) => {
    const { id } = req.params;
    const { amount, action } = req.body; // action: 'add' or 'subtract'
    try {
        const query = action === 'add'
            ? 'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance'
            : 'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2 RETURNING wallet_balance';

        const result = await db.query(query, [amount, id]);
        res.json({ message: 'Wallet updated successfully', balance: result.rows[0].wallet_balance });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update wallet', error: error.message });
    }
});

// Delete User
router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete user' });
    }
});

// --- BUNDLES CRUD ---

// Get All Bundles
router.get('/bundles', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM bundles ORDER BY network, price_ghc');
        res.json({ bundles: result.rows });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch bundles' });
    }
});

// Create Bundle
router.post('/bundles', authMiddleware, adminOnly, async (req, res) => {
    const { network, name, data_amount, price_ghc } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO bundles (network, name, data_amount, price_ghc) VALUES ($1, $2, $3, $4) RETURNING *',
            [network, name, data_amount, price_ghc]
        );
        res.status(201).json({ message: 'Bundle created', bundle: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create bundle' });
    }
});

// Update Bundle
router.put('/bundles/:id', authMiddleware, adminOnly, async (req, res) => {
    const { network, name, data_amount, price_ghc, is_active } = req.body;
    try {
        const result = await db.query(
            'UPDATE bundles SET network = $1, name = $2, data_amount = $3, price_ghc = $4, is_active = $5 WHERE id = $6 RETURNING *',
            [network, name, data_amount, price_ghc, is_active, req.params.id]
        );
        res.json({ message: 'Bundle updated', bundle: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update bundle' });
    }
});

// Toggle Bundle Status
router.post('/bundles/:id/toggle', authMiddleware, adminOnly, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('UPDATE bundles SET is_active = NOT is_active WHERE id = $1 RETURNING is_active', [id]);
        res.json({ message: `Bundle status updated`, is_active: result.rows[0].is_active });
    } catch (error) {
        res.status(500).json({ message: 'Failed to toggle bundle' });
    }
});

// Delete Bundle
router.delete('/bundles/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        await db.query('DELETE FROM bundles WHERE id = $1', [req.params.id]);
        res.json({ message: 'Bundle deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete bundle' });
    }
});

// --- LOGS ---

// Get All Activity Logs
router.get('/logs', authMiddleware, adminOnly, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT l.*, u.full_name as user_name 
             FROM activity_logs l 
             LEFT JOIN users u ON l.user_id = u.id 
             ORDER BY l.created_at DESC LIMIT 100`
        );
        res.json({ logs: result.rows });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch logs', error: error.message });
    }
});

// Purge Logs
router.delete('/logs/purge', authMiddleware, adminOnly, async (req, res) => {
    try {
        await db.query('DELETE FROM activity_logs');
        res.json({ message: 'Logs purged successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to purge logs' });
    }
});

// --- SETTINGS ---

// Get All Settings
router.get('/settings', authMiddleware, adminOnly, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM settings');
        const settingsMap = {};
        result.rows.forEach(row => {
            settingsMap[row.key] = row.value;
        });
        res.json({ settings: settingsMap });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch settings' });
    }
});

// Update Setting
router.post('/settings', authMiddleware, adminOnly, async (req, res) => {
    const { key, value } = req.body;
    try {
        await db.query(
            'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
            [key, value]
        );
        res.json({ message: 'Setting updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update setting' });
    }
});

// --- ORDERS ---

// Get All Orders
router.get('/orders', authMiddleware, adminOnly, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT t.*, u.full_name as user_name, b.name as bundle_name, b.network 
             FROM transactions t 
             LEFT JOIN users u ON t.user_id = u.id 
             LEFT JOIN bundles b ON t.bundle_id = b.id 
             WHERE t.purpose = 'data_purchase' 
             ORDER BY t.created_at DESC`
        );
        res.json({ orders: result.rows });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
});

module.exports = router;
