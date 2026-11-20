# 04-DRIZZLE-DATABASE-ARCHITECTURE.md

# PMKI Database Architecture

## Platform Pelayanan Terpadu PMKI
### Rumah Belajar Griya Asih Lawang

Version: 1.0  
Status: Production Database Architecture  
Database: PostgreSQL  
ORM: Drizzle ORM  
Reference:
- 03-DESIGN-IDENTITY-SYSTEM.md
- UI-UX-DESIGN-SYSTEM.md
- PRODUCTION-ARCHITECTURE-BLUEPRINT.md
- 02-NEXTJS-PRODUCTION-BLUEPRINT.md

---

# 1. Purpose

Dokumen ini mendefinisikan arsitektur database produksi PMKI.

Tujuan utama:

```text
Data Integrity

+
Privacy First

+
Auditability

+
Scalability

+
Type Safety
```

Database harus mendukung:

- Rumah Belajar
- Program Pelayanan
- Kehadiran
- Perkembangan Anak
- Consent
- Media
- Governance
- Publishing
- Audit
- Multi Organization

tanpa perlu redesign struktur fundamental.

---

# 2. Architectural Principles

## Principle 01

Single Source of Truth

```text
PostgreSQL
```

seluruh data operasional berasal dari database.

---

## Principle 02

Database First Integrity

Gunakan:

```text
Foreign Keys

Unique Constraints

Check Constraints

Indexes
```

bukan hanya validasi frontend.

---

## Principle 03

Privacy by Design

Data anak:

```text
PRIVATE
by default
```

---

## Principle 04

Auditability

Seluruh tindakan penting:

```text
Traceable
```

---

## Principle 05

Multi Organization Ready

Database tidak hanya untuk:

```text
Rumah Belajar Griya Asih
```

tetapi:

```text
PMKI

Mupel

Jemaat

Unit Pelayanan
```

---

# 3. Database Domains

Database dibagi menjadi domain.

```text
Foundation

Identity

Organization

Education

Attendance

Development

Consent

Media

Governance

Publishing

Audit
```

---

# 4. Identifier Strategy

Seluruh primary key menggunakan:

```text
UUID v7
```

atau UUID yang setara.

---

## Rule

Jangan gunakan:

```text
Auto Increment
```

untuk entitas utama.

---

Contoh:

```sql
id UUID PRIMARY KEY
```

---

# 5. Common Columns

Hampir seluruh tabel menggunakan:

```sql
id

created_at

updated_at

created_by

updated_by
```

---

Untuk data arsip:

```sql
archived_at

archived_by
```

---

# 6. Domain Map

```text
Organizations
      │
      ▼

Service Units
      │
      ▼

Programs
      │
      ▼

Classes
      │
      ▼

Students
      │
      ▼

Attendance
      │
      ▼

Development

```

---

# 7. Foundation Tables

## users

```sql
id

name

email

password_hash

role

active

last_login_at

created_at

updated_at
```

---

## roles

```sql
id

code

name

description
```

---

## permissions

```sql
id

code

name

description
```

---

## role_permissions

```sql
role_id

permission_id
```

---

# 8. Organization Domain

## organizations

Digunakan untuk:

```text
PMKI

Mupel

Jemaat
```

---

Fields:

```sql
id

parent_id

code

name

type

active
```

---

## organization_types

```text
SINODAL

MUPEL

JEMAAT
```

---

## service_units

Contoh:

```text
Rumah Belajar Griya Asih
```

Fields:

```sql
id

organization_id

name

description

active
```

---

# 9. Academic Structure

## academic_years

```sql
id

name

start_date

end_date

active
```

---

Contoh:

```text
2026 / 2027
```

---

# 10. Teacher Domain

## teachers

```sql
id

user_id

service_unit_id

name

phone

active
```

---

## teacher_assignments

```sql
id

teacher_id

class_id

academic_year_id
```

---

# 11. Student Domain

## students

