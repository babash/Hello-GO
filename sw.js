// Hello GO : le service worker garde l'application sur l'appareil, pour qu'elle s'ouvre sans réseau.
// Changer VERSION à chaque publication : l'ancien cache est alors remplacé.
const VERSION = 'hello-go-1.0.0';
const FICHIERS = ['./', 'index.html', 'css/app.css', 'css/polices.css', 'js/donnees.js', 'js/analyse.js', 'js/app.js',
  'vendor/sortable.min.js', 'icone.svg', 'manifest.webmanifest'];
self.addEventListener('install', (ev) => { ev.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting())); });
// Les caches sont communs à toutes les applications de babash.github.io : on ne supprime que les anciennes versions de Hello GO.
self.addEventListener('activate', (ev) => {
  ev.waitUntil(caches.keys().then((cles) => Promise.all(cles.filter((k) => k.startsWith('hello-go-') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Le réseau d'abord (pour avoir la dernière version), le cache si le réseau manque. Le PDF est gardé après son premier usage.
self.addEventListener('fetch', (ev) => {
  const r = ev.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  ev.respondWith(fetch(r).then((rep) => { if (rep.ok) { const copie = rep.clone(); caches.open(VERSION).then((c) => c.put(r, copie)).catch(() => {}); } return rep; })
    .catch(() => caches.match(r, { ignoreSearch: true }).then((rep) => rep || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
