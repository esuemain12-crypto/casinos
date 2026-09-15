/**
 * Zone 51 — Casino Sound Effects
 * Web Audio API — no external files needed.
 * window.Z51Sound: { coin, win, click, chip, mute, unmute }
 * Mute toggle button injected bottom-right.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  var _ctx    = null;
  var _muted  = false;
  var _btn    = null;

  try { _muted = localStorage.getItem('z51_sfx_muted') === '1'; } catch (e) {}

  function _getCtx() {
    if (!_ctx) {
      try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    if (_ctx.state === 'suspended') { try { _ctx.resume(); } catch (e) {} }
    return _ctx;
  }

  function _tone(freq, type, startOffset, duration, vol) {
    var ctx = _getCtx();
    if (!ctx || _muted) return;
    var osc  = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    var t0 = ctx.currentTime + (startOffset || 0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol || 0.25, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  /* ── Sounds ── */
  function coin() {
    _tone(1200, 'sine',     0,    0.08, 0.18);
    _tone(900,  'sine',     0.06, 0.06, 0.14);
    _tone(660,  'sine',     0.11, 0.05, 0.10);
  }

  function win() {
    [523, 659, 784, 1047].forEach(function (f, i) { _tone(f, 'sine', i * 0.11, 0.22, 0.17); });
  }

  function click_snd() {
    _tone(900, 'square', 0, 0.038, 0.045);
  }

  function chip() {
    _tone(440, 'triangle', 0,    0.10, 0.12);
    _tone(560, 'triangle', 0.04, 0.07, 0.08);
  }

  /* ── Mute button — placed inside .topbar-right ── */
  function _createBtn() {
    _btn = document.createElement('button');
    _btn.id = 'z51-sfx-btn';
    _btn.title = 'Toggle Sound';
    _btn.textContent = _muted ? '🔇' : '🔊';
    _btn.style.cssText = [
      'background:transparent;',
      'border:1px solid rgba(255,30,55,0.3);',
      'color:rgba(200,180,220,0.65);font-size:1rem;',
      'width:36px;height:36px;',
      'display:inline-flex;align-items:center;justify-content:center;',
      'cursor:pointer;flex-shrink:0;',
      'transition:border-color 0.18s,color 0.18s;',
      'padding:0;border-radius:0;'
    ].join('');
    _btn.addEventListener('mouseenter', function () {
      _btn.style.borderColor = 'rgba(255,30,55,0.65)';
      _btn.style.color = 'rgba(255,255,255,0.9)';
    });
    _btn.addEventListener('mouseleave', function () {
      _btn.style.borderColor = 'rgba(255,30,55,0.3)';
      _btn.style.color = 'rgba(200,180,220,0.65)';
    });
    _btn.addEventListener('click', function () {
      _muted = !_muted;
      try { localStorage.setItem('z51_sfx_muted', _muted ? '1' : '0'); } catch (e) {}
      _btn.textContent = _muted ? '🔇' : '🔊';
      if (!_muted) { _getCtx(); setTimeout(coin, 50); }
    });
    // Insert into topbar-right if it exists, otherwise append to body as fallback
    var topbarRight = document.querySelector('.topbar-right');
    if (topbarRight) {
      topbarRight.insertBefore(_btn, topbarRight.firstChild);
    } else {
      // fallback: small icon top-right corner
      _btn.style.cssText += 'position:fixed;top:12px;right:14px;z-index:2147483630;';
      document.body.appendChild(_btn);
    }
  }

  /* ── Auto-attach click sound ── */
  function _attachClicks() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t) return;
      if (t.tagName === 'BUTTON' || t.tagName === 'A' ||
          t.closest('button') || t.closest('.btn') || t.closest('.z51-card') || t.closest('.menu-item')) {
        click_snd();
      }
    }, { passive: true });
  }

  /* ── Resume AudioContext on first user interaction (browser policy) ── */
  document.addEventListener('click', function _once() {
    _getCtx();
    document.removeEventListener('click', _once);
  }, { once: true, passive: true });

  /* ── Init ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { _createBtn(); _attachClicks(); });
  } else {
    setTimeout(function () { _createBtn(); _attachClicks(); }, 0);
  }

  window.Z51Sound = {
    coin:   coin,
    win:    win,
    click:  click_snd,
    chip:   chip,
    mute:   function () { _muted = true;  if (_btn) _btn.textContent = '🔇'; },
    unmute: function () { _muted = false; if (_btn) _btn.textContent = '🔊'; }
  };
})();
