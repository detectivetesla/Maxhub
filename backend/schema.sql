-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone_number TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    wallet_balance DECIMAL(15, 2) DEFAULT 0.00,
    role TEXT DEFAULT 'customer', -- customer, admin
    is_blocked BOOLEAN DEFAULT FALSE,
    api_key TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Bundles Table
CREATE TABLE IF NOT EXISTS bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    network TEXT NOT NULL, -- MTN, Telecel, AirtelTigo
    name TEXT NOT NULL,
    data_amount TEXT NOT NULL,
    price_ghc DECIMAL(15, 2) NOT NULL,
    provider_code TEXT, -- External API code
    validity TEXT DEFAULT '30 Days',
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'credit', 'debit'
    purpose TEXT NOT NULL, -- 'wallet_funding', 'data_purchase'
    amount DECIMAL(15, 2) NOT NULL,
    status TEXT DEFAULT 'processing', -- processing, success, failed
    reference TEXT UNIQUE, -- Provider reference
    bundle_id UUID REFERENCES bundles(id),
    recipient_phone TEXT,
    payment_method TEXT, -- wallet, paystack
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type TEXT DEFAULT 'system', -- auth, system, bundle, order, user
    level TEXT DEFAULT 'info', -- success, info, warning, error
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Settings
INSERT INTO settings (key, value, description) VALUES
('maintenance_mode', 'false', 'Disable all non-admin access'),
('public_registration', 'true', 'Allow new users to sign up'),
('min_deposit', '5', 'Minimum wallet deposit amount'),
('support_email', 'support@dataswap.com', 'System support email')
ON CONFLICT (key) DO NOTHING;
