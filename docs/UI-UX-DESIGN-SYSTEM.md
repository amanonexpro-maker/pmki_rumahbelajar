# UI-UX-DESIGN-SYSTEM.md

# PMKI UI/UX Design System

## Platform Pelayanan Terpadu PMKI
### Rumah Belajar Griya Asih Lawang

Version: 2.1 Final  
Status: Production Design System  
Authority Level: Design System  
Parent Authority: 03-DESIGN-IDENTITY-SYSTEM.md

---

# 1. Purpose

Dokumen ini menerjemahkan PMKI Design Identity menjadi sistem UI/UX yang dapat dibangun secara konsisten menggunakan:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Drizzle ORM
- PostgreSQL
- PWA

Dokumen ini mendefinisikan:

- Design Tokens
- Typography
- Layout
- Navigation
- Components
- Workflows
- Accessibility
- Motion
- Responsive Rules
- Anti Patterns

---

# 2. Design Authority

Hierarki desain:

```text
03-DESIGN-IDENTITY-SYSTEM.md
            ↓
UI-UX-DESIGN-SYSTEM.md
            ↓
COMPONENT ARCHITECTURE
            ↓
FEATURE DESIGN
            ↓
SCREENS
            ↓
IMPLEMENTATION
```

Jika terjadi konflik:

```text
Design Identity
selalu menang.
```

---

# 3. Core Principle

> Public is expressive.
>
> Workspace is calm.
>
> Data is clear.
>
> Children are respected.

---

# 4. Experience Modes

## Public

Karakter:

```text
Warm
Educational
Story Driven
Human
Community
```

---

## Workspace

Karakter:

```text
Calm
Operational
Focused
Editorial
```

---

## Governance

Karakter:

```text
Trustworthy
Traceable
Accountable
Clear
```

---

# 5. Design Principles

## Whitespace is Structure

Hierarchy dibentuk oleh:

```text
Typography
+
Spacing
+
Composition
```

bukan:

```text
Card
+
Badge
+
Shadow
```

---

## Design Less Communicate More

Jangan menambah elemen.

Kurangi elemen sampai informasi menjadi jelas.

---

## Human First

Urutan prioritas:

```text
Human
↓
Task
↓
Workflow
↓
Data
↓
UI
```

---

## Calm By Default

Workspace harus terasa tenang.

Visual tidak boleh lebih dominan daripada pekerjaan pengguna.

---

# 6. STOP-SCROLLING FRAMEWORK

PMKI tidak menggunakan:

- visual noise
- efek berlebihan
- animasi agresif
- clickbait visual

untuk menghentikan perhatian.

---

PMKI menggunakan:

- Storytelling
- Meaning
- Composition
- Typography
- Photography

---

## Public Stop-Scrolling Moments

Public experience wajib memiliki:

```text
Hero

Mission

Community Story

Registration CTA
```

---

## Workspace Stop-Scrolling Moments

Workspace menggunakan:

```text
Meaningful Context

Needs Attention

Upcoming Work

Recent Activity
```

---

# 7. DESIGN TOKEN ARCHITECTURE

## Layer 01 — Brand Tokens

Tidak boleh digunakan langsung pada komponen.

### Forest

Stability, Trust, Institution

### Leaf

Growth, Education

### Sunlight

Encouragement, Warmth

### Canvas

Breathing Space

### Stone

Governance

### Water

Reflection

### Lavender

Exploration

---

# 8. PRODUCTION COLOR TOKENS

## Brand Foundation Tokens

```css
:root {

  --forest-50:  #F3F8F5;
  --forest-100: #E4F1EA;
  --forest-200: #CFE4D8;
  --forest-300: #AED1BA;
  --forest-400: #83B294;
  --forest-500: #5D9272;
  --forest-600: #397A5D;
  --forest-700: #1F6650;
  --forest-800: #184E3D;
  --forest-900: #123B2F;

  --sunlight-50:  #FFFBEF;
  --sunlight-100: #FFF3CC;
  --sunlight-200: #FFE599;
  --sunlight-300: #FFD166;

  --stone-50:  #F8F8F7;
  --stone-100: #F1F2F0;
  --stone-200: #E4E8E5;
  --stone-300: #D4DAD6;
  --stone-400: #AAB3AD;
  --stone-500: #69736E;
  --stone-600: #505B56;

  --water-100: #DCEEFF;
  --water-500: #4B93D1;
  --water-700: #2E6EA7;

  --lavender-100: #EEE8FF;
  --lavender-500: #8C78D5;
  --lavender-700: #6A58B6;
}
```

---

# 9. SEMANTIC TOKENS

## Light Theme

```css
:root {

  --background: #F7F8F4;

  --surface: #FFFFFF;

  --surface-subtle: #F1F4F1;

  --foreground: #17211D;

  --foreground-secondary: #69736E;

  --foreground-muted: #89918D;

  --border: #E4E8E5;

  --border-subtle: #EEF1EE;

  --primary: #1F6650;
  --primary-hover: #184E3D;

  --success: #2E7D5A;
  --success-soft: #EAF7F0;

  --warning: #D99912;
  --warning-soft: #FFF7E7;

  --danger: #C44B4F;
  --danger-soft: #FFF1F2;

  --info: #4588C8;
  --info-soft: #EEF7FF;

  --learning: #8C78D5;
  --learning-soft: #F5F1FF;

  --activity: #F29F59;
  --activity-soft: #FFF3E8;
}
```

