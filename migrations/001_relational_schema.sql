CREATE TABLE IF NOT EXISTS schema_migrations (
  version integer PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (
  id text PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  level text NOT NULL,
  parent_id text REFERENCES organizations(id) DEFERRABLE INITIALLY DEFERRED,
  address text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  position integer NOT NULL
);

CREATE TABLE IF NOT EXISTS service_units (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  type text NOT NULL,
  headline text NOT NULL,
  slogan text NOT NULL,
  location text NOT NULL,
  active boolean NOT NULL,
  position integer NOT NULL
);

CREATE TABLE IF NOT EXISTS service_unit_sub_districts (
  service_unit_id text NOT NULL REFERENCES service_units(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL,
  PRIMARY KEY (service_unit_id, position)
);

CREATE TABLE IF NOT EXISTS service_unit_contacts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  service_unit_id text NOT NULL REFERENCES service_units(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  role text NOT NULL,
  position integer NOT NULL,
  UNIQUE (service_unit_id, position)
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL,
  organization_id text NOT NULL REFERENCES organizations(id),
  service_unit_id text REFERENCES service_units(id),
  active boolean NOT NULL,
  avatar_url text,
  last_login_at timestamptz,
  position integer NOT NULL
);

CREATE TABLE IF NOT EXISTS academic_years (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  position integer NOT NULL
);

CREATE TABLE IF NOT EXISTS subjects (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  target_focus text NOT NULL,
  position integer NOT NULL
);

CREATE TABLE IF NOT EXISTS teachers (
  id text PRIMARY KEY,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  origin_school text NOT NULL,
  is_coordinator boolean,
  position integer NOT NULL
);

CREATE TABLE IF NOT EXISTS teacher_subjects (
  teacher_id text NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_name text NOT NULL,
  position integer NOT NULL,
  PRIMARY KEY (teacher_id, position)
);

CREATE TABLE IF NOT EXISTS classes (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  capacity integer NOT NULL,
  enrolled_count integer NOT NULL,
  room_name text NOT NULL,
  main_teacher_id text NOT NULL REFERENCES teachers(id),
  position integer NOT NULL
);

CREATE TABLE IF NOT EXISTS class_schedules (
  id text PRIMARY KEY,
  day_of_week text NOT NULL,
  time_start text NOT NULL,
  time_end text NOT NULL,
  class_id text NOT NULL REFERENCES classes(id),
  subject_id text NOT NULL REFERENCES subjects(id),
  teacher_id text NOT NULL REFERENCES teachers(id),
  location text NOT NULL,
  position integer NOT NULL
);

CREATE TABLE IF NOT EXISTS guardians (
  id text PRIMARY KEY,
  full_name text NOT NULL,
  relationship text NOT NULL,
  phone text NOT NULL,
  occupation text NOT NULL,
  address text NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id text PRIMARY KEY,
  registration_number text NOT NULL UNIQUE,
  full_name text NOT NULL,
  nickname text NOT NULL,
  gender text NOT NULL,
  date_of_birth date NOT NULL,
  place_of_birth text NOT NULL,
  address text NOT NULL,
  kelurahan text NOT NULL,
  grade_level text NOT NULL,
  assigned_class_id text REFERENCES classes(id),
  is_raal_resident boolean NOT NULL,
  status text NOT NULL,
  guardian_id text NOT NULL REFERENCES guardians(id),
  notes text,
  created_at timestamptz NOT NULL,
  verified_at timestamptz,
  verified_by text,
  position integer NOT NULL
);

CREATE INDEX IF NOT EXISTS students_status_idx ON students(status);
CREATE INDEX IF NOT EXISTS students_assigned_class_idx ON students(assigned_class_id);

CREATE TABLE IF NOT EXISTS consents (
  id text PRIMARY KEY,
  student_id text NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  guardian_name text NOT NULL,
  personal_data_consent text NOT NULL,
  photo_video_public_consent text NOT NULL,
  effective_date date NOT NULL,
  notes text,
  updated_at timestamptz NOT NULL,
  position integer NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id text PRIMARY KEY,
  class_id text NOT NULL REFERENCES classes(id),
  class_name text NOT NULL,
  session_date date NOT NULL,
  recorded_by text NOT NULL REFERENCES users(id),
  recorded_by_name text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL,
  position integer NOT NULL
);

CREATE INDEX IF NOT EXISTS attendance_sessions_class_date_idx
  ON attendance_sessions(class_id, session_date);

CREATE TABLE IF NOT EXISTS attendance_records (
  id text PRIMARY KEY,
  session_id text NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id text NOT NULL REFERENCES students(id),
  student_name text NOT NULL,
  status text NOT NULL,
  note text,
  position integer NOT NULL
);

CREATE TABLE IF NOT EXISTS student_development_notes (
  id text PRIMARY KEY,
  student_id text NOT NULL REFERENCES students(id),
  student_name text NOT NULL,
  note_date date NOT NULL,
  category text NOT NULL,
  teacher_id text NOT NULL REFERENCES users(id),
  teacher_name text NOT NULL,
  observation text NOT NULL,
  progress_notes text NOT NULL,
  follow_up text NOT NULL,
  classification text NOT NULL,
  created_at timestamptz NOT NULL,
  position integer NOT NULL
);

CREATE INDEX IF NOT EXISTS development_notes_student_date_idx
  ON student_development_notes(student_id, note_date);

CREATE TABLE IF NOT EXISTS media_assets (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  url text NOT NULL,
  category text NOT NULL,
  captured_date date NOT NULL,
  privacy_reviewed boolean NOT NULL,
  is_eligible_for_public boolean NOT NULL,
  reviewed_by text,
  position integer NOT NULL
);

CREATE TABLE IF NOT EXISTS publication_posts (
  id text PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  summary text NOT NULL,
  content text NOT NULL,
  cover_image text,
  status text NOT NULL,
  author_id text NOT NULL REFERENCES users(id),
  author_name text NOT NULL,
  published_at timestamptz,
  scheduled_for timestamptz,
  event_date date,
  event_location text,
  position integer NOT NULL
);

CREATE INDEX IF NOT EXISTS publication_posts_status_idx ON publication_posts(status);

CREATE TABLE IF NOT EXISTS service_reports (
  id text PRIMARY KEY,
  title text NOT NULL,
  period text NOT NULL,
  report_type text NOT NULL,
  summary text NOT NULL,
  total_beneficiaries integer NOT NULL,
  total_sessions integer NOT NULL,
  average_attendance_pct double precision NOT NULL,
  created_by text NOT NULL REFERENCES users(id),
  created_by_name text NOT NULL,
  status text NOT NULL,
  classification text NOT NULL,
  is_public_summary_generated boolean NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  position integer NOT NULL
);

CREATE TABLE IF NOT EXISTS report_approval_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id text NOT NULL REFERENCES service_reports(id) ON DELETE CASCADE,
  step text NOT NULL,
  actor_id text NOT NULL REFERENCES users(id),
  actor_name text NOT NULL,
  action text NOT NULL,
  comment text NOT NULL,
  occurred_at timestamptz NOT NULL,
  position integer NOT NULL,
  UNIQUE (report_id, position)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY,
  actor_id text NOT NULL REFERENCES users(id),
  actor_name text NOT NULL,
  actor_role text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  description text NOT NULL,
  occurred_at timestamptz NOT NULL,
  ip_address text,
  position integer NOT NULL
);

CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON audit_logs(occurred_at);

CREATE TABLE IF NOT EXISTS application_settings (
  id smallint PRIMARY KEY CHECK (id = 1),
  current_user_id text NOT NULL REFERENCES users(id)
);
