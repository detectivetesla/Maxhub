const db = require('../db');
const portal02Service = require('../services/portal02');
const queueService = require('../services/queueService');
const { logActivity } = require('../services/logger');
const notificationService = require('../services/notificationService');

const orderController = {
    getOrders: async (req, res) => {
        try {
            const userId = req.user.id;
            const result = await db.query(
                `SELECT t.*, b.name as bundle_name, b.network 
                 FROM transactions t 
                 LEFT JOIN bundles b ON t.bundle_id = b.id 
                 WHERE t.user_id = $1 AND t.purpose = 'data_purchase' AND t.status != 'initialized'
                 ORDER BY t.created_at DESC LIMIT 50`,
                [userId]
            );
            res.json({ orders: result.rows });
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch orders' });
        }
    },

    purchaseData: async (req, res) => {
        const { bundleId, phoneNumber, isRecurring } = req.body;
        const userId = req.user.id;

        if (!bundleId || !phoneNumber) {
            return res.status(400).json({ message: 'Bundle ID and Phone Number are required' });
        }

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const userResult = await client.query('SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE', [userId]);
            const currentBalance = Number(userResult.rows[0].wallet_balance);

            const bundleResult = await client.query('SELECT * FROM bundles WHERE id = $1', [bundleId]);
            if (bundleResult.rows.length === 0) throw new Error('Bundle not found');

            const bundle = bundleResult.rows[0];
            const price = Number(bundle.price_ghc);

            if (currentBalance < price) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Insufficient wallet balance' });
            }

            const reference = `PUR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const metadata = { bundle_name: bundle.name, network: bundle.network, is_recurring: isRecurring };

            await client.query(
                'INSERT INTO transactions (user_id, type, purpose, amount, status, reference, bundle_id, recipient_phone, metadata, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                [userId, 'debit', 'data_purchase', price, 'queued', reference, bundleId, phoneNumber, JSON.stringify(metadata), 'wallet']
            );

            await client.query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2', [price, userId]);
            await client.query('COMMIT');

            // 1. Respond to user immediately
            res.json({ message: 'Order placed successfully and is being processed.', reference, status: 'queued' });

            // 2. Trigger background processing immediately (non-blocking)
            queueService.processOrderQueue().catch(err => console.error('Immediate Queue Trigger Error:', err));

            // 3. Log and notify (internal)
            logActivity({
                userId, type: 'order', level: 'info', action: 'Purchase Queued',
                message: `User ${userId} queued purchase of ${bundle.network} ${bundle.data_amount} for ${phoneNumber}`,
                req
            });

            await notificationService.createNotification({
                userId, title: 'Order Received',
                message: `Your order for ${bundle.network} ${bundle.data_amount} has been received and is being processed.`,
                type: 'info'
            });

        } catch (error) {
            if (client) await client.query('ROLLBACK');
            res.status(500).json({ message: 'Transaction failed', error: error.message });
        } finally {
            if (client) client.release();
        }
    }
};

module.exports = orderController;
