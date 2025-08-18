-- 001_dashboard_foundation.sql
-- Comprehensive Developer Dashboard Database Foundation
-- Run in both lucky-poetry (dev) and muddy-moon (prod)

-- 1) Users enrichments
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_provider           text,            -- 'password' | 'google' | 'both'
  ADD COLUMN IF NOT EXISTS email_verified_at       timestamptz,
  ADD COLUMN IF NOT EXISTS last_login_at           timestamptz,
  ADD COLUMN IF NOT EXISTS last_ip                 inet,
  ADD COLUMN IF NOT EXISTS last_user_agent         text,
  ADD COLUMN IF NOT EXISTS mfa_enabled             boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS status                  text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS stripe_customer_id      text,
  ADD COLUMN IF NOT EXISTS marketing_opt_in        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS picture_url             text;

CREATE INDEX IF NOT EXISTS idx_users_email               ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_last_login          ON public.users (last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role                ON public.users (role);

-- 2) OAuth identity linker (Google, etc.)
CREATE TABLE IF NOT EXISTS public.user_identities (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            varchar NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider           text NOT NULL,             -- 'google'
  provider_user_id   text NOT NULL,             -- Google sub
  email              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);
CREATE INDEX IF NOT EXISTS idx_user_identities_user ON public.user_identities (user_id);

-- 3) Login events (auditable, queryable)
CREATE TABLE IF NOT EXISTS public.login_events (
  id           bigserial PRIMARY KEY,
  user_id      varchar NULL REFERENCES public.users(id) ON DELETE SET NULL,
  email        text NULL,
  provider     text NOT NULL,        -- 'password' | 'google'
  method       text NOT NULL,        -- 'signin' | 'signup' | 'refresh'
  success      boolean NOT NULL,
  error_code   text NULL,
  ip           inet NULL,
  user_agent   text NULL,
  country      text NULL,
  region       text NULL,
  city         text NULL,
  risk_score   int  NULL DEFAULT 0,
  session_id   text NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_login_events_user_time ON public.login_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_events_time      ON public.login_events (created_at DESC);

-- 4) Session introspection (connect-pg-simple compatible, add columns if you own the table)
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS user_id       varchar,
  ADD COLUMN IF NOT EXISTS ip            inet,
  ADD COLUMN IF NOT EXISTS user_agent    text,
  ADD COLUMN IF NOT EXISTS last_seen_at  timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_sessions_user_seen ON public.sessions (user_id, last_seen_at DESC);

-- 5) Products safety column (idempotent - already exists but ensuring consistency)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS continue_selling_when_out_of_stock boolean NOT NULL DEFAULT false;

-- 6) Useful aggregates (materialized view for Users tab "at a glance")
DROP MATERIALIZED VIEW IF EXISTS public.user_aggregate;
CREATE MATERIALIZED VIEW public.user_aggregate AS
SELECT
  u.id,
  count(DISTINCT o.id)                       AS orders_count,
  coalesce(sum(oi.quantity * oi.price), 0)::numeric(12,2) AS lifetime_value,
  max(o.created_at)                          AS last_order_at,
  max(le.created_at) FILTER (WHERE le.success) AS last_success_login_at
FROM public.users u
LEFT JOIN public.orders o           ON o.user_id = u.id
LEFT JOIN public.order_items oi     ON oi.order_id = o.id
LEFT JOIN public.login_events le    ON le.user_id = u.id
GROUP BY u.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_aggregate_id ON public.user_aggregate (id);

-- 7) Small but important indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_orders_user_time       ON public.orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order      ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user         ON public.addresses (user_id);

-- 8) Audit log table for admin actions (optional but recommended)
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id           bigserial PRIMARY KEY,
  actor_user_id varchar REFERENCES public.users(id) ON DELETE SET NULL,
  actor_role   text,
  action       text NOT NULL,        -- 'view_user', 'reveal_pii', 'revoke_session', etc.
  target_type  text,                 -- 'user', 'session', 'order'
  target_id    text,
  details      jsonb,
  ip           inet,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor_time ON public.admin_audit_log (actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_time       ON public.admin_audit_log (created_at DESC);

-- Success message
SELECT 'Dashboard foundation migration completed successfully' AS status;