---

# 10. DARK MODE TOKENS

## Dark Theme

```css
.dark {

  --background: #0E1512;

  --surface: #151F1B;

  --surface-subtle: #1B2722;

  --foreground: #F3F5F3;

  --foreground-secondary: #C5CDC9;

  --foreground-muted: #97A39B;

  --border: #2A3932;

  --border-subtle: #223129;

  --primary: #6FAE92;

  --primary-hover: #8DC0A9;

  --success: #76C49B;
  --success-soft: #18271F;

  --warning: #F2C461;
  --warning-soft: #291F0D;

  --danger: #E27A7F;
  --danger-soft: #2A1719;

  --info: #79B4EB;
  --info-soft: #152438;

  --learning: #B29AF8;
  --learning-soft: #211B35;

  --activity: #F7BD84;
  --activity-soft: #2E2216;
}
```

---

# 11. PALETTE USAGE RATIO

## Public

```text
70% Neutral

20% Forest

10% Accent
```

---

## Workspace

```text
85% Neutral

10% Forest

5% Status Colors
```

---

## Governance

```text
90% Neutral

5% Primary

5% Status Colors
```

---

# 12. COMPONENT TOKENS

```css
:root {

  --button-primary-bg: var(--primary);

  --button-primary-hover: var(--primary-hover);

  --button-primary-fg: #FFFFFF;

  --dialog-surface: var(--surface);

  --sheet-surface: var(--surface);

  --card-surface: var(--surface);

  --sidebar-active: var(--primary);

  --table-hover: var(--surface-subtle);

  --hero-surface: var(--surface);

  --focus-ring: var(--primary);
}
```

---

# 13. TYPOGRAPHY IDENTITY

Typography adalah identitas utama PMKI.

Lebih penting daripada:

- warna
- icon
- ilustrasi
- motion

---

# 14. FONT STRATEGY

## Display Font

```css
font-family:
"Newsreader",
serif;
```

Digunakan untuk:

```text
Hero

Mission

Storytelling
```

---

## Workspace Font

```css
font-family:
"Plus Jakarta Sans",
sans-serif;
```

Digunakan untuk:

```text
Dashboard

Forms

Tables

Workspace
```

---

## Mono Font

```css
font-family:
"JetBrains Mono",
monospace;
```

Digunakan untuk:

```text
Audit

Identifiers

Logs
```

---

# 15. TYPOGRAPHY SPECIFICATION

## Display XL

```css
font-size: clamp(3.5rem, 6vw, 5rem);

font-weight: 600;

line-height: 1.05;

letter-spacing: -0.04em;
```

---

## Display

```css
font-size: clamp(3rem, 5vw, 4rem);

font-weight: 600;

line-height: 1.1;

letter-spacing: -0.03em;
```

---

## Page Title

```css
font-size: 2rem;

font-weight: 600;

line-height: 1.15;

letter-spacing: -0.02em;
```

---

## Section Title

```css
font-size: 1.5rem;

font-weight: 600;

line-height: 1.2;
```

---

## Title

```css
font-size: 1.25rem;

font-weight: 600;

line-height: 1.3;
```

---

## Body

```css
font-size: 1rem;

font-weight: 400;

line-height: 1.6;
```

---

## Body Small

```css
font-size: 0.925rem;

line-height: 1.55;
```

---

## Label

```css
font-size: 0.875rem;

font-weight: 500;
```

---

## Caption

```css
font-size: 0.8125rem;

line-height: 1.45;
```

---

## Mono

```css
font-size: 0.875rem;

font-weight: 500;
```

---

# 16. TYPOGRAPHY RULES

Forbidden:

```text
Display Typography
inside Workspace
```

Forbidden:

```text
Body Text
under 14px
```

Forbidden:

```text
6+ font weights
```

Allowed:

```text
400
500
600
700
```

---

# 17. SPACING SYSTEM

Base:

```text
4px Grid
```

Scale:

```text
1 = 4

2 = 8

3 = 12

4 = 16

5 = 20

6 = 24

8 = 32

10 = 40

12 = 48

16 = 64

20 = 80

24 = 96
```

---

# 18. VISUAL RHYTHM SYSTEM

## Public

```text
Hero
96

Mission
80

Programs
64

Community Story
96

CTA
80
```

---

## Workspace

```text
Page Header
32

Toolbar
24

Primary Content
32

Sections
32

Tables
24
```

---

# 19. RADIUS SYSTEM

```css
--radius-sm: 8px;

--radius-control: 11px;

--radius-card: 16px;

--radius-feature: 24px;

--radius-hero: 28px;

--radius-pill: 999px;
```

---

# 20. ELEVATION TOKENS

