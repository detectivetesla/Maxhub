const db = require('../db');
const portal02Service = require('../services/portal02');
const { logActivity } = require('./logger');
const notificationService = require('./notificationService');

/**
 * Robust Queue Processor for Orders
 * Handles:
 * 1. Asynchronous processing of 'queued' transactions
 * 2. Automatic retries on transient API failures
 * 3. Status updates and user notifications
 */

let isProcessing = false;

const processOrderQueue = async () => {
    // Prevent multiple simultaneous runs
    if (isProcessing) return;
    isProcessing = true;

    try {
        // 1. Fetch pending orders (status = 'queued')
        // We limit to 5 per run to ensure low latency and respect API limits
        const result = await db.query(
            `SELECT t.*, b.name as bundle_name, b.network, b.data_amount, b.provider_code 
             FROM transactions t 
             JOIN bundles b ON t.bundle_id = b.id
             WHERE t.status = 'processing' 
             AND t.provider_order_id IS NULL
             AND t.retries < 5
             ORDER BY t.created_at ASC 
             LIMIT 5`
        );

        if (result.rows.length === 0) {
            isProcessing = false;
            return;
        }

        console.log(`📡 [Queue Service] Processing ${result.rows.length} queued orders...`);

        for (const order of result.rows) {
            try {
                console.log(`📦 [Queue Service] Attempting order ${order.reference} (Retry: ${order.retries})...`);

                // 2. Call Portal-02 Service
                const portalResponse = await portal02Service.purchaseData(
                    order.network,
                    order.data_amount,
                    order.recipient_phone,
                    order.provider_code,
                    order.reference
                );

                // 3. Update status based on response
                // If it reaches here, it means the service didn't throw an error
                const portalOrderId = portalResponse.orderId || portalResponse.reference;
                const portalStatus = String(portalResponse.status || '').toLowerCase();

                let finalStatus = 'processing';
                if (['delivered', 'completed', 'success', 'fulfilled', 'resolved', 'delivered_callback'].includes(portalStatus)) {
                    finalStatus = 'success';
                } else if (['failed', 'error', 'cancelled', 'rejected', 'failed_callback', 'refunded'].includes(portalStatus)) {
                    finalStatus = 'failed';
                }

                await db.query(
                    `UPDATE transactions 
                     SET status = $1, 
                         provider_order_id = $2, 
                         provider_reference = $3,
                         metadata = metadata || $4
                     WHERE id = $5`,
                    [
                        finalStatus,
                        portalResponse.orderId ? String(portalResponse.orderId) : null,
                        portalResponse.reference || null,
                        JSON.stringify({ portal_status: portalStatus, processed_at: new Date().toISOString() }),
                        order.id
                    ]
                );

                console.log(`✅ [Queue Service] Order ${order.reference} processed. Status: ${finalStatus}`);

                // Notifications
                if (finalStatus === 'success') {
                    await notificationService.createNotification({
                        userId: order.user_id,
                        title: 'Order Successful',
                        message: `Your order for ${order.bundle_name} has been delivered.`,
                        type: 'success'
                    });
                } else if (finalStatus === 'failed') {
                    await notificationService.createNotification({
                        userId: order.user_id,
                        title: 'Order Failed',
                        message: `Your order for ${order.bundle_name} failed. Status: ${portalStatus}`,
                        type: 'error'
                    });
                }

            } catch (error) {
                console.error(`❌ [Queue Service] Order ${order.reference} error:`, error.message);

                const nextRetry = order.retries + 1;
                const shouldFailExtremely = nextRetry >= 5;

                await db.query(
                    `UPDATE transactions 
                     SET retries = $1, 
                         last_error = $2, 
                         status = $3 
                     WHERE id = $4`,
                    [
                        nextRetry,
                        error.message,
                        shouldFailExtremely ? 'failed' : 'processing',
                        order.id
                    ]
                );

                if (shouldFailExtremely) {
                    logActivity({
                        type: 'order',
                        level: 'error',
                        action: 'Queue Failure',
                        message: `Order ${order.reference} failed after maximum retries. Error: ${error.message}`
                    });

                    await notificationService.createNotification({
                        userId: order.user_id,
                        title: 'Order Failed',
                        message: `We encountered an issue processing your order for ${order.bundle_name}. Our team has been notified.`,
                        type: 'error'
                    });
                }
            }
        }
    } catch (criticalError) {
        console.error('❌ [Queue Service] Critical Processor Error:', criticalError);
    } finally {
        isProcessing = false;
    }
};

module.exports = {
    processOrderQueue
};
