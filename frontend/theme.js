(function () {
  const STORAGE_KEY = 'community-cleaning-theme';
  let isToggleBound = false;

  function getInitialTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.textContent = theme === 'dark' ? 'Switch to Light' : 'Switch to Dark';
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  function bindThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle || isToggleBound) {
      return;
    }

    isToggleBound = true;
    toggle.addEventListener('click', function () {
      const current = document.body.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
    });
  }

  function initTheme() {
    if (!document.body) {
      return;
    }

    const theme = getInitialTheme();
    applyTheme(theme);
    bindThemeToggle();
    document.addEventListener('navbar:rendered', function () {
      isToggleBound = false;
      applyTheme(document.body.getAttribute('data-theme') || getInitialTheme());
      bindThemeToggle();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();
