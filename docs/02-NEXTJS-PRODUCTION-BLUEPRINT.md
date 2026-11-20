03-DESIGN-IDENTITY-SYSTEM.md sebagai otoritas desain tertinggi
Design DNA PMKI
Modular Token Architecture
Premium Design Principles
Anti-AI Design Rules
Mobile-First PWA Architecture
Next.js + Supabase Local + Drizzle + Docker
UX Parity Preservation
Production Migration Strategy
# 02-NEXTJS-PRODUCTION-BLUEPRINT.md

# PMKI Production Blueprint

## Platform Pelayanan Terpadu PMKI
### Pilot: Rumah Belajar Griya Asih Lawang

Version: 2.0
Status: Production Architecture Blueprint
Prerequisite: Design Freeze Approved

---

# 1. Purpose

Dokumen ini menjadi blueprint implementasi produksi untuk PMKI Platform.

Tujuan utama dokumen ini adalah:

```text
MENGUBAH PROTOTYPE VALIDASI
MENJADI
PRODUCTION SYSTEM
```

tanpa kehilangan:

- Design Identity
- User Experience
- Workflow
- Privacy Model
- Governance Model
- Accessibility
- Mobile First Experience

Dokumen ini bukan spesifikasi desain.

Dokumen ini adalah spesifikasi implementasi.

---

# 2. Architecture Governance

## Document Hierarchy

Seluruh implementasi wajib mengikuti urutan otoritas berikut:

```text
03-DESIGN-IDENTITY-SYSTEM.md
                ↓
UI-UX-DESIGN-SYSTEM.md
                ↓
PRODUCTION-ARCHITECTURE-BLUEPRINT.md
                ↓
02-NEXTJS-PRODUCTION-BLUEPRINT.md
                ↓
Implementation
```

Jika terjadi konflik:

```text
DESIGN IDENTITY
selalu menang.
```

---

## Non-Negotiable Rule

Framework harus mengikuti identitas.

Bukan identitas yang mengikuti framework.

Salah:

```text
shadcn terlihat seperti ini
jadi kita pakai saja
```

Benar:

```text
shadcn adalah infrastruktur

PMKI adalah identitas
```

---

# 3. Production Vision

PMKI adalah:

```text
Educational Community Platform
```

Bukan:

```text
Dashboard

SaaS

ERP

NGO Admin Software

Government System
```

Karakter utama:

```text
Human
Educational
Trustworthy
Warm
Calm
Intentional
```

---

# 4. Product Experience Pillars

## Public

```text
Warm
Hopeful
Welcoming
Community-Oriented
```

Target:

> "Saya percaya ini tempat yang baik untuk anak belajar."

---

## Workspace

```text
Calm
Focused
Human
Operational
```

Target:

> "Saya tahu apa yang harus saya lakukan berikutnya."

---

## Governance

```text
Traceable
Responsible
Trustworthy
```

Target:

> "Saya bisa mengambil keputusan dengan benar."
```

---

# 5. Production Stack

## Frontend

```text
Next.js App Router

React

TypeScript

Tailwind CSS v4

shadcn/ui

Lucide Icons
```

---

## Backend

```text
Next.js Route Handlers

Server Actions

Domain Services
```

---

## Database

```text
PostgreSQL

Drizzle ORM

Drizzle Kit
```

---

## Platform

```text
Supabase
(Self Hosted Development)
```

---

## Authentication

```text
Auth.js
```

---

## Infrastructure

```text
Docker

Docker Compose
```

---

## Progressive Web App

```text
PWA

Offline Aware

Installable

Mobile First
```

---

# 6. Design Foundation Stack

Implementasi UI mengikuti urutan berikut:

```text
Design Identity

        ↓

Design System

        ↓

Design Tokens

        ↓

shadcn/ui

        ↓

PMKI Components

        ↓

Features

        ↓

Pages
```

Rule:

```text
shadcn/ui
=
Infrastructure

NOT

