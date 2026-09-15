/**
 * Zone 51 — Cookie Consent Modal
 * Blocking overlay on first visit. Self-contained, no dependencies.
 * Stores consent in localStorage.
 */
(function () {
  var STORAGE_KEY = 'z51_cookie_consent';
  var consent = null;
  try { consent = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (consent) return;

  var CSS = [
    /* backdrop */
    '#z51-ck-overlay{position:fixed;inset:0;z-index:2147483646;',
      'background:rgba(0,0,0,0.82);backdrop-filter:blur(6px);',
      'display:flex;align-items:center;justify-content:center;',
      'font-family:"Inter",sans-serif;',
      'animation:ck-bg .3s ease;}',
    '@keyframes ck-bg{from{opacity:0}to{opacity:1}}',

    /* modal box */
    '#z51-ck-box{position:relative;width:92%;max-width:480px;',
      'background:linear-gradient(160deg,#130018,#08000e);',
      'border:1px solid rgba(255,30,55,0.3);border-radius:16px;',
      'padding:36px 32px 28px;text-align:center;',
      'box-shadow:0 0 80px rgba(255,20,44,0.18),0 24px 60px rgba(0,0,0,0.7);',
      'animation:ck-in .4s cubic-bezier(.22,1,.36,1);}',
    '@keyframes ck-in{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:none}}',

    /* noise texture */
    '#z51-ck-noise{position:absolute;inset:0;border-radius:16px;pointer-events:none;',
      'background-image:url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E");',
      'opacity:.03;mix-blend-mode:overlay;}',

    /* icon */
    '#z51-ck-icon{font-size:3rem;margin-bottom:16px;',
      'filter:drop-shadow(0 0 16px rgba(255,196,0,0.5));line-height:1;}',

    /* title */
    '#z51-ck-title{font-family:"Orbitron",sans-serif;font-size:1.05rem;font-weight:900;',
      'letter-spacing:.06em;color:#fff;margin-bottom:10px;}',

    /* body text */
    '#z51-ck-body{font-size:.78rem;color:rgba(255,245,245,.55);line-height:1.7;margin-bottom:22px;}',
    '#z51-ck-body a{color:rgba(255,196,0,.85);text-decoration:underline;cursor:pointer;}',
    '#z51-ck-body b{color:rgba(255,245,245,.8);}',

    /* 18+ badge row */
    '#z51-ck-age{display:inline-flex;align-items:center;gap:8px;',
      'border:1px solid rgba(255,30,55,.3);padding:6px 14px;margin-bottom:24px;',
      'font-size:.62rem;letter-spacing:2px;text-transform:uppercase;color:rgba(255,30,55,.8);}',
    '#z51-ck-age-badge{font-family:"Orbitron",sans-serif;font-weight:900;font-size:.9rem;',
      'color:#ff2244;text-shadow:0 0 8px rgba(255,34,68,.6);}',

    /* divider */
    '#z51-ck-sep{height:1px;background:rgba(255,30,55,.15);margin-bottom:22px;}',

    /* buttons */
    '#z51-ck-btns{display:flex;gap:10px;}',
    '.z51-ck-btn{flex:1;font-family:"Orbitron",sans-serif;font-size:.62rem;font-weight:700;',
      'letter-spacing:2.5px;text-transform:uppercase;padding:13px 10px;border-radius:0;',
      'cursor:pointer;transition:all .18s;border:1px solid transparent;}',
    '.z51-ck-accept{background:linear-gradient(135deg,#ff2244,#c41133);',
      'border-color:rgba(255,34,68,.4);color:#fff;',
      'box-shadow:0 4px 20px rgba(255,34,68,.35);}',
    '.z51-ck-accept:hover{opacity:.88;box-shadow:0 6px 28px rgba(255,34,68,.55);}',
    '.z51-ck-accept:active{transform:scale(.97);}',
    '.z51-ck-decline{background:transparent;border-color:rgba(255,255,255,.1);',
      'color:rgba(255,245,245,.4);}',
    '.z51-ck-decline:hover{border-color:rgba(255,255,255,.22);color:rgba(255,245,245,.65);}',

    /* mobile */
    '@media(max-width:480px){#z51-ck-box{padding:28px 20px 22px;}',
      '#z51-ck-btns{flex-direction:column-reverse;}}'
  ].join('');

  var style = document.createElement('style');
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);

  var overlay = document.createElement('div');
  overlay.id = 'z51-ck-overlay';
  overlay.innerHTML =
    '<div id="z51-ck-box">' +
      '<div id="z51-ck-noise"></div>' +
      '<div id="z51-ck-icon">🍪</div>' +
      '<div id="z51-ck-title">COOKIE NOTICE</div>' +
      '<div id="z51-ck-body">' +
        'We use cookies to deliver and improve our services, analyze site traffic, ' +
        'and personalize your experience. By clicking <b>Accept All</b> you agree to our ' +
        '<a onclick="if(typeof z51OpenFooterModal===\'function\')z51OpenFooterModal(\'cookie\')">Cookie Policy</a> ' +
        'and <a onclick="if(typeof z51OpenFooterModal===\'function\')z51OpenFooterModal(\'terms\')">Terms&nbsp;&amp;&nbsp;Conditions</a>.' +
      '</div>' +
      '<div id="z51-ck-age">' +
        '<span id="z51-ck-age-badge">18+</span>' +
        '<span>You must be 18 or older to use this site</span>' +
      '</div>' +
      '<div id="z51-ck-sep"></div>' +
      '<div id="z51-ck-btns">' +
        '<button class="z51-ck-btn z51-ck-decline" id="z51-ck-btn-decline">Necessary Only</button>' +
        '<button class="z51-ck-btn z51-ck-accept" id="z51-ck-btn-accept">Accept All</button>' +
      '</div>' +
    '</div>';

  function dismiss(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
    overlay.style.transition = 'opacity .28s ease';
    overlay.style.opacity = '0';
    setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 300);
  }

  // Wait for DOM ready before injecting
  function inject() {
    document.body.appendChild(overlay);
    document.getElementById('z51-ck-btn-accept').addEventListener('click', function () { dismiss('all'); });
    document.getElementById('z51-ck-btn-decline').addEventListener('click', function () { dismiss('necessary'); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();

