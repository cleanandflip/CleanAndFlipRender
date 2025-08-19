BEGIN;

CREATE SCHEMA IF NOT EXISTS admin;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admin.db_checkpoints (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch       text NOT NULL CHECK (branch IN ('dev','prod')),
  label        text NOT NULL,
  schema_name  text NOT NULL UNIQUE,
  notes        text,
  created_by   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin.db_checkpoint_tables (
  checkpoint_id uuid NOT NULL REFERENCES admin.db_checkpoints(id) ON DELETE CASCADE,
  table_schema  text NOT NULL,
  table_name    text NOT NULL,
  row_count     bigint,
  PRIMARY KEY (checkpoint_id, table_schema, table_name)
);

CREATE TABLE IF NOT EXISTS admin.db_checkpoint_sequences (
  checkpoint_id   uuid NOT NULL REFERENCES admin.db_checkpoints(id) ON DELETE CASCADE,
  sequence_schema text NOT NULL,
  sequence_name   text NOT NULL,
  last_value      bigint NOT NULL,
  PRIMARY KEY (checkpoint_id, sequence_schema, sequence_name)
);

-- Normalize a label to a slug
CREATE OR REPLACE FUNCTION admin.slugify_label(p_label text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE s text;
BEGIN
  s := lower(regexp_replace(p_label, '[^a-zA-Z0-9]+', '_', 'g'));
  s := regexp_replace(s, '^_+|_+$', '', 'g');
  IF s = '' THEN s := 'checkpoint'; END IF;
  RETURN s;
END$$;

-- Create snapshot schema with shallow table copies (no constraints) + data + sequence values
CREATE OR REPLACE FUNCTION admin.create_checkpoint(
  p_branch text,
  p_label  text,
  p_notes  text DEFAULT NULL,
  p_include_schemas text[] DEFAULT ARRAY['public'],
  p_created_by text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  v_slug text := admin.slugify_label(p_label);
  v_schema text := 'ckpt_' || to_char(now(), 'YYYYMMDD_HH24MISS') || '_' || v_slug;
  r record;
  v_count bigint;
  v_sql text;
BEGIN
  IF NOT (p_branch IN ('dev','prod')) THEN
    RAISE EXCEPTION 'invalid branch';
  END IF;

  EXECUTE format('CREATE SCHEMA %I', v_schema);

  -- Copy tables (structure w/o constraints) and data
  FOR r IN
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type='BASE TABLE'
      AND table_schema = ANY(p_include_schemas)
      AND table_schema NOT IN ('admin', 'pg_catalog', 'information_schema')
  LOOP
    v_sql := format('CREATE TABLE %I.%I (LIKE %I.%I INCLUDING DEFAULTS INCLUDING IDENTITY)', v_schema, r.table_name, r.table_schema, r.table_name);
    EXECUTE v_sql;

    v_sql := format('INSERT INTO %I.%I SELECT * FROM %I.%I', v_schema, r.table_name, r.table_schema, r.table_name);
    EXECUTE v_sql;

    EXECUTE format('SELECT count(*) FROM %I.%I', v_schema, r.table_name) INTO v_count;

    INSERT INTO admin.db_checkpoint_tables(checkpoint_id, table_schema, table_name, row_count)
    VALUES (v_id, v_schema, r.table_name, v_count);
  END LOOP;

  -- Capture sequences
  FOR r IN
    SELECT sequence_schema, sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema = ANY(p_include_schemas)
      AND sequence_schema NOT IN ('admin', 'pg_catalog', 'information_schema')
  LOOP
    EXECUTE format('SELECT last_value FROM %I.%I', r.sequence_schema, r.sequence_name) INTO v_count;
    INSERT INTO admin.db_checkpoint_sequences(checkpoint_id, sequence_schema, sequence_name, last_value)
    VALUES (v_id, r.sequence_schema, r.sequence_name, v_count);
  END LOOP;

  INSERT INTO admin.db_checkpoints(id, branch, label, schema_name, notes, created_by)
  VALUES (v_id, p_branch, p_label, v_schema, p_notes, p_created_by);

  RETURN v_id;
END$$;

-- Diff: per-table row-count deltas between current and checkpoint
CREATE OR REPLACE FUNCTION admin.diff_checkpoint(p_checkpoint uuid)
RETURNS TABLE(table_name text, current_count bigint, checkpoint_count bigint, delta bigint)
LANGUAGE plpgsql
AS $$
DECLARE 
  v_schema text;
  r record;
  v_count bigint;
BEGIN
  SELECT schema_name INTO v_schema FROM admin.db_checkpoints WHERE id = p_checkpoint;
  IF v_schema IS NULL THEN RAISE EXCEPTION 'checkpoint not found'; END IF;

  -- Create temp table for current counts
  CREATE TEMP TABLE IF NOT EXISTS current_counts (table_name text, cnt bigint);
  DELETE FROM current_counts;
  
  FOR r IN
    SELECT t.table_name
    FROM information_schema.tables t
    WHERE t.table_type='BASE TABLE' AND t.table_schema='public'
  LOOP
    EXECUTE format('SELECT count(*) FROM %I.%I', 'public', r.table_name) INTO v_count;
    INSERT INTO current_counts VALUES (r.table_name, v_count);
  END LOOP;

  RETURN QUERY
  WITH cur AS (
    SELECT * FROM current_counts
  ), ck AS (
    SELECT table_name, row_count AS cnt
    FROM admin.db_checkpoint_tables
    WHERE checkpoint_id = p_checkpoint
  )
  SELECT COALESCE(cur.table_name, ck.table_name) AS table_name,
         COALESCE(cur.cnt, 0) AS current_count,
         COALESCE(ck.cnt, 0) AS checkpoint_count,
         COALESCE(cur.cnt,0) - COALESCE(ck.cnt,0) AS delta
  FROM cur
  FULL OUTER JOIN ck ON ck.table_name = cur.table_name
  ORDER BY table_name;
  
  DROP TABLE IF EXISTS current_counts;
END$$;

-- Roll back: replace current data with snapshot data and restore sequences
CREATE OR REPLACE FUNCTION admin.rollback_to_checkpoint(p_checkpoint uuid)
RETURNS void LANGUAGE plpgsql
AS $$
DECLARE
  v_schema text;
  r record;
  cols text;
  shared_cols text;
  v_sql text;
BEGIN
  SELECT schema_name INTO v_schema FROM admin.db_checkpoints WHERE id = p_checkpoint;
  IF v_schema IS NULL THEN RAISE EXCEPTION 'checkpoint not found'; END IF;

  PERFORM pg_advisory_lock(987654321); -- global guard

  BEGIN
    -- Disable triggers/constraints to avoid FK order issues
    EXECUTE 'SET session_replication_role = replica';

    -- Truncate all public tables
    FOR r IN
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type='BASE TABLE' AND table_schema='public'
    LOOP
      EXECUTE format('TRUNCATE TABLE %I.%I CASCADE', r.table_schema, r.table_name);
    END LOOP;

    -- Refill from checkpoint, using shared column intersection
    FOR r IN
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = v_schema AND table_type='BASE TABLE'
    LOOP
      SELECT string_agg(quote_ident(c.column_name), ',')
      INTO shared_cols
      FROM information_schema.columns c
      JOIN information_schema.columns p
        ON p.table_schema='public' AND p.table_name=r.table_name
       AND p.column_name=c.column_name
      WHERE c.table_schema = v_schema AND c.table_name=r.table_name;

      IF shared_cols IS NULL THEN CONTINUE; END IF;

      v_sql := format('INSERT INTO public.%I(%s) SELECT %s FROM %I.%I',
                      r.table_name, shared_cols, shared_cols, v_schema, r.table_name);
      EXECUTE v_sql;
    END LOOP;

    -- Restore sequences
    FOR r IN
      SELECT sequence_schema, sequence_name, last_value
      FROM admin.db_checkpoint_sequences
      WHERE checkpoint_id = p_checkpoint
    LOOP
      EXECUTE format('SELECT setval(%L, %s, true)', quote_ident(r.sequence_schema)||'.'||quote_ident(r.sequence_name), r.last_value);
    END LOOP;

    EXECUTE 'SET session_replication_role = origin';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE 'SET session_replication_role = origin';
    RAISE;
  END;

  PERFORM pg_advisory_unlock(987654321);
END$$;

COMMIT;