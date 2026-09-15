(function () {
  'use strict';

  // Skip inside iframes
  if (window.top !== window.self) return;

  // Skip on localhost / dev
  var _host = location.hostname;
  if (_host === 'localhost' || _host === '127.0.0.1' || _host === '') return;

  // ── 1. Disable right-click ──
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); return false; });

  // ── 2. Disable keyboard shortcuts ──
  document.addEventListener('keydown', function (e) {
    if (e.keyCode === 123) { e.preventDefault(); return false; }                          // F12
    if (e.ctrlKey && e.keyCode === 85) { e.preventDefault(); return false; }             // Ctrl+U
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) { e.preventDefault(); return false; } // Ctrl+Shift+I/J
    if (e.ctrlKey && e.shiftKey && e.keyCode === 67) { e.preventDefault(); return false; } // Ctrl+Shift+C
    if (e.ctrlKey && e.keyCode === 83) { e.preventDefault(); return false; }             // Ctrl+S
    if (e.ctrlKey && e.keyCode === 65) { e.preventDefault(); return false; }             // Ctrl+A
  });

  // ── 3. Disable text selection / drag ──
  document.addEventListener('selectstart', function (e) { e.preventDefault(); });
  document.addEventListener('dragstart',   function (e) { e.preventDefault(); });

  // ── 4. Protect images ──
  function _protectImg(img) {
    img.setAttribute('draggable', 'false');
    img.style.userSelect    = 'none';
    img.style.webkitUserDrag = 'none';
  }
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('img').forEach(_protectImg);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType === 1) {
            if (n.tagName === 'IMG') _protectImg(n);
            (n.querySelectorAll ? n.querySelectorAll('img') : []).forEach(_protectImg);
          }
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  });

  // ── 5. Disable copy / cut ──
  document.addEventListener('copy', function (e) { e.preventDefault(); });
  document.addEventListener('cut',  function (e) { e.preventDefault(); });

  // ── 6. Block iframe embedding ──
  if (window.self !== window.top) {
    try { window.top.location.href = window.self.location.href; } catch (e) {}
  }

  // ── 7. Poison console — silence ALL output ──
  var _noop = function () {};
  var _consoleMethods = [
    'log','warn','error','info','debug','table','trace','dir','dirxml',
    'group','groupCollapsed','groupEnd','time','timeEnd','timeLog',
    'count','countReset','assert','clear','profile','profileEnd','exception'
  ];
  _consoleMethods.forEach(function (m) {
    try { Object.defineProperty(console, m, { get: function () { return _noop; }, configurable: true }); } catch (e) {}
    try { console[m] = _noop; } catch (e) {}
  });
  // Redefine the whole console object
  try {
    Object.defineProperty(window, 'console', {
      get: function () {
        return { log:_noop,warn:_noop,error:_noop,info:_noop,debug:_noop,table:_noop,
                 trace:_noop,dir:_noop,group:_noop,groupEnd:_noop,time:_noop,
                 timeEnd:_noop,count:_noop,assert:_noop,clear:_noop };
      },
      configurable: true
    });
  } catch (e) {}

  // ── 8. DevTools size detection → ACCESS DENIED overlay ──
  var _dtOpen = false;
  var _dtEl   = null;
  var _DT_THRESHOLD = 200;

  function _buildOverlay() {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed;inset:0;z-index:2147483647;',
      'background:rgba(4,0,7,0.99);',
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;'
    ].join('');
    el.innerHTML = [
      '<div style="font-family:Orbitron,monospace;color:rgba(255,34,68,0.55);font-size:0.6rem;letter-spacing:6px;text-transform:uppercase;margin-bottom:22px;">ZONE 51</div>',
      '<div style="font-size:3rem;margin-bottom:22px;">⛔</div>',
      '<div style="font-family:Orbitron,monospace;color:#ff2244;font-size:1.05rem;font-weight:700;letter-spacing:5px;text-transform:uppercase;margin-bottom:14px;">ACCESS DENIED</div>',
      '<div style="color:rgba(200,160,160,0.4);font-size:0.7rem;letter-spacing:2.5px;font-family:Inter,sans-serif;">Close developer tools to continue</div>'
    ].join('');
    return el;
  }

  function _showDT() {
    if (_dtEl) return;
    _dtEl = _buildOverlay();
    if (document.body) {
      document.body.appendChild(_dtEl);
    } else {
      document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(_dtEl); });
    }
  }

  function _hideDT() {
    if (_dtEl) { _dtEl.remove(); _dtEl = null; }
  }

  setInterval(function () {
    var open = (window.outerWidth  - window.innerWidth  > _DT_THRESHOLD) ||
               (window.outerHeight - window.innerHeight > _DT_THRESHOLD);
    if (open  && !_dtOpen) { _dtOpen = true;  _showDT(); }
    if (!open &&  _dtOpen) { _dtOpen = false; _hideDT(); }
  }, 800);

})();
