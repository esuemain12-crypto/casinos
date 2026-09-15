/**
 * Zone 51 — Custom Cursor
 * Dot + trailing ring with glow. Gold on hover, pulse on click.
 * Skip on touch devices and iframes.
 */
(function () {
  // No custom cursor on touch devices or inside iframes
  if (window.self !== window.top) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  var CSS = [
    'html,html *{cursor:none!important;}',

    /* dot */
    '#z51-cur-dot{',
      'position:fixed;top:0;left:0;z-index:2147483647;pointer-events:none;',
      'width:6px;height:6px;border-radius:50%;',
      'background:#ff2244;',
      'box-shadow:0 0 6px 2px rgba(255,34,68,.9),0 0 12px 4px rgba(255,34,68,.4);',
      'transform:translate(-50%,-50%);',
      'transition:width .1s,height .1s,background .15s,box-shadow .15s;',
      'will-change:transform;}',

    /* ring */
    '#z51-cur-ring{',
      'position:fixed;top:0;left:0;z-index:2147483646;pointer-events:none;',
      'width:28px;height:28px;border-radius:50%;',
      'border:1.5px solid rgba(255,34,68,.7);',
      'box-shadow:0 0 8px rgba(255,34,68,.25),inset 0 0 8px rgba(255,34,68,.06);',
      'transform:translate(-50%,-50%);',
      'transition:width .18s cubic-bezier(.22,1,.36,1),height .18s cubic-bezier(.22,1,.36,1),border-color .18s,box-shadow .18s,opacity .18s;',
      'will-change:transform;}',

    /* hover state — gold */
    'html.z51-cur-hover #z51-cur-dot{',
      'width:8px;height:8px;',
      'background:#ffe600;',
      'box-shadow:0 0 8px 3px rgba(255,220,0,.95),0 0 18px 6px rgba(255,196,0,.45);}',
    'html.z51-cur-hover #z51-cur-ring{',
      'width:38px;height:38px;',
      'border-color:rgba(255,196,0,.8);',
      'box-shadow:0 0 14px rgba(255,196,0,.35),inset 0 0 10px rgba(255,196,0,.08);}',

    /* click pulse */
    'html.z51-cur-click #z51-cur-dot{',
      'width:4px;height:4px;',
      'box-shadow:0 0 14px 6px rgba(255,34,68,1),0 0 28px 10px rgba(255,34,68,.5);}',
    'html.z51-cur-click #z51-cur-ring{',
      'width:48px;height:48px;',
      'opacity:.5;}'
  ].join('');

  var style = document.createElement('style');
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);

  var dot  = document.createElement('div'); dot.id  = 'z51-cur-dot';
  var ring = document.createElement('div'); ring.id = 'z51-cur-ring';
  dot.style.opacity  = '0';   // hidden until first mouse move
  ring.style.opacity = '0';

  function inject() {
    document.body.appendChild(dot);
    document.body.appendChild(ring);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  // Ring lags behind mouse with lerp
  var mx = -100, my = -100;   // mouse
  var rx = -100, ry = -100;   // ring current position
  var LERP = 0.13;
  var rafId = null;

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
    dot.style.opacity  = '';
    ring.style.opacity = '';
    dot.style.transform  = 'translate(' + (mx - 3) + 'px,' + (my - 3) + 'px)';
    if (!rafId) rafId = requestAnimationFrame(animRing);
  });

  function animRing() {
    var dx = mx - rx, dy = my - ry;
    rx += dx * LERP;
    ry += dy * LERP;
    ring.style.transform = 'translate(' + (rx - 14) + 'px,' + (ry - 14) + 'px)';
    if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) {
      rafId = requestAnimationFrame(animRing);
    } else {
      rafId = null;
    }
  }

  // Hover detection — gold on interactive elements
  var HOVER_SEL = 'a,button,input,select,textarea,label,[role="button"],[tabindex],.sf-link,.ck-btn,.z51-ck-btn,.z51-card,.topbar-btn,.nav-link';
  document.addEventListener('mouseover', function (e) {
    if (e.target.closest(HOVER_SEL)) document.documentElement.classList.add('z51-cur-hover');
  });
  document.addEventListener('mouseout', function (e) {
    if (e.target.closest(HOVER_SEL)) document.documentElement.classList.remove('z51-cur-hover');
  });

  // Click pulse
  document.addEventListener('mousedown', function () {
    document.documentElement.classList.add('z51-cur-click');
  });
  document.addEventListener('mouseup', function () {
    document.documentElement.classList.remove('z51-cur-click');
  });

  // Hide when leaving window
  document.addEventListener('mouseleave', function () {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', function () {
    dot.style.opacity  = '';
    ring.style.opacity = '';
  });
})();
