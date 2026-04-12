<img src="assets/volty-logo.png" alt="Volty" width="400">

A modern CSS theme library built on features that other libraries haven't fully exploited yet — typed design tokens, native Shadow DOM theming, and a component shorthand system that lets you drop in any component with a single tag.

## What makes it different

| Feature | How Volty uses it |
|---|---|
| `@property` + `inherits: true` | Typed tokens that animate, validate, and pass through Shadow DOM boundaries automatically |
| `light-dark()` | Zero-JS dark mode tied to `prefers-color-scheme` |
| `color-mix()` | Entire brand scale auto-generated from one `--vt-color-brand` token |
| `@layer` | Deterministic cascade — reset → tokens → base → components → utilities |
| `@starting-style` | Native entry/exit animations on modals and toasts — no JS animation library |
| `<dialog>` | Native modal with built-in focus trap, backdrop, and accessibility |
| `container-type` | Components adapt to their own container width, not the viewport |
| `adoptedStyleSheets` | Share one stylesheet across all shadow roots — zero duplication |
| `:has()` | State-driven layouts without JavaScript (alert grid, switch track) |

---

## Quick start

<!-- npm install -->
To install via NPM simply run the following command:
```html
npm i volty
```
For no build setup simply include these in the header of your html file:
```html
<!-- Theme + token system -->
<link rel="stylesheet" href="dist/volty.css">
<script src="src/volty.js"></script>

<!-- Optional: component shorthand system -->
<script src="dist/volty-insert.js"></script>
```
---

## Component shorthand — `volty-insert.js`

Drop any Volty component into a page without writing the markup by hand. Three equivalent syntaxes — pick whichever fits your workflow.

### 1. Custom element

```html
<!-- Navigation bar -->
<vt-nav logo="My App" version="v1.0"
        links='[{"href":"/","label":"Home"},{"href":"/docs","label":"Docs"},{"href":"/about","label":"About"}]'>
</vt-nav>

<!-- Left sidebar -->
<vt-sidebar></vt-sidebar>
<!-- Custom sidebar groups -->
<vt-sidebar groups='[{"label":"Guide","links":[{"href":"/start","label":"Getting Started"}]}]'></vt-sidebar>

<!-- Footer -->
<vt-footer text="© 2026 My Company"
           links='[{"href":"/privacy","label":"Privacy"},{"href":"/terms","label":"Terms"}]'>
</vt-footer>

<!-- Card -->
<vt-card title="Card title" description="Subtitle text">
  Body content goes here as inner HTML.
</vt-card>
<vt-card title="Raised" variant="raised" footer='<button class="vt-btn vt-btn--sm">Action</button>'>
</vt-card>

<!-- Alert -->
<vt-alert variant="success" title="Deployed">Version 2.0 is live.</vt-alert>
<vt-alert variant="danger" title="Error" dismissible="false">Payment failed.</vt-alert>

<!-- Badge -->
<vt-badge variant="success">Active</vt-badge>
<vt-badge variant="warning">Degraded</vt-badge>

<!-- Button -->
<vt-button>Primary</vt-button>
<vt-button variant="outline" size="sm">Outline</vt-button>
<vt-button href="/docs" variant="ghost">Link button</vt-button>

<!-- Modal (open with document.getElementById('my-modal').showModal()) -->
<vt-modal id="my-modal" title="Confirm action"
          confirm="Yes, delete" cancel="Keep it" variant="danger">
  This cannot be undone.
</vt-modal>

<!-- Toast trigger button -->
<vt-toast-trigger variant="success" message="Saved!" title="Done">
  Save changes
</vt-toast-trigger>
<vt-toast-trigger variant="danger" message="Upload failed." duration="0">
  Try upload (persistent)
</vt-toast-trigger>
```

### 2. Data attribute

Works on any existing element — useful when you can't change tag names (CMS output, templates, etc.).

```html
<div data-vt-insert="nav"
     data-logo="My App"
     data-links='[{"href":"/","label":"Home"}]'></div>

<div data-vt-insert="alert"
     data-variant="warning"
     data-title="Heads up">Rate limit at 85%.</div>

<div data-vt-insert="card"
     data-title="Hello"
     data-description="Subtitle">Body content</div>
```

