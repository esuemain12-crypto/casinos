/**
 * Zone 51 — Toast Notification System
 * Usage: Z51Toast.show(msg, type, duration)
 * Types: success | error | info | warning | win | bonus
 */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  var CSS = [
    '#z51-toast-wrap{',
      'position:fixed;top:96px;right:20px;z-index:2147483640;',
      'display:flex;flex-direction:column;gap:10px;',
      'pointer-events:none;max-width:340px;width:calc(100vw - 40px);',
    '}',
    '.z51-toast{',
      'pointer-events:all;',
      'padding:13px 16px 13px 14px;',
      'background:rgba(8,2,14,0.96);',
      'border:1px solid rgba(255,34,68,0.35);border-left:3px solid #ff2244;',
      'border-radius:4px;',
      'box-shadow:0 8px 32px rgba(0,0,0,0.65),0 0 18px rgba(255,34,68,0.08);',
      'display:flex;align-items:flex-start;gap:12px;',
      'opacity:0;transform:translateX(28px);',
      'transition:opacity 0.22s,transform 0.22s;',
      'backdrop-filter:blur(14px);',
    '}',
    '.z51-toast.in{opacity:1;transform:translateX(0);}',
    '.z51-toast.out{opacity:0;transform:translateX(28px);}',
    '.z51-toast.success{border-color:rgba(0,240,119,0.4);border-left-color:#00f077;box-shadow:0 8px 32px rgba(0,0,0,0.65),0 0 18px rgba(0,240,119,0.07);}',
    '.z51-toast.error{border-color:rgba(255,34,68,0.45);border-left-color:#ff2244;}',
    '.z51-toast.info{border-color:rgba(255,196,0,0.35);border-left-color:#ffcb00;box-shadow:0 8px 32px rgba(0,0,0,0.65),0 0 18px rgba(255,196,0,0.07);}',
    '.z51-toast.warning{border-color:rgba(255,150,0,0.4);border-left-color:#ff9600;}',
    '.z51-toast.win{border-color:rgba(255,220,0,0.5);border-left-color:#ffe600;box-shadow:0 8px 32px rgba(0,0,0,0.65),0 0 28px rgba(255,220,0,0.18);}',
    '.z51-toast.bonus{border-color:rgba(180,80,255,0.4);border-left-color:#b450ff;}',
    '.z51-toast-icon{font-size:1.1rem;flex-shrink:0;margin-top:1px;}',
    '.z51-toast-body{flex:1;min-width:0;}',
    '.z51-toast-title{font-family:Orbitron,monospace;font-size:0.58rem;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#fff;margin-bottom:4px;}',
    '.z51-toast-msg{font-size:0.75rem;color:rgba(200,185,220,0.82);line-height:1.5;}',
    '.z51-toast-close{background:none;border:none;color:rgba(255,255,255,0.22);font-size:0.95rem;cursor:pointer;padding:0;flex-shrink:0;margin-top:-2px;transition:color 0.15s;line-height:1;}',
    '.z51-toast-close:hover{color:rgba(255,255,255,0.7);}',
    '@media(max-width:480px){#z51-toast-wrap{top:76px;right:12px;width:calc(100vw - 24px);}}'
  ].join('');

  var ICONS  = { success:'✅', error:'❌', info:'💡', warning:'⚠️', win:'💰', bonus:'🎁' };
  var TITLES = { success:'Success', error:'Error', info:'Notice', warning:'Warning', win:'Big Win!', bonus:'Bonus' };

  var _wrap = null;

  function _getWrap() {
    if (_wrap && _wrap.isConnected) return _wrap;
    _wrap = document.getElementById('z51-toast-wrap');
    if (!_wrap) {
      _wrap = document.createElement('div');
      _wrap.id = 'z51-toast-wrap';
      document.body.appendChild(_wrap);
    }
    return _wrap;
  }

  function show(msg, type, duration) {
    type     = type || 'info';
    duration = duration != null ? duration : 3500;

    var wrap = _getWrap();
    var el   = document.createElement('div');
    el.className = 'z51-toast ' + type;
    el.innerHTML =
      '<span class="z51-toast-icon">' + (ICONS[type] || 'ℹ️') + '</span>' +
      '<div class="z51-toast-body">' +
        '<div class="z51-toast-title">' + (TITLES[type] || type) + '</div>' +
        '<div class="z51-toast-msg">'   + msg + '</div>' +
      '</div>' +
      '<button class="z51-toast-close" onclick="this.closest(\'.z51-toast\').remove()">✕</button>';
    wrap.appendChild(el);
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('in'); }); });
    setTimeout(function () {
      el.classList.remove('in');
      el.classList.add('out');
      setTimeout(function () { el.remove(); }, 320);
    }, duration);
  }

  // Inject CSS
  var s = document.createElement('style');
  s.textContent = CSS;
  (document.head || document.documentElement).appendChild(s);

  // Init wrap early
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _getWrap);
  } else {
    setTimeout(_getWrap, 0);
  }

  window.Z51Toast = {
    show:    show,
    success: function (m, d) { show(m, 'success', d); },
    error:   function (m, d) { show(m, 'error',   d); },
    info:    function (m, d) { show(m, 'info',     d); },
    warning: function (m, d) { show(m, 'warning',  d); },
    win:     function (m, d) { show(m, 'win',    d != null ? d : 5000); },
    bonus:   function (m, d) { show(m, 'bonus',    d); }
  };
})();
