const db = require('../db');
const { logActivity } = require('../services/logger');
const notificationService = require('../services/notificationService');

const portal02Controller = {
    handleWebhook: async (req, res) => {
        const { event, orderId, reference, status, recipient } = req.body;

        if (event === 'order.status.updated') {
            try {
                let localStatus = 'processing';
                const statusLower = String(status).toLowerCase();

                if (['delivered', 'completed', 'success', 'fulfilled', 'resolved', 'delivered_callback'].includes(statusLower)) {
                    localStatus = 'success';
                } else if (['failed', 'cancelled', 'refunded', 'error', 'failed_callback'].includes(statusLower)) {
                    localStatus = 'failed';
                }

                await db.query(
                    'UPDATE transactions SET status = $1, metadata = metadata || $2 WHERE reference = $3 OR reference = $4',
                    [localStatus, JSON.stringify({ portal_order_id: orderId, portal_status: status }), reference, orderId]
                );

                logActivity({
                    type: 'order',
                    level: localStatus === 'success' ? 'success' : (localStatus === 'failed' ? 'error' : 'info'),
                    action: 'Order Status Update',
                    message: `Portal02 Order ${reference} updated to ${status}`
                });

                const txInfo = await db.query('SELECT user_id, metadata FROM transactions WHERE reference = $1 OR reference = $2', [reference, orderId]);
                if (txInfo.rows.length > 0) {
                    const userId = txInfo.rows[0].user_id;
                    const metadata = txInfo.rows[0].metadata || {};
                    await notificationService.createNotification({
                        userId,
                        title: localStatus === 'success' ? 'Order Successful' : 'Order Update',
                        message: `Your order for ${metadata.bundle_name || 'data'} is now ${status}.`,
                        type: localStatus === 'success' ? 'success' : 'info'
                    });
                }
            } catch (error) {
                console.error('Portal02 Webhook Error:', error);
            }
        }
        res.sendStatus(200);
    }
};

module.exports = portal02Controller;
