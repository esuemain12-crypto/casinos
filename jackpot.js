/**
 * Zone 51 — Live Jackpot Counter
 * Injects a thin ticker bar between the topbar and page content.
 * Persists across pages via sessionStorage.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  // Base + random offset so each user session sees a different starting point
  var _BASE = 1247381.52;
  var _val;
  try {
    var _stored = parseFloat(sessionStorage.getItem('z51_jp'));
    _val = (_stored > _BASE) ? _stored : _BASE + Math.random() * 1200000;
  } catch (e) {
    _val = _BASE + Math.random() * 1200000;
  }

  function _fmt(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  var CSS = [
    '#z51-jp-bar{',
      'background:linear-gradient(90deg,rgba(18,6,4,0.99) 0%,rgba(10,3,2,0.99) 50%,rgba(18,6,4,0.99) 100%);',
      'border-bottom:1px solid rgba(255,196,0,0.14);',
      'height:28px;',
      'display:flex;align-items:center;justify-content:center;gap:10px;',
      'position:sticky;top:60px;z-index:199;overflow:hidden;',
    '}',
    /* subtle shimmer */
    '#z51-jp-bar::before{',
      'content:"";position:absolute;inset:0;',
      'background:linear-gradient(90deg,transparent 0%,rgba(255,196,0,0.04) 50%,transparent 100%);',
      'animation:jp-shimmer 4s ease-in-out infinite;pointer-events:none;',
    '}',
    '@keyframes jp-shimmer{0%,100%{opacity:0}50%{opacity:1}}',
    '.jp-icon{font-size:0.88rem;}',
    '.jp-label{',
      'font-family:Orbitron,monospace;font-size:0.46rem;',
      'letter-spacing:4.5px;text-transform:uppercase;',
      'color:rgba(255,196,0,0.45);font-weight:700;',
    '}',
    '.jp-sep{height:12px;width:1px;background:rgba(255,196,0,0.18);}',
    '#z51-jp-amt{',
      'font-family:Orbitron,monospace;font-size:0.76rem;font-weight:700;',
      'color:#ffe600;letter-spacing:2px;',
      'text-shadow:0 0 14px rgba(255,220,0,0.6),0 0 28px rgba(255,180,0,0.25);',
      'min-width:170px;text-align:center;',
    '}',
    '.jp-live{',
      'font-family:Orbitron,monospace;font-size:0.42rem;',
      'letter-spacing:3px;text-transform:uppercase;',
      'color:rgba(0,240,119,0.7);',
      'display:flex;align-items:center;gap:5px;',
    '}',
    '.jp-live-dot{',
      'width:5px;height:5px;border-radius:50%;',
      'background:#00f077;box-shadow:0 0 5px rgba(0,240,119,0.9);',
      'animation:jp-pulse 1.6s ease-in-out infinite;',
    '}',
    '@keyframes jp-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.65)}}',
    '@media(max-width:600px){',
      '#z51-jp-bar{height:24px;gap:7px;}',
      '.jp-label{display:none;}',
      '#z51-jp-amt{font-size:0.68rem;min-width:140px;}',
    '}'
  ].join('');

  var _amtEl = null;

  function _inject() {
    var topbar = document.querySelector('.topbar');
    if (!topbar || document.getElementById('z51-jp-bar')) return;

    var bar = document.createElement('div');
    bar.id = 'z51-jp-bar';
    bar.innerHTML =
      '<span class="jp-icon">🏆</span>' +
      '<span class="jp-label">Mega Jackpot</span>' +
      '<span class="jp-sep"></span>' +
      '<span id="z51-jp-amt">' + _fmt(_val) + '</span>' +
      '<span class="jp-sep"></span>' +
      '<span class="jp-live"><span class="jp-live-dot"></span>Live</span>';

    topbar.insertAdjacentElement('afterend', bar);
    _amtEl = document.getElementById('z51-jp-amt');
  }

  function _tick() {
    _val += Math.random() * 0.42 + 0.03;
    if (_amtEl) _amtEl.textContent = _fmt(_val);
    try { sessionStorage.setItem('z51_jp', _val); } catch (e) {}
    setTimeout(_tick, 90 + Math.random() * 180);
  }

  // Inject CSS
  var s = document.createElement('style');
  s.textContent = CSS;
  (document.head || document.documentElement).appendChild(s);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { _inject(); _tick(); });
  } else {
    setTimeout(function () { _inject(); _tick(); }, 0);
  }
})();
