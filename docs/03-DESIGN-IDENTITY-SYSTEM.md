# 03-DESIGN-IDENTITY-SYSTEM.md

# PMKI Design Identity System

## Rumah Belajar Griya Asih Lawang
### Platform Pelayanan Terpadu PMKI

Version: 1.0
Status: Design Authority
Priority: Highest Design Reference

---

# 1. Purpose

Dokumen ini mendefinisikan identitas desain PMKI.

Ini bukan design system.

Ini bukan UI kit.

Ini bukan component guide.

Dokumen ini menjelaskan:

- siapa PMKI
- bagaimana PMKI seharusnya terasa
- bagaimana PMKI berkomunikasi
- bagaimana PMKI berbeda dari aplikasi generik
- bagaimana PMKI menghindari pola desain hasil AI generatif

Seluruh keputusan visual, UX, UI, motion, typography, dan token harus dapat ditelusuri kembali ke dokumen ini.

---

# 2. Design Hierarchy

Urutan otoritas desain:

```text
DESIGN IDENTITY
        ↓
DESIGN SYSTEM
        ↓
COMPONENT SYSTEM
        ↓
PATTERNS
        ↓
SCREENS
        ↓
FEATURES
```

Rules:

- Design System tidak boleh bertentangan dengan Design Identity.
- Component System tidak boleh bertentangan dengan Design System.
- Pattern tidak boleh bertentangan dengan Component System.
- Screen tidak boleh bertentangan dengan Pattern.
- Feature tidak boleh mengubah prinsip dasar Design Identity.

---

# 3. PMKI Design DNA

PMKI bukan:

- Startup SaaS
- Corporate Dashboard
- School ERP
- NGO Admin System
- Government Platform
- Accounting Software
- Analytics Product

PMKI adalah:

> Educational Community Platform

PMKI dibangun untuk mendukung:

- pertumbuhan manusia
- pembelajaran
- pelayanan
- komunitas
- akuntabilitas
- kepedulian

Karena itu setiap pengalaman harus terasa:

```text
Human
Educational
Trustworthy
Warm
Calm
Intentional
```

---

# 4. Core Philosophy

## Primary Principle

> Public is expressive.
> Workspace is calm.
> Data is clear.
> Children are respected.

Semua keputusan desain harus mendukung prinsip ini.

---

# 5. Emotional System

## Public Experience

Target emosi:

```text
Welcome
Trust
Hope
Safety
Belonging
```

Pengunjung harus merasa:

> "Ini tempat yang baik untuk anak bertumbuh."

---

## Teacher Experience

Target emosi:

```text
Focus
Clarity
Calm
Efficiency
```

Pengajar harus merasa:

> "Saya tahu apa yang harus saya lakukan berikutnya."

---

## Coordinator Experience

Target emosi:

```text
Awareness
Control
Confidence
```

Koordinator harus merasa:

> "Saya memahami kondisi pelayanan hari ini."

---

## Governance Experience

Target emosi:

```text
Trust
Responsibility
Accountability
```

Pengguna harus merasa:

> "Saya dapat mengambil keputusan dengan tepat."

---

# 6. Personality Matrix

## Public

```text
70% Warm
15% Playful
15% Institutional
```

Kata kunci:

- welcoming
- inspiring
- educational
- human
- hopeful

---

## Workspace

```text
60% Calm
25% Operational
15% Warm
```

Kata kunci:

- clear
- structured
- thoughtful
- quiet
- efficient

---

## Governance

```text
70% Clarity
20% Trust
10% Formality
```

Kata kunci:

- accountable
- traceable
- understandable
- reliable

---

# 7. Stop-Scrolling Principles

PMKI tidak mencari perhatian dengan visual berlebihan.

PMKI membuat orang berhenti karena:

- makna
- cerita
- ritme
- komposisi
- tipografi

Bukan karena:

- animasi berlebihan
- gradient berlebihan
- efek visual berlebihan

---

## Wrong

```text
GRADIENT
BIG NUMBER
KPI
CHART
FLOATING CARDS
```

---

## Right

```text
Ayo Belajar
&
Tumbuh Bersama.

Dare to be Great.
```

kemudian visual mendukung narasi tersebut.

---

# 8. Premium Design Definition

Premium tidak berarti mewah.

Premium tidak berarti mahal.

Premium tidak berarti penuh efek.

---

## Bukan Premium

- Glassmorphism
- Glow
- Heavy Blur
- Huge Shadow
- Neon
- Gradient Everywhere

---

## Premium

- Visual restraint
- Strong hierarchy
- Excellent typography
- Meaningful whitespace
- Intentional rhythm
- Precise interaction

---

# 9. Visual Restraint Doctrine

PMKI selalu memilih:

```text
Less but Better
```

Pertanyaan utama:

> Apakah elemen ini membantu pengguna?

Jika tidak:

hapus.

---

# 10. Human-Centered Rule

Sebelum mendesain:

Tanyakan:

```text
Apa yang ingin dilakukan pengguna?

Apa yang perlu diketahui?

Apa yang perlu diputuskan?

Apa yang perlu dilindungi?
```

Baru sesudah itu:

desain visual.

---

# 11. Brand Token Layer

Ini adalah lapisan identitas.

Tidak digunakan langsung pada komponen.

---

## Forest

Makna:

```text
Trust
Institution
Stability
```

---

## Leaf

Makna:

```text
Growth
Learning
Progress
```

---

## Sunlight

Makna:

```text
Encouragement
Warmth
Optimism
```

---

## Canvas

Makna:

```text
Comfort
Reading
Breathing Space
```

---

## Stone

Makna:

```text
Governance
Structure
Responsibility
```

---

## Water

Makna:

```text
Reflection
Learning Journey
```