### 3. JS API

```js
// Render into a target element (replaces innerHTML)
Volty.insert('nav', document.querySelector('header'), {
  logo: 'My App',
  links: [
    { href: '/', label: 'Home' },
    { href: '/docs', label: 'Docs', active: true },
    { href: 'https://github.com/org/repo', label: 'GitHub', external: true },
  ],
});

// Get raw HTML string from any template
const html = Volty.templates.card({
  title: 'Hello',
  description: 'World',
  content: '<p>Body text</p>',
  variant: 'raised',
});

// Re-process a subtree after dynamic content is added
Volty.processInserts(document.getElementById('dynamic-container'));
```

### Available components

| Tag / name | Key options |
|---|---|
| `vt-nav` / `nav` | `logo`, `logoSrc`, `logoHref`, `version`, `links[]`, `themeSwitcher` |
| `vt-sidebar` / `sidebar` | `groups[]`, `label` |
| `vt-footer` / `footer` | `text`, `links[]` |
| `vt-card` / `card` | `title`, `description`, `variant`, `content`, `footer` |
| `vt-alert` / `alert` | `variant`, `title`, `content`, `solid`, `dismissible` |
| `vt-badge` / `badge` | `variant`, `content` |
| `vt-button` / `button` | `variant`, `size`, `href`, `content`, `disabled` |
| `vt-modal` / `modal` | `id`, `title`, `variant`, `content`, `confirm`, `cancel` |
| `vt-toast-trigger` / `toast-trigger` | `message`, `title`, `variant`, `duration`, `buttonVariant`, `size` |

`links[]` accepts `{ href, label, active?, external? }`.
`variant` for alert/badge/modal: `success` | `warning` | `danger` | (default info).
`variant` for button: `outline` | `ghost` | `surface` | `danger`.

---

## Theming

### System preference — automatic, zero JS

The default `:root` uses `light-dark()`. The browser picks light or dark automatically based on `prefers-color-scheme`.

### Manual override

```js
Volty.setTheme('dark')    // force dark
Volty.setTheme('light')   // force light
Volty.setTheme('system')  // follow OS preference
```

Or set the attribute on any element — everything inside inherits the scoped tokens:

```html
<div data-theme="dark">
  <!-- Always dark regardless of page theme -->
</div>
```

### Brand theming

```html
<section data-brand="violet"> ... </section>
<section data-brand="emerald"> ... </section>
<section data-brand="rose"> ... </section>
<section data-brand="amber"> ... </section>
<section data-brand="cyan"> ... </section>
```

```js
Volty.setBrand('violet')  // apply globally
Volty.setBrand(null)      // reset to default
```

### Custom brand color

Override `--vt-color-brand` and the entire scale regenerates automatically:

```css
:root {
  --vt-color-brand: oklch(58% 0.21 310);
}
```

---

## Token system

All tokens are registered via `@property` with a typed `syntax` and `initial-value`. This gives them three capabilities that unregistered custom properties cannot have:

1. **Animation & transition** — typed `<color>` values can be interpolated by the browser
2. **Browser validation** — invalid values (e.g. `--vt-space-4: red`) are silently rejected and fall back to `initial-value`
3. **Shadow DOM inheritance** — tokens with `inherits: true` cross shadow boundaries automatically

### Color tokens

| Token | Role |
|---|---|
| `--vt-color-brand` | Primary brand (all hover/active/ring colors derive from this) |
| `--vt-color-surface` | Page background |
| `--vt-color-surface-raised` | Elevated surface (sidebars, inputs) |
| `--vt-color-surface-overlay` | Highest surface (cards, modals) |
| `--vt-color-text` | Primary text |
| `--vt-color-text-muted` | Secondary / placeholder text |
| `--vt-color-border` | Borders and dividers |
| `--vt-color-brand-text` | Text on brand-colored backgrounds |
| `--vt-color-success` / `--vt-color-success-subtle` | Semantic green |
| `--vt-color-warning` / `--vt-color-warning-subtle` | Semantic amber |
| `--vt-color-danger` / `--vt-color-danger-subtle` | Semantic red |
| `--vt-color-info` / `--vt-color-info-subtle` | Semantic blue |

