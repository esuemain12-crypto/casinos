/**
 * Telegram Activity Tracker — Zone 51 Casino
 * All user actions are sent via the backend proxy (/api/track).
 * The Telegram token never touches the browser.
 */
(function () {
  // Backend API base — reads from localStorage (set by api.js), falls back to default
  function _apiBase() {
    try {
      var stored = localStorage.getItem('z51_api_base');
      if (stored) return stored.replace(/\/$/, '');
    } catch(e) {}
    return 'http://localhost:4000';
  }

  // ── helpers ──────────────────────────────────────────────────────────────
  function now() {
    return new Date().toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'Europe/Moscow'
    }) + ' МСК';
  }

  function page() {
    var p = location.pathname.split('/').pop() || 'index.html';
    return p || 'index.html';
  }

  // Geo cache — populated async on load, pageVisit waits for it
  var _geo = { country: null, ip: null, ready: false };
  var _geoPromise = new Promise(function(resolve) {
    fetch('https://ipapi.co/json/')
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (d && d.country_code) {
          _geo.country = d.country_code;
          _geo.ip = d.ip || null;
        }
        _geo.ready = true;
        resolve();
      }).catch(function(){ _geo.ready = true; resolve(); });
  });

  function user() {
    // 1. Z51 session (most reliable when logged in)
    try {
      if (window.Z51 && typeof Z51.getSession === 'function') {
        var s = Z51.getSession();
        if (s && s.username) return s.username;
      }
    } catch(e) {}
    // 2. localStorage profile cache
    try {
      var u = JSON.parse(localStorage.getItem('z51_user') || 'null');
      if (u && u.username && u.username !== 'Agent') return u.username;
    } catch(e) {}
    // 3. Guest + geo
    var geo = _geo.country ? ' 🌍 ' + _geo.country : '';
    return 'Guest' + geo;
  }

  function bal() {
    try {
      if (window.Z51 && typeof Z51.getBalance === 'function') {
        return '$' + parseFloat(Z51.getBalance()).toFixed(2);
      }
    } catch (e) {}
    return '—';
  }

  function send(html) {
    try {
      fetch(_apiBase() + '/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: html })
      });
    } catch (e) {}
  }

  function refCode() {
    try { return localStorage.getItem('z51_ref') || ''; } catch(e) { return ''; }
  }

  function header(emoji, title) {
    return emoji + ' <b>' + title + '</b>\n';
  }

  function footer() {
    return '🕐 <code>' + now() + '</code>';
  }

  // ── public events ────────────────────────────────────────────────────────

  /** Page visit */
  window.tgTrack = {

    pageVisit: function (pageName) {
      var pg = pageName || page();
      var PAGE_LABELS = {
        'index.html': '🏠 Главная',
        'games.html': '🎮 Каталог игр',
        'plinko.html': '🎯 Plinko',
        'slot.html': '🎰 Слот',
        'crash.html': '🚀 Краш',
        'dice.html': '🎲 Кости',
        'mines.html': '💣 Мины',
        'signal-lost.html': '📡 Signal Lost',
        'leaderboard.html': '🏆 Лидерборд',
        'promotions.html': '🎁 Акции',
        'vip.html': '💎 VIP',
        'tournaments.html': '🥊 Турниры',
        'support.html': '🆘 Поддержка',
        'coinflip.html': '🪙 Монетка',
        'penalty.html': '⚽ Пенальти',
      };
      var label = PAGE_LABELS[pg] || '📄 ' + pg;
      var ref = refCode();
      send(
        header('👁', 'ВИЗИТ НА СТРАНИЦУ') +
        '📄 Страница: ' + label + '\n' +
        '👤 Игрок: <code>' + user() + '</code>\n' +
        (ref ? '👽 РЕФЕРАЛ: <b>' + ref.toUpperCase() + '</b>\n' : '') +
        footer()
      );
    },

    login: function (username, method) {
      send(
        header('🟢', 'ВХОД В АККАУНТ') +
        '👤 Игрок: <b>' + (username || user()) + '</b>\n' +
        (method ? '🔑 Способ: <code>' + method + '</code>\n' : '') +
        '💰 Баланс: <code>' + bal() + '</code>\n' +
        footer()
      );
    },

    logout: function (username) {
      send(
        header('🔴', 'ВЫХОД ИЗ АККАУНТА') +
        '👤 Игрок: <b>' + (username || 'unknown') + '</b>\n' +
        footer()
      );
    },

    register: function (username, email, promoCode, refCodeVal) {
      var ref = refCodeVal || refCode();
      send(
        header('🆕', 'НОВАЯ РЕГИСТРАЦИЯ') +
        '👤 Ник: <b>' + username + '</b>\n' +
        '📧 Email: <code>' + email + '</code>\n' +
        (promoCode ? '🔖 ИСПОЛЬЗОВАН ПРОМОКОД: <code>' + promoCode.toUpperCase() + '</code>\n' : '') +
        (ref ? '👽 РЕФЕРАЛ: <b>' + ref.toUpperCase() + '</b>\n' : '') +
        footer()
      );
    },

    gameOpen: function (gameTitle, provider, balance) {
      var PROV_EMOJI = {
        pragmatic: '🎰', evoplay: '🕹', amatic: '🎡', igrosoft: '🎪',
        novomatic: '🎠', greentube: '🌿', playson: '🃏', hacksaw: '🪓',
        pocket: '👛', push: '🚀', relax: '😌', spinomenal: '💫',
        '3oaks': '🌳', default: '🎮'
      };
      var emoji = PROV_EMOJI[(provider || '').toLowerCase()] || PROV_EMOJI.default;
      send(
        header('🎰', 'ОТКРЫТА ИГРА') +
        emoji + ' Игра: <b>' + gameTitle + '</b>\n' +
        '🏭 Провайдер: <code>' + (provider || '—') + '</code>\n' +
        '👤 Игрок: <code>' + user() + '</code>\n' +
        '💰 Баланс: <code>' + (balance ? '$' + parseFloat(balance).toFixed(2) : bal()) + '</code>\n' +
        footer()
      );
    },

    gameClose: function (gameTitle, provider) {
      send(
        header('❎', 'ИГРА ЗАКРЫТА') +
        '🎮 Игра: <b>' + (gameTitle || '—') + '</b>\n' +
        '🏭 Провайдер: <code>' + (provider || '—') + '</code>\n' +
        '👤 Игрок: <code>' + user() + '</code>\n' +
        '💰 Баланс: <code>' + bal() + '</code>\n' +
        footer()
      );
    },

    providerBlocked: function (provider) {
      send(
        header('⛔', 'ПОПЫТКА ЗАЙТИ В ЗАБЛОКИРОВАННЫЙ ПРОВАЙДЕР') +
        '🏭 Провайдер: <b>' + provider + '</b>\n' +
        '👤 Игрок: <code>' + user() + '</code>\n' +
        footer()
      );
    },

    pinSet: function (len) {
      send(
        header('🔐', 'PIN УСТАНОВЛЕН') +
        '👤 Игрок: <b>' + user() + '</b>\n' +
        '🔢 Длина: <code>' + len + ' цифр</code>\n' +
        footer()
      );
    },

    pinVerified: function () {
      send(
        header('✅', 'PIN ПОДТВЕРЖДЁН') +
        '👤 Игрок: <b>' + user() + '</b>\n' +
        footer()
      );
    },

    pinForgot: function () {
      send(
        header('⚠️', 'СБРОС PIN') +
        '👤 Игрок: <b>' + user() + '</b>\n' +
        footer()
      );
    },

    wheelSpin: function (prize) {
      send(
        header('🎡', 'ПРОКРУТКА КОЛЕСА УДАЧИ') +
        '🎁 Приз: <b>' + prize + '</b>\n' +
        footer()
      );
    },

    promoActivate: function (code, freespins, depositBonusPct) {
      send(
        header('🎟', 'ПРОМОКОД АКТИВИРОВАН') +
        '👤 Игрок: <b>' + user() + '</b>\n' +
        '🔖 Код: <code>' + code.toUpperCase() + '</code>\n' +
        (freespins > 0 ? '🎰 Фриспинов: <b>' + freespins + '</b> (Alien Rush Bonanza)\n' : '') +
        (depositBonusPct > 0 ? '💰 Бонус к депозиту: <b>+' + depositBonusPct + '%</b> (1 раз)\n' : '') +
        footer()
      );
    }
  };

  // ── auto-fire page visit on load ──────────────────────────────────────────
  function _firePageVisit() {
    // Wait for geo (max 2s), then send
    var timeout = setTimeout(function() { tgTrack.pageVisit(); }, 2000);
    _geoPromise.then(function() { clearTimeout(timeout); tgTrack.pageVisit(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _firePageVisit);
  } else {
    _firePageVisit();
  }

})();
