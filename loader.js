/**
 * Zone 51 — Page Transition Loader
 * Intercepts same-origin link clicks, shows casino loading overlay.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  var CSS = [
    '#z51-loader{',
      'position:fixed;inset:0;z-index:2147483648;',
      'background:rgba(3,0,5,1);',
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;',
      'opacity:0;pointer-events:none;',
      'transition:opacity 0.18s;',
    '}',
    '#z51-loader.show{opacity:1;pointer-events:all;}',
    '.z51-ld-logo{',
      'width:52px;height:52px;',
      'border:1.5px solid rgba(255,34,68,0.55);',
      'background:rgba(255,20,40,0.05);',
      'display:flex;align-items:center;justify-content:center;',
      'position:relative;',
    '}',
    '.z51-ld-logo::before{',
      'content:"";position:absolute;inset:4px;',
      'border:1px solid rgba(255,40,60,0.3);pointer-events:none;',
    '}',
    '.z51-ld-logo-txt{',
      'font-family:Orbitron,monospace;font-size:0.85rem;font-weight:900;',
      'color:#ffe600;letter-spacing:1px;',
      'text-shadow:0 0 16px rgba(255,80,30,0.9);',
      'position:relative;z-index:1;',
    '}',
    '.z51-ld-track{',
      'width:110px;height:2px;',
      'background:rgba(255,34,68,0.12);border-radius:2px;overflow:hidden;',
    '}',
    '.z51-ld-fill{',
      'height:100%;width:0%;border-radius:2px;',
      'background:linear-gradient(90deg,#ff2244 0%,#ffe600 100%);',
      'transition:width 0.3s linear;',
    '}',
    '.z51-ld-lbl{',
      'font-family:Orbitron,monospace;font-size:0.44rem;',
      'letter-spacing:5px;text-transform:uppercase;',
      'color:rgba(200,150,170,0.38);',
    '}'
  ].join('');

  var _el   = null;
  var _fill = null;

  function _create() {
    if (_el) return;
    _el = document.createElement('div');
    _el.id = 'z51-loader';
    _el.innerHTML =
      '<div class="z51-ld-logo"><span class="z51-ld-logo-txt">51</span></div>' +
      '<div class="z51-ld-track"><div class="z51-ld-fill" id="z51-ld-fill"></div></div>' +
      '<div class="z51-ld-lbl">Loading</div>';
    document.body.appendChild(_el);
    _fill = document.getElementById('z51-ld-fill');
  }

  function show() {
    if (!_el) _create();
    _el.classList.add('show');
    if (_fill) { _fill.style.transition = 'none'; _fill.style.width = '0%'; }
    requestAnimationFrame(function () {
      if (_fill) { _fill.style.transition = 'width 0.32s linear'; _fill.style.width = '82%'; }
    });
  }

  function hide() {
    if (!_el) return;
    if (_fill) { _fill.style.transition = 'width 0.15s linear'; _fill.style.width = '100%'; }
    setTimeout(function () { _el.classList.remove('show'); }, 180);
  }

  // Intercept link clicks
  function _intercept() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href || href[0] === '#' || /^(javascript|mailto|tel):/i.test(href)) return;
      if (link.target === '_blank') return;
      var url;
      try { url = new URL(href, location.href); } catch (x) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && !url.search) return;
      e.preventDefault();
      show();
      setTimeout(function () { location.href = href; }, 340);
    });
  }

  // Inject CSS
  var s = document.createElement('style');
  s.textContent = CSS;
  (document.head || document.documentElement).appendChild(s);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { _create(); _intercept(); });
  } else {
    setTimeout(function () { _create(); _intercept(); }, 0);
  }

  // Hide on back/forward cache restore
  window.addEventListener('pageshow', function (e) { if (e.persisted) hide(); });

  window.Z51Loader = { show: show, hide: hide };
})();
