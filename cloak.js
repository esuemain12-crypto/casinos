/**
 * Zone 51 — Cloak
 * Blocks bots (by User-Agent) and visitors from CIS countries (by IP geo).
 * Runs as early as possible — before any other script.
 */
(function () {
  var SAFE_URL = 'https://www.google.com';

  // CIS country codes → display names
  var CIS = {
    RU:'Россия', BY:'Беларусь', UA:'Украина', KZ:'Казахстан',
    AZ:'Азербайджан', AM:'Армения', GE:'Грузия', MD:'Молдова',
    KG:'Кыргызстан', TJ:'Таджикистан', TM:'Туркменистан', UZ:'Узбекистан'
  };

  // Bot / crawler UA patterns
  var BOT_PATTERNS = [
    'googlebot','bingbot','yandexbot','yandex','baiduspider','duckduckbot',
    'slurp','facebot','facebookexternalhit','twitterbot','linkedinbot',
    'applebot','mj12bot','semrushbot','ahrefsbot','petalbot','bytespider',
    'dotbot','rogerbot','exabot','gigabot','ia_archiver','seznambot',
    'blexbot','proximic','brandwatch','screaming frog','dataforseo',
    'crawler','spider','scraper','wget','curl','python-requests','python-urllib',
    'go-http-client','okhttp','java/','httpclient','libwww','mechanize',
    'phantomjs','headlesschrome','selenium','puppeteer','playwright',
    'nmap','zgrab','masscan','nikto'
  ];

  function redirect() {
    try { document.documentElement.innerHTML = ''; } catch(e) {}
    window.location.replace(SAFE_URL);
  }

  function showCisModal(geoData) {
    var cc   = (geoData && geoData.country_code) || '??';
    var name = CIS[cc] || geoData.country_name || cc;
    var city = geoData.city ? geoData.city + ', ' : '';
    var ip   = geoData.ip   || '';

    // Inject styles
    var s = document.createElement('style');
    s.textContent = [
      '@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Inter:wght@400;500;600&display=swap");',
      '#cloak-overlay{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;',
        'background:radial-gradient(ellipse at 50% 0%,#1a0010 0%,#0a000a 60%,#000 100%);',
        'font-family:"Inter",sans-serif;}',
      '#cloak-box{position:relative;max-width:440px;width:90%;padding:44px 36px 36px;text-align:center;',
        'background:linear-gradient(145deg,#1c0018,#0d000d);',
        'border:1px solid rgba(255,34,68,.25);border-radius:20px;',
        'box-shadow:0 0 60px rgba(255,34,68,.15),0 0 120px rgba(255,34,68,.07);',
        'animation:clk-in .45s cubic-bezier(.22,1,.36,1);}',
      '@keyframes clk-in{from{opacity:0;transform:translateY(28px) scale(.96)}to{opacity:1;transform:none}}',
      '#cloak-icon{font-size:52px;line-height:1;margin-bottom:18px;filter:drop-shadow(0 0 18px #ff2244bb);}',
      '#cloak-title{font-family:"Orbitron",sans-serif;font-size:1.25rem;font-weight:900;',
        'color:#fff;letter-spacing:.06em;margin-bottom:8px;}',
      '#cloak-sub{font-size:.85rem;color:rgba(255,255,255,.45);margin-bottom:28px;line-height:1.6;}',
      '#cloak-card{background:rgba(255,34,68,.07);border:1px solid rgba(255,34,68,.18);',
        'border-radius:12px;padding:16px 20px;margin-bottom:28px;text-align:left;}',
      '.cloak-row{display:flex;justify-content:space-between;align-items:center;',
        'padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:.82rem;}',
      '.cloak-row:last-child{border-bottom:none;}',
      '.cloak-lbl{color:rgba(255,255,255,.4);}',
      '.cloak-val{color:#fff;font-weight:600;font-family:"Orbitron",sans-serif;font-size:.75rem;letter-spacing:.04em;}',
      '.cloak-flag{font-size:1.1em;margin-right:6px;}',
      '#cloak-btn{display:block;width:100%;padding:13px;border-radius:10px;border:none;cursor:pointer;',
        'background:linear-gradient(135deg,#ff2244,#c41133);',
        'color:#fff;font-family:"Orbitron",sans-serif;font-size:.8rem;font-weight:700;letter-spacing:.08em;',
        'box-shadow:0 4px 20px rgba(255,34,68,.35);transition:opacity .2s;}',
      '#cloak-btn:hover{opacity:.85;}',
      '#cloak-noise{position:absolute;inset:0;border-radius:20px;pointer-events:none;',
        'background-image:url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E");',
        'opacity:.03;mix-blend-mode:overlay;}'
    ].join('');
    document.head.appendChild(s);

    // Emoji flags via regional indicators
    function flagEmoji(code) {
      if (!code || code.length !== 2) return '🌐';
      return String.fromCodePoint(
        code.charCodeAt(0) - 65 + 0x1F1E6,
        code.charCodeAt(1) - 65 + 0x1F1E6
      );
    }

    var flag = flagEmoji(cc);

    var overlay = document.createElement('div');
    overlay.id = 'cloak-overlay';
    overlay.innerHTML = [
      '<div id="cloak-box">',
        '<div id="cloak-noise"></div>',
        '<div id="cloak-icon">🚫</div>',
        '<div id="cloak-title">ДОСТУП ОГРАНИЧЕН</div>',
        '<div id="cloak-sub">Наш сервис недоступен для вашего региона<br>в соответствии с условиями использования.</div>',
        '<div id="cloak-card">',
          '<div class="cloak-row">',
            '<span class="cloak-lbl">Страна</span>',
            '<span class="cloak-val"><span class="cloak-flag">' + flag + '</span>' + name + '</span>',
          '</div>',
          '<div class="cloak-row">',
            '<span class="cloak-lbl">Регион</span>',
            '<span class="cloak-val">' + (city ? city.replace(', ','') : '—') + '</span>',
          '</div>',
          '<div class="cloak-row">',
            '<span class="cloak-lbl">IP-адрес</span>',
            '<span class="cloak-val">' + (ip || '—') + '</span>',
          '</div>',
          '<div class="cloak-row">',
            '<span class="cloak-lbl">Код страны</span>',
            '<span class="cloak-val">' + cc + '</span>',
          '</div>',
        '</div>',
        '<button id="cloak-btn" onclick="window.location.replace(\'' + SAFE_URL + '\')">ПОКИНУТЬ САЙТ</button>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);
  }

  // ── 1. Synchronous bot check (UA) ─────────────────────────────────────────
  var ua = (navigator.userAgent || '').toLowerCase();
  for (var i = 0; i < BOT_PATTERNS.length; i++) {
    if (ua.indexOf(BOT_PATTERNS[i]) !== -1) {
      redirect();
      return;
    }
  }

  // Headless / automation flags
  if (navigator.webdriver ||
      window._phantom ||
      window.__nightmare ||
      window.callPhantom ||
      (!window.chrome && /chrome/i.test(ua) && /headless/i.test(ua))) {
    redirect();
    return;
  }

  // ── 2. Async geo check (CIS countries) ────────────────────────────────────
  var _unlocked = false;
  var _style = document.createElement('style');
  _style.id = 'cloak-freeze';
  _style.textContent = 'body{visibility:hidden!important}';
  (document.head || document.documentElement).appendChild(_style);

  function unlock() {
    if (_unlocked) return;
    _unlocked = true;
    var el = document.getElementById('cloak-freeze');
    if (el) el.parentNode.removeChild(el);
  }

  var _fallback = setTimeout(unlock, 3000);

  fetch('https://ipapi.co/json/')
    .then(function(r) { return r.json(); })
    .then(function(d) {
      clearTimeout(_fallback);
      if (d && d.country_code && CIS[d.country_code]) {
        unlock(); // show body first so modal is visible
        showCisModal(d);
      } else {
        unlock();
      }
    })
    .catch(function() {
      clearTimeout(_fallback);
      unlock();
    });

})();
