const db = require('../db');

const dashboardController = {
    getStats: async (req, res) => {
        try {
            const userId = req.user.id;
            const [
                balanceResult,
                totalOrdersResult,
                processingOrdersResult,
                completedOrdersResult,
                networkDistResult,
                dailyOrdersResult
            ] = await Promise.all([
                db.query('SELECT wallet_balance FROM users WHERE id = $1', [userId]),
                db.query("SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND purpose = 'data_purchase'", [userId]),
                db.query("SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND purpose = 'data_purchase' AND status = 'processing'", [userId]),
                db.query("SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND purpose = 'data_purchase' AND status = 'success'", [userId]),
                db.query(`
                    SELECT b.network, COUNT(*) as count 
                    FROM transactions t 
                    JOIN bundles b ON t.bundle_id = b.id 
                    WHERE t.user_id = $1 AND t.purpose = 'data_purchase' 
                    GROUP BY b.network
                `, [userId]),
                db.query(`
                    SELECT DATE(created_at) as date, COUNT(*) as count 
                    FROM transactions 
                    WHERE user_id = $1 AND purpose = 'data_purchase' AND status != 'initialized' AND created_at > NOW() - INTERVAL '7 days' 
                    GROUP BY date 
                    ORDER BY date ASC
                `, [userId])
            ]);

            res.json({
                walletBalance: Number(balanceResult.rows[0]?.wallet_balance || 0),
                totalOrders: Number(totalOrdersResult.rows[0].count),
                processingOrders: Number(processingOrdersResult.rows[0].count),
                completedOrders: Number(completedOrdersResult.rows[0].count),
                networkDistribution: networkDistResult.rows.map(row => ({
                    name: row.network,
                    count: parseInt(row.count)
                })),
                dailyOrders: dailyOrdersResult.rows.map(row => ({
                    date: new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                    count: parseInt(row.count)
                }))
            });
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
        }
    },

    getBundles: async (req, res) => {
        try {
            const result = await db.query('SELECT * FROM bundles WHERE is_active = true ORDER BY network, price_ghc');
            res.json({ bundles: result.rows });
        } catch (error) {
            console.error('Get User Bundles Error:', error);
            res.status(500).json({ message: 'Failed to fetch data bundles' });
        }
    }
};


module.exports = dashboardController;
