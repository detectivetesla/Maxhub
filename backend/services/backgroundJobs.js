const db = require('../db');
const portal02Service = require('../services/portal02');
const { logActivity } = require('./logger');
const notificationService = require('./notificationService');

/**
 * Background service to keep order statuses in sync with Portal-02
 */
const syncPortal02Orders = async () => {
    try {
        // 1. Fetch orders that are still 'processing'
        // Limit to 20 per run to avoids hitting API rate limits too hard
        const result = await db.query(
            `SELECT t.*, b.name as bundle_name 
             FROM transactions t 
             LEFT JOIN bundles b ON t.bundle_id = b.id
             WHERE t.status = 'processing' 
             AND t.purpose = 'data_purchase'
             AND (t.provider_order_id IS NOT NULL OR t.provider_reference IS NOT NULL)
             ORDER BY t.created_at DESC 
             LIMIT 20`
        );

        if (result.rows.length === 0) return;

        console.log(`🔄 [Background Jobs] Syncing ${result.rows.length} pending Portal-02 orders...`);

        for (const order of result.rows) {
            try {
                // Determine the best ID/Reference to check status with
                const checkId = order.provider_order_id || order.provider_reference || order.reference;

                // 2. Check status via Portal-02 service
                const portalOrder = await portal02Service.checkOrderStatus(checkId);

                if (!portalOrder) continue;

                const portalStatus = String(portalOrder.status || '').toLowerCase();
                let localStatus = 'processing';

                // 3. Map status to our system
                if (['delivered', 'completed', 'success', 'fulfilled', 'resolved', 'delivered_callback'].includes(portalStatus)) {
                    localStatus = 'success';
                } else if (['failed', 'error', 'cancelled', 'rejected', 'failed_callback', 'refunded'].includes(portalStatus)) {
                    localStatus = 'failed';
                }

                // 4. Update if status has changed
                if (localStatus !== order.status) {
                    await db.query(
                        'UPDATE transactions SET status = $1, metadata = metadata || $2 WHERE id = $3',
                        [localStatus, JSON.stringify({ portal_status: portalStatus, last_sync: new Date().toISOString() }), order.id]
                    );

                    console.log(`✅ [Background Jobs] Order ${order.id} updated to ${localStatus} (Portal status: ${portalStatus})`);

                    // 5. Log activity and notify user
                    logActivity({
                        type: 'order',
                        level: localStatus === 'success' ? 'success' : 'error',
                        action: 'Auto-Sync Status Update',
                        message: `Order ${order.reference} automatically updated to ${localStatus} via Portal-02 sync.`
                    });

                    await notificationService.createNotification({
                        userId: order.user_id,
                        title: localStatus === 'success' ? 'Order Successful' : 'Order Update',
                        message: `Your order for ${order.bundle_name || 'data'} is now ${portalStatus}.`,
                        type: localStatus === 'success' ? 'success' : 'info'
                    });
                }
            } catch (orderError) {
                console.error(`❌ [Background Jobs] Error syncing order ${order.id}:`, orderError.message);
            }
        }
    } catch (error) {
        console.error('❌ [Background Jobs] syncPortal02Orders Critical Error:', error);
    }
};

/**
 * Start all background jobs
 */
const startBackgroundJobs = () => {
    console.log('🚀 Background jobs initialized.');

    // Sync Portal-02 orders every 1 minute
    const SYNC_INTERVAL = 60 * 1000;

    // Initial run after short delay
    setTimeout(() => {
        syncPortal02Orders();
        queueService.processOrderQueue();
    }, 10000);

    // Recurring interval
    setInterval(() => {
        syncPortal02Orders();
        queueService.processOrderQueue();
    }, SYNC_INTERVAL);
};

module.exports = {
    startBackgroundJobs
};
