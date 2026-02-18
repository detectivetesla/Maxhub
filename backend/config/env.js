const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env
const result = dotenv.config({ path: path.join(__dirname, '../../.env') });

if (result.error) {
    console.error('Warning: Failed to load .env file:', result.error.message);
}

// Export common variables with sensible defaults or fail-safes
module.exports = {
    PORT: process.env.PORT || 5000,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET || 'fallback_data_swap_secret_key_123!@#',
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
    PORTAL02_API_KEY: process.env.PORTAL02_API_KEY,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    TRANSACTION_FEE_PERCENTAGE: parseFloat(process.env.TRANSACTION_FEE_PERCENTAGE) || 0.00,
    MIN_DEPOSIT_GHC: parseFloat(process.env.MIN_DEPOSIT_GHC) || 1.00,
    SYSTEM_CURRENCY: process.env.SYSTEM_CURRENCY || 'GH₵',
    SYSTEM_NAME: process.env.SYSTEM_NAME || 'MaxHub'
};