Tabel utama peserta.

---

Fields

```sql
id

registration_number

full_name

nickname

birth_date

gender

education_level

school_name

address

district

registration_status

assigned_class_id

academic_year_id

service_unit_id
```

---

# 12. Registration Lifecycle

```text
SUBMITTED

PENDING_VERIFICATION

VERIFIED

CLASS_PLACEMENT

ACTIVE

WAITLIST

REJECTED

CANCELLED
```

---

# 13. Guardian Domain

## guardians

```sql
id

full_name

phone

occupation

address
```

---

## student_guardians

Pivot table.

```sql
student_id

guardian_id

relationship
```

---

Relationship:

```text
1 Student
  ↔
Many Guardians
```

---

Supported:

```text
Father

Mother

Guardian

Other
```

---

# 14. Education Structure

## classes

```sql
id

service_unit_id

academic_year_id

name

category

capacity

room_name

active
```

---

Examples

```text
TK A

TK B

SD 1

SD 2

...

SMP 8
```

---

## class_enrollments

```sql
id

student_id

class_id

academic_year_id

status
```

---

# 15. Subject Domain

## subjects

```sql
id

name

description
```

---

Default data:

```text
Matematika

Bahasa Inggris

Karakter

Literasi Membaca
```

---

## schedules

```sql
id

class_id

teacher_id

subject_id

day_of_week

start_time

end_time

location
```

---

# 16. Attendance Domain

## attendance_sessions

```sql
id

class_id

teacher_id

session_date

notes
```

---

Constraint:

```sql
UNIQUE(
 class_id,
 session_date
)
```

---

Mencegah:

```text
double attendance session
```

---

## attendance_records

```sql
id

session_id

student_id

status

note
```

---

Supported Status:

```text
PRESENT

ABSENT

SICK

PERMITTED
```

---

# 17. Development Domain

## development_categories

```sql
id

name
```

Default:

```text
Academic

Character

Literacy

Discipline

Social
```

---

## development_notes

```sql
id

student_id

teacher_id

category_id

observation

progress

follow_up

confidential
```

---

Rule

```text
confidential = true
```

by default.

---

# 18. Consent Domain

## consents

Data consent utama.

```sql
id

student_id

guardian_id

personal_data_consent

photo_video_consent

notes

effective_at

revoked_at
```

---

## Consent Status

```text
GRANTED

DENIED

REVOKED
```

---

Rule:

```text
Personal Data Consent

≠

Photo Consent
```

---

# 19. Media Domain

## media_assets

```sql
id

title

description

file_path

category

privacy_reviewed

eligible_for_public

reviewed_by
```

---

Categories

```text
KEGIATAN

ACARA

FASILITAS

PENGURUS
```

---

Rule:

```text
Media

cannot become public

without review
```

---

# 20. Governance Domain

## reports

```sql
id

title

report_type

period

summary

status

classification

created_by
```

---

Types

```text
ACTIVITY

ATTENDANCE

STUDENT_DEVELOPMENT

STAKEHOLDER
```

---

Statuses

```text
DRAFT

PROGRAM_REVIEW

UNIT_VALIDATION

ORGANIZATION_APPROVAL

APPROVED

REJECTED
```

---

# 21. Report Workflow

## report_workflow_logs

```sql
id

report_id

action

comment

actor_id

created_at
```

---

Rule

Workflow history:

```text
immutable
```

---

# 22. Publishing Domain

## publications

```sql
id

title

slug

excerpt

content

status

published_at

created_by
```

---

Statuses

```text
DRAFT

PRIVACY_REVIEW

APPROVED

PUBLISHED

ARCHIVED
```

---

# 23. Audit Domain

## audit_logs

Audit table adalah append only.

---

Fields

```sql
id

actor_id

action

entity_type

entity_id

description

metadata

created_at
```

---

Rule:

```text
No Update

No Delete

Append Only
```

---

# 24. Multi-Organization Strategy

