export const APP_CONFIG = {
    TRANSACTION_FEE_PERCENTAGE: parseFloat(import.meta.env.VITE_FEE_PERCENTAGE) || 0.03,
    MIN_DEPOSIT_GHC: parseFloat(import.meta.env.VITE_MIN_DEPOSIT) || 6.00,
    CURRENCY: import.meta.env.VITE_CURRENCY || 'GH₵',
    CURRENCY_SYMBOL: import.meta.env.VITE_CURRENCY_SYMBOL || '₵',
    SYSTEM_NAME: import.meta.env.VITE_SYSTEM_NAME || 'Maxhub',
    SYSTEM_SLOGAN: import.meta.env.VITE_SYSTEM_SLOGAN || 'Connecting the World',
    SYSTEM_DESCRIPTION: import.meta.env.VITE_SYSTEM_DESCRIPTION || 'Seamless Connectivity at Your Fingertips. Experience the power of Maxhub for all your data and VTU needs.',
    SUPPORT_WHATSAPP: import.meta.env.VITE_SUPPORT_WHATSAPP || '233541349282',
    SUPPORT_MESSAGE: import.meta.env.VITE_SUPPORT_MESSAGE || 'Hello Maxhub Support! I need assistance.',
    ROLES: {
        customer: 'Standard User',
        admin: 'System Admin'
    }
};
