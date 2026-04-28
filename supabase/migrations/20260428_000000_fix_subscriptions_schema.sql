-- Fix subscriptions table column mismatch
DO $$
BEGIN
    -- Rename plan_code to plan if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'plan_code') THEN
        ALTER TABLE subscriptions RENAME COLUMN plan_code TO plan;
    END IF;

    -- Add missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'provider') THEN
        ALTER TABLE subscriptions ADD COLUMN provider text NOT NULL DEFAULT 'mercadopago';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'external_id') THEN
        ALTER TABLE subscriptions ADD COLUMN external_id text NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'current_period_end') THEN
        ALTER TABLE subscriptions ADD COLUMN current_period_end timestamptz;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'raw_payload') THEN
        ALTER TABLE subscriptions ADD COLUMN raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'updated_at') THEN
        ALTER TABLE subscriptions ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
    END IF;

    -- Add constraints if they don't exist
    -- Note: This is simplified, in a real migration we'd check if constraints already exist
    ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('basic', 'pro', 'enterprise'));

    ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (status IN ('pending', 'active', 'past_due', 'canceled'));

END $$;