### Spacing — `<length>`

`--vt-space-1` (4px) → `--vt-space-10` (64px)

### Typography — `<length>`

`--vt-text-xs` (12px) → `--vt-text-4xl` (36px)

### Radius — `<length>`

`--vt-radius-sm` (4px) → `--vt-radius-full` (9999px)

### Duration — `<time>`

`--vt-duration-fast` (100ms) · `--vt-duration-base` (200ms) · `--vt-duration-slow` (350ms)

---

## Shadow DOM

Because all Volty tokens are registered with `@property` and `inherits: true`, the browser treats them exactly like built-in inherited CSS properties (`color`, `font-size`). They pass through shadow DOM boundaries automatically — no CSS injection, no `::part()`, no re-declaration inside each shadow root.

```js
// Tokens flow in automatically. adoptStyles() adds component classes too.
const shadow = Volty.createShadow(hostElement);
shadow.innerHTML = `<div class="vt-card">...</div>`;

// Adopt component styles into an existing shadow root
Volty.adoptStyles(existingShadowRoot);

// Scoped token override — cascades into all shadow descendants
Volty.setTokens(hostElement, {
  '--vt-color-brand': 'oklch(55% 0.22 10)',
});
```

```js
// Web Component example
class MyCard extends HTMLElement {
  connectedCallback() {
    const shadow = Volty.createShadow(this);
    shadow.innerHTML = `
      <div class="vt-card vt-card--raised">
        <div class="vt-card__header">
          <h3 class="vt-card__title"><slot name="title"></slot></h3>
        </div>
        <div class="vt-card__body"><slot></slot></div>
      </div>`;
  }
}
customElements.define('my-card', MyCard);
```

---

## Components

All components live in `@layer volty.components` and use only Volty design tokens.

| Component | Base class | Key modifiers |
|---|---|---|
| **Nav** | `.vt-nav` | — |
| **Button** | `.vt-btn` | `--sm` `--lg` `--outline` `--ghost` `--surface` `--danger` `--icon` |
| **Card** | `.vt-card` | `--raised` `--interactive` |
| **Badge** | `.vt-badge` | `--solid` `--surface` `--success` `--warning` `--danger` `--info` |
| **Input** | `.vt-input` | `--sm` `--lg` `--error` |
| **Select** | `.vt-select` | `--sm` `--lg` `--error` |
| **Switch** | `.vt-switch` | — |
| **Alert** | `.vt-alert` | `--success` `--warning` `--danger` `--solid` |
| **Tooltip** | `data-tooltip` | `data-tooltip-placement` |
| **Modal** | `.vt-modal` | `--sm` `--lg` `--full` `--danger` |
| **Toast** | `Volty.toast()` | — |

### Form field layout

```html
<div class="vt-field">
  <label class="vt-label" for="email">Email</label>
  <input class="vt-input" id="email" type="email">
  <span class="vt-field-hint">We'll never share your email.</span>
</div>

<div class="vt-field">
  <label class="vt-label" for="role">Role</label>
  <div class="vt-select vt-select--error">
    <select id="role">
      <option>Select a role…</option>
    </select>
  </div>
  <span class="vt-field-error">A role is required.</span>
</div>
```

### Modal

```html
<dialog class="vt-modal" id="confirm">
  <div class="vt-modal__header">
    <h2 class="vt-modal__title">Confirm</h2>
    <button class="vt-modal__close" onclick="this.closest('dialog').close()">×</button>
  </div>
  <div class="vt-modal__body">Are you sure?</div>
  <div class="vt-modal__footer">
    <button class="vt-btn vt-btn--surface" onclick="this.closest('dialog').close()">Cancel</button>
    <button class="vt-btn">Confirm</button>
  </div>
</dialog>

<script>
  document.getElementById('confirm').showModal();
  // Close on backdrop click:
  modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
</script>
```

### Toast

```js
Volty.toast('File saved.')
Volty.toast({ message: 'Upload failed.', variant: 'danger', title: 'Error' })
Volty.toast({ message: 'Deploying…', duration: 0 }) // persistent until dismissed
```

