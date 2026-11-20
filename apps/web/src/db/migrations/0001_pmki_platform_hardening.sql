-- ==============================================================================
-- PMKI PLATFORM HARDENING (ADR-13 / Appendix D)
-- 1. RLS deny-by-default & revoke anon/authenticated grants on all public tables
-- 2. Append-only immutability triggers on audit_logs & report_workflow_logs
-- 3. Private Supabase Storage bucket `media`
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.pmki_harden_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE '__drizzle%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated;', r.tablename);
  END LOOP;

  REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
END;
$$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.pmki_reject_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Append-only table % cannot be updated or deleted (PMKI D-14)', TG_TABLE_NAME;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.pmki_reject_mutation();
--> statement-breakpoint

DROP TRIGGER IF EXISTS trg_report_workflow_logs_immutable ON public.report_workflow_logs;
CREATE TRIGGER trg_report_workflow_logs_immutable
  BEFORE UPDATE OR DELETE ON public.report_workflow_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.pmki_reject_mutation();
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('media', 'media', false)
    ON CONFLICT (id) DO UPDATE SET public = false;
  END IF;
END;
$$;
--> statement-breakpoint

SELECT public.pmki_harden_tables();
