-- =============================================================================
-- DataSwap Complete Database Schema
-- Version: 1.0.0
-- Last Updated: 2026-02-04
-- Description: Complete schema for user and admin systems, including all 
--              required tables for authentication, transactions, bundles,
--              notifications, and system settings.
-- =============================================================================

-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- User role enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('customer', 'admin');
    END IF;
END $$;

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE
-- Primary table for all user accounts (customers and admins)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone_number TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    wallet_balance DECIMAL(15, 2) DEFAULT 0.00,
    role user_role DEFAULT 'customer',
    is_blocked BOOLEAN DEFAULT FALSE,
    api_key TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups during login
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- -----------------------------------------------------------------------------
-- 2. PROFILES TABLE
-- Extended user profile information
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- -----------------------------------------------------------------------------
-- 3. BUNDLES TABLE
-- Data bundle products available for purchase
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    network TEXT NOT NULL,                     -- MTN, Telecel, AirtelTigo
    name TEXT NOT NULL,                        -- Display name (e.g., "2GB Daily")
    data_amount TEXT NOT NULL,                 -- Amount with unit (e.g., "2GB", "500MB")
    price_ghc DECIMAL(15, 2) NOT NULL,         -- Price in Ghana Cedis
    provider_code TEXT,                        -- External provider API code (offerSlug)
    validity TEXT DEFAULT '30 Days',           -- Display validity
    validity_days INTEGER DEFAULT 30,          -- Numeric validity for calculations
    is_active BOOLEAN DEFAULT TRUE,            -- Whether bundle is available for purchase
    is_popular BOOLEAN DEFAULT FALSE,          -- Featured/popular flag
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for network filtering
CREATE INDEX IF NOT EXISTS idx_bundles_network ON bundles(network);
CREATE INDEX IF NOT EXISTS idx_bundles_active ON bundles(is_active);

-- -----------------------------------------------------------------------------
-- 4. TRANSACTIONS TABLE
-- All financial transactions: deposits, purchases, refunds
-- This table serves as the "orders" table for data purchases
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,                        -- 'credit' (deposit), 'debit' (purchase)
    purpose TEXT NOT NULL,                     -- 'wallet_funding', 'data_purchase', 'refund'
    amount DECIMAL(15, 2) NOT NULL,
    status TEXT DEFAULT 'processing',          -- processing, success, failed
    reference TEXT UNIQUE,                     -- Unique transaction reference
    bundle_id UUID REFERENCES bundles(id),     -- For data purchases
    recipient_phone TEXT,                      -- Phone number receiving data
    payment_method TEXT,                       -- wallet, paystack
    provider_order_id TEXT,                    -- External provider order ID (e.g., ORD-000067)
    provider_reference TEXT,                   -- External provider reference (e.g., ORD-IB22OQws)
    metadata JSONB DEFAULT '{}',               -- Additional data (bundle_name, network, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_purpose ON transactions(purpose);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- -----------------------------------------------------------------------------
-- 5. ACTIVITY_LOGS TABLE
-- System-wide activity logging for auditing
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type TEXT DEFAULT 'system',                -- auth, system, bundle, order, user
    level TEXT DEFAULT 'info',                 -- success, info, warning, error
    action TEXT NOT NULL,                      -- Description of the action
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for filtering by type and user
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- -----------------------------------------------------------------------------
-- 6. NOTIFICATIONS TABLE
-- User notifications (in-app messages)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',                  -- info, success, warning, error
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- -----------------------------------------------------------------------------
-- 7. SETTINGS TABLE
-- System-wide configuration settings
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 8. DEPOSITS TABLE
-- Dedicated table for tracking wallet deposits (Paystack payments)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,            -- Deposit amount in GHC
    fee DECIMAL(15, 2) DEFAULT 0.00,           -- Transaction fee charged
    net_amount DECIMAL(15, 2) NOT NULL,        -- Amount credited to wallet (amount - fee)
    status TEXT DEFAULT 'pending',             -- pending, success, failed, abandoned
    reference TEXT UNIQUE NOT NULL,            -- Paystack reference
    paystack_reference TEXT,                   -- Paystack transaction reference
    payment_channel TEXT,                      -- card, bank, ussd, mobile_money
    currency TEXT DEFAULT 'GHS',               -- Currency code
    paid_at TIMESTAMP WITH TIME ZONE,          -- When payment was confirmed
    metadata JSONB DEFAULT '{}',               -- Additional Paystack data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for deposit queries
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_reference ON deposits(reference);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON deposits(created_at DESC);

-- =============================================================================
-- DEFAULT DATA
-- =============================================================================

-- Ensure is_popular column exists (for existing databases)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bundles' AND column_name = 'is_popular') THEN
        ALTER TABLE bundles ADD COLUMN is_popular BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Ensure provider_order_id and provider_reference exist in transactions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'provider_order_id') THEN
        ALTER TABLE transactions ADD COLUMN provider_order_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'provider_reference') THEN
        ALTER TABLE transactions ADD COLUMN provider_reference TEXT;
    END IF;
