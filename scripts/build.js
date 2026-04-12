#!/usr/bin/env node
/**
 * Volty build script
 * Concatenates src/ files in correct order → dist/volty.css
 * Minifies → dist/volty.min.css + dist/volty.min.css.map
 * Generates → dist/volty.schema.json + dist/llms.txt
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const DIST = path.join(ROOT, "dist");
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));

// Source files in correct cascade order
const SOURCE_FILES = [
  ["core/layers.css",      "LAYERS"],
  ["core/properties.css",  "PROPERTIES"],
  ["core/colors.css",      "COLORS"],
  ["core/typography.css",  "TYPOGRAPHY"],
  ["core/spacing.css",     "SPACING"],
  ["themes/base.css",      "THEME — BASE"],
  ["themes/dark.css",      "THEME — DARK"],
  ["components/nav.css",     "COMPONENT — NAV"],
  ["components/button.css",  "COMPONENT — BUTTON"],
  ["components/card.css",    "COMPONENT — CARD"],
  ["components/badge.css",   "COMPONENT — BADGE"],
  ["components/input.css",   "COMPONENT — INPUT"],
  ["components/switch.css",  "COMPONENT — SWITCH"],
  ["components/alert.css",   "COMPONENT — ALERT"],
  ["components/tooltip.css", "COMPONENT — TOOLTIP"],
  ["components/select.css",  "COMPONENT — SELECT"],
  ["components/modal.css",   "COMPONENT — MODAL"],
  ["components/toast.css",      "COMPONENT — TOAST"],
  ["components/tabs.css",       "COMPONENT — TABS"],
  ["components/accordion.css",  "COMPONENT — ACCORDION"],
  ["components/dropdown.css",   "COMPONENT — DROPDOWN"],
  ["components/skeleton.css",   "COMPONENT — SKELETON"],
  ["components/progress.css",   "COMPONENT — PROGRESS"],
  ["layout/layout.css",         "LAYOUT UTILITIES"],
];

// Component metadata — modifiers, key elements, JS API notes
const COMPONENTS = [
  {
    class: "vt-btn",
    element: "button | a",
    description: "Button",
    modifiers: ["--sm", "--lg", "--outline", "--ghost", "--surface", "--danger", "--icon"],
    notes: "Use aria-disabled instead of disabled for accessible disabled state.",
  },
  {
    class: "vt-card",
    element: "div | article",
    description: "Surface card",
    modifiers: ["--raised", "--interactive"],
    elements: ["__header", "__title", "__description", "__body", "__footer"],
  },
  {
    class: "vt-badge",
    element: "span",
    description: "Inline status badge",
    modifiers: ["--success", "--warning", "--danger", "--info", "--outline"],
  },
  {
    class: "vt-input",
    element: "input",
    description: "Text input. Wrap in .vt-field for label + hint layout.",
    modifiers: ["--sm", "--lg", "--error"],
  },
  {
    class: "vt-select",
    element: "div > select",
    description: "Select dropdown wrapper. Native <select> inside .vt-select div.",
    modifiers: ["--sm", "--lg", "--error"],
  },
  {
    class: "vt-switch",
    element: "label > input[type=checkbox]",
    description: "Toggle switch. CSS-only, no JS needed.",
    modifiers: [],
  },
  {
    class: "vt-alert",
    element: "div[role=alert]",
    description: "Inline alert banner.",
    modifiers: ["--success", "--warning", "--danger", "--solid"],
    elements: ["__icon", "__body", "__title", "__desc", "__dismiss"],
  },
  {
    class: "vt-tooltip",
    element: "span.vt-tooltip-wrap > *",
    description: "Tooltip. Two paths: anchor-positioning (.vt-tooltip) or attribute (data-tooltip).",
    modifiers: [],
    notes: "data-tooltip-placement: top (default) | bottom | left | right",
  },
  {
    class: "vt-modal",
    element: "dialog",
    description: "Modal dialog. Uses native <dialog> element.",
    modifiers: ["--sm", "--lg", "--full", "--danger"],
    elements: ["__header", "__title", "__close", "__body", "__footer"],
    notes: "JS: el.showModal() / el.close(). Close on backdrop: modal.addEventListener('click', e => { if (e.target === modal) modal.close() })",
  },
  {
    class: "vt-toast",
    element: "div (managed by Volty.toast())",
    description: "Toast notification. Created programmatically.",
    modifiers: ["--success", "--warning", "--danger"],
    elements: ["__icon", "__body", "__title", "__message", "__dismiss", "__progress"],
    notes: "JS: Volty.toast(message) or Volty.toast({ title, message, variant, duration, dismissible, progress }). duration:0 = persistent.",
  },
  {
    class: "vt-tabs",
    element: "div",
    description: "Tabbed content panel. Requires Volty.initTabs().",
    modifiers: ["--pills"],
    elements: ["__list", "__trigger", "__panel"],
    notes: "JS: Volty.initTabs() called automatically. trigger needs aria-controls matching panel id. aria-selected managed automatically.",
  },
  {
    class: "vt-accordion",
    element: "div > details.vt-accordion__item",
    description: "Collapsible accordion built on native <details>/<summary>. Zero JS needed.",
    modifiers: [],
    elements: ["__item", "__trigger", "__body"],
  },
  {
    class: "vt-dropdown",
    element: "div",
    description: "Toggleable dropdown menu. Requires Volty.initDropdowns().",
    modifiers: ["--end"],
    elements: ["__trigger", "__menu", "__item", "__separator", "__label"],
    notes: "JS: Volty.initDropdowns() called automatically. Use aria-haspopup='true' aria-expanded='false' on trigger.",
  },
  {
    class: "vt-skeleton",
    element: "span | div",
    description: "Shimmer loading placeholder. Pure CSS, no JS.",
    modifiers: ["--text", "--circle", "--card", "--avatar", "--button"],
  },
  {
    class: "vt-progress",
    element: "progress",
    description: "Styled native <progress> element.",
    modifiers: ["--sm", "--lg", "--success", "--warning", "--danger", "--indeterminate"],
    elements: [".vt-progress-wrap", ".vt-progress-wrap__label", ".vt-progress-wrap__value"],
    notes: "Spinner: use .vt-spinner with --xs --sm --lg --xl sizes and --success --warning --danger variants.",
  },
  {
    class: "vt-field",
    element: "div",
    description: "Form field layout wrapper. Use with .vt-label, .vt-field-hint, .vt-field-error.",
    modifiers: [],
    elements: [".vt-label", ".vt-field-hint", ".vt-field-error"],
  },
  // ── Layout primitives (volty.utilities layer) ──────────────────────────────
  {
    class: "vt-stack",
    element: "div | section | *",
    description: "Vertical flex column. Children stack top-to-bottom with uniform gap. Default gap: --vt-space-4.",
    modifiers: ["--gap-1", "--gap-2", "--gap-3", "--gap-4", "--gap-5", "--gap-6", "--gap-8", "--center", "--end"],
    notes: "Override gap inline: style=\"--vt-stack-gap: var(--vt-space-6)\"",
  },
  {
    class: "vt-cluster",
    element: "div | *",
    description: "Horizontal wrapping flex row for inline groups: buttons, tags, breadcrumbs. Default gap: --vt-space-3.",
    modifiers: ["--gap-1", "--gap-2", "--gap-3", "--gap-4", "--gap-5", "--gap-6", "--center", "--end", "--between"],
    notes: "Override gap inline: style=\"--vt-cluster-gap: var(--vt-space-4)\"",
  },
  {
    class: "vt-grid",
    element: "div | *",
    description: "Responsive auto-fit CSS grid. Columns collapse below --vt-grid-min (default 16rem) with no media queries. Default gap: --vt-space-5.",
    modifiers: ["--cols-2", "--cols-3", "--cols-4", "--gap-1", "--gap-2", "--gap-3", "--gap-4", "--gap-5", "--gap-6", "--gap-8"],
    notes: "Override min column width inline: style=\"--vt-grid-min: 12rem\". container-type: inline-size set — child components can use @container queries per cell.",
  },
  {
    class: "vt-container",
    element: "div | *",
    description: "Centered max-width page wrapper with horizontal padding. Default max-width: 72rem (~1152px).",
    modifiers: ["--sm", "--md", "--lg", "--xl", "--full"],
    notes: "sm=640px md=896px lg=1280px xl=1536px full=no max-width. Override inline: style=\"--vt-container-width: 60rem\"",
  },
];

const BANNER = `/*!
 * Volty v${PKG.version}
 * ${PKG.description}
 * MIT License
 * Built: ${new Date().toISOString()}
 */
