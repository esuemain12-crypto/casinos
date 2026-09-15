// ZONE 51 — Auth & Balance (API-backed, server-authoritative)
(function (w) {
  'use strict';

  function resolveApiBase() {
    var defaultBase = 'http://localhost:4000';
    try {
      var fromQuery = new URLSearchParams(w.location.search || '').get('api');
      if (fromQuery) {
        localStorage.setItem('z51_api_base', fromQuery);
        return fromQuery;
      }
    } catch (e) {}
    try {
      return localStorage.getItem('z51_api_base') || defaultBase;
    } catch (e) {
      return defaultBase;
    }
  }

  var API          = resolveApiBase();
  var TOKEN_KEY    = 'z51_token';   // JWT stored in localStorage (cleared on logout)
  var SESSION_KEY  = 'z51_session'; // { userId, username } — no sensitive data
  var HISTORY_KEY  = 'z51_history';
  var MAX_HISTORY  = 300;

  // ── IN-MEMORY BALANCE (never persisted to localStorage) ─────────────────────
  // Balance is always authoritative on the server. The in-memory variable here
  // is an ephemeral cache for the current page session only.
  var _balance = 0;

  // ── TOKEN HELPERS ────────────────────────────────────────────────────────────
  function getToken()   { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t)  { localStorage.setItem(TOKEN_KEY, t); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); }

  function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() };
  }

  // ── Z51 PUBLIC API ──────────────────────────────────────────────────────────
  var Z51 = {

    API: API,

    /* ───── BALANCE (in-memory cache + server-authoritative) ───── */
    getBalance: function () {
      return _balance;
    },

    setBalance: function (v) {
      var n = parseFloat(v);
      if (isNaN(n) || n < 0) return;
      _balance = n;
      // Async persist to server. `keepalive:true` ensures the request still
      // completes if the page is being unloaded — critical when a slot writes
      // the balance right before the user navigates back to index/profile.
      if (!getToken()) return;
      try {
        fetch(API + '/balance/set', {
          method:    'POST',
          headers:   authHeaders(),
          body:      JSON.stringify({ balance: n }),
          keepalive: true,
        }).catch(function () {});
      } catch (e) {
        // Some browsers cap keepalive payload size; fall back to plain fetch.
        fetch(API + '/balance/set', {
          method:  'POST',
          headers: authHeaders(),
          body:    JSON.stringify({ balance: n }),
        }).catch(function () {});
      }
    },

    deduct: function (amount) {
      var b = Math.max(0, _balance - amount);
      Z51.setBalance(b);
      return b;
    },

    credit: function (amount) {
      var b = _balance + amount;
      Z51.setBalance(b);
      return b;
    },

    // Fetch fresh balance from server and update in-memory cache
    syncBalance: function (cb) {
      if (!getToken()) { if (cb) cb(_balance); return; }
      fetch(API + '/balance', { headers: authHeaders() })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok) {
            _balance = Number(d.balance);
            if (cb) cb(_balance);
          }
        })
        .catch(function () {});
    },

    /* ───── BET HISTORY (local — game round data, not financial) ───── */
    getHistory: function () {
      try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
      catch (e) { return []; }
    },

    pushHistory: function (entry) {
      var hist = Z51.getHistory();
      entry.date = new Date().toISOString();
      hist.unshift(entry);
      if (hist.length > MAX_HISTORY) hist = hist.slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
    },

    clearHistory: function () { localStorage.removeItem(HISTORY_KEY); },

    /* ───── AUTH ───── */

    // Async registration — returns Promise<{ok, token?, user?, error?}>
    registerUser: function (username, email, password, ref) {
      var body = { username: username, email: email, password: password };
      if (ref) body.ref = ref;
      return fetch(API + '/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok) {
            setToken(d.token);
            _balance = Number(d.user.balance);
            // Store only non-sensitive identity data (no email, no balance)
            var session = { userId: d.user.id, username: d.user.username };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          }
          return d;
        });
    },

    // Async login — returns Promise<{ok, token?, user?, error?}>
    loginUser: function (login, password) {
      return fetch(API + '/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ login: login, password: password }),
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok) {
            setToken(d.token);
            _balance = Number(d.user.balance);
            // Store only non-sensitive identity data (no email, no balance)
            var session = { userId: d.user.id, username: d.user.username };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          }
          return d;
        });
    },

    getSession: function () {
      try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
      catch (e) { return null; }
    },

    logout: function () {
      if (getToken()) {
        fetch(API + '/auth/logout', { method: 'POST', headers: authHeaders() }).catch(function () {});
      }
      clearToken();
      localStorage.removeItem(SESSION_KEY);
      _balance = 0;
    },

    // Verify token is still valid (call on page load).
    // On success, balance is fetched from server into memory.
    verifySession: function (cb) {
      if (!getToken()) { if (cb) cb(null); return; }
      fetch(API + '/auth/me', { headers: authHeaders() })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok) {
            _balance = Number(d.user.balance);
            var session = { userId: d.user.id, username: d.user.username };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            if (cb) cb(session);
          } else {
            clearToken();
            localStorage.removeItem(SESSION_KEY);
            _balance = 0;
            if (cb) cb(null);
          }
        })
        .catch(function () { if (cb) cb(Z51.getSession()); });
    },
  };

  w.Z51 = Z51;

  // ── MINUTES PLAYED TICKER (runs on every page that loads balance.js) ──
  (function () {
    var KEY = 'z51_minutes_played';
    setInterval(function () {
      var v = parseInt(localStorage.getItem(KEY) || '0') || 0;
      localStorage.setItem(KEY, v + 1);
    }, 60000);
  })();

})(window);
