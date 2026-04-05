#!/usr/bin/env node
/**
 * Volty build script
 * Concatenates src/ files in correct order → dist/volty.css
 * Then minifies → dist/volty.min.css + dist/volty.min.css.map
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
  // 1. Layer order declaration (must be first)
  ["core/layers.css", "LAYERS"],

  // 2. @property registrations (before any token usage)
  ["core/properties.css", "PROPERTIES"],

  // 3. Token values (uses @property-registered custom props)
  ["core/colors.css", "COLORS"],
  ["core/typography.css", "TYPOGRAPHY"],
  ["core/spacing.css", "SPACING"],

  // 4. Theme tokens (light-dark(), data-theme, data-brand)
  ["themes/base.css", "THEME — BASE"],
  ["themes/dark.css", "THEME — DARK"],

  // 5. Components
  ["components/button.css",  "COMPONENT — BUTTON"],
  ["components/card.css",    "COMPONENT — CARD"],
  ["components/badge.css",   "COMPONENT — BADGE"],
  ["components/input.css",   "COMPONENT — INPUT"],
  ["components/switch.css",  "COMPONENT — SWITCH"],
  ["components/alert.css",   "COMPONENT — ALERT"],
  ["components/tooltip.css", "COMPONENT — TOOLTIP"],
  ["components/select.css",  "COMPONENT — SELECT"],
  ["components/modal.css",   "COMPONENT — MODAL"],
  ["components/toast.css",   "COMPONENT — TOAST"],
];

const BANNER = `/*!
 * Volty v${PKG.version}
 * ${PKG.description}
 * MIT License
 * Built: ${new Date().toISOString()}
 */
`;

function build() {
  const start = Date.now();

  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

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

  // Write unminified
  const outCSS = path.join(DIST, "volty.css");
  fs.writeFileSync(outCSS, combined);
  const sizeCSS = (Buffer.byteLength(combined, "utf8") / 1024).toFixed(1);

  // Minify with lightningcss-cli
  const outMin = path.join(DIST, "volty.min.css");
  const lcss = path.join(ROOT, "node_modules/.bin/lightningcss");

  try {
    execSync(
      `"${lcss}" --minify --sourcemap --targets '>= 0.5%' "${outCSS}" -o "${outMin}"`,
      { stdio: "pipe" }
    );
    const sizeMin = (fs.statSync(outMin).size / 1024).toFixed(1);
    const elapsed = Date.now() - start;

    console.log(`\nVolty v${PKG.version} built in ${elapsed}ms`);
    console.log(`  dist/volty.css      ${sizeCSS} kB`);
    console.log(`  dist/volty.min.css  ${sizeMin} kB  (+ .map)`);
    console.log();
  } catch (err) {
    console.error("lightningcss failed:", err.stderr?.toString() || err.message);
    process.exit(1);
  }
}

build();
