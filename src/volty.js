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
