const CONFIG = {
    TRANSACTION_FEE_PERCENTAGE: parseFloat(process.env.TRANSACTION_FEE_PERCENTAGE) || 0.00,
    MIN_DEPOSIT_GHC: parseFloat(process.env.MIN_DEPOSIT_GHC) || 1.00,
    CURRENCY: process.env.SYSTEM_CURRENCY || 'GH₵',
    SYSTEM_NAME: process.env.SYSTEM_NAME || 'MaxHub'
};

module.exports = CONFIG;
