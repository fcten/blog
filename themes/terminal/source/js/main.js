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

    // 联系邮箱仅在用户主动点击后解码，避免在静态 HTML 中暴露明文地址
    var emailButton = document.querySelector('[data-contact-email]');
    if (emailButton) {
      emailButton.addEventListener('click', function () {
        var key = 73;
        var encoded = [47, 42, 61, 44, 39, 9, 37, 32, 63, 44, 103, 42, 38, 36];
        var address = encoded.map(function (value) {
          return String.fromCharCode(value ^ key);
        }).join('');
        var link = document.createElement('a');
        link.href = 'mai' + 'lto:' + address;
        link.textContent = address;
        link.setAttribute('aria-label', '发送邮件至 ' + address);
        emailButton.replaceWith(link);
      }, { once: true });
    }
  });

  // 正文图片点击预览（lightbox：缩放 / 拖动 / 前后切换 / 开关动画）
  // 相册等模块可复用：window.TerminalLightbox.open(images, index)
  // images 为 <img> 元素数组或 [{ src, alt, thumb }]（thumb 用于开关动画的起点/终点）
  document.addEventListener('DOMContentLoaded', function () {
    var ANIM_MS = 250;

    var ICONS = {
      'zoom-out': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
      'zoom-in': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
      'zoom-fit': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
      'zoom-actual': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
      'close': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      'prev': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
      'next': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'
    };
    var TITLES = {
      'zoom-out': '缩小', 'zoom-in': '放大', 'zoom-fit': '适应窗口',
      'zoom-actual': '实际大小', 'close': '关闭 (Esc)', 'prev': '上一张 (←)', 'next': '下一张 (→)'
    };

    function toolbarBtn(action) {
      return '<button type="button" data-action="' + action + '" title="' + TITLES[action] +
        '" aria-label="' + TITLES[action] + '">' + ICONS[action] + '</button>';
    }

    var overlay = document.createElement('div');
    overlay.className = 'img-lightbox';
    overlay.innerHTML =
      '<img alt="">' +
      '<button type="button" class="img-lightbox-nav img-lightbox-prev" title="' + TITLES.prev +
        '" aria-label="' + TITLES.prev + '">' + ICONS.prev + '</button>' +
      '<button type="button" class="img-lightbox-nav img-lightbox-next" title="' + TITLES.next +
        '" aria-label="' + TITLES.next + '">' + ICONS.next + '</button>' +
      '<span class="img-lightbox-counter"></span>' +
      '<div class="img-lightbox-toolbar">' +
        toolbarBtn('zoom-out') +
        '<span class="img-lightbox-scale">100%</span>' +
        toolbarBtn('zoom-in') +
        toolbarBtn('zoom-fit') +
        toolbarBtn('zoom-actual') +
        toolbarBtn('close') +
      '</div>';
    document.body.appendChild(overlay);

    var overlayImg = overlay.querySelector('img');
    var scaleLabel = overlay.querySelector('.img-lightbox-scale');
    var counterLabel = overlay.querySelector('.img-lightbox-counter');

    var items = [], index = 0;
    var scale = 1, tx = 0, ty = 0, actualRatio = 1;
    var MIN_SCALE = 0.1, MAX_SCALE = 20, ZOOM_STEP = 1.25;
    var animTimer = null;

    // 百分比以实际像素为基准：1:1 显示为 100%，适应窗口则按比例折算
    function updateActualRatio() {
      var fitWidth = overlayImg.clientWidth; // 不含 transform 的布局宽度
      if (overlayImg.naturalWidth && fitWidth) actualRatio = overlayImg.naturalWidth / fitWidth;
    }

    function apply() {
      scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
      overlayImg.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + scale + ')';
      scaleLabel.textContent = Math.round(scale / actualRatio * 100) + '%';
    }

    function center(r) { return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

    function show(i) {
      index = (i + items.length) % items.length;
      var item = items[index];
      overlayImg.src = item.src;
      overlayImg.alt = item.alt || '';
      scale = 1; tx = 0; ty = 0;
      counterLabel.textContent = (index + 1) + ' / ' + items.length;
      updateActualRatio();
      apply();
    }

    // FLIP：从缩略图位置放大到适应窗口
    function animateOpen() {
      var thumb = items[index] && items[index].thumb;
      if (!thumb || !document.contains(thumb)) return;
      var finalRect = overlayImg.getBoundingClientRect();
      var thumbRect = thumb.getBoundingClientRect();
      if (!finalRect.width || !thumbRect.width) return;
      var cf = center(finalRect), ct = center(thumbRect);
      overlayImg.style.transform = 'translate(' + (ct.x - cf.x) + 'px, ' + (ct.y - cf.y) + 'px)' +
        ' scale(' + thumbRect.width / finalRect.width + ')';
      void overlayImg.offsetWidth; // 强制 reflow，让上面的初始状态先生效
      overlayImg.classList.add('is-animating');
      apply();
      clearTimeout(animTimer);
      animTimer = setTimeout(function () { overlayImg.classList.remove('is-animating'); }, ANIM_MS + 50);
    }

    // FLIP：从当前状态缩小回缩略图位置，同时遮罩渐出
    function animateClose() {
      var thumb = items[index] && items[index].thumb;
      if (thumb && document.contains(thumb) && scale > 0) {
        var rect = overlayImg.getBoundingClientRect();
        var layoutCenter = { x: rect.left + rect.width / 2 - tx, y: rect.top + rect.height / 2 - ty };
        var layoutWidth = rect.width / scale;
        var thumbRect = thumb.getBoundingClientRect();
        if (layoutWidth && thumbRect.width) {
          var ct = center(thumbRect);
          overlayImg.classList.add('is-animating');
          overlayImg.style.transform = 'translate(' + (ct.x - layoutCenter.x) + 'px, ' +
            (ct.y - layoutCenter.y) + 'px) scale(' + thumbRect.width / layoutWidth + ')';
        }
      }
      clearTimeout(animTimer);
      animTimer = setTimeout(function () {
        overlayImg.classList.remove('is-animating');
        document.body.style.overflow = '';
      }, ANIM_MS + 50);
    }

    function open(images, i) {
      items = Array.prototype.map.call(images, function (it) {
        if (it && it.tagName === 'IMG') return { src: it.currentSrc || it.src, alt: it.alt, thumb: it };
        return { src: it.src, alt: it.alt || '', thumb: it.thumb || null };
      });
      if (!items.length) return;
      clearTimeout(animTimer);
      overlay.classList.add('is-open');
      overlay.classList.toggle('has-multiple', items.length > 1);
      document.body.style.overflow = 'hidden';
      show(i || 0);
      animateOpen();
    }

    function close() {
      if (!overlay.classList.contains('is-open')) return;
      overlay.classList.remove('is-open');
      animateClose();
    }

    // 工具栏
    overlay.querySelector('.img-lightbox-toolbar').addEventListener('click', function (e) {
      var action = e.target.closest('button');
      if (!action) return;
      switch (action.getAttribute('data-action')) {
        case 'zoom-in': scale *= ZOOM_STEP; break;
        case 'zoom-out': scale /= ZOOM_STEP; break;
        case 'zoom-fit': scale = 1; tx = 0; ty = 0; break;
        case 'zoom-actual': scale = actualRatio; break;
        case 'close': close(); return;
      }
      apply();
    });

    // 前后切换
    overlay.querySelector('.img-lightbox-prev').addEventListener('click', function () { show(index - 1); });
    overlay.querySelector('.img-lightbox-next').addEventListener('click', function () { show(index + 1); });

    // 图片加载完成 / 窗口尺寸变化后重新计算 1:1 比例
    overlayImg.addEventListener('load', function () {
      updateActualRatio();
      apply();
    });
    window.addEventListener('resize', function () {
      if (!overlay.classList.contains('is-open')) return;
      updateActualRatio();
      apply();
    });

    // 滚轮缩放
    overlay.addEventListener('wheel', function (e) {
      e.preventDefault();
      scale *= e.deltaY < 0 ? 1.1 : 1 / 1.1;
      apply();
    }, { passive: false });

    // 拖动
    var dragging = false, moved = false, startX = 0, startY = 0, startTx = 0, startTy = 0;
    overlayImg.addEventListener('pointerdown', function (e) {
      dragging = true; moved = false;
      startX = e.clientX; startY = e.clientY;
      startTx = tx; startTy = ty;
      overlayImg.setPointerCapture(e.pointerId);
      overlayImg.classList.add('is-dragging');
    });
    overlayImg.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      tx = startTx + dx; ty = startTy + dy;
      apply();
    });
    overlayImg.addEventListener('pointerup', function () {
      dragging = false;
      overlayImg.classList.remove('is-dragging');
    });

    // 点击遮罩空白处关闭（拖动后不触发）
    overlay.addEventListener('pointerdown', function (e) {
      if (e.target === overlay) moved = false;
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay && !moved) close();
    });
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft' && items.length > 1) show(index - 1);
      else if (e.key === 'ArrowRight' && items.length > 1) show(index + 1);
    });

    // 供相册等模块复用
    window.TerminalLightbox = { open: open };

    // 正文图片接入
    var content = document.querySelector('.article-content');
    if (content) {
      content.addEventListener('click', function (e) {
        var img = e.target.closest('img');
        if (!img || !content.contains(img)) return;
        e.preventDefault();
        var imgs = Array.prototype.slice.call(content.querySelectorAll('img'));
        open(imgs, imgs.indexOf(img));
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
