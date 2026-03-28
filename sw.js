/* JAR My Expense Ledger — Service Worker v2.4.1 */
var CACHE = 'mel-v2.4.1';
var APP_URL = '/';

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.add(APP_URL); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.pathname === '/' || url.pathname.endsWith('index.html')) {
    e.respondWith(
      caches.open(CACHE).then(function(cache) {
        return cache.match(e.request).then(function(cached) {
          var fresh = fetch(e.request).then(function(resp) {
            if (resp && resp.status === 200) cache.put(e.request, resp.clone());
            return resp;
          }).catch(function() { return cached; });
          return cached || fresh;
        });
      })
    );
  } else {
    e.respondWith(
      fetch(e.request).catch(function() { return caches.match(e.request); })
    );
  }
});

self.addEventListener('message', function(e) {
  if (e.data === 'CHECK_UPDATE') {
    fetch('/?_bust=' + Date.now(), { cache: 'no-store' })
      .then(function(resp) { return resp.text(); })
      .then(function(html) {
        var m = html.match(/var APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
        var remoteVer = m ? m[1] : null;
        e.source.postMessage({ type: 'UPDATE_STATUS', version: remoteVer });
      })
      .catch(function() {});
  }
});
