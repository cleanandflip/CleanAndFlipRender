BEGIN;

-- USERS -------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_login_at     timestamptz,
  ADD COLUMN IF NOT EXISTS login_count       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sign_in_provider  text    NOT NULL DEFAULT 'password',
  ADD COLUMN IF NOT EXISTS last_ip           inet;

-- Backfill email_verified_at from a legacy boolean if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users' AND column_name='email_verified'
  ) THEN
    UPDATE public.users
      SET email_verified_at = COALESCE(email_verified_at, NOW())
    WHERE email_verified = TRUE AND email_verified_at IS NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_users_last_login_at    ON public.users (last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_sign_in_provider ON public.users (sign_in_provider);
-- If created_at exists (most likely):
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users' AND column_name='created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users (created_at DESC);
  END IF;
END$$;

-- PRODUCTS ----------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS continue_selling_when_out_of_stock boolean NOT NULL DEFAULT FALSE;

-- ADDRESSES (for geo & alias safety) -------------------------
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS latitude  double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

COMMIT;