const axios = require('axios');
const db = require('../db');
const portal02Utils = require('../utils/portal02');

/**
 * Dynamic Provider Configuration Helper
 * Retrieves active supplier settings from the database (settings table)
 * with environment variables and defaults as fallbacks.
 */
const getProviderConfig = async () => {
    try {
        const result = await db.query(
            "SELECT key, value FROM settings WHERE key IN ('provider_type', 'provider_api_url', 'provider_api_key')"
        );
        const config = result.rows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {});

        const providerType = config.provider_type || 'portal02';
        const apiUrl = config.provider_api_url || (providerType === 'bytebeacon' ? 'https://bytebeacon.online/api/v1' : 'https://www.portal-02.com/api/v1');
        const apiKey = config.provider_api_key || process.env.PORTAL02_API_KEY || '';

        return { providerType, apiUrl, apiKey };
    } catch (error) {
        console.error('⚠️ [Provider Config] Failed to fetch settings from DB, using env fallbacks:', error.message);
        return {
            providerType: 'portal02',
            apiUrl: 'https://www.portal-02.com/api/v1',
            apiKey: process.env.PORTAL02_API_KEY || ''
        };
    }
};

const portal02Service = {
    /**
     * Fetch all available bundles from active provider
     */
    syncBundles: async () => {
        try {
            const { providerType, apiUrl, apiKey } = await getProviderConfig();
            console.log(`📡 [Provider Sync] Syncing offers from provider type: ${providerType} (${apiUrl})`);

            if (providerType === 'bytebeacon') {
                const response = await axios.get(`${apiUrl}/plans`, {
                    headers: { 'x-api-key': apiKey }
                });

                const plans = response.data.plans || [];
                // Map ByteBeacon plans to look like offers to maintain compatibility
                return plans.map(p => ({
                    offerSlug: p.id,
                    isp: p.network,
                    type: p.name,
                    price: p.price,
                    id: p.id,
                    name: p.name,
                    network: p.network
                }));
            } else {
                // Fallback to legacy Portal-02 utility
                const offers = await portal02Utils.fetchOffers(apiKey);
                return offers;
            }
        } catch (error) {
            console.error('❌ Upstream Sync Error:', error.message);
            throw error;
        }
    },

    /**
     * Purchase a data bundle for a recipient
     */
    purchaseData: async (network, dataAmount, phoneNumber, offerSlug, transactionId) => {
        try {
            const { providerType, apiUrl, apiKey } = await getProviderConfig();
            console.log(`📡 [Provider Purchase] Placing order via provider type: ${providerType} (${apiUrl})`);

            if (providerType === 'bytebeacon') {
                const phone = portal02Utils.normalizeGhanaPhone(phoneNumber);
                const payload = {
                    network: network,
                    phone: phone,
                    plan_id: offerSlug, // offerSlug holds the provider_code (plan_id)
                    reference: transactionId
                };

                const response = await axios.post(`${apiUrl}/data/purchase`, payload, {
                    headers: {
                        'x-api-key': apiKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.data || !response.data.success) {
                    throw new Error(response.data?.message || 'ByteBeacon Order Failed');
                }

                // Return normalized response matching expectations of queueService
                return {
                    success: true,
                    orderId: response.data.transaction_id || response.data.id || transactionId,
                    reference: transactionId,
                    status: response.data.status || 'processing'
                };
            } else {
                // Fallback to legacy Portal-02 utility
                // Ensure PORTAL02_API_KEY env variable matches DB if set
                process.env.PORTAL02_API_KEY = apiKey;
                const result = await portal02Utils.placeDataOrder({
                    network,
                    dataAmount,
                    recipientPhone: phoneNumber,
                    transactionId: transactionId || `PUR-${Date.now()}`
                });

                if (!result.success) {
                    throw new Error(result.message || 'Portal-02 Order Failed');
                }

                return result.apiResponse;
            }
        } catch (error) {
            console.error('❌ Upstream Purchase Error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || error.message);
        }
    },

    /**
     * Purchase data bundles for multiple recipients (Bulk)
     */
    purchaseBulkData: async (network, items, offerSlug) => {
        console.warn('Bulk purchase called - dynamic provider delegates to loop');
        throw new Error('Bulk purchase is currently being migrated to the new utility.');
    },

    /**
     * Check the status of an order by ID or reference
     */
    checkOrderStatus: async (id) => {
        try {
            const { providerType, apiUrl, apiKey } = await getProviderConfig();
            console.log(`📡 [Provider Status] Checking status on provider type: ${providerType}`);

            if (providerType === 'bytebeacon') {
                const response = await axios.get(`${apiUrl}/transactions/${id}`, {
                    headers: { 'x-api-key': apiKey }
                });

                const transaction = response.data.transaction || response.data.data || response.data;
                const status = response.data.status || transaction?.status || 'processing';

                return {
                    success: true,
                    order: transaction,
                    status: status,
                    portalStatus: status
                };
            } else {
                // Fallback to legacy Portal-02 utility
                process.env.PORTAL02_API_KEY = apiKey;
                const result = await portal02Utils.checkOrderStatus(id);
                if (!result.success) {
                    throw new Error(result.error || 'Failed to check order status');
                }
                return result.order;
            }
        } catch (error) {
            console.error('❌ Upstream Status Check Error:', error.message);
            throw error;
        }
    },

    /**
     * Fetch order history for reconciliation
     */
    syncOrders: async (page = 1, limit = 50) => {
        try {
            const { providerType, apiUrl, apiKey } = await getProviderConfig();

            if (providerType === 'bytebeacon') {
                const response = await axios.get(`${apiUrl}/transactions?page=${page}&limit=${limit}`, {
                    headers: { 'x-api-key': apiKey }
                });

                const list = response.data.transactions || response.data.data || response.data.orders || [];
                return {
                    success: true,
                    orders: list.map(t => ({
                        orderId: t.id || t.transaction_id,
                        reference: t.reference,
                        status: t.status,
                        price: t.price || t.amount
                    }))
                };
            } else {
                // Fallback to legacy Portal-02 utility
                process.env.PORTAL02_API_KEY = apiKey;
                const result = await portal02Utils.fetchOrderHistory(page, limit);
                if (!result.success) {
                    throw new Error(result.error || 'Failed to sync orders from Portal-02');
                }
                return result;
            }
        } catch (error) {
            console.error('❌ Upstream Sync Orders Error:', error.message);
            throw error;
        }
    },

    /**
     * Check active provider account balance
     */
    checkBalance: async () => {
        try {
            const { providerType, apiUrl, apiKey } = await getProviderConfig();

            if (providerType === 'bytebeacon') {
                if (!apiKey) {
                    return { success: false, error: 'API key not configured' };
                }

                const response = await axios.get(`${apiUrl}/wallet`, {
                    headers: { 'x-api-key': apiKey }
                });

                return {
                    success: response.data.success || false,
                    balance: parseFloat(response.data.balance || response.data.wallet?.balance || 0),
                    currency: response.data.currency || 'GHS'
                };
            } else {
                // Fallback to legacy Portal-02 utility
                process.env.PORTAL02_API_KEY = apiKey;
                const result = await portal02Utils.checkBalance();
                return result;
            }
        } catch (error) {
            console.error('❌ Upstream Balance Check Error:', error.message);
            return { success: false, error: error.message };
        }
    }
};

module.exports = portal02Service;
