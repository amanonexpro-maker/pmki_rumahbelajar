# 11-DOMAIN-DRIVEN-FEATURE-ARCHITECTURE.md

# PMKI Domain-Driven Feature Architecture

## Platform Pelayanan Terpadu PMKI
### Rumah Belajar Griya Asih Lawang

Version: 1.0  
Status: Production Domain Architecture  
Priority: Critical  
Architecture Type: Domain-Driven Modular Monolith

Dependencies:

- 03-DESIGN-IDENTITY-SYSTEM.md
- UI-UX-DESIGN-SYSTEM.md v2.1
- 02-NEXTJS-PRODUCTION-BLUEPRINT.md
- 04-DRIZZLE-DATABASE-ARCHITECTURE.md
- 05-AUTHORIZATION-RBAC-BLUEPRINT.md
- 06-PWA-OFFLINE-STRATEGY.md
- 07-COMPONENT-ARCHITECTURE.md
- 08-STATE-MANAGEMENT.md
- 09-API-ARCHITECTURE.md
- 10-CONTENT-MICROCOPY-GUIDE.md

---

# 1. Purpose

Dokumen ini mendefinisikan bagaimana domain bisnis PMKI diterjemahkan menjadi struktur implementasi Next.js Production.

Tujuan utama:

```text
Scalability

Maintainability

Separation Of Concerns

Feature Ownership

Domain Integrity
```

Dokumen ini menjadi jembatan antara:

```text
Business Domain
        ↓
Application Features
        ↓
Code Structure
```

---

# 2. Architectural Philosophy

PMKI menggunakan:

```text
Domain Driven Design

+
Modular Monolith
```

Bukan:

```text
Page Driven Architecture

atau

Folder By Technical Type
```

---

# 3. Architecture Layers

```text
UI
        ↓

Actions
        ↓

Services
        ↓

Policies
        ↓

Repositories
        ↓

Drizzle
        ↓

Database
```

---

# 4. Domain Ownership Principle

Setiap domain:

✅ memiliki data sendiri

✅ memiliki service sendiri

✅ memiliki validators sendiri

✅ memiliki permissions sendiri

✅ memiliki queries sendiri

---

Setiap domain:

❌ tidak mengambil alih domain lain

❌ tidak mengakses database domain lain secara langsung

❌ tidak menulis query lintas domain

---

# 5. Production Folder Structure

```text
src/

app/
components/
features/
server/
db/
lib/
styles/
types/
```

---

# 6. Feature Architecture

Semua domain menggunakan struktur yang sama.

```text
features/

domain-name/
│
├── actions/
├── services/
├── repositories/
├── permissions/
├── validators/
├── queries/
├── hooks/
├── types/
├── components/
└── index.ts
```

---

# 7. Domain List

PMKI memiliki domain utama:

```text
Identity

Organization

Students

Academic

Attendance

Development

Consent

Media

Governance

Publishing

Audit

Administration
```

---

# 8. Identity Domain

Bertanggung jawab atas:

```text
Authentication

Sessions

User Identity

Profile
```

---

Ownership:

```text
users

sessions

auth
```

---

Feature:

```text
features/identity
```

---

# 9. Organization Domain

Bertanggung jawab atas:

```text
Organizations

Service Units

Memberships

Scope
```

---

Ownership:

```text
organizations

service_units

memberships
```

---

Feature:

```text
features/organization
```

---

# 10. Students Domain

Bertanggung jawab atas:

```text
Registration

Verification

Placement

Student Profiles
```

---

Ownership:

```text
students

guardians

student_guardians
```

---

Feature:

```text
features/students
```

---

Services:

```text
StudentService
GuardianService
RegistrationService
PlacementService
```

---

# 11. Academic Domain

Bertanggung jawab atas:

```text
Academic Years

Classes

Schedules

Teachers
```

---

Ownership:

```text
academic_years

classes

teachers

schedules
```

---

Feature:

```text
features/academic
```

---

# 12. Attendance Domain

Bertanggung jawab atas:

```text
Sessions

Roster

Attendance Records
```

---

Ownership:

```text
attendance_sessions

attendance_records
```

