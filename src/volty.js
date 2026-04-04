/**
 * Volty — theme utility
 * Handles: system preference detection, manual override, persistence, transitions
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'volty-theme';
  const BRAND_KEY = 'volty-brand';

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
      // Use view transitions if available
      if (document.startViewTransition) {
        document.startViewTransition(() => applyTheme(theme, el));
      } else {
        el.style.transition = `background-color 200ms ease, color 200ms ease`;
        applyTheme(theme, el);
        setTimeout(() => el.style.transition = '', 250);
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

  function init() {
    const saved = getTheme();
    const savedBrand = getBrand();
    applyTheme(saved);
    if (savedBrand) applyBrand(savedBrand);

    // Watch system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (getTheme() === 'system') applyTheme('system');
    });
  }

  // Auto-init
  init();

  // Public API
  window.Volty = { setTheme, setBrand, getTheme, getBrand, getSystemTheme };
})();
