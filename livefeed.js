/**
 * Zone 51 — Live Wins Feed
 * Fixed bottom-left widget showing recent wins from other players.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  var PLAYERS = [
    'Agent****2847', 'Shadow_***', 'Luck_H***', 'B1gW1n_**',
    'NightOwl_', 'Phantom**', 'Reaper_**', 'Viper_XX_',
    'G0ldRush_', 'DarkAce**', 'NightFox_', 'Cipher***',
    'Overdrive', 'Nexus_***', 'Specter**', 'Volkov***',
    'RedFox***', 'IronWolf_', 'Banshee**', 'Tempest**',
    'Striker**', 'CobraX***', 'Ghost_***', 'Titan_***',
    'Rogue_***', 'Eclipse**', 'Blaze_***', 'Storm****',
  ];

  var GAMES = [
    'Gates of Olympus', 'Sweet Bonanza', 'Big Bass Splash',
    'Wolf Gold', 'Chaos Crew', 'Wanted Dead or Wild',
    'Book of Dead', 'Hand of Anubis', 'Rocket Reels',
    'Plinko', 'Crash', 'Mines', 'Penalty Shoot-out',
    'Coin Flip', 'Lucky Strike', 'Fire Joker', 'Cubes 2',
    'Neon Blaze', 'Wild Bandito', 'Fruit Party 2',
    'Sugar Rush 1000', 'Big Bass Bonanza', 'Starlight Princess',
    'Elemental Gems', 'Floating Dragon', 'Bounty Hunter',
  ];

  // Weighted: small wins much more frequent
  var AMOUNTS = [
    8.40, 14.80, 22.50, 38.00, 55.00, 84.20, 120.00, 175.00,
    240.00, 380.00, 540.00, 750.00, 1100.00, 1650.00, 2400.00,
    3500.00, 5200.00, 8400.00, 14000.00, 22000.00, 38500.00
  ];

  function _randAmount() {
    var i = Math.floor(Math.pow(Math.random(), 2.6) * AMOUNTS.length);
    var base = AMOUNTS[Math.min(i, AMOUNTS.length - 1)];
    return (base * (0.88 + Math.random() * 0.24)).toFixed(2);
  }
  function _ri(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function _fmt(n)  { return '$' + parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  var CSS = [
    '#z51-feed{',
      'position:fixed;bottom:24px;left:18px;z-index:2147483620;',
      'display:flex;flex-direction:column-reverse;gap:8px;',
      'pointer-events:none;max-width:290px;',
    '}',
    '.z51-fw{',
      'pointer-events:all;',
      'background:rgba(6,1,10,0.94);',
      'border:1px solid rgba(255,34,68,0.22);border-left:2px solid rgba(255,34,68,0.65);',
      'padding:10px 14px 10px 12px;border-radius:4px;',
      'display:flex;align-items:center;gap:10px;',
      'opacity:0;transform:translateX(-20px);',
      'transition:opacity 0.28s,transform 0.28s;',
      'backdrop-filter:blur(12px);',
      'box-shadow:0 4px 20px rgba(0,0,0,0.55);',
      'min-width:220px;',
    '}',
    '.z51-fw.big{',
      'border-left-color:rgba(255,220,0,0.85);border-color:rgba(255,196,0,0.3);',
      'box-shadow:0 4px 20px rgba(0,0,0,0.55),0 0 18px rgba(255,196,0,0.1);',
    '}',
    '.z51-fw.in{opacity:1;transform:translateX(0);}',
    '.z51-fw.out{opacity:0;transform:translateX(-20px);}',
    '.z51-fw-icon{font-size:1rem;flex-shrink:0;}',
    '.z51-fw-body{flex:1;min-width:0;}',
    '.z51-fw-player{font-size:0.64rem;color:rgba(200,175,215,0.58);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.z51-fw-line{display:flex;align-items:baseline;gap:5px;}',
    '.z51-fw-amt{font-family:Orbitron,monospace;font-size:0.82rem;font-weight:700;color:#ffe600;text-shadow:0 0 10px rgba(255,230,0,0.5);}',
    '.z51-fw-game{font-size:0.6rem;color:rgba(200,150,180,0.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '@media(max-width:480px){#z51-feed{max-width:calc(100vw - 36px);left:12px;}}'
  ].join('');

  var _container = null;
  var MAX = 3;

  function _getContainer() {
    if (_container && _container.isConnected) return _container;
    _container = document.getElementById('z51-feed');
    if (!_container) {
      _container = document.createElement('div');
      _container.id = 'z51-feed';
      document.body.appendChild(_container);
    }
    return _container;
  }

  function addWin() {
    var amt   = _randAmount();
    var big   = parseFloat(amt) >= 1000;
    var c     = _getContainer();

    // Remove oldest if at limit
    if (c.children.length >= MAX) {
      var last = c.lastElementChild;
      if (last) {
        last.classList.remove('in');
        last.classList.add('out');
        setTimeout(function () { last.remove(); }, 320);
      }
    }

    var el = document.createElement('div');
    el.className = 'z51-fw' + (big ? ' big' : '');
    el.innerHTML =
      '<span class="z51-fw-icon">' + (big ? '💰' : '🎰') + '</span>' +
      '<div class="z51-fw-body">' +
        '<div class="z51-fw-player">' + _ri(PLAYERS) + ' just won</div>' +
        '<div class="z51-fw-line">' +
          '<span class="z51-fw-amt">' + _fmt(amt) + '</span>' +
          '<span class="z51-fw-game">on ' + _ri(GAMES) + '</span>' +
        '</div>' +
      '</div>';

    c.insertBefore(el, c.firstChild);
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('in'); }); });

    var showFor = big ? 7000 : 5000;
    setTimeout(function () {
      el.classList.remove('in');
      el.classList.add('out');
      setTimeout(function () { el.remove(); }, 350);
    }, showFor);

    if (big && window.Z51Sound) { Z51Sound.coin(); }
  }

  // Inject CSS
  var s = document.createElement('style');
  s.textContent = CSS;
  (document.head || document.documentElement).appendChild(s);

  // Schedule wins
  function _schedule() {
    _getContainer();
    setTimeout(addWin, 2500);
    setTimeout(function () {
      addWin();
      // Random interval: 8 - 18 seconds
      (function _loop() {
        setTimeout(function () { addWin(); _loop(); }, 8000 + Math.random() * 10000);
      })();
    }, 6000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _schedule);
  } else {
    setTimeout(_schedule, 0);
  }

  window.Z51Feed = { addWin: addWin };
})();
