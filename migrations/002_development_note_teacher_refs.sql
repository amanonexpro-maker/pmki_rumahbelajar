DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'student_development_notes'
      AND column_name = 'teacher_id'
  ) THEN
    ALTER TABLE student_development_notes
      DROP CONSTRAINT IF EXISTS student_development_notes_teacher_id_fkey;
    ALTER TABLE student_development_notes RENAME COLUMN teacher_id TO teacher_reference_id;
    ALTER TABLE student_development_notes
      ADD COLUMN teacher_user_id text REFERENCES users(id),
      ADD COLUMN teacher_directory_id text REFERENCES teachers(id);

    IF EXISTS (
      SELECT 1 FROM student_development_notes n
      WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = n.teacher_reference_id)
        AND NOT EXISTS (SELECT 1 FROM teachers t WHERE t.id = n.teacher_reference_id)
    ) THEN
      RAISE EXCEPTION 'A development note references an unknown teacher or user';
    END IF;

    UPDATE student_development_notes n SET teacher_user_id = n.teacher_reference_id
      WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = n.teacher_reference_id);
    UPDATE student_development_notes n SET teacher_directory_id = n.teacher_reference_id
      WHERE teacher_user_id IS NULL
        AND EXISTS (SELECT 1 FROM teachers t WHERE t.id = n.teacher_reference_id);
    ALTER TABLE student_development_notes
      ADD CONSTRAINT student_development_note_teacher_ref_check
      CHECK ((teacher_user_id IS NOT NULL)::integer + (teacher_directory_id IS NOT NULL)::integer = 1);
    ALTER TABLE student_development_notes DROP COLUMN teacher_reference_id;
  ELSE
    ALTER TABLE student_development_notes
      ADD COLUMN IF NOT EXISTS teacher_user_id text REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS teacher_directory_id text REFERENCES teachers(id);

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'student_development_note_teacher_ref_check'
    ) THEN
      ALTER TABLE student_development_notes
        ADD CONSTRAINT student_development_note_teacher_ref_check
        CHECK ((teacher_user_id IS NOT NULL)::integer + (teacher_directory_id IS NOT NULL)::integer = 1);
    END IF;
  END IF;
END
$migration$;
