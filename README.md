# Volty

A modern CSS theme library built on features that existing libraries haven't fully exploited.

## What makes it different

| Feature | How Volty uses it |
|---|---|
| `@property` | Typed design tokens — colors animate, lengths validate, times transition |
| `light-dark()` | Zero-JS color scheme switching tied to `prefers-color-scheme` |
| `color-mix()` | Entire brand scale auto-generated from one `--vt-color-brand` token |
| `@layer` | Deterministic cascade — reset → tokens → base → components → utilities |
| `container-type` | Components adapt to their own container width, not the viewport |
| `clamp()` | Fluid type and spacing that scales smoothly between breakpoints |
| `data-brand` | Scope a different brand color to any element without touching the theme |

## Quick start

```html
<link rel="stylesheet" href="dist/volty.css">
<script src="src/volty.js"></script>
```

That's it. No build step. No JavaScript framework. No configuration required.

## Theming

### System preference (automatic, zero JS)
The default `:root` uses `light-dark()` — the browser picks light or dark based on `prefers-color-scheme` with no JS at all.

### Manual override
```js
Volty.setTheme('dark')    // force dark
Volty.setTheme('light')   // force light
Volty.setTheme('system')  // back to system preference
```

Or set the attribute directly on any element:
```html
<div data-theme="dark">
  <!-- Everything inside this div renders in dark mode -->
</div>
```

### Brand theming
Change the brand color for any subtree:
```html
<section data-brand="violet"> ... </section>
<section data-brand="emerald"> ... </section>
<section data-brand="rose"> ... </section>
<section data-brand="amber"> ... </section>
<section data-brand="cyan"> ... </section>
```

Or via JS:
```js
Volty.setBrand('violet')  // apply globally
Volty.setBrand(null)      // reset to default
```

### Custom brand color
Override the single `--vt-color-brand` token — the entire scale regenerates automatically via `color-mix()`:
```css
:root {
  --vt-color-brand: oklch(58% 0.21 310); /* your custom brand */
}
```

## Token system

All tokens are `@property` registered, meaning they have types, fallbacks, and can be animated/transitioned.

### Color tokens
- `--vt-color-brand` — primary brand color (all other brand colors derive from this)
- `--vt-color-surface` — page background
- `--vt-color-surface-raised` — slightly elevated surface (sidebars, inputs)
- `--vt-color-surface-overlay` — highest surface (cards, modals)
- `--vt-color-text` — primary text
- `--vt-color-text-muted` — secondary / placeholder text
- `--vt-color-border` — borders and dividers
- `--vt-color-brand-text` — text on brand-colored backgrounds

### Auto-generated brand scale
`--vt-brand-50` through `--vt-brand-950` — generated from `--vt-color-brand` via `color-mix()`.

### Semantic colors
- `--vt-color-success` / `--vt-color-success-subtle`
- `--vt-color-warning` / `--vt-color-warning-subtle`
- `--vt-color-danger` / `--vt-color-danger-subtle`
- `--vt-color-info` / `--vt-color-info-subtle`

### Spacing (`--vt-space-1` → `--vt-space-10`)
Fluid scale using `clamp()` — values smoothly scale with viewport width.

### Typography (`--vt-text-xs` → `--vt-text-5xl`)
Fluid type scale — each step uses `clamp()` with viewport-relative sizing.

### Radius (`--vt-radius-sm` → `--vt-radius-full`)
### Duration (`--vt-duration-fast`, `--vt-duration-base`, `--vt-duration-slow`)

## Components

All components live in `@layer volty.components` and use only Volty tokens.

| Component | Classes |
|---|---|
| Button | `.vt-btn`, `.vt-btn--sm`, `.vt-btn--lg`, `.vt-btn--outline`, `.vt-btn--ghost`, `.vt-btn--surface`, `.vt-btn--danger`, `.vt-btn--icon` |
| Card | `.vt-card`, `.vt-card--raised`, `.vt-card--interactive`, `.vt-card__header`, `.vt-card__title`, `.vt-card__description`, `.vt-card__body`, `.vt-card__footer` |
| Badge | `.vt-badge`, `.vt-badge--solid`, `.vt-badge--surface`, `.vt-badge--success`, `.vt-badge--warning`, `.vt-badge--danger` |
| Input | `.vt-field`, `.vt-label`, `.vt-label--required`, `.vt-input`, `.vt-input--error`, `.vt-hint`, `.vt-hint--error` |
| Switch | `.vt-switch`, `.vt-switch__track`, `.vt-switch__thumb`, `.vt-switch__label` |

## JS API

```js
Volty.setTheme(theme, options)   // 'light' | 'dark' | 'system'
Volty.setBrand(brand, options)   // 'violet' | 'emerald' | 'rose' | 'amber' | 'cyan' | null
Volty.getTheme()                 // returns current stored theme
Volty.getBrand()                 // returns current stored brand
Volty.getSystemTheme()           // returns 'light' or 'dark' based on OS preference
```

Options for `setTheme`:
- `persist` (default `true`) — save to localStorage
- `transition` (default `true`) — use View Transition API or CSS transition
- `target` (default `document.documentElement`) — apply to a specific element

## File structure

```
src/
  core/
    layers.css       @layer order declaration
    properties.css   @property typed token registrations
    colors.css       auto-generated color scales via color-mix()
    typography.css   fluid type scale
    spacing.css      fluid spacing + box-sizing reset
  themes/
    base.css         light-dark() tokens + data-theme overrides + data-brand
    dark.css         dark-specific semantic color adjustments
  components/
    nav.css
    button.css
    card.css
    badge.css
    input.css
    switch.css
  volty.js           theme switcher utility (<1.5kb)
dist/
  volty.css          all source concatenated in correct order
```

## Browser support

Requires a modern browser with support for:
- `@property` (Chrome 85+, Firefox 128+, Safari 16.4+)
- `color-mix()` (Chrome 111+, Firefox 113+, Safari 16.2+)
- `light-dark()` (Chrome 123+, Firefox 120+, Safari 17.5+)
- Container queries (Chrome 105+, Firefox 110+, Safari 16+)
- `:has()` (Chrome 105+, Firefox 121+, Safari 15.4+)

## License

MIT
