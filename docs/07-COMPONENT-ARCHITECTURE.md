# 07-COMPONENT-ARCHITECTURE.md

# PMKI Component Architecture

## Platform Pelayanan Terpadu PMKI
### Rumah Belajar Griya Asih Lawang

Version: 1.0  
Status: Production Component Architecture  
Priority: Critical  
Architecture Type: Design System → Component System → Feature System

Dependencies:

- 03-DESIGN-IDENTITY-SYSTEM.md
- UI-UX-DESIGN-SYSTEM.md v2.1
- PRODUCTION-ARCHITECTURE-BLUEPRINT.md
- 02-NEXTJS-PRODUCTION-BLUEPRINT.md
- 04-DRIZZLE-DATABASE-ARCHITECTURE.md
- 05-AUTHORIZATION-RBAC-BLUEPRINT.md
- 06-PWA-OFFLINE-STRATEGY.md

---

# 1. Purpose

Dokumen ini mendefinisikan struktur komponen PMKI.

Tujuan utama:

```text
Consistency

Scalability

Reusability

Maintainability

Design Integrity
```

Tanpa dokumen ini, aplikasi berisiko menghasilkan:

```text
ButtonA

ButtonB

ButtonNew

ButtonImproved

ButtonV2

CustomButton
```

yang pada akhirnya menghancurkan Design System.

---

# 2. Architecture Philosophy

PMKI menggunakan:

```text
Design Identity
      ↓
Design System
      ↓
Component System
      ↓
Patterns
      ↓
Features
      ↓
Pages
```

Bukan:

```text
Page
      ↓
Custom UI
      ↓
Another Custom UI
```

---

# 3. Golden Rule

## Components Are Product Infrastructure

Komponen bukan dekorasi.

Komponen adalah:

```text
Building Blocks
```

untuk seluruh aplikasi.

---

## Forbidden

```text
Feature membuat Button sendiri

Feature membuat Dialog sendiri

Feature membuat Badge sendiri
```

---

# 4. Component Hierarchy

PMKI menggunakan 4 tingkat komponen.

```text
Primitives
      ↓

Compositions
      ↓

Patterns
      ↓

Feature Components
```

---

# 5. Layer 1 — Primitives

Lokasi:

```text
src/components/ui
```

Primitives berasal dari:

```text
shadcn/ui
```

tetapi telah diadaptasi ke PMKI Design System.

---

# Critical Rule

```text
shadcn/ui

=

Infrastructure

NOT

Identity
```

---

# 6. Primitive Components

## Button

```text
Primary

Secondary

Ghost

Link

Destructive
```

---

## Input

```text
Text

Email

Number

Phone
```

---

## Textarea

---

## Select

---

## Checkbox

---

## Radio Group

---

## Switch

---

## Badge

---

## Avatar

---

## Dialog

---

## Sheet

---

## Tooltip

---

## Skeleton

---

## Tabs

---

## Dropdown Menu

---

## Command

---

## Popover

---

## Scroll Area

---

# 7. Primitive Rules

Primitives:

✅ memahami design tokens

✅ memahami accessibility

✅ memahami dark mode

✅ memahami responsive behavior

---

Primitives:

❌ tidak memahami business logic

❌ tidak memahami domain

❌ tidak melakukan data fetching

---

# 8. Layer 2 — Compositions

Lokasi:

```text
src/components/compositions
```

Compositions adalah gabungan beberapa primitive.

---

Contoh:

## SearchInput

```text
Input
+
Icon
+
Clear Action
```

---

## StatusBadge

```text
Badge
+
Domain Mapping
```

---

## EmptyState

```text
Illustration
+
Copy
+
Action
```

---

## UserAvatar

```text
Avatar
+
Fallback
+
Role Tag
```

---

# 9. Layer 3 — Patterns

Lokasi:

```text
src/components/patterns
```

Patterns digunakan di banyak fitur.

---

## PageHeader

```text
Title

Description

Actions
```

---

## EntityHeader

```text
Identity

Metadata

Status

Actions
```

---

## SearchToolbar

```text
Search

Filters

Summary
```

---

## DataTable

```text
Desktop Table

Mobile List
```

---

## DetailTabs

```text
Overview

Attendance

Learning

Development
```

---

## WorkflowProgress

```text
Governance Workflow
```

---

## DecisionHistory

```text
Approval History
```

---

## StatSummary

```text
Operational Summary
```

---

## FormSection

```text
Title

Description

Fields
```

---

## StepIndicator

```text
Registration Flow
```

---

## ReviewSection

```text
Review Before Submit
```

---

## SessionProgress

```text
Attendance Progress
```

---

# 10. Pattern Rules

Patterns:

✅ memahami UI behavior

✅ memahami layout

✅ memahami interaction

---

Patterns:

❌ tidak memahami database

❌ tidak melakukan queries

❌ tidak melakukan authorization

---

# 11. Layer 4 — Feature Components

Lokasi:

```text
src/features/*
```

---

Contoh:

```text
students/

attendance/

development/

governance/

publishing/
```

---

Feature component boleh memahami:

```text
Domain

Workflow

Permissions

Validation
```

---

# 12. Project Structure

```text
src/

components/
│
├── ui/
├── compositions/
├── patterns/
└── layout/

features/
│
├── students/
├── attendance/
├── development/
├── consent/
├── governance/
├── publishing/
├── audit/
└── administration/
```

---

# 13. Layout Components

Lokasi:

```text
src/components/layout
```

---

## AppShell

Global workspace shell.

---

## Sidebar

Workspace navigation.

---

## WorkspaceHeader

Global context bar.

---

## MobileNavigation

PWA-oriented navigation.

---

## PageContainer

Width management.

---

# 14. Public Components