---

## JS API

### Theme & brand

```js
Volty.setTheme(theme, options)   // 'light' | 'dark' | 'system'
Volty.setBrand(brand, options)   // 'violet'|'emerald'|'rose'|'amber'|'cyan'|null
Volty.getTheme()                 // → 'light' | 'dark' | 'system'
Volty.getBrand()                 // → brand string or null
Volty.getSystemTheme()           // → 'light' | 'dark'
```

`setTheme` options: `persist` (bool, default true) · `transition` (bool, default true) · `target` (Element)

### Shadow DOM

```js
Volty.createShadow(host, options)         // attachShadow + adoptStyles
Volty.adoptStyles(shadowRoot)             // inject component stylesheet via adoptedStyleSheets
Volty.setTokens(el, { '--vt-...': '...' }) // scoped token override; cascades into shadow children
```

### Toast

```js
Volty.toast(message)
Volty.toast({ message, title, variant, duration, dismissible, progress })
// variant: 'success' | 'warning' | 'danger'
// duration: ms until auto-dismiss (0 = persistent). Default: 4000
```

### Component insert (requires volty-insert.js)

```js
Volty.insert(name, target, options)  // render component into target element
Volty.processInserts(root?)          // re-scan for data-vt-insert attributes
Volty.templates.card(options)        // raw HTML string from any template
```

---

## AI / Schema

Volty ships two machine-readable files generated at build time:

**`dist/volty.schema.json`** — all 44 tokens (name, syntax, initial-value, group) and all components (class, element, modifiers, elements, notes). Auto-derived from `@property` declarations — never out of sync.

**`dist/llms.txt`** — 7.7 kB compact reference covering the full token set, theming system, Shadow DOM API, every component with modifiers, and 8 explicit code-generation rules. Paste into any AI chat or load via `@file` in Cursor to get accurate Volty output.

Because all tokens have a declared `syntax`, an AI generating Volty code can statically verify its own output — `--vt-color-brand: 16px` is provably wrong before it ever reaches the browser.

---

## File structure

```
src/
  core/
    layers.css          @layer order declaration
    properties.css      @property typed token registrations (44 tokens)
    colors.css          color scale tokens
    typography.css      type scale tokens
    spacing.css         spacing + box-sizing reset
  themes/
    base.css            light-dark() tokens, data-theme, data-brand
    dark.css            dark-specific semantic adjustments
  components/
    nav.css             .vt-nav sticky navigation
    button.css          .vt-btn
    card.css            .vt-card
    badge.css           .vt-badge
    input.css           .vt-input, .vt-field, .vt-label
    select.css          .vt-select
    switch.css          .vt-switch
    alert.css           .vt-alert
    tooltip.css         data-tooltip, .vt-tooltip (anchor positioning)
    modal.css           .vt-modal (<dialog>)
    toast.css           .vt-toast + .vt-toast-region
  volty.js              theme + Shadow DOM + toast utility
  volty-insert.js       component shorthand system

dist/
  volty.css             all source concatenated in layer order
  volty.min.css         minified + sourcemap
  volty-insert.js       component shorthand (standalone, opt-in)
  volty.schema.json     machine-readable token + component schema
  llms.txt              AI reference file
```

---

## Browser support

| Feature | Chrome | Firefox | Safari |
|---|---|---|---|
| `@property` | 85+ | 128+ | 16.4+ |
| `color-mix()` | 111+ | 113+ | 16.2+ |
| `light-dark()` | 123+ | 120+ | 17.5+ |
| Container queries | 105+ | 110+ | 16+ |
| `:has()` | 105+ | 121+ | 15.4+ |
| `<dialog>` | 37+ | 98+ | 15.4+ |
| `@starting-style` | 117+ | 129+ | 17.5+ |
| `adoptedStyleSheets` | 73+ | 101+ | 16.4+ |
| CSS anchor positioning | 125+ | — | — |

Tooltip anchor positioning degrades gracefully — falls back to the `data-tooltip` pseudo-element path in unsupported browsers.

---

## License

MIT
