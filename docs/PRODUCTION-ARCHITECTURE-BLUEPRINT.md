PRODUCTION-ARCHITECTURE-BLUEPRINT.md
PMKI Platform
Rumah Belajar Griya Asih Lawang

Status: Post Design Freeze (UI-1 → UI-12 Complete)
 Architecture Target: Production Ready
 Approach: UX-Parity Migration

1. Architecture Principles
Primary Principle

Production implementation MUST preserve workflow, UX, privacy model, RBAC behavior, and design identity from the validated prototype.

This project is not:

Prototype
    ↓
Throw Away


This project is:

Prototype
     ↓
Validated UX Reference
     ↓
Production Architecture

Product Principles
Public
Warm
Educational
Community-Oriented
Trustworthy

Workspace
Calm
Operational
Human
Editorial

Data
Minimal Disclosure
Privacy First
Role Aware
Audit Friendly

2. Target Technology Stack
Frontend
Next.js 17+ App Router
React
TypeScript
Tailwind CSS v4
shadcn/ui
Lucide Icons
next-pwa

Backend
Next.js Route Handlers
Server Actions
Domain Services
RBAC Middleware

Database
PostgreSQL
Drizzle ORM
Drizzle Kit

Infrastructure
Docker
Docker Compose

Services:

app
postgres
supabase

Authentication
Auth.js

Email Login
Role Aware Session
Permission Claims

Optional Future:
Magic Link
OAuth

3. High Level Architecture
┌────────────────────────┐
│        Browser         │
│        PWA App         │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│      Next.js App       │
│                        │
│ Public                │
│ Workspace             │
│ Server Components     │
│ Client Components     │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│    Route Handlers      │
│   Server Actions       │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│    Domain Services     │
│                        │
│ Students              │
│ Attendance            │
│ Development           │
│ Consent               │
│ Reports               │
│ Publishing            │
│ Audit                 │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│    Authorization       │
│      RBAC Layer        │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│      Drizzle ORM       │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│      PostgreSQL        │
└────────────────────────┘

4. Project Structure
src/

app/
│
├── (public)
│   ├── page.tsx
│   ├── program
│   ├── gallery
│   ├── news
│   └── registration
│
├── (workspace)
│   ├── dashboard
│   ├── students
│   ├── attendance
│   ├── development
│   ├── organization
│   ├── reports
│   ├── consent
│   ├── publishing
│   ├── audit
│   └── administration
│
├── api
│
├── auth
│
└── layout.tsx

features/

├── students
├── attendance
├── development
├── organization
├── reports
├── consent
├── publishing
├── users
├── audit

components/

├── ui
├── layout
├── patterns

server/

├── auth
├── permissions
├── services
├── repositories

db/

├── schema
├── seed
├── migrations

lib/

├── constants
├── validation
├── formatting

styles/

├── tokens.css
├── themes.css
├── typography.css

5. PWA Strategy
Philosophy
Mobile First
Offline Friendly
Installable
Fast
Reliable

Features
Installable
manifest.json
icons
splash screens
shortcuts

Offline Support

Allowed Offline:

Public pages
Dashboard shell
Previously loaded lists
Reference data


Limited Offline:

Attendance Draft
Development Draft


Queued:

Attendance Submission
Development Notes


Not Offline:

Approval Actions
Publishing Actions
Administration

6. Domain Architecture
Student Domain
Student
Guardian
Enrollment
AcademicYear
ClassAssignment


Responsibilities:

Registration
Verification
Placement
Activation
Profile Management

Attendance Domain
Schedule
AttendanceSession
AttendanceRecord


Responsibilities:

Create Session
Record Attendance
Review Attendance
Track Follow Up

Development Domain
DevelopmentNote
DevelopmentCategory
FollowUp


Responsibilities:

Observation
Reflection
Follow Up

Consent Domain
ConsentRecord

Personal Data

Photo / Video


Responsibilities:

Grant
Deny
Revoke
Audit

Governance Domain
Report
Approval
WorkflowStep
Publication
MediaReview


Responsibilities:

Review
Approval
Publication
Governance Audit

Audit Domain
AuditLog
Actor
Action
Entity


Responsibilities:

Traceability
History
Compliance

7. Authentication Architecture
Auth.js

Session:

{
  userId: string
  role: Role
  serviceUnitId: string
}

Middleware
Anonymous
    ↓
Authenticated
    ↓
Role Check
    ↓
Permission Check
    ↓
Domain Check

8. RBAC Architecture

Current:

can.ts


Future:

Role
    ↓
Permission Set
    ↓
Policy Evaluation


Example

can(
  user,
  "attendance.record"
)


Server-side only.

Never trust client authorization.

9. Database Architecture
Core Tables
users
roles

organizations
service_units

academic_years

students
guardians

student_guardians

classes
teachers

class_enrollments

schedules

attendance_sessions
attendance_records

development_notes

consents

media_assets

publications

reports
report_workflow_logs

audit_logs

10. Audit Strategy

Audit records are:

Append Only
Immutable
Human Readable


Never:

Update
Delete
Overwrite


Structure:

Who
What
When
Where
Why (optional)

11. Privacy Model
Child Data Protection

Default:

Private


Not:

Public by default


Protected:

Guardian Contact
Address
Development Notes
Assessment
Consent Evidence


Rules:

Need To Know
Minimum Disclosure
Role Based Access

12. Design System Preservation

Must be migrated unchanged:

Design Tokens
Typography
Spacing Scale
Color Semantics

AppShell
PageHeader
EntityHeader
DetailTabs

DataTable
SearchToolbar

WorkflowProgress
DecisionHistory

FormSection
StepIndicator
ReviewSection

13. Supabase Local

Docker Compose:

services:

  app:
    build: .
    ports:
      - "3000:3000"

  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: pmki
      POSTGRES_USER: pmki
      POSTGRES_PASSWORD: pmki

  supabase:
    image: supabase/studio


Environment:

DATABASE_URL=

NEXTAUTH_SECRET=

NEXTAUTH_URL=

SUPABASE_URL=

SUPABASE_ANON_KEY=

14. Migration Strategy
Phase 1

Foundation

Next.js
Tailwind
shadcn/ui
Drizzle
Postgres
Auth
PWA

Phase 2

Database

Schema
Migration
Seed Data

Phase 3

Authentication

Users
Roles
Sessions
Permissions

Phase 4

Students

Registration
Verification
Placement

Phase 5

Attendance

Sessions
Recording
Review

Phase 6

Development

Observation
Follow Up

Phase 7

Governance

Reports
Approvals
Publishing
Consent

Phase 8

Audit

Audit Log
Administration

Phase 9

Public Experience

Homepage
Gallery
News
Contact

15. Acceptance Criteria

Production migration is complete only when:

Functional

✅ Registration works
 ✅ Verification works
 ✅ Placement works
 ✅ Attendance works
 ✅ Development works
 ✅ Reports work
 ✅ Consent works
 ✅ Publishing works
 ✅ Audit works

UX

✅ UI-1–UI-12 parity maintained

Security

✅ RBAC server-side

✅ Audit append-only

✅ Privacy protected

✅ Consent enforced

Technical

✅ Next.js App Router

✅ Drizzle ORM

✅ PostgreSQL

✅ Docker

✅ PWA installable

✅ Mobile-first responsive

✅ Type-safe

✅ Production deployable

Final Architecture Statement

PMKI Production Platform adalah aplikasi PWA mobile-first berbasis Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, PostgreSQL (Supabase), dan Docker yang mempertahankan seluruh UX, workflow, privacy model, governance model, serta design identity yang telah divalidasi melalui prototype UI-1 sampai UI-12.
