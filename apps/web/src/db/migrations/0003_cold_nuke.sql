ALTER TABLE "users" ADD COLUMN "public_bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "show_on_public" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true)
    ON CONFLICT (id) DO UPDATE SET public = true;
  END IF;
END;
$$;
--> statement-breakpoint
SELECT public.pmki_harden_tables();