`;

/* =============================================================================
   PARSER — extract @property blocks from properties.css
   ============================================================================= */

function inferGroup(name) {
  const segment = name.replace("--vt-", "").split("-")[0];
  const map = {
    color:    "color",
    space:    "spacing",
    radius:   "radius",
    text:     "font-size",
    duration: "duration",
    font:     "typography",
    line:     "typography",
  };
  return map[segment] || "other";
}

function parseProperties(css) {
  const tokens = {};
  // Match each @property block
  const re = /@property\s+(--[\w-]+)\s*\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const name = m[1];
    const body = m[2];
    const syntax       = (body.match(/syntax:\s*"([^"]+)"/)    || [])[1] || "";
    const initialValue = (body.match(/initial-value:\s*([^;]+);/) || [])[1]?.trim() || "";
    tokens[name] = { syntax, initial: initialValue, group: inferGroup(name) };
  }
  return tokens;
}

/* =============================================================================
   SCHEMA — dist/volty.schema.json
   ============================================================================= */

function buildSchema(tokens) {
  return {
    $schema: "https://volty.dev/schema/v1",
    version: PKG.version,
    description: PKG.description,
    tokens,
    components: COMPONENTS.map(c => ({
      class:       c.class,
      element:     c.element,
      description: c.description,
      ...(c.modifiers?.length  ? { modifiers: c.modifiers } : {}),
      ...(c.elements?.length   ? { elements:  c.elements  } : {}),
      ...(c.notes              ? { notes:     c.notes     } : {}),
    })),
    shadowDom: {
      mechanism: "@property inherits: true",
      description: "All tokens cross Shadow DOM boundaries automatically. No CSS injection needed. Use Volty.adoptStyles(shadowRoot) to also enable component classes inside shadow trees.",
      api: {
        "Volty.adoptStyles(shadowRoot)": "Inject component stylesheet via adoptedStyleSheets.",
        "Volty.createShadow(host)":      "attachShadow + adoptStyles in one call.",
        "Volty.setTokens(el, tokens)":   "Scope token overrides to an element; cascades into all shadow descendants.",
      },
    },
  };
}

/* =============================================================================
   llms.txt — dist/llms.txt
   ============================================================================= */

function buildLlmsTxt(tokens, version) {
  const byGroup = {};
  for (const [name, meta] of Object.entries(tokens)) {
    if (!byGroup[meta.group]) byGroup[meta.group] = [];
    byGroup[meta.group].push({ name, ...meta });
  }

  const tokenLines = Object.entries(byGroup).map(([group, list]) => {
    const header = `### ${group}`;
    const rows = list.map(t =>
      `${t.name.padEnd(36)} ${t.syntax.padEnd(10)} initial: ${t.initial}`
    ).join("\n");
    return `${header}\n${rows}`;
  }).join("\n\n");

  const componentLines = COMPONENTS.map(c => {
    const mods = c.modifiers?.length ? `  modifiers: ${c.modifiers.join(", ")}` : "";
    const els  = c.elements?.length  ? `  elements:  ${c.elements.join(", ")}`  : "";
    const note = c.notes             ? `  note: ${c.notes}`                      : "";
    return [`## .${c.class}  <${c.element}>`, c.description, mods, els, note]
      .filter(Boolean).join("\n");
  }).join("\n\n");

  return `# Volty v${version} — AI reference
# ${PKG.description}
# All tokens registered via @property with typed syntax — browser-validated, Shadow DOM-inherited.
# Use this file as context when generating Volty components.

================================================================================
TOKENS
================================================================================
All tokens follow the pattern --vt-[group]-[name].
Override any token on :root or any ancestor element (including shadow hosts).
Token overrides cascade into Shadow DOM automatically.

${tokenLines}

================================================================================
THEMING
================================================================================
System:  :root uses light-dark() — no attribute needed
Light:   data-theme="light"  on any ancestor
Dark:    data-theme="dark"   on any ancestor
Brand:   data-brand="violet|emerald|rose|amber|cyan"  on any ancestor

Custom brand:
  el.style.setProperty('--vt-color-brand', 'oklch(58% 0.19 142)')

JS API:
  Volty.setTheme('light' | 'dark' | 'system')
  Volty.setBrand('violet' | 'emerald' | 'rose' | 'amber' | 'cyan' | null)
  Volty.toast(message)
  Volty.toast({ title, message, variant, duration, dismissible, progress })
    variant: 'success' | 'warning' | 'danger'   duration: ms, 0=persistent

================================================================================
SHADOW DOM
================================================================================
Tokens cross shadow boundaries via @property inherits:true — zero config needed.
For component classes inside shadow trees:
  const shadow = Volty.createShadow(hostElement);          // attach + adopt
  Volty.adoptStyles(existingShadowRoot);                    // adopt only
  Volty.setTokens(el, { '--vt-color-brand': 'oklch(...)' }) // scoped override

================================================================================
COMPONENTS
================================================================================
${componentLines}

================================================================================
RULES FOR AI CODE GENERATION
================================================================================
1. All Volty classes use the .vt- prefix.
2. Token values must match their registered syntax — <color>, <length>, or <time>.
3. Use semantic color tokens (--vt-color-danger, not hardcoded oklch values).
4. Modals use native <dialog> + el.showModal(). Never use div-based modals.
5. Toasts are created with Volty.toast() — never write .vt-toast HTML by hand.
6. Add container-type: inline-size to any parent that should trigger responsive behavior.
7. For form fields: wrap input/select in .vt-field with a .vt-label sibling.
8. All @property tokens have initial-value fallbacks — missing token refs render correctly.
9. Layout primitives (vt-stack, vt-cluster, vt-grid, vt-container) live in volty.utilities — they override component styles when combined.
10. Layout gap always references a --vt-space-N token, never a hardcoded value.
11. vt-grid auto-fit handles responsiveness — avoid --cols-N modifiers unless a fixed count is explicitly required.
`;
}

