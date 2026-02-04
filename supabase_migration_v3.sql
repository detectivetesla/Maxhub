-- SQL Migration: Add 'purpose' column to transactions table
-- Run this in your Supabase SQL Editor

-- 1. Add the purpose column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'purpose') THEN
        ALTER TABLE public.transactions ADD COLUMN purpose TEXT;
    END IF;
END $$;

-- 2. Update existing records with default values based on type
UPDATE public.transactions 
SET purpose = 'wallet_funding' 
WHERE purpose IS NULL AND type = 'credit';

UPDATE public.transactions 
SET purpose = 'data_purchase' 
WHERE purpose IS NULL AND type = 'debit';

-- 3. Set a default and make it NOT NULL for future consistency
-- We use 'data_purchase' or 'wallet_funding' as a safe fallback
ALTER TABLE public.transactions 
ALTER COLUMN purpose SET DEFAULT 'wallet_funding';

-- Apply NOT NULL constraint
ALTER TABLE public.transactions 
ALTER COLUMN purpose SET NOT NULL;

-- 4. Verification
-- Now your transactions should have a 'purpose' column,
-- which is required by the backend to process deposits and purchases.