Identity
```

---

# 7. Modular Token Architecture

## Layer 1

Brand Tokens

Tidak digunakan langsung pada komponen.

```css
--forest
--leaf
--sunlight
--canvas
--stone
--water
--lavender
```

Makna:

```text
Forest      → Stability
Leaf        → Growth
Sunlight    → Encouragement
Canvas      → Reading Comfort
Stone       → Governance
Water       → Reflection
Lavender    → Exploration
```

---

## Layer 2

Semantic Tokens

```css
--primary

--success
--warning
--danger
--info

--learning
--activity

--background
--surface
--surface-subtle

--foreground
--foreground-secondary
--foreground-muted

--border
--border-subtle
```

---

## Layer 3

Component Tokens

```css
--button-primary-bg
--button-primary-hover

--badge-success-bg

--dialog-surface

--hero-surface

--card-surface

--sidebar-active

--table-hover
```

---

## Rule

```text
Components consume
Component Tokens

NOT

Brand Tokens
```

---

# 8. Typography Architecture

Typography adalah identitas utama PMKI.

Lebih penting daripada:

- warna
- ilustrasi
- icon
- animasi

---

## Display

Digunakan untuk:

```text
Hero

Mission

Storytelling

Community Narratives
```

Karakter:

```text
Expressive

Editorial

Memorable
```

---

## Heading

Digunakan untuk:

```text
Dashboard

Workspace

Details
```

Karakter:

```text
Calm

Structured

Readable
```

---

## Body

Digunakan untuk:

```text
Reading

Operations

Forms

Tables
```

Karakter:

```text
Comfortable

Efficient
```

---

## Label

Digunakan untuk:

```text
Guidance

Support

Metadata
```

---

## Mono

Digunakan untuk:

```text
Audit

Identifiers

Technical References
```

---

## Rule

```text
Hero Typography

must never appear

inside operational workspace.
```

---

# 9. Project Structure

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

## App Router

```text
app/

(public)/
├── page.tsx
├── program
├── gallery
├── news
├── registration

(workspace)/
├── dashboard
├── students
├── attendance
├── development
├── organization
├── reports
├── consent
├── publishing
├── audit
├── administration

api/
auth/
```

---

# 10. Domain Architecture

## Students

```text
Registration

Verification

Placement

Activation
```

---

## Attendance

```text
Session

Roster

Recording

Review
```

---

## Development

```text
Observation

Progress

Follow Up
```

---

## Consent

```text
Personal Data

Photo & Video

Revocation
```

---

## Governance

```text
Reports

Approval

Publication

Privacy Review
```

---

## Audit

```text
Traceability

History

Compliance
```

---

# 11. Authentication Blueprint

Auth.js menjadi satu-satunya sumber otoritas identitas.

Session:

```ts
type SessionUser = {
  userId: string
  role: Role
  organizationId: string
  serviceUnitId: string
}
```

---

# 12. Authorization Blueprint

## Layer 1

Authentication

```text
Logged In?
```

---

## Layer 2

Role

```text
Teacher

Coordinator

Approver

Admin
```

---

## Layer 3

Permission

```text
attendance.record

student.verify

guardian.read

report.approve

publication.publish
```

---

## Layer 4

Policy

Misalnya:

```text
Separation Of Duties
```

---

## Rule

```text
Never trust client permissions.
```

Seluruh authorization dilakukan di server.

---

# 13. PWA Strategy

## Mobile First

Baseline:

```text
375px
```

baru:

```text
768
1024
1440
```

---

## Offline Priority

### High

```text
Attendance Draft

Development Draft
```

### Medium

```text
Dashboard

Students
```

### Low

```text
Governance

Publishing

Administration
```

---

## Installable

```text
Manifest

Icons

Splash Screen

Shortcuts
```

---

# 14. Supabase Local Architecture

Development Environment:

```yaml
app

postgres

supabase

mailhog
```

---

## Database

```text
Single PostgreSQL Source of Truth
```

---

## Environment

```env
DATABASE_URL=

AUTH_SECRET=

AUTH_URL=

NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

# 15. Drizzle Architecture

## Core Tables

```text
users

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
```

---

# 16. Service Architecture

Repositories:

