-- Dashboard Foundation Migration
-- This migration adds new columns and tables to support the enhanced admin dashboard
-- Safe to run multiple times (uses IF NOT EXISTS checks)

-- Users enrichment
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_provider           text,      -- 'password' | 'google' | 'both'
  ADD COLUMN IF NOT EXISTS email_verified_at       timestamptz,
  ADD COLUMN IF NOT EXISTS last_login_at           timestamptz,
  ADD COLUMN IF NOT EXISTS last_ip                 inet,
  ADD COLUMN IF NOT EXISTS last_user_agent         text,
  ADD COLUMN IF NOT EXISTS mfa_enabled             boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS role                    text DEFAULT 'user',   -- 'user'|'support'|'developer'
  ADD COLUMN IF NOT EXISTS status                  text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS stripe_customer_id      text,
  ADD COLUMN IF NOT EXISTS marketing_opt_in        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS picture_url             text;

CREATE INDEX IF NOT EXISTS idx_users_email        ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_last_login   ON public.users (last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role         ON public.users (role);

-- OAuth identity linker
CREATE TABLE IF NOT EXISTS public.user_identities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider         text NOT NULL,          -- 'google'
  provider_user_id text NOT NULL,          -- Google sub
  email            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);
CREATE INDEX IF NOT EXISTS idx_user_identities_user ON public.user_identities (user_id);

-- Login events/audit
CREATE TABLE IF NOT EXISTS public.login_events (
  id         bigserial PRIMARY KEY,
  user_id    uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  email      text NULL,
  provider   text NOT NULL,      -- 'password' | 'google'
  method     text NOT NULL,      -- 'signin' | 'signup' | 'refresh'
  success    boolean NOT NULL,
  error_code text NULL,
  ip         inet NULL,
  user_agent text NULL,
  country    text NULL,
  region     text NULL,
  city       text NULL,
  risk_score int NULL DEFAULT 0,
  session_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_login_events_user_time ON public.login_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_events_time      ON public.login_events (created_at DESC);

-- Sessions introspection (if table is ours)
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS user_id      uuid,
  ADD COLUMN IF NOT EXISTS ip           inet,
  ADD COLUMN IF NOT EXISTS user_agent   text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_sessions_user_seen ON public.sessions (user_id, last_seen_at DESC);

-- Products: missing column (safe, idempotent)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS continue_selling_when_out_of_stock boolean NOT NULL DEFAULT false;

-- Aggregates for Users tab
DROP MATERIALIZED VIEW IF EXISTS public.user_aggregate;
CREATE MATERIALIZED VIEW public.user_aggregate AS
SELECT
  u.id,
  count(DISTINCT o.id) AS orders_count,
  coalesce(sum(oi.quantity * oi.unit_price), 0)::numeric(12,2) AS lifetime_value,
  max(o.created_at) AS last_order_at,
  max(le.created_at) FILTER (WHERE le.success) AS last_success_login_at
FROM public.users u
LEFT JOIN public.orders o       ON o.user_id = u.id
LEFT JOIN public.order_items oi ON oi.order_id = o.id
LEFT JOIN public.login_events le ON le.user_id = u.id
GROUP BY u.id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_aggregate_id ON public.user_aggregate (id);