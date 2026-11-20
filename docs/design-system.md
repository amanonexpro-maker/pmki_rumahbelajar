# Design tokens & typography

The shared visual tokens live in `src/styles/tokens.css`; reusable type
utilities live in `src/styles/typography.css`; light/dark surface tokens and
dark-mode overrides live in `src/styles/themes.css`. Import them from
`src/index.css` so the public site and dashboard share the same design system.

## Theme preference

The theme picker supports `light`, `dark`, and `system`. The selection is saved
as `pmki_theme` in local storage. System preference follows the operating
system's `prefers-color-scheme` and updates while the page is open. An early
bootstrap in `index.html` applies the stored preference before the app renders
to avoid a light/dark flash.

## Tokens

- `font-sans` / `font-display`: system-font stacks; no remote font download is
  required.
- `brand-*`: primary green palette for PMKI actions and selected navigation.
- `accent-*`: warm amber accent palette.
- `text-display`, `text-page-title`, `text-section-title`, `text-card-title`,
  `text-body`, `text-body-sm`, `text-eyebrow`, `text-label`, `text-caption`:
  named responsive size, line-height, and weight tokens exposed to Tailwind.

## Semantic typography utilities

Use the shared `type-*` utilities for component roles:

```tsx
<h1 className="type-display">Page headline</h1>
<h2 className="type-page-title">Main section title</h2>
<h3 className="type-section-title">Subsection title</h3>
<h4 className="type-card-title">Card title</h4>
<p className="type-body">Main supporting copy</p>
<p className="type-body-sm">Secondary supporting copy</p>
<span className="type-eyebrow">Section category</span>
<label className="type-label">Field label</label>
<small className="type-caption">Helper text</small>
```

Keep color, spacing, layout, and interaction utilities on the element; use
semantic typography utilities for its type role instead of repeating size,
weight, tracking, and line-height combinations.
