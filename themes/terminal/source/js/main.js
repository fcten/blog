// Hexo Theme: terminal — 浅色/暗色模式切换
(function () {
  var STORAGE_KEY = 'terminal-theme';

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
    updateButton(theme);
  }

  function updateButton(theme) {
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '[light]' : '[dark]';
  }

  document.addEventListener('DOMContentLoaded', function () {
    updateButton(currentTheme());
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
      });
    }
  });

  // 未手动选择过时跟随系统
  try {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? 'light' : 'dark');
      }
    });
  } catch (e) {}
})();
