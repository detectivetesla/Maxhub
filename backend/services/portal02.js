const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const PORTAL02_BASE_URL = process.env.PORTAL02_BASE_URL;
const PORTAL02_API_KEY = process.env.PORTAL02_API_KEY;

const portal02Service = {
    /**
     * Fetch all available bundles from Portal02
     */
    syncBundles: async () => {
        try {
            const response = await axios.get(`${PORTAL02_BASE_URL}/offers`, {
                headers: { 'Authorization': `Bearer ${PORTAL02_API_KEY}` }
            });
            return response.data.offers;
        } catch (error) {
            const providerError = error.response?.data;
            if (providerError && providerError.success === false) {
                console.error(`Portal02 Sync Error [${providerError.type}]: ${providerError.error}`);
                const err = new Error(providerError.error);
                err.type = providerError.type;
                throw err;
            }
            console.error('Portal02 Sync Error:', error.message);
            throw error;
        }
    },

    /**
     * Purchase a data bundle for a recipient
     */
    purchaseData: async (network, volume, phoneNumber, offerSlug) => {
        try {
            const response = await axios.post(`${PORTAL02_BASE_URL}/order/${network.toLowerCase()}`, {
                type: 'single',
                volume: volume,
                phone: phoneNumber,
                offerSlug: offerSlug,
                webhookUrl: `${process.env.BACKEND_URL}/webhooks/portal02`
            }, {
                headers: { 'Authorization': `Bearer ${PORTAL02_API_KEY}` }
            });
            return response.data;
        } catch (error) {
            const providerError = error.response?.data;
            if (providerError && providerError.success === false) {
                console.error(`Portal02 Error [${providerError.type}]: ${providerError.error}`);
                const err = new Error(providerError.error);
                err.type = providerError.type;
                throw err;
            }
            console.error('Portal02 Purchase Error:', error.message);
            throw error;
        }
    },

    /**
     * Check the status of an order by ID or reference
     */
    checkOrderStatus: async (id) => {
        try {
            const response = await axios.get(`${PORTAL02_BASE_URL}/order/status/${id}`, {
                headers: { 'Authorization': `Bearer ${PORTAL02_API_KEY}` }
            });
            return response.data.order;
        } catch (error) {
            const providerError = error.response?.data;
            if (providerError && providerError.success === false) {
                console.error(`Portal02 Status Check Error [${providerError.type}]: ${providerError.error}`);
                const err = new Error(providerError.error);
                err.type = providerError.type;
                throw err;
            }
            console.error('Portal02 Status Check Error:', error.message);
            throw error;
        }
    }
};

module.exports = portal02Service;