```css
--shadow-xs:
0 1px 2px rgb(0 0 0 / 0.04);

--shadow-sm:
0 2px 8px rgb(0 0 0 / 0.06);

--shadow-md:
0 8px 24px rgb(0 0 0 / 0.08);

--shadow-overlay:
0 16px 40px rgb(0 0 0 / 0.12);
```

---

# 21. MOTION TOKENS

```css
--motion-fast: 120ms;

--motion-base: 150ms;

--motion-slow: 200ms;

--ease-standard:
cubic-bezier(0.2, 0, 0, 1);

--ease-accelerate:
cubic-bezier(0.4, 0, 1, 1);

--ease-decelerate:
cubic-bezier(0, 0, 0.2, 1);
```

---

# 22. MOTION RULES

Motion digunakan untuk:

- continuity
- hierarchy
- state
- feedback

Motion tidak digunakan untuk:

- decoration
- spectacle
- attention seeking

Forbidden:

```text
Parallax

Infinite Motion

Bounce

Floating Objects
```

---

# 23. NAVIGATION SYSTEM

Sidebar berfungsi untuk:

```text
Orientation
```

Topbar berfungsi untuk:

```text
Global Context
```

Bukan dekorasi.

---

# 24. DASHBOARD SYSTEM

Mental Model:

```text
Orientation

↓

Needs Attention

↓

Upcoming Work

↓

Recent Activity
```

Bukan:

```text
Metrics

Metrics

Metrics

Chart
```

---

# 25. DATA WORKSPACE SYSTEM

Pattern:

```text
Page Header

↓

Search

↓

Filters

↓

Result Summary

↓

Data View

↓

Action
```

---

# 26. DETAIL EXPERIENCE SYSTEM

Structure:

```text
Entity Header

↓

Overview

↓

Tabs

↓

Secondary Information
```

---

# 27. FORMS SYSTEM

Forms harus terasa seperti:

```text
Conversation
```

Bukan:

```text
Database Editor
```

---

# 28. GOVERNANCE SYSTEM

Setiap workflow harus menjelaskan:

```text
Current State

↓

Available Action

↓

Next State
```

---

# 29. EMPTY STATES

Harus menjelaskan:

- apa yang kosong
- apakah normal
- apa tindakan berikutnya

---

Forbidden:

```text
No Data Found
```

---

# 30. ACCESSIBILITY

Wajib:

- semantic HTML
- keyboard support
- visible focus
- contrast AA
- reduced motion
- touch targets >= 44px

Accessibility bukan QA.

Accessibility adalah desain.

---

# 31. RESPONSIVE STRATEGY

Mobile First.

Baseline:

```text
375px
```

Review:

```text
375

768

1024

1440
```

Responsive berarti:

```text
Recomposition
```

bukan resize.

---

# 32. SHADCN/UI RULES

Golden Rule:

```text
shadcn/ui

=

Infrastructure

NOT

Identity
```

Jika terlihat seperti:

```text
Default shadcn
```

maka dianggap gagal.

---

# 33. AI GENERATED DESIGN ANTI-PATTERNS

Forbidden:

```text
4 KPI Cards + Chart

Card Grid Everywhere

Everything Is Green

Gradient Everywhere

Shadow Everywhere

Animation Everywhere

Huge Radius Everywhere

Generic SaaS Sidebar

Default shadcn Appearance

Visual Decoration replacing IA
```

---

# 34. DESIGN REVIEW GATES

Gate 1

Apakah layout tetap bekerja tanpa shadow?

---

Gate 2

Apakah layout tetap jelas tanpa warna?

---

Gate 3

Apakah layout tetap jelas tanpa badge?

---

Gate 4

Apakah layout tetap bagus tanpa animasi?

---

Gate 5

Apakah halaman dipahami dalam 5 detik?

---

Jika gagal:

```text
Fix hierarchy.

Do not add decoration.
```

---

# 35. DEFINITION OF DESIGN SUCCESS

Pengguna tidak mengingat:

- warna
- card
- icon
- framework
- animasi

Pengguna mengingat:

- pengalaman
- kemudahan
- kejelasan
- kepercayaan
- rasa diterima

---

# 36. AI CODING AGENT RULES

Wajib membaca:

```text
03-DESIGN-IDENTITY-SYSTEM.md

UI-UX-DESIGN-SYSTEM.md
```

Wajib:

- mobile first
- accessibility
- privacy by design
- hierarchy first
- token first

Dilarang:

- menggunakan default shadcn sebagai identitas
- membuat UI generik SaaS
- menggunakan dekorasi sebagai solusi IA

---

# 37. FINAL STATEMENT

> PMKI UI/UX Design System adalah sistem desain produksi yang menerjemahkan identitas PMKI ke dalam pengalaman digital yang hangat, manusiawi, terpercaya, tenang, dan mudah dipahami. Sistem ini dibangun di atas prinsip hierarchy-first, privacy-by-design, mobile-first, dan meaningful experience, serta secara aktif menghindari pola visual generik yang umum ditemukan pada dashboard SaaS maupun antarmuka hasil AI generatif.

> Less Decoration. More Meaning.

> Design Less. Communicate More.

> Public is expressive. Workspace is calm. Data is clear. Children are respected.