---

## Lavender

Makna:

```text
Exploration
Creativity
Language
```

---

# 12. Token Architecture

## Layer 1

Brand Token

```css
--forest
--leaf
--sunlight
--canvas
--stone
--water
--lavender
```

---

## Layer 2

Semantic Token

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

Component Token

```css
--button-primary-bg

--button-primary-hover

--hero-surface

--card-surface

--dialog-surface

--table-hover

--sidebar-active
```

---

Rule:

```text
Components
must NEVER consume
Brand Tokens directly.
```

---

# 13. Typography Identity

Typography adalah identitas utama PMKI.

Lebih penting daripada warna.

---

## Display Typography

Tujuan:

```text
Emotion
Meaning
Storytelling
```

Digunakan untuk:

- Hero
- Mission
- Community Story

---

## Heading Typography

Tujuan:

```text
Orientation
Hierarchy
```

Digunakan untuk:

- Dashboard
- Workspace
- Detail Pages

---

## Body Typography

Tujuan:

```text
Reading Comfort
Operational Clarity
```

---

## Label Typography

Tujuan:

```text
Guidance
Support
```

---

## Mono Typography

Tujuan:

```text
Audit
Identifiers
Technical References
```

---

# 14. Typography Rules

## Public

Boleh:

- editorial
- expressive
- large
- emotional

---

## Workspace

Harus:

- calm
- readable
- efficient
- restrained

---

Rule:

```text
Workspace
must never use
Hero Typography.
```

---

# 15. Information Hierarchy

Urutan visual:

```text
Meaning
↓
Purpose
↓
Action
↓
Data
↓
Metadata
```

Bukan:

```text
Data
↓
More Data
↓
Even More Data
```

---

# 16. Motion Identity

Motion bukan hiburan.

Motion adalah alat komunikasi.

---

Tujuan motion:

- state
- hierarchy
- continuity
- feedback

---

Default Durations:

```text
120ms
150ms
200ms
```

---

Forbidden:

```text
Parallax
Bounce
Infinite Motion
Floating Elements
Long Animation
```

---

Rule:

```text
Motion exists
to explain,
not entertain.
```

---

# 17. Photography Identity

Prefer:

- authentic
- community-based
- educational
- candid
- respectful

---

Avoid:

- corporate stock photos
- boardroom scenes
- handshakes
- startup teams around laptops
- staged marketing photos

---

# 18. Illustration Identity

Karakter:

- warm
- simple
- rounded
- educational
- human

---

Bukan:

- gaming
- crypto
- tech startup
- cartoon overload

---

# 19. Public Language

Tone:

```text
Warm
Inclusive
Hopeful
```

Contoh:

> Mari belajar dan tumbuh bersama.

Bukan:

> Join our learning program today!

---

# 20. Workspace Language

Tone:

```text
Direct
Respectful
Clear
Operational
```

Contoh:

- Catat presensi
- Menunggu verifikasi
- Perlu perhatian

---

# 21. Governance Language

Tone:

```text
Calm
Precise
Accountable
```

Contoh:

- Menunggu validasi unit
- Menunggu persetujuan
- Memerlukan tinjauan privasi

---

# 22. Shadcn/UI Usage Rules

Golden Rule:

```text
shadcn/ui
=
Infrastructure

NOT

Identity
```

Jika pengguna berkata:

> "Ini aplikasi shadcn."

maka desain dianggap gagal.

Targetnya:

> "Ini PMKI."

---

# 23. AI-Generated Design Anti-Patterns

## Forbidden Pattern 01

```text
4 KPI Cards
+
Big Chart
+
Table
```

---

## Forbidden Pattern 02

```text
Card Grid
Card Grid
Card Grid
Card Grid
```

---

## Forbidden Pattern 03

```text
Everything Is Green
```

---

## Forbidden Pattern 04

```text
Gradient Everywhere
```

---

## Forbidden Pattern 05

```text
Animation Everywhere
```

---

## Forbidden Pattern 06

```text
Huge Radius Everywhere
```

---

## Forbidden Pattern 07

```text
Every Object Needs Shadow
```

---

## Forbidden Pattern 08

```text
Generic SaaS Sidebar
```

---

## Forbidden Pattern 09

```text
Default shadcn look
```

---

## Forbidden Pattern 10

```text
Visual Decoration
Replacing
Information Architecture
```

---

# 24. Design Quality Heuristics

Sebelum merge UI:

## Test 1

Apakah layout masih bekerja tanpa shadow?

Jika tidak:

perbaiki hierarchy.

---

## Test 2

Apakah layout masih bekerja tanpa warna?

Jika tidak:

perbaiki structure.

---

## Test 3

Apakah halaman masih jelas tanpa badge?

Jika tidak:

perbaiki typography.

---

## Test 4

Apakah halaman masih bagus tanpa animasi?

Jika tidak:

perbaiki composition.

---

## Test 5

Apakah pengguna memahami halaman dalam 5 detik?

Jika tidak:

perbaiki hierarchy.

---

# 25. Definition of Visual Success

PMKI berhasil apabila:

Pengguna tidak mengingat:

- tombol
- warna
- kartu
- animasi

Pengguna mengingat:

- pengalaman
- kejelasan
- kemudahan
- rasa percaya

---

# 26. Final Identity Statement

> PMKI adalah platform pendidikan dan komunitas yang hangat, manusiawi, terpercaya, dan tenang. Desainnya tidak mencari perhatian melalui dekorasi, tetapi melalui kejelasan, makna, ritme visual, dan pengalaman yang menghormati manusia yang dilayaninya.

> Less Decoration. More Meaning.

> Design Less. Communicate More.

> Public is expressive. Workspace is calm. Data is clear. Children are respected.

