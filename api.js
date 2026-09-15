// ZONE 51 — API Client
(function (w) {
  'use strict';

  function resolveBase() {
    var defaultBase = 'http://localhost:4000';
    try {
      return localStorage.getItem('z51_api_base') || defaultBase;
    } catch (e) {
      return defaultBase;
    }
  }

  var BASE = resolveBase();
  var TOKEN_KEY = 'z51_token';

  var API = {
    getToken: function () {
      return localStorage.getItem(TOKEN_KEY) || null;
    },

    setToken: function (token) {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    },

    _headers: function (json) {
      var h = {};
      if (json) h['Content-Type'] = 'application/json';
      var t = API.getToken();
      if (t) h['Authorization'] = 'Bearer ' + t;
      return h;
    },

    _req: function (method, path, body) {
      return fetch(BASE + path, {
        method: method,
        headers: API._headers(!!body),
        body: body ? JSON.stringify(body) : undefined,
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) return Promise.reject(data);
          return data;
        });
      });
    },

    get:    function (path)       { return API._req('GET',    path); },
    post:   function (path, body) { return API._req('POST',   path, body); },
    delete: function (path)       { return API._req('DELETE', path); },
  };

  w.Z51API = API;
})(window);
