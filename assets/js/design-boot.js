// ─────────────────────────────────────────────────────────────────────────
//  design-boot.js — Digital Peak
//  Risoluzione sincrona variante grafica (?design=A|B|C|D), anti-FOUC e
//  persistenza automatica su tutti i link interni e navigazione browser.
// ─────────────────────────────────────────────────────────────────────────
(function (win, doc) {
  'use strict';

  var VALID_DESIGNS = ['A', 'B', 'C', 'D'];
  var STORAGE_KEY = 'dp_design';
  var DEFAULT_DESIGN = 'A';

  function normalizeDesign(value) {
    if (!value) return null;
    var clean = String(value).trim().toUpperCase();
    return VALID_DESIGNS.indexOf(clean) !== -1 ? clean : null;
  }

  function safeGetStorage(store, key) {
    try {
      return store ? store.getItem(key) : null;
    } catch (_) {
      return null;
    }
  }

  function safeSetStorage(store, key, value) {
    try {
      if (store) store.setItem(key, value);
    } catch (_) {
      // Storage non disponibile (es. privacy mode restrittiva)
    }
  }

  function getQueryDesign(search) {
    try {
      var params = new URLSearchParams(search != null ? search : win.location.search);
      return normalizeDesign(params.get('design'));
    } catch (_) {
      return null;
    }
  }

  function persistDesign(design) {
    safeSetStorage(win.sessionStorage, STORAGE_KEY, design);
    safeSetStorage(win.localStorage, STORAGE_KEY, design);
  }

  function resolveDesign() {
    var fromUrl = getQueryDesign(win.location.search);
    if (fromUrl) {
      persistDesign(fromUrl);
      return fromUrl;
    }

    var fromSession = normalizeDesign(safeGetStorage(win.sessionStorage, STORAGE_KEY));
    if (fromSession) return fromSession;

    var fromLocal = normalizeDesign(safeGetStorage(win.localStorage, STORAGE_KEY));
    if (fromLocal) return fromLocal;

    return DEFAULT_DESIGN;
  }

  function isExternalHttpUrl(rawHref) {
    if (!/^https?:\/\//i.test(rawHref)) return false;
    try {
      var parsed = new URL(rawHref, win.location.href);
      return win.location.origin !== 'null' && parsed.origin !== win.location.origin;
    } catch (_) {
      return true;
    }
  }

  function shouldSkipHref(rawHref) {
    if (!rawHref) return true;
    var trimmed = rawHref.trim();
    if (!trimmed || trimmed.charAt(0) === '#') return true;
    if (/^(mailto:|tel:|javascript:|data:|blob:)/i.test(trimmed)) return true;
    if (isExternalHttpUrl(trimmed)) return true;
    return false;
  }

  function withDesign(rawHref, forcedDesign) {
    if (shouldSkipHref(rawHref)) return rawHref;

    var design = normalizeDesign(forcedDesign) || currentDesign || resolveDesign();
    var trimmed = rawHref.trim();

    var hashIndex = trimmed.indexOf('#');
    var beforeHash = hashIndex !== -1 ? trimmed.slice(0, hashIndex) : trimmed;
    var hashPart = hashIndex !== -1 ? trimmed.slice(hashIndex) : '';

    var queryIndex = beforeHash.indexOf('?');
    var pathPart = queryIndex !== -1 ? beforeHash.slice(0, queryIndex) : beforeHash;
    var queryPart = queryIndex !== -1 ? beforeHash.slice(queryIndex + 1) : '';

    var params = new URLSearchParams(queryPart);
    params.set('design', design);

    var qs = params.toString();
    return pathPart + (qs ? '?' + qs : '') + hashPart;
  }

  function applyDesignAttribute(design) {
    doc.documentElement.setAttribute('data-design', design);
  }

  function syncCurrentUrl(design) {
    if (!/^https?:$/i.test(win.location.protocol)) return;
    if (!win.history || typeof win.history.replaceState !== 'function') return;

    try {
      var params = new URLSearchParams(win.location.search);
      var raw = params.get('design');
      if (raw === design) return;

      params.set('design', design);
      var nextUrl =
        win.location.pathname +
        '?' +
        params.toString() +
        (win.location.hash || '');
      win.history.replaceState(win.history.state, '', nextUrl);
    } catch (_) {
      // Ignora eventuale restrizione history
    }
  }

  function decorateLinks(forcedDesign) {
    var design = normalizeDesign(forcedDesign) || currentDesign;
    var anchors = doc.querySelectorAll('a[href]');
    for (var i = 0; i < anchors.length; i++) {
      var link = anchors[i];
      if (link.hasAttribute('data-design-static')) continue;

      if (!link.hasAttribute('data-base-href')) {
        link.setAttribute('data-base-href', link.getAttribute('href') || '');
      }

      var baseHref = link.getAttribute('data-base-href');
      if (!shouldSkipHref(baseHref)) {
        link.setAttribute('href', withDesign(baseHref, design));
      }
    }
  }

  function handleStateSync() {
    var next = resolveDesign();
    currentDesign = next;
    applyDesignAttribute(next);
    persistDesign(next);
    if (doc.readyState !== 'loading') {
      decorateLinks(next);
    }
    try {
      win.dispatchEvent(new CustomEvent('dp:designchange', { detail: { design: next } }));
    } catch (_) {}
  }

  function bindPointerSheen() {
    if (!win.matchMedia) return;
    var reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = win.matchMedia('(pointer: fine)').matches;
    if (reduced || !finePointer) return;

    var cards = doc.querySelectorAll('.service-card, .svc-card, .method-col');
    cards.forEach(function (card) {
      var rafId = 0;
      var lastX = 0;
      var lastY = 0;

      card.addEventListener(
        'pointermove',
        function (e) {
          var d = doc.documentElement.getAttribute('data-design');
          if (d !== 'B' && d !== 'D') return;
          lastX = e.clientX;
          lastY = e.clientY;
          if (rafId) return;
          rafId = win.requestAnimationFrame(function () {
            rafId = 0;
            var rect = card.getBoundingClientRect();
            var rx = lastX - rect.left;
            var ry = lastY - rect.top;
            card.style.setProperty('--mx', rx.toFixed(1) + 'px');
            card.style.setProperty('--my', ry.toFixed(1) + 'px');
            if (d === 'D' && rect.width > 0 && rect.height > 0) {
              var nx = (rx / rect.width) * 2 - 1;
              var ny = (ry / rect.height) * 2 - 1;
              card.style.setProperty('--rx', (-ny * 4.5).toFixed(2) + 'deg');
              card.style.setProperty('--ry', (nx * 5.5).toFixed(2) + 'deg');
            }
          });
        },
        { passive: true }
      );

      card.addEventListener(
        'pointerleave',
        function () {
          card.style.setProperty('--rx', '0deg');
          card.style.setProperty('--ry', '0deg');
        },
        { passive: true }
      );
    });
  }

  // Esecuzione SINCRONA immediata in <head> prima del rendering CSS -> Zero FOUC
  var currentDesign = resolveDesign();
  applyDesignAttribute(currentDesign);
  persistDesign(currentDesign);
  syncCurrentUrl(currentDesign);

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', function () {
      decorateLinks(currentDesign);
      bindPointerSheen();
    });
  } else {
    decorateLinks(currentDesign);
    bindPointerSheen();
  }

  // Fallback su click delegato per qualsiasi link interno
  doc.addEventListener('click', function (e) {
    var target = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!target || target.hasAttribute('data-design-static')) return;
    var raw = target.getAttribute('data-base-href') || target.getAttribute('href');
    if (!shouldSkipHref(raw)) {
      target.setAttribute('href', withDesign(raw, currentDesign));
    }
  });

  // Back / Forward & bfcache restore
  win.addEventListener('popstate', handleStateSync);
  win.addEventListener('pageshow', handleStateSync);

  win.DPDesign = {
    getDesign: function () {
      return currentDesign;
    },
    withDesign: function (href, forced) {
      return withDesign(href, forced || currentDesign);
    },
    decorateLinks: decorateLinks,
    setDesign: function (nextDesign) {
      var valid = normalizeDesign(nextDesign);
      if (!valid) return false;
      currentDesign = valid;
      applyDesignAttribute(valid);
      persistDesign(valid);
      syncCurrentUrl(valid);
      decorateLinks(valid);
      try {
        win.dispatchEvent(new CustomEvent('dp:designchange', { detail: { design: valid } }));
      } catch (_) {}
      return true;
    }
  };
})(window, document);