```text
Database Access Only
```

Contoh:

```text
StudentRepository

AttendanceRepository

ReportRepository
```

---

Services:

```text
Business Rules
```

Contoh:

```text
StudentService

AttendanceService

GovernanceService
```

---

# 17. Server Actions

Mutasi data hanya boleh dilakukan melalui:

```text
Server Actions
```

Contoh:

```ts
createStudent()

verifyRegistration()

placeStudent()

recordAttendance()

createNote()

approveReport()

publishPost()
```

---

# 18. Privacy Architecture

Prinsip:

```text
Deny By Default
```

---

Sensitive Data:

```text
Guardian Contact

Address

Development Notes

Assessment

Consent Evidence
```

---

Rule:

```text
Need To Know

Minimum Disclosure
```

---

# 19. Audit Architecture

Audit adalah:

```text
Immutable

Append Only

Traceable
```

---

Audit tidak boleh:

```text
Deleted

Updated

Overwritten
```

---

# 20. Anti-AI Implementation Rules

Forbidden:

```text
4 KPI Cards
+
Chart
+
Feed
```

---

Forbidden:

```text
Card Grid Everywhere
```

---

Forbidden:

```text
Gradient Everywhere
```

---

Forbidden:

```text
Everything Is Green
```

---

Forbidden:

```text
Heavy Shadow Everywhere
```

---

Forbidden:

```text
Default shadcn appearance
```

---

Forbidden:

```text
Animation Everywhere
```

---

Forbidden:

```text
Visual Decoration replacing
Information Architecture
```

---

# 21. Stop-Scrolling Requirement

Public Experience wajib memiliki:

```text
Meaningful Pause Moments
```

Contoh:

```text
Hero

Mission

Community Story

Registration CTA
```

Bukan:

```text
Visual Noise
```

---

# 22. Design Review Gates

Sebelum merge:

### Gate 01

Masih bekerja tanpa shadow?

---

### Gate 02

Masih bekerja tanpa warna?

---

### Gate 03

Masih bekerja tanpa badge?

---

### Gate 04

Masih bekerja tanpa animasi?

---

### Gate 05

Dipahami dalam 5 detik?

---

Jika gagal:

```text
Fix hierarchy

NOT decoration.
```

---

# 23. Migration Waves

## Wave 1

Foundation

```text
Next.js

Tailwind

PWA

Auth
```

---

## Wave 2

Students

```text
Registration

Verification

Placement
```

---

## Wave 3

Attendance

Development
```

---

## Wave 4

Consent

Media

Publishing
```

---

## Wave 5

Reports

Governance
```

---

## Wave 6

Audit

Administration
```

---

## Wave 7

Public Experience
```

---

# 24. Production Success Criteria

Functional:

✅ Registration

✅ Verification

✅ Placement

✅ Attendance

✅ Development

✅ Consent

✅ Governance

✅ Publishing

✅ Audit

---

Design:

✅ UX Parity Maintained

✅ Design Identity Preserved

✅ Not Generic

✅ Not Template Looking

---

Security:

✅ Server-Side Authorization

✅ Consent Enforcement

✅ Audit Integrity

✅ Privacy Protection

---

Technical:

✅ Next.js

✅ Drizzle

✅ PostgreSQL

✅ Docker

✅ PWA

✅ Mobile First

✅ Type Safe

---

# 25. Final Production Statement

> PMKI Production Platform adalah platform pendidikan dan komunitas berbasis PWA mobile-first yang dibangun menggunakan Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, PostgreSQL (Supabase), Auth.js, dan Docker.

> Seluruh implementasi wajib mematuhi 03-DESIGN-IDENTITY-SYSTEM.md sebagai otoritas desain tertinggi, mempertahankan UX yang telah divalidasi melalui UI-1 sampai UI-12, serta secara aktif menghindari pola desain generik yang umum ditemukan pada template SaaS, dashboard modern, maupun hasil AI-generated interface.

> Design Identity tidak boleh dikorbankan demi kecepatan implementasi.

> Public is expressive. Workspace is calm. Data is clear. Children are respected.