END $$;

-- Insert default system settings
INSERT INTO settings (key, value, description) VALUES
    ('maintenance_mode', 'false', 'Disable all non-admin access'),
    ('public_registration', 'true', 'Allow new users to sign up'),
    ('min_deposit', '5', 'Minimum wallet deposit amount (GHC)'),
    ('max_deposit', '10000', 'Maximum wallet deposit amount (GHC)'),
    ('transaction_fee_percentage', '0.02', 'Platform transaction fee (2%)'),
    ('support_email', 'support@dataswap.com', 'System support email'),
    ('support_phone', '+233241234567', 'System support phone number')
ON CONFLICT (key) DO NOTHING;

-- Insert sample bundles (you can modify these based on actual provider data)
INSERT INTO bundles (network, name, data_amount, price_ghc, provider_code, validity, validity_days, is_active, is_popular) VALUES
    -- MTN Bundles
    ('MTN', 'MTN 1GB', '1GB', 5.00, 'mtn_data_bundle', '30 Days', 30, true, false),
    ('MTN', 'MTN 2GB', '2GB', 10.00, 'mtn_data_bundle', '30 Days', 30, true, true),
    ('MTN', 'MTN 5GB', '5GB', 25.00, 'mtn_data_bundle', '30 Days', 30, true, true),
    ('MTN', 'MTN 10GB', '10GB', 45.00, 'mtn_data_bundle', '30 Days', 30, true, false),
    ('MTN', 'MTN 20GB', '20GB', 85.00, 'mtn_data_bundle', '30 Days', 30, true, false),
    
    -- Telecel Bundles
    ('Telecel', 'Telecel 1GB', '1GB', 4.50, 'telecel_data_bundle', '30 Days', 30, true, false),
    ('Telecel', 'Telecel 2GB', '2GB', 9.00, 'telecel_data_bundle', '30 Days', 30, true, true),
    ('Telecel', 'Telecel 5GB', '5GB', 22.00, 'telecel_data_bundle', '30 Days', 30, true, false),
    ('Telecel', 'Telecel 10GB', '10GB', 40.00, 'telecel_data_bundle', '30 Days', 30, true, false),
    
    -- AirtelTigo Bundles
    ('AirtelTigo', 'AT 1GB', '1GB', 4.00, 'airteltigo_data_bundle', '30 Days', 30, true, false),
    ('AirtelTigo', 'AT 2GB', '2GB', 8.00, 'airteltigo_data_bundle', '30 Days', 30, true, true),
    ('AirtelTigo', 'AT 5GB', '5GB', 20.00, 'airteltigo_data_bundle', '30 Days', 30, true, false),
    ('AirtelTigo', 'AT 10GB', '10GB', 38.00, 'airteltigo_data_bundle', '30 Days', 30, true, false)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- CLEANUP (Optional - Run only if you want to remove unused tables)
-- =============================================================================

-- Uncomment the following lines to drop unused tables:
-- DROP TABLE IF EXISTS ticket_messages CASCADE;
-- DROP TABLE IF EXISTS tickets CASCADE;

-- =============================================================================
-- NOTES
-- =============================================================================
-- 
-- Table Summary:
-- 1. users          - User accounts (customers and admins)
-- 2. profiles       - Extended user profile data
-- 3. bundles        - Data bundle products
-- 4. transactions   - All financial records (deposits, purchases, refunds)
-- 5. activity_logs  - System audit trail
-- 6. notifications  - User in-app notifications
-- 7. settings       - System configuration
--
-- The "orders" functionality is handled by the transactions table with:
--   - purpose = 'data_purchase' for data bundle orders
--   - bundle_id linking to the purchased bundle
--   - recipient_phone for the phone number receiving data
--   - provider_order_id and provider_reference for Portal-02 tracking
--
-- =============================================================================
