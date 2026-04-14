/*!
 * Volty v0.1.1
 * Modern CSS theme library — typed design tokens, native Shadow DOM theming, zero build step
 * MIT License
 * Built: 2026-04-13T22:41:18.095Z
 */

/*!
 * Volty v0.1.1 — embed bundle
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
})();

/**
 * Volty — runtime utilities
 *
 * Handles:
 *   - Theme (system preference detection, manual override, persistence, transitions)
 *   - Brand (scoped color overrides)
 *   - Shadow DOM token bridge (the @property inherits: true story)
 *   - Toast notifications
 */
(function () {
  'use strict';

  /* ==========================================================================
     THEME
     ========================================================================== */

  const STORAGE_KEY = 'volty-theme';
  const BRAND_KEY   = 'volty-brand';

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme, target = document.documentElement) {
    if (theme === 'system') {
      target.removeAttribute('data-theme');
    } else {
      target.setAttribute('data-theme', theme);
    }
  }

  function applyBrand(brand, target = document.documentElement) {
    if (brand) {
      target.setAttribute('data-brand', brand);
    } else {
      target.removeAttribute('data-brand');
    }
  }

  function setTheme(theme, { persist = true, target, transition = true } = {}) {
    const el = target || document.documentElement;

    if (transition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (document.startViewTransition) {
        document.startViewTransition(() => applyTheme(theme, el));
      } else {
        el.style.transition = 'background-color 200ms ease, color 200ms ease';
        applyTheme(theme, el);
        setTimeout(() => (el.style.transition = ''), 250);
      }
    } else {
      applyTheme(theme, el);
    }

    if (persist) localStorage.setItem(STORAGE_KEY, theme);
  }

  function setBrand(brand, { persist = true, target } = {}) {
    const el = target || document.documentElement;
    applyBrand(brand, el);
    if (persist) {
      brand
        ? localStorage.setItem(BRAND_KEY, brand)
        : localStorage.removeItem(BRAND_KEY);
    }
  }

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'system';
  }

  function getBrand() {
    return localStorage.getItem(BRAND_KEY) || null;
  }

  function initTheme() {
    applyTheme(getTheme());
    const saved = getBrand();
    if (saved) applyBrand(saved);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (getTheme() === 'system') applyTheme('system');
    });
  }

  /* ==========================================================================
     SHADOW DOM TOKEN BRIDGE
     ————————————————————————————————————————————————————————————————————————
     The problem CSS custom properties (--foo: bar) have in Shadow DOM:
     They inherit through the normal cascade, BUT only if the parent and child
     share the same document tree. Shadow roots create a style boundary — CSS
     rules from the light DOM don't pierce it, and the shadow root creates a
     new inheritance root for custom properties.

     The Volty solution — @property with inherits: true:
     When a custom property is REGISTERED via @property with inherits: true,
     the browser treats it like a built-in inherited CSS property (like color or
     font-size). Inherited CSS properties DO pass through Shadow DOM boundaries
     automatically — the shadow host element inherits from its parent, and
     the shadow root's :host element inherits those values.

     This means every Volty token (--vt-color-brand, --vt-space-4, etc.) is
     automatically available inside any Shadow DOM element that is a descendant
     of a Volty-themed document — with ZERO extra configuration, CSS injection,
     or JS bridging.

     The only requirement: @property registrations must exist in the document
     (not inside shadow roots). volty.css handles this at the document level.

     ---- adoptStyleSheet helper ------------------------------------------
     For Shadow Roots that need Volty component styles (not just tokens),
     use Volty.adoptStyles(shadowRoot) to inject the component stylesheet.
     This is optional — tokens work automatically, component classes do not.
     ========================================================================== */

  /**
   * Shared CSSStyleSheet for shadow DOM adoption.
   * Lazily created on first call; shared across all roots (zero duplication).
   */
  let _adoptableSheet = null;

  function getAdoptableSheet() {
    if (_adoptableSheet) return _adoptableSheet;
    _adoptableSheet = new CSSStyleSheet();
    // Prefer __voltyBase set by the embed bundle preamble; fall back to
    // finding the script tag by name.
    const scriptEl = document.currentScript ||
      document.querySelector('script[src*="volty"]');
    const base = window.__voltyBase ||
      (scriptEl ? scriptEl.src.replace(/[^/]+$/, '') : '/');
    fetch(base + 'volty.css')
      .then(r => r.text())
      .then(css => _adoptableSheet.replaceSync(css))
      .catch(() => {
        // Fallback: inline a minimal reset so tokens still work
        _adoptableSheet.replaceSync(':host { display: contents; }');
      });
    return _adoptableSheet;
  }

  /**
   * Adopt Volty styles into a Shadow Root.
   *
   * Tokens (colors, spacing, radii, etc.) cross shadow boundaries automatically
   * via @property inherits: true — no adoption needed for those.
   *
   * Call this when you want Volty component classes (.vt-btn, .vt-card, etc.)
   * to work inside your shadow tree.
   *
   * @param {ShadowRoot} shadowRoot
   * @returns {ShadowRoot} the same root, for chaining
   *
   * @example
   * const shadow = myEl.attachShadow({ mode: 'open' });
   * Volty.adoptStyles(shadow);
   */
  function adoptStyles(shadowRoot) {
    if (!('adoptedStyleSheets' in Document.prototype)) {
      console.warn('Volty.adoptStyles: adoptedStyleSheets not supported in this browser.');
      return shadowRoot;
    }
    const sheet = getAdoptableSheet();
    if (!shadowRoot.adoptedStyleSheets.includes(sheet)) {
      shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, sheet];
    }
    return shadowRoot;
  }

  /**
   * Create a Shadow Root with Volty styles already adopted.
   * Convenience wrapper around attachShadow + adoptStyles.
   *
   * @param {Element} host  - the element to attach the shadow to
   * @param {ShadowRootInit} [options] - passed to attachShadow (default: open)
   * @returns {ShadowRoot}
   *
   * @example
   * class MyCard extends HTMLElement {
   *   connectedCallback() {
   *     const shadow = Volty.createShadow(this);
   *     shadow.innerHTML = `
   *       <div class="vt-card">
   *         <div class="vt-card__title"><slot name="title"></slot></div>
   *         <div class="vt-card__body"><slot></slot></div>
   *       </div>`;
   *   }
   * }
   */
  function createShadow(host, options = { mode: 'open' }) {
    const shadow = host.attachShadow(options);
    adoptStyles(shadow);
    return shadow;
  }

  /**
   * Set a Volty token override scoped to a specific element (including shadow hosts).
   * Because all Volty tokens use @property with inherits: true, setting them on any
   * ancestor will cascade into all descendant shadow trees automatically.
   *
   * @param {Element} el
   * @param {Record<string, string>} tokens  e.g. { '--vt-color-brand': 'oklch(55% 0.22 10)' }
   *
   * @example
   * // Give a specific widget a rose brand color — it flows into any shadow children too
   * Volty.setTokens(myWidget, { '--vt-color-brand': 'oklch(55% 0.22 10)' });
   */
  function setTokens(el, tokens) {
    for (const [prop, value] of Object.entries(tokens)) {
      el.style.setProperty(prop, value);
    }
  }

  /* ==========================================================================
     TOAST
     ========================================================================== */

  const TOAST_DEFAULTS = {
    duration: 4000,  // ms; 0 = persist until dismissed
    variant: null,   // 'success' | 'warning' | 'danger' | null (info)
    title: null,
    message: '',
    dismissible: true,
    icon: null,      // HTML string or null to use default icon per variant
    progress: true,  // show countdown bar when duration > 0
  };

  // Default icons per variant — inline SVG so there's no dependency
  const TOAST_ICONS = {
    success: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
      <path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    warning: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2L14 13H2L8 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M8 6v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="8" cy="11" r="0.75" fill="currentColor"/>
    </svg>`,
    danger: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
      <path d="M6 6l4 4M10 6l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    info: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
      <path d="M8 7v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="8" cy="5" r="0.75" fill="currentColor"/>
    </svg>`,
  };

  const DISMISS_ICON = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;

  let _toastRegion = null;

  function getToastRegion() {
    if (_toastRegion && document.body.contains(_toastRegion)) return _toastRegion;
    _toastRegion = document.querySelector('.vt-toast-region');
    if (!_toastRegion) {
      _toastRegion = document.createElement('div');
      _toastRegion.className = 'vt-toast-region';
      _toastRegion.setAttribute('aria-live', 'polite');
      _toastRegion.setAttribute('aria-atomic', 'false');
      document.body.appendChild(_toastRegion);
    }
    return _toastRegion;
  }

  function dismissToast(el) {
    el.classList.add('is-dismissing');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
    // Fallback in case transitions are disabled
    setTimeout(() => el.remove(), 400);
  }

  /**
   * Show a toast notification.
   *
   * @param {Object|string} options  - config object, or a string (used as message)
   * @returns {HTMLElement} the toast element
   *
   * @example
   * Volty.toast('File saved.')
   * Volty.toast({ message: 'Deleted', variant: 'danger', title: 'Error', duration: 0 })
   */
  function toast(options) {
    if (typeof options === 'string') options = { message: options };
    const cfg = { ...TOAST_DEFAULTS, ...options };
    const region = getToastRegion();

    const el = document.createElement('div');
    el.className = 'vt-toast' + (cfg.variant ? ` vt-toast--${cfg.variant}` : '');
    el.setAttribute('role', 'status');
    if (cfg.duration > 0) {
      el.style.setProperty('--vt-toast-duration', cfg.duration + 'ms');
    }

    const iconHtml = cfg.icon !== null
      ? cfg.icon
      : (TOAST_ICONS[cfg.variant] || TOAST_ICONS.info);

    const titleHtml = cfg.title
      ? `<div class="vt-toast__title">${cfg.title}</div>`
      : '';

    const progressHtml = cfg.progress && cfg.duration > 0
      ? `<div class="vt-toast__progress">
           <div class="vt-toast__progress-bar"></div>
         </div>`
      : '';

    const dismissHtml = cfg.dismissible
      ? `<button class="vt-toast__dismiss" aria-label="Dismiss notification">${DISMISS_ICON}</button>`
      : '';

    el.innerHTML = `
      <div class="vt-toast__icon">${iconHtml}</div>
      <div class="vt-toast__body">
        ${titleHtml}
        <div class="vt-toast__message">${cfg.message}</div>
        ${progressHtml}
      </div>
      ${dismissHtml}`;

    if (cfg.dismissible) {
      el.querySelector('.vt-toast__dismiss').addEventListener('click', () => dismissToast(el));
    }

    region.appendChild(el);

    if (cfg.duration > 0) {
      setTimeout(() => dismissToast(el), cfg.duration);
    }

    return el;
  }

  /* ==========================================================================
     TABS
     ========================================================================== */

  /**
   * Initialize keyboard navigation and ARIA for all .vt-tabs on the page.
   * Called automatically on DOMContentLoaded. Call manually after dynamic content.
   *
   * @param {Element|Document} [root=document]
   */
  function initTabs(root) {
    root = root || document;
    root.querySelectorAll('.vt-tabs').forEach(function (tabs) {
      if (tabs._vtTabsInit) return;
      tabs._vtTabsInit = true;

      var triggers = Array.from(tabs.querySelectorAll('.vt-tabs__trigger'));
      var panels   = Array.from(tabs.querySelectorAll('.vt-tabs__panel'));

      function selectTab(index) {
        triggers.forEach(function (t, i) {
          var selected = i === index;
          t.setAttribute('aria-selected', selected ? 'true' : 'false');
          t.setAttribute('tabindex', selected ? '0' : '-1');
        });
        panels.forEach(function (p, i) {
          p.hidden = i !== index;
        });
      }

      triggers.forEach(function (trigger, i) {
        trigger.addEventListener('click', function () { selectTab(i); });
        trigger.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') { e.preventDefault(); selectTab((i + 1) % triggers.length); triggers[(i + 1) % triggers.length].focus(); }
          if (e.key === 'ArrowLeft')  { e.preventDefault(); selectTab((i - 1 + triggers.length) % triggers.length); triggers[(i - 1 + triggers.length) % triggers.length].focus(); }
          if (e.key === 'Home')       { e.preventDefault(); selectTab(0); triggers[0].focus(); }
          if (e.key === 'End')        { e.preventDefault(); selectTab(triggers.length - 1); triggers[triggers.length - 1].focus(); }
        });
      });

      var initial = triggers.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
      selectTab(initial >= 0 ? initial : 0);
    });
  }

  /* ==========================================================================
     DROPDOWNS
     ========================================================================== */

  /**
   * Initialize toggle behavior and keyboard for all .vt-dropdown on the page.
   * Called automatically on DOMContentLoaded. Call manually after dynamic content.
   *
   * @param {Element|Document} [root=document]
   */
  function initDropdowns(root) {
    root = root || document;
    root.querySelectorAll('.vt-dropdown').forEach(function (dropdown) {
      if (dropdown._vtDropInit) return;
      dropdown._vtDropInit = true;

      var trigger = dropdown.querySelector('.vt-dropdown__trigger');
      var menu    = dropdown.querySelector('.vt-dropdown__menu');
      if (!trigger || !menu) return;

      function openMenu() {
        menu.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        // Focus first item
        var first = menu.querySelector('.vt-dropdown__item:not(:disabled):not([aria-disabled="true"])');
        if (first) first.focus();
      }

      function closeMenu() {
        menu.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
      }

      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        if (menu.hidden) {
          // Close all other open dropdowns first
          document.querySelectorAll('.vt-dropdown__menu').forEach(function (m) {
            if (m !== menu) { m.hidden = true; var t = m.closest('.vt-dropdown') && m.closest('.vt-dropdown').querySelector('.vt-dropdown__trigger'); if (t) t.setAttribute('aria-expanded', 'false'); }
          });
          openMenu();
        } else {
          closeMenu();
        }
      });

      dropdown.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { closeMenu(); trigger.focus(); }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          var items = Array.from(menu.querySelectorAll('.vt-dropdown__item:not(:disabled)'));
          var idx = items.indexOf(document.activeElement);
          var next = items[idx + 1] || items[0];
          if (next) next.focus();
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          var items = Array.from(menu.querySelectorAll('.vt-dropdown__item:not(:disabled)'));
          var idx = items.indexOf(document.activeElement);
          var prev = items[idx - 1] || items[items.length - 1];
          if (prev) prev.focus();
        }
      });
    });

    // Global click-outside handler (only add once)
    if (!document._vtDropOutside) {
      document._vtDropOutside = true;
      document.addEventListener('click', function () {
        document.querySelectorAll('.vt-dropdown__menu').forEach(function (m) {
          m.hidden = true;
          var t = m.closest('.vt-dropdown') && m.closest('.vt-dropdown').querySelector('.vt-dropdown__trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  /* ==========================================================================
     INIT
     ========================================================================== */

  initTheme();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initTabs();
      initDropdowns();
    });
  } else {
    initTabs();
    initDropdowns();
  }

  /* ==========================================================================
     PUBLIC API
     ========================================================================== */
  window.Volty = {
    // Theme
    setTheme,
    setBrand,
    getTheme,
    getBrand,
    getSystemTheme,

    // Shadow DOM
    adoptStyles,
    createShadow,
    setTokens,

    // Toast
    toast,

    // Interactive components
    initTabs,
    initDropdowns,
  };
})();

/**
 * Volty Insert — component shorthand system
 *
 * Three equivalent ways to drop in any Volty component:
 *
 *   1. Custom element  →  <vt-nav></vt-nav>
 *   2. Data attribute  →  <div data-vt-insert="nav"></div>
 *   3. JS API          →  Volty.insert('nav', target, options)
 *
 * Options can be passed as element attributes or as a plain object:
 *   <vt-nav logo="My App" version="v2.0"
 *           links='[{"href":"/","label":"Home"},{"href":"/docs","label":"Docs"}]'>
 *   </vt-nav>
 */
(function () {
  'use strict';

  /* ==========================================================================
     HELPERS
     ========================================================================== */

  /** Parse a JSON string safely; return fallback on failure. */
  function parseJSON(str, fallback) {
    try { return str ? JSON.parse(str) : fallback; } catch { return fallback; }
  }

  /**
   * Read options from an element's attributes.
   * Supports plain attrs (logo="…") and data-* attrs (data-logo="…").
   * Also captures the element's innerHTML as opts.content.
   */
  function optsFromEl(el) {
    const o = { content: el.innerHTML.trim() };
    for (const attr of el.attributes) {
      const key = attr.name.replace(/^data-/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      o[key] = attr.value;
    }
    // Parse known JSON fields
    if (typeof o.links === 'string')  o.links  = parseJSON(o.links,  []);
    if (typeof o.groups === 'string') o.groups = parseJSON(o.groups, []);
    return o;
  }

  /** Render a template string into a DocumentFragment. */
  function toFragment(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content;
  }

  /** Replace el with rendered HTML; return the first inserted element. */
  function replaceWith(el, html) {
    const frag = toFragment(html);
    const first = frag.firstElementChild;
    el.replaceWith(frag);
    return first;
  }

  /* ==========================================================================
     SHARED ICONS (inline SVG, no external dependency)
     ========================================================================== */

  const ICON = {
    sun: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    moon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    monitor: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    close: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    info:    `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 7v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="5" r=".75" fill="currentColor"/></svg>`,
    success: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    warning: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2L14 13H2L8 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11" r=".75" fill="currentColor"/></svg>`,
    danger:  `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M6 6l4 4M10 6l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  };

  /* ==========================================================================
     COMPONENT TEMPLATES
     Each function receives an options object and returns an HTML string.
     ========================================================================== */

  const TEMPLATES = {

    /* ---- nav ----------------------------------------------------------------
       Options:
         logo         {string}   Logo text (first char used as mark). Default: "V"
         logoSrc      {string}   Image URL — replaces the text mark if provided
         logoHref     {string}   Logo link href. Default: "/"
         version      {string}   Version badge text. Optional
         links        {array}    [{href, label, active?, external?}]
         themeSwitcher {bool}    Show theme toggle. Default: true
         id           {string}   ID for the theme toggle (for aria). Default: auto
    */
    nav(o = {}) {
      const logo    = o.logo    || 'V';
      const href    = o.logoHref || '/';
      const version = o.version || '';
      const links   = Array.isArray(o.links) ? o.links : [];
      const showTheme = o.themeSwitcher !== 'false' && o.themeSwitcher !== false;
      const uid     = o.id || ('vt-nav-' + Math.random().toString(36).slice(2, 7));

      const logoMark = o.logoSrc
        ? `<img src="${o.logoSrc}" alt="${logo}" class="vt-nav__logo-img">`
        : `<div class="vt-nav__logo-mark">${logo[0].toUpperCase()}</div>`;

      const versionBadge = version
        ? `<span class="vt-badge vt-badge--surface" style="font-family:var(--vt-font-mono);font-size:var(--vt-text-xs);">${version}</span>`
        : '';

      const linkHtml = links.map(l => {
        const active = l.active ? ' is-active' : '';
        const ext    = l.external ? ' target="_blank" rel="noopener"' : '';
        return `<a href="${l.href}" class="vt-nav__link${active}"${ext}>${l.label}</a>`;
      }).join('');

      const themeHtml = showTheme ? `
        <div class="vt-nav__theme-toggle" role="group" aria-label="Theme">
          <button class="vt-nav__theme-btn" data-vt-theme="light"   onclick="Volty.setTheme('light');  _vtSyncTheme(this)">${ICON.sun}  Light</button>
          <button class="vt-nav__theme-btn" data-vt-theme="dark"    onclick="Volty.setTheme('dark');   _vtSyncTheme(this)">${ICON.moon} Dark</button>
          <button class="vt-nav__theme-btn" data-vt-theme="system"  onclick="Volty.setTheme('system'); _vtSyncTheme(this)">${ICON.monitor} System</button>
        </div>` : '';

      return `
<nav class="vt-nav" id="${uid}">
  <div class="vt-nav__inner">
    <a href="${href}" class="vt-nav__logo">
      ${logoMark}
      <span class="vt-nav__logo-name">${logo}</span>
      ${versionBadge}
    </a>
    <div class="vt-nav__links">${linkHtml}</div>
    <div class="vt-nav__controls">${themeHtml}</div>
  </div>
</nav>`;
    },

    /* ---- sidebar ------------------------------------------------------------
       Options:
         groups  {array}  [{label, links: [{href, label}]}]
                          If omitted, renders the default Volty docs sidebar.
    */
    sidebar(o = {}) {
      const groups = Array.isArray(o.groups) && o.groups.length
        ? o.groups
        : [
            { label: 'Components', links: [
                { href: '#buttons', label: 'Buttons' },
                { href: '#cards',   label: 'Cards' },
                { href: '#badges',  label: 'Badges' },
                { href: '#forms',   label: 'Form Fields' },
                { href: '#switches',label: 'Switches' },
                { href: '#alerts',  label: 'Alerts' },
                { href: '#tooltips',label: 'Tooltips' },
                { href: '#selects', label: 'Select' },
                { href: '#modals',  label: 'Modal' },
                { href: '#toasts',  label: 'Toast' },
              ]},
            { label: 'Theming', links: [
                { href: '#dark-island',   label: 'Dark Island' },
                { href: '#brand-theming', label: 'Brand Theming' },
              ]},
            { label: 'Tokens', links: [
                { href: '#tokens',     label: 'Color Tokens' },
                { href: '#typography', label: 'Typography' },
              ]},
            { label: 'Differentiators', links: [
                { href: '#property-transitions', label: '@property Transitions' },
                { href: '#container-queries',    label: 'Container Queries' },
                { href: '#dark-mode-colors',     label: 'Dark Mode Colors' },
                { href: '#shadow-dom',           label: 'Shadow DOM' },
              ]},
            { divider: true },
            { links: [
                { href: '#ai-schema',   label: 'AI / Schema' },
                { href: '#architecture',label: 'Architecture' },
              ]},
          ];

      const groupHtml = groups.map(g => {
        if (g.divider) return `<div class="vt-sidebar__divider"></div>`;
        const label = g.label
          ? `<p class="vt-sidebar__group-label">${g.label}</p>`
          : '';
        const links = (g.links || []).map(l =>
          `<a href="${l.href}" class="vt-sidebar__link">${l.label}</a>`
        ).join('');
        return `<div class="vt-sidebar__group">${label}${links}</div>`;
      }).join('');

      return `
<aside class="vt-sidebar" aria-label="${o.label || 'Page navigation'}">
  <nav class="vt-sidebar__nav">${groupHtml}</nav>
</aside>`;
    },

    /* ---- footer -------------------------------------------------------------
       Options:
         text     {string}  Footer copy. Supports basic HTML.
         links    {array}   [{href, label}] — rendered as inline links
    */
    footer(o = {}) {
      const text  = o.text || o.content || '&copy; ' + new Date().getFullYear();
      const links = Array.isArray(o.links) ? o.links : [];
      const linkHtml = links.length
        ? `<div style="display:flex;gap:var(--vt-space-4);justify-content:center;margin-block-start:var(--vt-space-2);">
             ${links.map(l => `<a href="${l.href}" style="font-size:var(--vt-text-sm);color:var(--vt-color-text-muted);text-decoration:none;">${l.label}</a>`).join('')}
           </div>`
        : '';
      return `
<footer style="border-top:1px solid var(--vt-color-border);padding-block:var(--vt-space-6);text-align:center;">
  <p style="font-size:var(--vt-text-sm);color:var(--vt-color-text-muted);">${text}</p>
  ${linkHtml}
</footer>`;
    },

    /* ---- card ---------------------------------------------------------------
       Options:
         title        {string}  Card title
         description  {string}  Subtitle beneath title
         variant      {string}  'raised' | 'interactive'
         content      {string}  innerHTML (body slot)
         footer       {string}  Footer HTML
    */
    card(o = {}) {
      const variant = o.variant ? ` vt-card--${o.variant}` : '';
      const header  = (o.title || o.description)
        ? `<div class="vt-card__header">
             ${o.title ? `<h3 class="vt-card__title">${o.title}</h3>` : ''}
             ${o.description ? `<p class="vt-card__description">${o.description}</p>` : ''}
           </div>`
        : '';
      const body    = o.content
        ? `<div class="vt-card__body">${o.content}</div>`
        : '';
      const footer  = o.footer
        ? `<div class="vt-card__footer">${o.footer}</div>`
        : '';
      return `<div class="vt-card${variant}">${header}${body}${footer}</div>`;
    },

    /* ---- alert --------------------------------------------------------------
       Options:
         variant   {string}  'success' | 'warning' | 'danger' (default: info)
         solid     {bool}    Use solid variant
         title     {string}  Bold title line
         content   {string}  Message body (innerHTML fallback)
         dismissible {bool}  Show dismiss button. Default: true
    */
    alert(o = {}) {
      const variant    = o.variant || 'info';
      const solid      = o.solid === true || o.solid === 'true';
      const cls        = ['vt-alert', o.variant ? `vt-alert--${variant}` : '', solid ? 'vt-alert--solid' : ''].filter(Boolean).join(' ');
      const icon       = ICON[variant] || ICON.info;
      const title      = o.title ? `<p class="vt-alert__title">${o.title}</p>` : '';
      const msg        = o.content || o.message || '';
      const dismissible = o.dismissible !== 'false' && o.dismissible !== false;
      const dismiss    = dismissible
        ? `<button class="vt-alert__dismiss" aria-label="Dismiss" onclick="this.closest('.vt-alert').remove()">${ICON.close}</button>`
        : '';
      return `
<div class="${cls}" role="alert">
  <div class="vt-alert__icon">${icon}</div>
  <div class="vt-alert__body">${title}<p class="vt-alert__desc">${msg}</p></div>
  ${dismiss}
</div>`;
    },

    /* ---- badge --------------------------------------------------------------
       Options:
         variant  {string}  'success'|'warning'|'danger'|'info'|'solid'|'surface'
         content  {string}  Badge label text (innerHTML fallback)
    */
    badge(o = {}) {
      const cls = ['vt-badge', o.variant ? `vt-badge--${o.variant}` : ''].filter(Boolean).join(' ');
      return `<span class="${cls}">${o.content || o.label || ''}</span>`;
    },

    /* ---- button -------------------------------------------------------------
       Options:
         variant  {string}  'outline'|'ghost'|'surface'|'danger'
         size     {string}  'sm'|'lg'
         href     {string}  Renders as <a> if provided
         content  {string}  Button label (innerHTML fallback)
         disabled {bool}
    */
    button(o = {}) {
      const classes = [
        'vt-btn',
        o.variant ? `vt-btn--${o.variant}` : '',
        o.size    ? `vt-btn--${o.size}`    : '',
      ].filter(Boolean).join(' ');
      const label   = o.content || o.label || 'Button';
      const disabled = (o.disabled === true || o.disabled === 'true') ? ' disabled' : '';
      if (o.href) {
        return `<a href="${o.href}" class="${classes}">${label}</a>`;
      }
      return `<button class="${classes}"${disabled}>${label}</button>`;
    },

    /* ---- modal --------------------------------------------------------------
       Options:
         id       {string}  Required — used to open/close via showModal()
         title    {string}  Modal heading
         variant  {string}  'danger'|'sm'|'lg'|'full'
         content  {string}  Body HTML (innerHTML fallback)
         confirm  {string}  Confirm button label. Default: 'Confirm'
         cancel   {string}  Cancel button label. Default: 'Cancel'
    */
    modal(o = {}) {
      const id      = o.id || ('vt-modal-' + Math.random().toString(36).slice(2, 7));
      const variant = o.variant ? ` vt-modal--${o.variant}` : '';
      const title   = o.title || 'Dialog';
      const body    = o.content || '';
      const confirm = o.confirm || 'Confirm';
      const cancel  = o.cancel  || 'Cancel';
      const confirmVariant = o.variant === 'danger' ? 'vt-btn--danger' : 'vt-btn';
      return `
<dialog class="vt-modal${variant}" id="${id}">
  <div class="vt-modal__header">
    <h2 class="vt-modal__title">${title}</h2>
    <button class="vt-modal__close" aria-label="Close" onclick="this.closest('dialog').close()">
      ${ICON.close}
    </button>
  </div>
  <div class="vt-modal__body">${body}</div>
  <div class="vt-modal__footer">
    <button class="vt-btn vt-btn--surface" onclick="this.closest('dialog').close()">${cancel}</button>
    <button class="${confirmVariant}" onclick="this.closest('dialog').close()">${confirm}</button>
  </div>
</dialog>`;
    },

    /* ---- toast-trigger ------------------------------------------------------
       Renders a button that fires Volty.toast() when clicked.
       Options:
         content   {string}  Button label
         message   {string}  Toast message
         title     {string}  Toast title (optional)
         variant   {string}  'success'|'warning'|'danger'
         duration  {number}  ms, 0=persistent
         size      {string}  Button size: 'sm'|'lg'
         buttonVariant {string}  Button style variant
    */
    'toast-trigger'(o = {}) {
      const label  = o.content || o.label || 'Show toast';
      const opts   = JSON.stringify({
        message:  o.message  || label,
        title:    o.title    || undefined,
        variant:  o.variant  || undefined,
        duration: o.duration !== undefined ? Number(o.duration) : undefined,
      }).replace(/,?"[^"]+":undefined/g, '').replace(/^\{,/, '{');
      const btnCls = ['vt-btn',
        o.buttonVariant ? `vt-btn--${o.buttonVariant}` : '',
        o.size          ? `vt-btn--${o.size}`          : '',
      ].filter(Boolean).join(' ');
      return `<button class="${btnCls}" onclick='Volty.toast(${opts})'>${label}</button>`;
    },

    /* ---- tabs ---------------------------------------------------------------
       Options:
         tabs   {array}  [{label, content, active?}]
         variant {string} 'pills'
    */
    tabs(o = {}) {
      const tabList = Array.isArray(o.tabs) ? o.tabs : [
        { label: 'Tab 1', content: '<p>Content for tab one.</p>' },
        { label: 'Tab 2', content: '<p>Content for tab two.</p>' },
        { label: 'Tab 3', content: '<p>Content for tab three.</p>' },
      ];
      const variant = o.variant ? ` vt-tabs--${o.variant}` : '';
      const uid = o.id || ('vt-tabs-' + Math.random().toString(36).slice(2, 7));

      const triggers = tabList.map((t, i) => {
        const selected = t.active || i === 0;
        return `<button class="vt-tabs__trigger" role="tab" aria-selected="${selected}" aria-controls="${uid}-panel-${i}" id="${uid}-tab-${i}" tabindex="${selected ? 0 : -1}">${t.label}</button>`;
      }).join('');

      const panels = tabList.map((t, i) => {
        const hidden = !(t.active || i === 0);
        return `<div class="vt-tabs__panel" id="${uid}-panel-${i}" role="tabpanel" aria-labelledby="${uid}-tab-${i}"${hidden ? ' hidden' : ''}>${t.content || ''}</div>`;
      }).join('');

      return `
<div class="vt-tabs${variant}">
  <div class="vt-tabs__list" role="tablist">${triggers}</div>
  ${panels}
</div>`;
    },

    /* ---- accordion ----------------------------------------------------------
       Options:
         items  {array}  [{title, content, open?}]
    */
    accordion(o = {}) {
      const items = Array.isArray(o.items) ? o.items : [
        { title: 'What is Volty?', content: 'A modern CSS theme library.' },
        { title: 'Is it free?', content: 'The core library is MIT licensed.' },
      ];
      const itemHtml = items.map(item => `
  <details class="vt-accordion__item"${item.open ? ' open' : ''}>
    <summary class="vt-accordion__trigger">${item.title}</summary>
    <div class="vt-accordion__body">${item.content}</div>
  </details>`).join('');

      return `<div class="vt-accordion">${itemHtml}\n</div>`;
    },

    /* ---- dropdown -----------------------------------------------------------
       Options:
         label   {string}  Trigger button label
         items   {array}   [{label, href?, danger?, disabled?, separator?}]
         variant {string}  Button variant for trigger
         align   {string}  'end' to right-align menu
    */
    dropdown(o = {}) {
      const label   = o.label || o.content || 'Options';
      const items   = Array.isArray(o.items) ? o.items : [
        { label: 'Edit' }, { label: 'Duplicate' }, { separator: true }, { label: 'Delete', danger: true },
      ];
      const btnCls  = ['vt-btn vt-btn--surface vt-dropdown__trigger', o.size ? `vt-btn--${o.size}` : ''].filter(Boolean).join(' ');
      const wrapCls = ['vt-dropdown', o.align === 'end' ? 'vt-dropdown--end' : ''].filter(Boolean).join(' ');

      const itemHtml = items.map(item => {
        if (item.separator) return `<div class="vt-dropdown__separator"></div>`;
        if (item.label && !item.href) {
          const danger   = item.danger    ? ' vt-dropdown__item--danger' : '';
          const disabled = item.disabled  ? ' aria-disabled="true"'      : '';
          return `<button class="vt-dropdown__item${danger}"${disabled}>${item.label}</button>`;
        }
        const danger = item.danger ? ' vt-dropdown__item--danger' : '';
        return `<a href="${item.href || '#'}" class="vt-dropdown__item${danger}">${item.label}</a>`;
      }).join('');

      const chevron = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" style="margin-inline-start:var(--vt-space-1)"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

      return `
<div class="${wrapCls}">
  <button class="${btnCls}" aria-haspopup="true" aria-expanded="false">${label}${chevron}</button>
  <div class="vt-dropdown__menu" hidden>${itemHtml}</div>
</div>`;
    },

    /* ---- skeleton -----------------------------------------------------------
       Options:
         variant  {string}  'text'|'circle'|'card'|'avatar'|'button'
         width    {string}  CSS width value
         lines    {number}  Number of text lines (for 'text' variant)
    */
    skeleton(o = {}) {
      const variant = o.variant || 'text';
      const width   = o.width || (variant === 'text' ? '60%' : undefined);
      const lines   = parseInt(o.lines || 1, 10);
      const style   = width ? ` style="width:${width}"` : '';

      if (variant === 'text' && lines > 1) {
        const lineHtml = Array.from({ length: lines }, (_, i) => {
          const w = i === lines - 1 ? '40%' : (i === 0 ? '80%' : '65%');
          return `<span class="vt-skeleton vt-skeleton--text" style="width:${w}"></span>`;
        }).join('');
        return `<div style="display:flex;flex-direction:column;gap:var(--vt-space-2)">${lineHtml}</div>`;
      }

      return `<span class="vt-skeleton vt-skeleton--${variant}"${style}></span>`;
    },

    /* ---- progress -----------------------------------------------------------
       Options:
         value    {number}  0-100
         max      {number}  Default 100
         variant  {string}  'success'|'warning'|'danger'
         size     {string}  'sm'|'lg'
         label    {string}  Label text above bar
         indeterminate {bool}
    */
    progress(o = {}) {
      const value   = o.value !== undefined ? Number(o.value) : undefined;
      const max     = o.max !== undefined ? Number(o.max) : 100;
      const variant = o.variant ? ` vt-progress--${o.variant}` : '';
      const size    = o.size    ? ` vt-progress--${o.size}`    : '';
      const indet   = (o.indeterminate === true || o.indeterminate === 'true') ? ' vt-progress--indeterminate' : '';
      const cls     = `vt-progress${variant}${size}${indet}`;
      const pct     = value !== undefined ? Math.round((value / max) * 100) : null;

      const label = o.label
        ? `<div class="vt-progress-wrap">
             <span class="vt-progress-wrap__label">${o.label}</span>
             ${pct !== null ? `<span class="vt-progress-wrap__value">${pct}%</span>` : ''}
           </div>`
        : '';

      const valueAttr = value !== undefined ? ` value="${value}"` : '';
      return `${label}<progress class="${cls}"${valueAttr} max="${max}" aria-label="${o.label || 'Progress'}"></progress>`;
    },

    /* ---- spinner ------------------------------------------------------------
       Options:
         variant  {string}  'success'|'warning'|'danger'
         size     {string}  'xs'|'sm'|'lg'|'xl'
         label    {string}  Accessible label (default: 'Loading')
    */
    spinner(o = {}) {
      const variant = o.variant ? ` vt-spinner--${o.variant}` : '';
      const size    = o.size    ? ` vt-spinner--${o.size}`    : '';
      const label   = o.label || 'Loading';
      return `<span class="vt-spinner${variant}${size}" role="status" aria-label="${label}"></span>`;
    },

  };

  /* ==========================================================================
     THEME SYNC HELPER
     Attached to window so onclick handlers in rendered HTML can call it.
     ========================================================================== */

  window._vtSyncTheme = function (pressedBtn) {
    const toggle = pressedBtn.closest('.vt-nav__theme-toggle');
    if (!toggle) return;
    toggle.querySelectorAll('.vt-nav__theme-btn').forEach(b => b.classList.remove('is-active'));
    pressedBtn.classList.add('is-active');
  };

  /* ==========================================================================
     CORE INSERT FUNCTION
     ========================================================================== */

  /**
   * Render a named component into a target element.
   *
   * @param {string}      name    Component name: 'nav' | 'sidebar' | 'footer' |
   *                              'card' | 'alert' | 'badge' | 'button' |
   *                              'modal' | 'toast-trigger'
   * @param {Element}     target  The element to render into (innerHTML replaced)
   * @param {object}      opts    Options — same keys accepted by each template
   * @returns {Element}           The target element
   */
  function insert(name, target, opts = {}) {
    if (!TEMPLATES[name]) throw new Error(`Volty.insert: unknown component "${name}". Available: ${Object.keys(TEMPLATES).join(', ')}`);
    target.innerHTML = TEMPLATES[name](opts);
    // Wire backdrop-close on any newly inserted modals
    target.querySelectorAll('.vt-modal').forEach(m => {
      if (!m._vtBackdrop) {
        m._vtBackdrop = true;
        m.addEventListener('click', e => { if (e.target === m) m.close(); });
      }
    });
    // Sync active theme button state
    const themeNow = (window.Volty && Volty.getTheme) ? Volty.getTheme() : 'system';
    target.querySelectorAll(`.vt-nav__theme-btn[data-vt-theme="${themeNow}"]`).forEach(b => b.classList.add('is-active'));
    return target;
  }

  /* ==========================================================================
     data-vt-insert PROCESSOR
     Scans the DOM for [data-vt-insert] and replaces each element.
     ========================================================================== */

  function processInserts(root) {
    root = root || document;
    root.querySelectorAll('[data-vt-insert]').forEach(el => {
      const name = el.dataset.vtInsert;
      if (!TEMPLATES[name]) {
        console.warn(`Volty: unknown insert "${name}"`);
        return;
      }
      const opts = optsFromEl(el);
      replaceWith(el, TEMPLATES[name](opts));
    });
  }

  /* ==========================================================================
     CUSTOM ELEMENTS
     <vt-nav>, <vt-sidebar>, <vt-footer>, <vt-card>, <vt-alert>,
     <vt-badge>, <vt-button>, <vt-modal>, <vt-toast-trigger>
     ========================================================================== */

  function defineVtElement(tagName, templateKey) {
    if (customElements.get(tagName)) return; // already registered
    customElements.define(tagName, class extends HTMLElement {
      connectedCallback() {
        const opts = optsFromEl(this);
        const frag = toFragment(TEMPLATES[templateKey](opts));
        // Wire modals before replacing
        frag.querySelectorAll && frag.querySelectorAll('.vt-modal').forEach(m => {
          m.addEventListener('click', e => { if (e.target === m) m.close(); });
        });
        this.replaceWith(frag);
      }
    });
  }

  const ELEMENT_MAP = {
    'vt-nav':           'nav',
    'vt-sidebar':       'sidebar',
    'vt-footer':        'footer',
    'vt-card':          'card',
    'vt-alert':         'alert',
    'vt-badge':         'badge',
    'vt-button':        'button',
    'vt-modal':         'modal',
    'vt-toast-trigger': 'toast-trigger',
    'vt-tabs':          'tabs',
    'vt-accordion':     'accordion',
    'vt-dropdown':      'dropdown',
    'vt-skeleton':      'skeleton',
    'vt-progress':      'progress',
    'vt-spinner':       'spinner',
  };

  Object.entries(ELEMENT_MAP).forEach(([tag, key]) => defineVtElement(tag, key));

  /* ==========================================================================
     AUTO-INIT
     ========================================================================== */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => processInserts());
  } else {
    processInserts();
  }

  /* ==========================================================================
     PUBLIC API  —  extends window.Volty
     ========================================================================== */

  window.Volty = window.Volty || {};
  Object.assign(window.Volty, {
    /**
     * Render a component into a target element.
     * Volty.insert('nav', document.querySelector('header'), { logo: 'My App' })
     */
    insert,

    /**
     * Re-scan a subtree for data-vt-insert attributes and process them.
     * Useful after dynamic content is added to the page.
     * Volty.processInserts(document.getElementById('dynamic-area'))
     */
    processInserts,

    /**
     * Access the raw template functions to generate HTML strings.
     * const html = Volty.templates.card({ title: 'Hello', content: 'World' })
     */
    templates: TEMPLATES,
  });

})();
