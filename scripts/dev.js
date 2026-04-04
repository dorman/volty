#!/usr/bin/env node
/**
 * Volty dev server
 * - Watches src/**\/*.css and src/volty.js
 * - Rebuilds dist/volty.css + dist/volty.min.css on change
 * - Runs browser-sync on http://localhost:3000
 * - Injects live reload — no manual refresh needed
 */

const path = require("path");
const { spawn } = require("child_process");
const bs = require("browser-sync").create();

const ROOT = path.resolve(__dirname, "..");
const build = path.join(__dirname, "build.js");

// ─── Build runner ─────────────────────────────────────────────────────────────

let building = false;
let queued = false;

function runBuild(label) {
  if (building) { queued = true; return; }
  building = true;

  const start = Date.now();
  process.stdout.write(`  building${label ? " (" + label + ")" : ""}… `);

  const child = spawn(process.execPath, [build], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let out = "";
  child.stdout.on("data", d => { out += d; });
  child.stderr.on("data", d => { out += d; });

  child.on("close", code => {
    building = false;
    if (code === 0) {
      // Extract size info from build output
      const match = out.match(/volty\.min\.css\s+([\d.]+ kB)/);
      const size = match ? `  ${match[1]} min` : "";
      console.log(`done in ${Date.now() - start}ms${size}`);
      bs.reload("dist/volty.css");
    } else {
      console.log("FAILED");
      console.error(out.trim());
    }
    if (queued) { queued = false; runBuild("queued"); }
  });
}

// ─── File watcher ─────────────────────────────────────────────────────────────

const chokidar = require("chokidar");

const watcher = chokidar.watch(
  ["src/**/*.css", "src/volty.js"],
  { cwd: ROOT, ignoreInitial: false, awaitWriteFinish: { stabilityThreshold: 80 } }
);

watcher
  .on("ready", () => console.log("  watching src/…"))
  .on("change", file => runBuild(file))
  .on("add",    file => runBuild(file));

// ─── Browser-sync ─────────────────────────────────────────────────────────────

bs.init({
  server: ROOT,
  startPath: "/index.html",
  port: 3000,
  ui: false,
  notify: false,          // no "Connected to BrowserSync" banner in page
  open: true,             // auto-open browser
  logLevel: "silent",     // we handle our own logging
  files: [
    "index.html",         // reload on HTML changes too
    "src/volty.js",       // reload on JS changes
    // dist/volty.css is reloaded manually via bs.reload() above
  ],
}, (err, bsInstance) => {
  if (err) { console.error("browser-sync error:", err); process.exit(1); }
  const port = bsInstance.options.get("port");
  console.log(`\n  Volty dev server  →  http://localhost:${port}\n`);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────

process.on("SIGINT", () => {
  watcher.close();
  bs.exit();
  process.exit(0);
});