/* =============================================================================
   BUILD
   ============================================================================= */

function build() {
  const start = Date.now();

  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

  // --- CSS bundle -----------------------------------------------------------
  const sections = SOURCE_FILES.map(([file, label], i) => {
    const filePath = path.join(SRC, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`  WARN: missing ${file} — skipping`);
      return null;
    }
    const content = fs.readFileSync(filePath, "utf8").trim();
    const divider = "=".repeat(77 - label.length);
    const header = `/* ${"=".repeat(78)}\n   ${i + 1}. ${label} — src/${file}\n   ${divider} */`;
    return `${header}\n\n${content}`;
  }).filter(Boolean);

  const combined = BANNER + "\n" + sections.join("\n\n\n");
  const outCSS = path.join(DIST, "volty.css");
  fs.writeFileSync(outCSS, combined);
  const sizeCSS = (Buffer.byteLength(combined, "utf8") / 1024).toFixed(1);

  // --- Minify ---------------------------------------------------------------
  const outMin = path.join(DIST, "volty.min.css");
  const lcss = path.join(ROOT, "node_modules/.bin/lightningcss");

  try {
    execSync(
      `"${lcss}" --minify --sourcemap --targets '>= 0.5%' "${outCSS}" -o "${outMin}"`,
      { stdio: "pipe" }
    );
  } catch (err) {
    console.error("lightningcss failed:", err.stderr?.toString() || err.message);
    process.exit(1);
  }
  const sizeMin = (fs.statSync(outMin).size / 1024).toFixed(1);

  // --- Parse @property tokens -----------------------------------------------
  const propsSrc = fs.readFileSync(path.join(SRC, "core/properties.css"), "utf8");
  const tokens = parseProperties(propsSrc);

  // --- Schema ---------------------------------------------------------------
  const schema = buildSchema(tokens);
  const outSchema = path.join(DIST, "volty.schema.json");
  const schemaStr = JSON.stringify(schema, null, 2);
  fs.writeFileSync(outSchema, schemaStr);
  const sizeSchema = (Buffer.byteLength(schemaStr, "utf8") / 1024).toFixed(1);

  // --- llms.txt -------------------------------------------------------------
  const llms = buildLlmsTxt(tokens, PKG.version);
  const outLlms = path.join(DIST, "llms.txt");
  fs.writeFileSync(outLlms, llms);
  const sizeLlms = (Buffer.byteLength(llms, "utf8") / 1024).toFixed(1);

  // --- Copy volty-insert.js to dist -----------------------------------------
  const insertSrc = path.join(SRC, "volty-insert.js");
  const insertDst = path.join(DIST, "volty-insert.js");
  fs.copyFileSync(insertSrc, insertDst);
  const sizeInsert = (fs.statSync(insertDst).size / 1024).toFixed(1);

  // --- volty-embed.js — single-file install ---------------------------------
  // Preamble captures the script's own URL, sets window.__voltyBase, and
  // injects volty.min.css so the developer only needs one <script> tag.
  const embedPreamble = `/*!
 * Volty v${PKG.version} — embed bundle
 * Single-file install: drop one <script> tag, nothing else needed.
 *
 *   <script src="dist/volty-embed.js"></script>
 *
 * Automatically injects dist/volty.min.css relative to this script's URL,
 * so it works from any directory or CDN without configuration.
 */
(function () {
  var _s = document.currentScript;
  var _base = _s ? _s.src.replace(/[^/]+$/, '') : '';
  window.__voltyBase = _base;
  if (!document.querySelector('link[data-volty]')) {
    var _l = document.createElement('link');
    _l.rel  = 'stylesheet';
    _l.href = _base + 'volty.min.css';
    _l.setAttribute('data-volty', '');
    // Insert before any other styles so Volty tokens are available immediately
    var _first = document.head.querySelector('link, style');
    _first ? document.head.insertBefore(_l, _first) : document.head.appendChild(_l);
  }
})();\n`;

  const voltyJs  = fs.readFileSync(path.join(SRC, "volty.js"),        "utf8");
  const insertJs = fs.readFileSync(path.join(SRC, "volty-insert.js"), "utf8");
  const embedJs  = BANNER + "\n" + embedPreamble + "\n" + voltyJs + "\n" + insertJs;
  const outEmbed = path.join(DIST, "volty-embed.js");
  fs.writeFileSync(outEmbed, embedJs);
  const sizeEmbed = (Buffer.byteLength(embedJs, "utf8") / 1024).toFixed(1);

  // --- Report ---------------------------------------------------------------
  const elapsed = Date.now() - start;
  console.log(`\nVolty v${PKG.version} built in ${elapsed}ms`);
  console.log(`  dist/volty.css          ${sizeCSS} kB`);
  console.log(`  dist/volty.min.css      ${sizeMin} kB  (+ .map)`);
  console.log(`  dist/volty.schema.json  ${sizeSchema} kB`);
  console.log(`  dist/llms.txt           ${sizeLlms} kB`);
  console.log(`  dist/volty-insert.js    ${sizeInsert} kB`);
  console.log(`  dist/volty-embed.js     ${sizeEmbed} kB  ← single-file install`);
  console.log();
}

build();
