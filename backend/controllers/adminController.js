const db = require('../db');
const bcrypt = require('bcryptjs');
const portal02Service = require('../services/portal02');
const { logActivity } = require('../services/logger');

const adminController = {
    // System Stats
    getStats: async (req, res) => {
        try {
            const [
                totalUsersResult,
                todayOrdersResult,
                todayRevenueResult,
                lifetimeRevenueResult,
                pendingOrdersResult,
                dailyRevenueResult,
                networkDistResult,
                recentFundingResult,
                monthlyRevenueResult,
                userGrowthResult,
                bundlePerformanceResult
            ] = await Promise.all([
                db.query('SELECT COUNT(*) FROM users'),
                db.query("SELECT COUNT(*) FROM transactions WHERE purpose = 'data_purchase' AND status != 'initialized' AND created_at >= CURRENT_DATE"),
                db.query("SELECT SUM(amount) FROM transactions WHERE purpose = 'data_purchase' AND status = 'success' AND created_at >= CURRENT_DATE"),
                db.query("SELECT SUM(amount) FROM transactions WHERE purpose = 'data_purchase' AND status = 'success'"),
                db.query("SELECT COUNT(*) FROM transactions WHERE purpose = 'data_purchase' AND status = 'processing'"),
                db.query(`
                    SELECT DATE(created_at) as date, SUM(amount) as revenue 
                    FROM transactions 
                    WHERE purpose = 'data_purchase' AND status = 'success' AND created_at > NOW() - INTERVAL '7 days' 
                    GROUP BY date 
                    ORDER BY date ASC
                `),
                db.query(`
                    SELECT b.network, COUNT(*) as count 
                    FROM transactions t 
                    JOIN bundles b ON t.bundle_id = b.id 
                    WHERE t.purpose = 'data_purchase' AND t.status = 'success'
                    GROUP BY b.network
                `),
                db.query(`
                    SELECT t.*, u.full_name as user_name 
                    FROM transactions t 
                    LEFT JOIN users u ON t.user_id = u.id 
                    WHERE t.purpose = 'wallet_funding' AND t.status = 'success' 
                    ORDER BY t.created_at DESC LIMIT 5
                `),
                db.query(`
                    SELECT 
                        TO_CHAR(created_at, 'Mon YYYY') as month,
                        SUM(amount) as revenue,
                        MIN(created_at) as sort_key
                    FROM transactions 
                    WHERE purpose = 'data_purchase' AND status = 'success' AND created_at > NOW() - INTERVAL '12 months'
                    GROUP BY month
                    ORDER BY sort_key ASC
                `),
                db.query(`
                    SELECT 
                        TO_CHAR(created_at, 'Mon DD') as date,
                        COUNT(*) as count,
                        MIN(created_at) as sort_key
                    FROM users
                    WHERE created_at > NOW() - INTERVAL '14 days'
                    GROUP BY date
                    ORDER BY sort_key ASC
                `),
                db.query(`
                    SELECT 
                        COALESCE(b.name, 'Unknown') as name,
                        COUNT(*) as sales,
                        SUM(t.amount) as revenue
                    FROM transactions t
                    LEFT JOIN bundles b ON t.bundle_id = b.id
                    WHERE t.purpose = 'data_purchase' AND t.status = 'success'
                    GROUP BY b.name
                    ORDER BY sales DESC
                    LIMIT 5
                `)
            ]);

            res.json({
                totalUsers: Number(totalUsersResult.rows[0].count),
                todayOrders: Number(todayOrdersResult.rows[0].count),
                todayRevenue: Number(todayRevenueResult.rows[0].sum || 0),
                lifetimeRevenue: Number(lifetimeRevenueResult.rows[0].sum || 0),
                pendingOrders: Number(pendingOrdersResult.rows[0].count),
                dailyRevenue: dailyRevenueResult.rows.map(row => ({
                    date: new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                    revenue: Number(row.revenue)
                })),
                networkDistribution: networkDistResult.rows.map(row => ({
                    name: row.network,
                    count: parseInt(row.count)
                })),
                recentFunding: recentFundingResult.rows,
                monthlyRevenue: monthlyRevenueResult.rows.map(row => ({
                    month: row.month,
                    revenue: Number(row.revenue)
                })),
                userGrowth: userGrowthResult.rows.map(row => ({
                    date: row.date,
                    count: parseInt(row.count)
                })),
                bundlePerformance: bundlePerformanceResult.rows.map(row => ({
                    name: row.name,
                    sales: parseInt(row.sales),
                    revenue: Number(row.revenue)
                }))
            });
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch admin stats', error: error.message });
        }
    },

    getRecentData: async (req, res) => {
        try {
            const ordersResult = await db.query(
                `SELECT t.*, u.full_name as user_name, b.network 
                 FROM transactions t 
                 LEFT JOIN users u ON t.user_id = u.id 
                 LEFT JOIN bundles b ON t.bundle_id = b.id 
                 WHERE t.purpose = 'data_purchase' AND t.status != 'initialized'
                 ORDER BY t.created_at DESC LIMIT 10`
            );

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
    },

    // Users Management
    getAllUsers: async (req, res) => {
        try {
            const result = await db.query('SELECT id, email, full_name, role, wallet_balance, is_blocked, created_at FROM users ORDER BY created_at DESC');
            res.json({ users: result.rows });
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch users', error: error.message });
        }
    },

    createUser: async (req, res) => {
        const { email, full_name, password, role, wallet_balance } = req.body;
        if (!['customer', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await db.query(
                'INSERT INTO users (email, full_name, password_hash, role, wallet_balance) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, wallet_balance, created_at',
                [email, full_name, hashedPassword, role, wallet_balance]
            );
            res.status(201).json({ message: 'User created successfully', user: result.rows[0] });
            logActivity({
                userId: req.user.id,
                type: 'user',
                level: 'success',
                action: 'Admin Create User',
                message: `Admin created user: ${email}`,
                req
            });
        } catch (error) {
            res.status(500).json({ message: 'Failed to create user', error: error.message });
        }
    },

    updateUser: async (req, res) => {
        const { id } = req.params;
        const { email, full_name, role, wallet_balance, is_blocked } = req.body;
        try {
            const result = await db.query(
                'UPDATE users SET email = $1, full_name = $2, role = $3, wallet_balance = $4, is_blocked = $5 WHERE id = $6 RETURNING *',
                [email, full_name, role, wallet_balance, is_blocked, id]
            );
            res.json({ message: 'User updated', user: result.rows[0] });
        } catch (error) {
            res.status(500).json({ message: 'Failed to update user', error: error.message });
        }
    },

    deleteUser: async (req, res) => {
        try {
            await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
            res.json({ message: 'User deleted' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to delete user' });
        }
    },

    // Bundles Management
    getAllBundles: async (req, res) => {
        try {
            const result = await db.query('SELECT * FROM bundles ORDER BY network, price_ghc');
            res.json({ bundles: result.rows });
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch bundles' });
        }
    },

    createBundle: async (req, res) => {
        const { network, name, data_amount, price_ghc, validity_days } = req.body;
        try {
            const result = await db.query(
                'INSERT INTO bundles (network, name, data_amount, price_ghc, validity_days) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [network, name, data_amount, price_ghc, validity_days]
            );
            res.status(201).json({ bundle: result.rows[0] });
        } catch (error) {
            res.status(500).json({ message: 'Failed to create bundle' });
        }
    },

    // Transactions Management (Deposits + Purchases)
    getAllTransactions: async (req, res) => {
        try {
            const { limit = 100, page = 1, status, type, search } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    t.*,
                    u.full_name as user_name,
                    u.email as user_email,
                    b.name as bundle_name,
                    b.network
                FROM transactions t
                LEFT JOIN users u ON t.user_id = u.id
                LEFT JOIN bundles b ON t.bundle_id = b.id
                WHERE 1=1
            `;
            const params = [];

            if (status) {
                params.push(status);
                query += ` AND t.status = $${params.length}`;
            }

            if (type) {
                params.push(type);
                query += ` AND t.type = $${params.length}`;
            }

            if (search) {
                params.push(`%${search}%`);
                query += ` AND (u.full_name ILIKE $${params.length} OR t.reference ILIKE $${params.length} OR t.recipient_phone ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
            }

            query += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);

            const result = await db.query(query, params);

            // Get total count for pagination
            const countResult = await db.query('SELECT COUNT(*) FROM transactions');

            res.json({
                transactions: result.rows,
                total: parseInt(countResult.rows[0].count),
                page: parseInt(page),
                limit: parseInt(limit)
            });
        } catch (error) {
            console.error('Get Admin Transactions Error:', error);
            res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
        }
    },

    // Orders Management
    getAllOrders: async (req, res) => {
        try {
            const result = await db.query(`
                SELECT 
                    t.id,
                    t.created_at,
                    t.amount,
                    t.status,
                    t.recipient_phone,
                    u.full_name as user_name,
                    b.network,
                    b.name as bundle_name
                FROM transactions t
                LEFT JOIN users u ON t.user_id = u.id
                LEFT JOIN bundles b ON t.bundle_id = b.id
                WHERE t.purpose = 'data_purchase'
                ORDER BY t.created_at DESC
                LIMIT 100
            `);
            res.json({ orders: result.rows });
        } catch (error) {
            console.error('Get Admin Orders Error:', error);
            res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
        }
    },

    // Communication Management
    sendMessage: async (req, res) => {
        const client = await db.getClient();
        try {
            const { recipientType, recipientId, subject, message, priority } = req.body;
            const adminId = req.user.id;

            await client.query('BEGIN');

            let userIds = [];
            if (recipientType === 'all') {
                const result = await client.query('SELECT id FROM users WHERE role = $1', ['customer']);
                userIds = result.rows.map(r => r.id);
            } else if (recipientType === 'specific') {
                userIds = [recipientId];
            } else if (recipientType === 'active') {
                const result = await client.query('SELECT id FROM users WHERE last_login > NOW() - INTERVAL \'30 days\'');
                userIds = result.rows.map(r => r.id);
            }

            // Insert into notifications/messages table for each user
            for (const userId of userIds) {
                await client.query(
                    'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
                    [userId, subject, message, priority === 'urgent' ? 'warning' : 'info']
                );
            }

            // Log activity
            await client.query(
                'INSERT INTO activity_logs (user_id, type, action) VALUES ($1, $2, $3)',
                [adminId, 'system', `Sent ${recipientType} message: ${subject}`]
            );

            await client.query('COMMIT');
            res.json({ message: `Message queued for ${userIds.length} users` });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Send Message Error:', error);
            res.status(500).json({ message: 'Failed to send message', error: error.message });
        } finally {
            client.release();
        }
    },

    getLogs: async (req, res) => {
        try {
            const result = await db.query('SELECT l.*, u.full_name as user_name FROM activity_logs l LEFT JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT 100');
            res.json({ logs: result.rows });
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch logs' });
        }
    }
};

module.exports = adminController;