Semua data penting harus dapat ditelusuri ke:

```sql
organization_id
```

atau

```sql
service_unit_id
```

---

Minimal:

```text
students

teachers

classes

attendance

development

reports

media
```

harus memiliki konteks organisasi.

---

# 25. Soft Delete Strategy

Gunakan:

```sql
archived_at

archived_by
```

---

Jangan:

```sql
DELETE
```

untuk data operasional.

---

# 26. Index Strategy

## Students

```sql
registration_number

full_name

registration_status

service_unit_id
```

---

## Attendance

```sql
session_date

class_id

student_id
```

---

## Development

```sql
student_id

teacher_id

created_at
```

---

## Reports

```sql
status

period

created_by
```

---

## Publications

```sql
slug

status

published_at
```

---

## Audit

```sql
actor_id

action

entity_type

created_at
```

---

# 27. Drizzle Schema Structure

```text
src/db/schema

core/

users.ts
roles.ts
permissions.ts

organization/

organizations.ts
service-units.ts

education/

academic-years.ts
teachers.ts
classes.ts
subjects.ts
schedules.ts

students/

students.ts
guardians.ts
student-guardians.ts

attendance/

attendance-sessions.ts
attendance-records.ts

development/

development-notes.ts

consent/

consents.ts

media/

media-assets.ts

governance/

reports.ts
report-workflow.ts

publishing/

publications.ts

audit/

audit-logs.ts

index.ts
```

---

# 28. Drizzle Query Layer

```text
db/queries/
```

Examples:

```text
student-queries.ts

attendance-queries.ts

report-queries.ts
```

---

Rule:

```text
Queries

≠

Business Logic
```

---

# 29. Seed Strategy

Environment:

```text
Development Only
```

---

Seed Data:

```text
Organizations

Service Units

Academic Years

Students

Teachers

Classes

Schedules

Reports

Publications
```

---

Seed harus mereplikasi:

```text
Rumah Belajar Griya Asih
```

---

# 30. Migration Strategy

## Step 1

Foundation

```text
Users

Roles

Permissions
```

---

## Step 2

Organizations

Service Units

Academic Years
```

---

## Step 3

Students

Guardians

Classes
```

---

## Step 4

Attendance

Development
```

---

## Step 5

Consent

Media

Publications
```

---

## Step 6

Reports

Workflow

Audit
```

---

# 31. Database Non-Negotiables

Rule 01

```text
No business logic in React
```

---

Rule 02

```text
No client-side authorization
```

---

Rule 03

```text
Audit Log is immutable
```

---

Rule 04

```text
Consent is explicit
```

---

Rule 05

```text
Child data is private by default
```

---

Rule 06

```text
Every workflow state is stored
not inferred
```

---

Rule 07

```text
Database constraints
before frontend validation
```

---

# 32. Definition of Done

Database Architecture dianggap selesai jika:

✅ Seluruh domain memiliki schema

✅ FK lengkap

✅ Index strategy jelas

✅ Audit strategy lengkap

✅ Consent strategy lengkap

✅ Governance workflow lengkap

✅ Multi-organization ready

✅ Drizzle ready

✅ PostgreSQL ready

✅ Production ready

---

# Final Architecture Statement

> Database PMKI dirancang sebagai sistem PostgreSQL berbasis domain yang mengutamakan integritas data, auditabilitas, privasi peserta didik, multi-organization readiness, dan workflow governance. Seluruh schema diimplementasikan menggunakan Drizzle ORM dengan pendekatan Database-First Integrity, Privacy-by-Design, dan Audit-by-Default untuk mendukung platform pendidikan dan komunitas PMKI dalam skala jangka panjang.


Rekomendasi berikutnya: lanjutkan dengan 05-AUTHORIZATION-RBAC-BLUEPRINT.md karena itu akan menentukan middleware Auth.js, kebijakan akses server-side, dan struktur permission yang akan digunakan oleh seluruh service layer dan database.