const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { logActivity } = require('../services/logger');
const notificationService = require('../services/notificationService');

// Middleware to verify Paystack signature
const verifyPaystackSignature = (req, res, next) => {
    if (!process.env.PAYSTACK_SECRET_KEY) {
        console.error('PAYSTACK_SECRET_KEY is not set');
        return res.sendStatus(500);
    }
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(req.rawBody || JSON.stringify(req.body))
        .digest('hex');
    if (hash === req.headers['x-paystack-signature']) {
        next();
    } else {
        console.warn('Invalid Paystack signature');
        res.sendStatus(400);
    }
};

// Paystack Webhook
router.post('/paystack', verifyPaystackSignature, async (req, res) => {
    try {
        const event = req.body;
        console.log(`Paystack Webhook Received: ${event.event}`);

        if (event.event === 'charge.success') {
            const { reference } = event.data;
            let metadata = event.data.metadata;

            // Paystack sometimes sends metadata as a string
            if (typeof metadata === 'string') {
                try {
                    metadata = JSON.parse(metadata);
                } catch (e) {
                    console.error('Failed to parse Paystack metadata string:', e.message);
                }
            }

            const userId = metadata?.user_id;
            const requestedAmount = metadata?.requested_amount;

            console.log(`Processing Success: Ref=${reference}, User=${userId}, Amount=${requestedAmount}`);

            if (!userId || !requestedAmount) {
                console.error('Missing userId or requestedAmount in webhook metadata');
                return res.sendStatus(200); // Still return 200 to Paystack to avoid retries
            }

            // check if transaction already processed
            const checkTx = await db.query('SELECT status FROM transactions WHERE reference = $1', [reference]);
            if (checkTx.rows.length > 0 && checkTx.rows[0].status === 'success') {
                console.log(`Transaction ${reference} already marked as success.`);
                return res.sendStatus(200);
            }

            // Use a transaction for consistency
            const client = await db.pool.connect();
            try {
                await client.query('BEGIN');

                // Update wallet balance
                const updateWallet = await client.query(
                    'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance',
                    [requestedAmount, userId]
                );

                // Update transaction status
                await client.query(
                    'UPDATE transactions SET status = $1 WHERE reference = $2',
                    ['success', reference]
                );

                await client.query('COMMIT');

                console.log(`Successfully credited user ${userId}. New balance: ${updateWallet.rows[0]?.wallet_balance}`);

                await logActivity({
                    userId,
                    type: 'order',
                    level: 'success',
                    action: 'Payment Success',
                    message: `Payment confirmed for transaction: ${reference}. Wallet credited with ${requestedAmount} GHC.`
                });

                await notificationService.createNotification({
                    userId,
                    title: 'Wallet Funded',
                    message: `Successfully credited ${requestedAmount} GHC to your wallet.`,
                    type: 'success'
                });

            } catch (txError) {
                await client.query('ROLLBACK');
                console.error('Database transaction error in webhook:', txError);
                throw txError;
            } finally {
                client.release();
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Paystack Webhook Root Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Portal02 Webhook
router.post('/portal02', async (req, res) => {
    const { event, orderId, reference, status, recipient, volume } = req.body;

    if (event === 'order.status.updated') {
        console.log(`Portal02 Webhook: Order ${reference} (${orderId}) for ${recipient} updated to: ${status}`);

        try {
            // Map Portal02 status to local status
            let localStatus = 'processing';
            if (status === 'delivered') localStatus = 'success';
            if (['failed', 'cancelled', 'refunded'].includes(status)) localStatus = 'failed';

            // Update transaction status
            // We try to match by reference first, then orderId (just in case)
            await db.query(
                'UPDATE transactions SET status = $1, metadata = metadata || $2 WHERE reference = $3 OR reference = $4',
                [localStatus, JSON.stringify({ portal_order_id: orderId, portal_status: status }), reference, orderId]
            );

            logActivity({
                type: 'order',
                level: localStatus === 'success' ? 'success' : (localStatus === 'failed' ? 'error' : 'info'),
                action: 'Order Status Update',
                message: `Portal02 Order ${reference} updated to ${status} (${localStatus})`
            });

            // Fetch user_id for this transaction to send notification
            const txInfo = await db.query('SELECT user_id, amount, metadata FROM transactions WHERE reference = $1 OR reference = $2', [reference, orderId]);
            if (txInfo.rows.length > 0) {
                const userId = txInfo.rows[0].user_id;
                const metadata = txInfo.rows[0].metadata || {};
                await notificationService.createNotification({
                    userId,
                    title: localStatus === 'success' ? 'Order Successful' : (localStatus === 'failed' ? 'Order Failed' : 'Order Update'),
                    message: localStatus === 'success'
                        ? `Your order for ${metadata.bundle_name || 'data'} has been completed successfully.`
                        : (localStatus === 'failed' ? `Your order for ${metadata.bundle_name || 'data'} failed. Please contact support.` : `Your order status is now ${status}.`),
                    type: localStatus === 'success' ? 'success' : (localStatus === 'failed' ? 'error' : 'info')
                });
            }

            // TODO: If failed/refunded, initiate a manual or automatic refund to wallet balance
            if (localStatus === 'failed') {
                console.warn(`ORDER FAILED: ${reference}. Consider refunding user.`);
            }

        } catch (error) {
            console.error('Portal02 Webhook Processing Error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    res.sendStatus(200);
});

module.exports = router;