---

Feature:

```text
features/attendance
```

---

Services:

```text
AttendanceService

AttendanceSessionService
```

---

# 13. Development Domain

Bertanggung jawab atas:

```text
Observations

Progress Notes

Follow Up Notes
```

---

Ownership:

```text
development_notes
```

---

Feature:

```text
features/development
```

---

# 14. Consent Domain

Bertanggung jawab atas:

```text
Personal Data Consent

Photo Consent

Revocations
```

---

Ownership:

```text
consents
```

---

Feature:

```text
features/consent
```

---

# 15. Media Domain

Bertanggung jawab atas:

```text
Documentation

Media Review

Eligibility
```

---

Ownership:

```text
media_assets
```

---

Feature:

```text
features/media
```

---

# 16. Governance Domain

Bertanggung jawab atas:

```text
Reports

Approvals

Workflows

Decision History
```

---

Ownership:

```text
reports

report_workflow_logs
```

---

Feature:

```text
features/governance
```

---

# 17. Publishing Domain

Bertanggung jawab atas:

```text
News

Publications

Privacy Review

Publishing Workflow
```

---

Ownership:

```text
publications
```

---

Feature:

```text
features/publishing
```

---

# 18. Audit Domain

Bertanggung jawab atas:

```text
Audit Trail

Historical Records
```

---

Ownership:

```text
audit_logs
```

---

Feature:

```text
features/audit
```

---

# 19. Administration Domain

Bertanggung jawab atas:

```text
Role Management

Permission Assignment

Membership Assignment
```

---

Ownership:

```text
roles

permissions

role_permissions

user_roles

user_permissions
```

---

Feature:

```text
features/administration
```

---

# 20. Domain Dependencies

## Allowed

```text
Students
        ↓
Academic
```

---

```text
Attendance
        ↓
Students
```

---

```text
Development
        ↓
Students
```

---

```text
Consent
        ↓
Students
```

---

```text
Governance
        ↓
Publishing
```

---

```text
Publishing
        ↓
Media
```

---

# 21. Forbidden Dependencies

Forbidden:

```text
Students
        ↓
Attendance Repository
```

---

Forbidden:

```text
Attendance
        ↓
Publishing Repository
```

---

Forbidden:

```text
Development
        ↓
Consent Repository
```

---

Rule:

```text
Cross-domain access

must go through services.
```

---

# 22. Shared Layer

Lokasi:

```text
src/lib
src/components
src/server
```

---

Berisi:

```text
Utilities

Helpers

Shared Components

Shared Validators
```

---

Tidak berisi:

```text
Business Logic
```

---

# 23. Service Responsibilities

Service bertanggung jawab terhadap:

```text
Business Rules

Workflow Rules

Authorization

Policy Evaluation

Validation Coordination
```

---

Service tidak membuat:

```text
UI

Pages

Components
```

---

# 24. Repository Responsibilities

Repository bertanggung jawab terhadap:

```text
Database Queries

Persistence

Transactions
```

---

Repository tidak boleh:

```text
Validate Permissions

Execute Workflow Logic
```

---

# 25. Actions Responsibilities

Actions bertanggung jawab terhadap:

```text
Entry Point

Validation Trigger

Authorization Trigger

Service Invocation
```

---

Actions tidak boleh:

```text
Contain Business Logic
```

---

# 26. Validators

Lokasi:

```text
validators/
```

---

Semua validasi menggunakan:

```text
Zod
```

---

Contoh:

```text
student.schema.ts

attendance.schema.ts

report.schema.ts
```

---

# 27. Permissions

Lokasi:

```text
permissions/
```

---

Berisi:

```text
Student Policies

Attendance Policies

Development Policies
```

---

Tidak langsung berada di komponen.

---

# 28. Queries

Lokasi:

```text
queries/
```

---

Digunakan untuk:

```text
Read Models

Dashboard Views

Aggregated Lists
```

---

Bukan untuk:

```text
Mutation
```

---

# 29. Feature Components

Lokasi:

```text
components/
```

di dalam feature.

---

Contoh:

```text
StudentCard

StudentProfileSummary

AttendanceRoster

SessionProgress
```

