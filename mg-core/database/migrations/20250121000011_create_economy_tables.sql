-- Migration: 20250121000011_create_economy_tables
-- Description: Create wallets and transactions tables for MatrixCoin economy
-- Author: MatrixGin Development Team
-- Date: 2025-01-21

BEGIN;

-- Create wallets table
CREATE TABLE wallets (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Balances (using INTEGER for atomic operations)
    mc_balance INTEGER DEFAULT 0 CHECK (mc_balance >= 0),
    gmc_balance INTEGER DEFAULT 0 CHECK (gmc_balance >= 0),
    mc_frozen INTEGER DEFAULT 0 CHECK (mc_frozen >= 0),
    
    -- Safe (заморозка MC на 30 дней для защиты от сгорания)
    safe_active BOOLEAN DEFAULT FALSE,
    safe_activated_at TIMESTAMPTZ,
    safe_unlock_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT wallets_safe_check CHECK (
        (safe_active = TRUE AND safe_activated_at IS NOT NULL AND safe_unlock_at IS NOT NULL) OR
        (safe_active = FALSE)
    ),
    CONSTRAINT wallets_frozen_check CHECK (mc_frozen <= mc_balance)
);

-- Indexes for wallets
CREATE INDEX idx_wallets_mc_balance ON wallets(mc_balance DESC);
CREATE INDEX idx_wallets_gmc_balance ON wallets(gmc_balance DESC);
CREATE INDEX idx_wallets_safe ON wallets(safe_active, safe_unlock_at) WHERE safe_active = TRUE;

-- Comments
COMMENT ON TABLE wallets IS 'Кошельки пользователей (MC + GMC)';
COMMENT ON COLUMN wallets.mc_balance IS 'Баланс MatrixCoin (сгораемые)';
COMMENT ON COLUMN wallets.gmc_balance IS 'Баланс Golden MatrixCoin (вечные)';
COMMENT ON COLUMN wallets.mc_frozen IS 'Замороженные MC в сейфе';
COMMENT ON COLUMN wallets.safe_active IS 'Активен ли сейф (защита от сгорания на 30 дней)';

-- Trigger for updated_at
CREATE TRIGGER trg_wallets_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-create wallet for new users
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_wallet
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_wallet_for_user();

-- Create transactions table (partitioned by month)
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid(),
    
    -- Parties
    from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Amount
    amount INTEGER NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL CHECK (currency IN ('MC', 'GMC')),
    
    -- Type
    transaction_type VARCHAR(50) NOT NULL
        CHECK (transaction_type IN (
            'task_reward', 'transfer', 'purchase', 'bonus', 'penalty', 
            'refund', 'auction_bid', 'auction_win', 'safe_activation',
            'store_purchase', 'gmc_conversion'
        )),
    
    -- Description
    description TEXT,
    
    -- Relations
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Indexes for transactions
CREATE INDEX idx_transactions_from ON transactions(from_user_id, created_at DESC);
CREATE INDEX idx_transactions_to ON transactions(to_user_id, created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_currency ON transactions(currency);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_related ON transactions(related_entity_type, related_entity_id);

-- Comments
COMMENT ON TABLE transactions IS 'Транзакции MatrixCoin и GMC (партиционировано по месяцам)';
COMMENT ON COLUMN transactions.from_user_id IS 'Отправитель (NULL для системных начислений)';
COMMENT ON COLUMN transactions.to_user_id IS 'Получатель';
COMMENT ON COLUMN transactions.related_entity_type IS 'Тип связанной сущности (task, auction, store_item)';

-- Trigger to update wallet balances on transaction
CREATE OR REPLACE FUNCTION update_wallet_balances()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.currency = 'MC' THEN
        -- Deduct from sender
        IF NEW.from_user_id IS NOT NULL THEN
            UPDATE wallets 
            SET mc_balance = mc_balance - NEW.amount,
                updated_at = NOW()
            WHERE user_id = NEW.from_user_id;
            
            -- Check for sufficient balance
            IF (SELECT mc_balance FROM wallets WHERE user_id = NEW.from_user_id) < 0 THEN
                RAISE EXCEPTION 'Insufficient MC balance for user %', NEW.from_user_id;
            END IF;
        END IF;
        
        -- Credit to recipient
        UPDATE wallets 
        SET mc_balance = mc_balance + NEW.amount,
            updated_at = NOW()
        WHERE user_id = NEW.to_user_id;
        
    ELSIF NEW.currency = 'GMC' THEN
        -- Deduct from sender
        IF NEW.from_user_id IS NOT NULL THEN
            UPDATE wallets 
            SET gmc_balance = gmc_balance - NEW.amount,
                updated_at = NOW()
            WHERE user_id = NEW.from_user_id;
            
            -- Check for sufficient balance
            IF (SELECT gmc_balance FROM wallets WHERE user_id = NEW.from_user_id) < 0 THEN
                RAISE EXCEPTION 'Insufficient GMC balance for user %', NEW.from_user_id;
            END IF;
        END IF;
        
        -- Credit to recipient
        UPDATE wallets 
        SET gmc_balance = gmc_balance + NEW.amount,
            updated_at = NOW()
        WHERE user_id = NEW.to_user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_wallet_balances
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_balances();

-- Create initial partitions for transactions (2025)
CREATE TABLE transactions_2025_01 PARTITION OF transactions
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE transactions_2025_02 PARTITION OF transactions
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE transactions_2025_03 PARTITION OF transactions
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE transactions_2025_04 PARTITION OF transactions
    FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE transactions_2025_05 PARTITION OF transactions
    FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE transactions_2025_06 PARTITION OF transactions
    FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE transactions_2025_07 PARTITION OF transactions
    FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE transactions_2025_08 PARTITION OF transactions
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE transactions_2025_09 PARTITION OF transactions
    FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
CREATE TABLE transactions_2025_10 PARTITION OF transactions
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE transactions_2025_11 PARTITION OF transactions
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE transactions_2025_12 PARTITION OF transactions
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

COMMIT;
