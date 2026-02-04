const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');

// Middleware to verify Paystack signature
const verifyPaystackSignature = (req, res, next) => {
    if (!process.env.PAYSTACK_SECRET_KEY) {
        console.error('PAYSTACK_SECRET_KEY is not set');
        return res.sendStatus(500);
    }
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
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
    const event = req.body;

    if (event.event === 'charge.success') {
        const { reference, metadata } = event.data;
        const userId = metadata?.user_id;
        const requestedAmount = metadata?.requested_amount;

        console.log(`Payment success: ${reference}, User: ${userId}, Amount: ${requestedAmount}`);

        if (userId && requestedAmount) {
            try {
                // Use a transaction for consistency
                await db.pool.connect().then(async (client) => {
                    try {
                        await client.query('BEGIN');

                        // Check if transaction already processed
                        const checkTx = await client.query('SELECT status FROM transactions WHERE reference = $1', [reference]);
                        if (checkTx.rows.length > 0 && checkTx.rows[0].status === 'success') {
                            await client.query('COMMIT');
                            return;
                        }

                        // Update wallet
                        await client.query(
                            'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
                            [requestedAmount, userId]
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
                });
            } catch (error) {
                console.error('Webhook processing error:', error);
                return res.status(500).json({ message: 'Internal server error' });
            }
        }
    }

    res.sendStatus(200);
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
