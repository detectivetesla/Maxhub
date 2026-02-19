const portal02Utils = require('../utils/portal02');

const portal02Service = {
    /**
     * Fetch all available bundles from Portal02
     */
    syncBundles: async () => {
        try {
            const portal02ApiKey = process.env.PORTAL02_API_KEY;
            const offers = await portal02Utils.fetchOffers(portal02ApiKey);
            return offers;
        } catch (error) {
            console.error('Portal02 Sync Error:', error.message);
            throw error;
        }
    },

    /**
     * Purchase a data bundle for a recipient
     */
    purchaseData: async (network, dataAmount, phoneNumber, offerSlug, transactionId) => {
        try {
            // Map parameters to what the new utility expects
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
        } catch (error) {
            console.error('Portal02 Purchase Error:', error.message);
            throw error;
        }
    },

    /**
     * Purchase data bundles for multiple recipients (Bulk)
     * Currently the new utility doesn't have a specific bulk method, 
     * but we can wrap it or keep the old one if needed. 
     * For now, let's keep the existing interface but mark it as pending utility update.
     */
    purchaseBulkData: async (network, items, offerSlug) => {
        // Keeping as is for now or migrating to a loop if utility doesn't support bulk
        console.warn('Bulk purchase called - utility currently optimized for single orders');
        // Legacy axios implementation for bulk if needed, or implement in utility
        throw new Error('Bulk purchase is currently being migrated to the new utility.');
    },

    /**
     * Check the status of an order by ID or reference
     */
    checkOrderStatus: async (id) => {
        try {
            const result = await portal02Utils.checkOrderStatus(id);
            if (!result.success) {
                throw new Error(result.error || 'Failed to check order status');
            }
            return result.order;
        } catch (error) {
            console.error('Portal02 Status Check Error:', error.message);
            throw error;
        }
    },

    /**
     * Fetch Portal-02 order history for reconciliation
     */
    syncOrders: async (page = 1, limit = 50) => {
        try {
            const result = await portal02Utils.fetchOrderHistory(page, limit);
            if (!result.success) {
                throw new Error(result.error || 'Failed to sync orders from Portal-02');
            }
            return result;
        } catch (error) {
            console.error('Portal02 Sync Orders Error:', error.message);
            throw error;
        }
    },

    /**
     * Check Portal-02 account balance
     */
    checkBalance: async () => {
        try {
            const result = await portal02Utils.checkBalance();
            return result;
        } catch (error) {
            console.error('Portal02 Balance Check Error:', error.message);
            throw error;
        }
    }
};

module.exports = portal02Service;