---

Rule:

```text
Feature Component
boleh memahami domain.
```

---

# 30. Reusable Components

Lokasi:

```text
src/components
```

---

Contoh:

```text
Button

Dialog

Badge

Sheet

PageHeader

DataTable

EntityHeader

WorkflowProgress
```

---

Rule:

```text
Reusable Component

tidak memahami domain.
```

---

# 31. Domain Events

PMKI menggunakan event bisnis eksplisit.

---

Examples:

```text
StudentRegistered

StudentVerified

StudentPlaced

AttendanceRecorded

DevelopmentNoteCreated

ConsentUpdated

ReportApproved

PublicationPublished
```

---

# 32. Event Usage

Digunakan untuk:

```text
Audit

Notifications

Future Integrations
```

---

Tidak digunakan untuk:

```text
Tight Coupling Between Domains
```

---

# 33. Page Ownership

## Students

```text
/workspace/students
```

owned by:

```text
Students Domain
```

---

## Attendance

```text
/workspace/attendance
```

owned by:

```text
Attendance Domain
```

---

## Governance

```text
/workspace/reports
```

owned by:

```text
Governance Domain
```

---

# 34. Feature Navigation

Navigasi boleh lintas domain.

Ownership tidak.

---

Example:

```text
Student Detail

↓

Attendance Tab
```

---

Data Attendance tetap berasal dari:

```text
Attendance Domain
```

---

# 35. Integration Rules

Semua integrasi harus dilakukan melalui:

```text
Application Service
```

---

Bukan:

```text
Feature Direct Database Access
```

---

# 36. Multi Organization Readiness

Semua domain harus memahami:

```text
organization_id

service_unit_id
```

---

Scope bukan responsibility UI.

---

Scope responsibility:

```text
Policy Layer
```

---

# 37. Offline Feature Integration

Feature yang mendukung offline:

```text
Attendance

Development
```

harus memiliki:

```text
Draft Support

Sync Queue

Conflict Handling
```

---

# 38. Testing Ownership

Setiap feature wajib memiliki:

```text
Service Tests

Policy Tests

Validation Tests
```

---

Critical domains:

```text
Students

Attendance

Governance

RBAC
```

wajib memiliki integration tests.

---

# 39. Future Domains

Future domains harus mengikuti standar ini.

---

Contoh:

```text
Events

Finance

Volunteer Management

Training
```

---

Tidak boleh membuat arsitektur baru.

---

# 40. Anti Patterns

Forbidden:

```text
God Service
```

---

Forbidden:

```text
Shared Business Logic Folder
```

---

Forbidden:

```text
Repository Calling Repository
```

---

Forbidden:

```text
Business Logic In React Component
```

---

Forbidden:

```text
Feature Accessing Another Feature Database Directly
```

---

# 41. Review Gates

Sebelum domain baru dibuat:

### Gate 1

Apakah domain benar-benar baru?

---

### Gate 2

Apakah bisa menjadi bagian domain yang ada?

---

### Gate 3

Apakah boundaries jelas?

---

### Gate 4

Apakah ownership jelas?

---

### Gate 5

Apakah dependency aman?

---

# 42. Definition of Done

Domain Architecture dianggap selesai jika:

✅ Domain Boundaries Jelas

✅ Ownership Jelas

✅ Folder Structure Jelas

✅ Dependency Rules Jelas

✅ Service Rules Jelas

✅ Repository Rules Jelas

✅ Event Rules Jelas

✅ Offline Integration Jelas

✅ Testing Ownership Jelas

✅ Multi Organization Ready

---

# 43. Final Statement

> PMKI menggunakan Domain-Driven Feature Architecture untuk memastikan setiap area bisnis memiliki kepemilikan yang jelas, batas tanggung jawab yang kuat, dan kemampuan berkembang tanpa menciptakan ketergantungan yang tidak terkendali. Struktur aplikasi mengikuti domain pelayanan, bukan sekadar struktur teknis framework.

> Domains own behavior.

> Services own rules.

> Repositories own persistence.

> Components own presentation.

> The database owns the truth.