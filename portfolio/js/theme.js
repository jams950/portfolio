/* ==========================================================================
   DARK AND LIGHT MODE
   The first choice comes from the small script in <head>, which prevents flicker.
   This file handles the toggle, saving the choice and following the system.
   ========================================================================== */

(function () {
  var STORAGE_KEY = 'portfolio-theme';
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function save(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (error) { /* private window: theme just won't persist */ }
  }

  function hasSavedTheme() {
    try { return !!localStorage.getItem(STORAGE_KEY); } catch (error) { return false; }
  }

  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function updateLabel() {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    toggle.setAttribute('aria-label', 'Switch to ' + next + ' mode');
    toggle.title = 'Switch to ' + next + ' mode';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    updateLabel();
  }

  // A circle grows from the toggle. Browsers without this feature just switch instantly.
  function switchWithWipe(theme) {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduced) {
      applyTheme(theme);
      return;
    }

    var box = toggle.getBoundingClientRect();
    var x = box.left + box.width / 2;
    var y = box.top + box.height / 2;
    var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    var transition = document.startViewTransition(function () { applyTheme(theme); });
    transition.ready.then(function () {
      root.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 650, easing: 'cubic-bezier(.22,.8,.24,1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(function () {});
  }

  toggle.addEventListener('click', function () {
    var theme = currentTheme() === 'dark' ? 'light' : 'dark';
    save(theme);
    switchWithWipe(theme);
  });

  // Follow the system setting until the visitor makes their own choice.
  systemDark.addEventListener('change', function (event) {
    if (!hasSavedTheme()) applyTheme(event.matches ? 'dark' : 'light');
  });

  updateLabel();
})();