Lokasi:

```text
src/features/public
```

---

## Hero

---

## Mission

---

## Programs

---

## Schedule

---

## Gallery

---

## News

---

## Registration CTA

---

## Contact

---

Rule:

Public components boleh lebih ekspresif.

Tetapi tetap menggunakan token yang sama.

---

# 15. Domain Component Boundaries

## Student Domain

Boleh membuat:

```text
StudentCard

StudentProfileSummary

StudentStatusBadge
```

---

Tidak boleh membuat:

```text
CustomButton

CustomDialog
```

---

## Attendance Domain

Boleh membuat:

```text
AttendanceRoster

AttendanceStatusControls

AttendanceSessionHeader
```

---

Tidak boleh membuat:

```text
AttendanceButton
```

---

# 16. Domain-Aware Components

Beberapa component dapat memahami domain.

Contoh:

## StudentStatusBadge

mengubah:

```text
ACTIVE
```

menjadi:

```text
Aktif Belajar
```

---

## ReportStatusBadge

mengubah:

```text
PROGRAM_REVIEW
```

menjadi:

```text
Tinjauan Program
```

---

# 17. Status System

Status tidak boleh tersebar.

Lokasi:

```text
src/lib/status
```

---

Contoh:

```text
student-status.ts

report-status.ts

publication-status.ts

consent-status.ts
```

---

# 18. Form Architecture

## Shared Forms

```text
FormLayout

FormSection

FormActions

FormField
```

---

## Validation

Semua validasi menggunakan:

```text
Zod
```

---

## Rule

Validasi tidak boleh tersebar ke dalam komponen.

---

# 19. Data Table Architecture

Semua data grid menggunakan:

```text
DataTable
```

---

## Desktop

```text
Table
```

---

## Mobile

```text
Responsive List
```

---

Tidak boleh:

```text
Desktop Table
diperkecil
ke mobile
```

---

# 20. Responsive Component Strategy

Komponen harus mendukung:

```text
375

768

1024

1440
```

---

Responsive berarti:

```text
Different Layout
```

bukan:

```text
Smaller Layout
```

---

# 21. Accessibility Architecture

Semua komponen wajib:

```text
Keyboard Accessible

Focus Visible

Screen Reader Friendly

Reduced Motion Aware
```

---

Accessibility adalah responsibility komponen.

Bukan halaman.

---

# 22. Motion Architecture

Semua motion berasal dari:

```css
--motion-fast

--motion-base

--motion-slow
```

---

Tidak boleh:

```text
Custom 500ms

Custom 800ms

Random easing
```

---

# 23. Token Usage Architecture

Komponen hanya boleh menggunakan:

```text
Component Tokens

atau

Semantic Tokens
```

---

Tidak boleh menggunakan:

```css
--forest

--sunlight

--leaf
```

secara langsung.

---

# 24. Dark Mode Rules

Semua komponen harus:

```text
Dark Ready
```

secara default.

---

Tidak boleh:

```text
Light Component

+
Dark Patch
```

---

# 25. Performance Rules

Komponen:

✅ reusable

✅ memo-friendly

✅ tree-shakable

---

Hindari:

```text
Feature imports component
for only one usage
```

---

# 26. Naming Convention

## Components

```text
PascalCase
```

---

Contoh:

```text
PageHeader

StudentCard

WorkflowProgress
```

---

## Hooks

```text
useStudent

useAttendance

usePermission
```

---

## Files

```text
page-header.tsx
workflow-progress.tsx
```

atau konsisten PascalCase.

---

# 27. Anti Patterns

Forbidden:

```text
Feature-specific button
```

---

Forbidden:

```text
Feature-specific dialog
```

---

Forbidden:

```text
Duplicate DataTable
```

---

Forbidden:

```text
Inline styles
```

---

Forbidden:

```text
Shadow design as hierarchy
```

---

Forbidden:

```text
Gradient design as hierarchy
```

---

Forbidden:

```text
Default shadcn appearance
```

---

# 28. Component Review Gates

Sebelum komponen baru dibuat:

### Gate 1

Sudah ada primitive?

---

### Gate 2

Sudah ada composition?

---

### Gate 3

Sudah ada pattern?

---

### Gate 4

Apakah benar-benar reusable?

---

### Gate 5

Apakah menjaga Design Identity?

---

# 29. AI Coding Agent Rules

Sebelum membuat komponen:

Wajib membaca:

```text
03-DESIGN-IDENTITY-SYSTEM.md

UI-UX-DESIGN-SYSTEM.md

07-COMPONENT-ARCHITECTURE.md
```

---

Agent harus:

✅ Reuse existing components

✅ Reuse existing patterns

✅ Reuse existing tokens

---

Agent tidak boleh:

❌ membuat duplicate component

❌ membuat variant tidak resmi

❌ membuat UI generik

---

# 30. Definition of Done

Component Architecture dianggap selesai jika:

✅ Primitive Layer Lengkap

✅ Composition Layer Jelas

✅ Pattern Layer Jelas

✅ Feature Layer Jelas

✅ Accessibility Rules Jelas

✅ Motion Rules Jelas

✅ Dark Mode Rules Jelas

✅ Responsive Rules Jelas

✅ Token Rules Jelas

✅ Anti Pattern Rules Jelas

---

# 31. Final Statement

> PMKI Component Architecture memastikan bahwa seluruh implementasi UI dibangun dari fondasi yang konsisten, dapat dipelihara, dan tetap setia terhadap Design Identity PMKI. Komponen bukan sekadar elemen visual, tetapi merupakan infrastruktur produk yang menjaga kualitas pengalaman pengguna dalam skala jangka panjang.

> Components create consistency.

> Consistency creates trust.

> Trust creates adoption.