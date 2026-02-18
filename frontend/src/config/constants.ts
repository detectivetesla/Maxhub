export const APP_CONFIG = {
    TRANSACTION_FEE_PERCENTAGE: parseFloat(import.meta.env.VITE_FEE_PERCENTAGE) || 0.00,
    MIN_DEPOSIT_GHC: parseFloat(import.meta.env.VITE_MIN_DEPOSIT) || 6.00,
    CURRENCY: import.meta.env.VITE_CURRENCY || 'GH₵',
    CURRENCY_SYMBOL: import.meta.env.VITE_CURRENCY_SYMBOL || '₵',
    SYSTEM_NAME: import.meta.env.VITE_SYSTEM_NAME || 'MaxHub',
    SYSTEM_SLOGAN: import.meta.env.VITE_SYSTEM_SLOGAN || 'The Future of Cheap Data in Ghana.',
    SYSTEM_DESCRIPTION: import.meta.env.VITE_SYSTEM_DESCRIPTION || 'Experience effortless connectivity with MaxHub. Instant delivery, affordable prices, and 24/7 reliability.',
    SUPPORT_WHATSAPP: import.meta.env.VITE_SUPPORT_WHATSAPP || '233541349282',
    SUPPORT_MESSAGE: import.meta.env.VITE_SUPPORT_MESSAGE || 'Hello! I need assistance with MaxHub.',
    ROLES: {
        customer: 'Standard User',
        admin: 'System Admin'
    }
};
