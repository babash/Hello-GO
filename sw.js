// Hello GO : le service worker garde l'application sur l'appareil, pour qu'elle s'ouvre sans réseau.
// À chaque publication, changer V ici, HG_VERSION et les ?v= de index.html, et VERSION_APP dans js/app.js (le test
// tests/versions.test.js le vérifie) : l'ancien cache est alors remplacé.
const V = '1.7.0', VERSION = 'hello-go-' + V, Q = '?v=' + V;
// Un seul cache par version, rempli à l'installation avec exactement les adresses que demande index.html (avec leur ?v=) :
// la page gardée ne va jamais avec des fichiers d'une autre version.
const FICHIERS = ['index.html', 'css/polices.css' + Q, 'css/app.css' + Q, 'vendor/sortable.min.js' + Q, 'js/donnees.js' + Q, 'js/decouvertes.js' + Q, 'js/culture.js' + Q,
  'js/coach.js' + Q, 'js/retours.js' + Q, 'js/export.js' + Q, 'js/en-ligne.js' + Q, 'js/prof.js' + Q, 'js/app.js' + Q, 'icone.svg', 'manifest.webmanifest'];
// Ces deux fichiers portent la version : une copie d'une autre version (serveur intermédiaire en retard) fait échouer
// l'installation, qui sera refaite à la visite suivante.
const AVEC_VERSION = { 'index.html': "window.HG_VERSION = '" + V + "'", ['js/app.js' + Q]: "const VERSION_APP = '" + V + "'" };
// Les bibliothèques chargées à la demande (le PDF, le QR code) ne changent pas avec la version : gardées après leur premier usage.
const ICI = new URL('./', self.location.href).href;
const A_LA_DEMANDE = ['vendor/pdfmake.min.js', 'vendor/vfs_fonts.js', 'vendor/qrcode.js'].map((f) => ICI + f);

self.addEventListener('install', (ev) => {
  // cache: 'reload' : chaque fichier vient du réseau, jamais d'une copie périmée du cache du navigateur.
  ev.waitUntil(Promise.all(FICHIERS.map((f) => fetch(new Request(f, { cache: 'reload' })).then((rep) => {
    if (!rep.ok) throw new Error(f + ' : ' + rep.status);
    if (!AVEC_VERSION[f]) return rep;
    return rep.clone().text().then((t) => { if (t.indexOf(AVEC_VERSION[f]) < 0) throw new Error(f + ' : pas la version ' + V); return rep; });
  }))).then((reps) => caches.open(VERSION).then((c) => Promise.all(reps.map((rep, i) => c.put(FICHIERS[i], rep))))).then(() => self.skipWaiting()));
});
// Les caches sont communs à toutes les applications de babash.github.io : on ne supprime que les anciennes versions de Hello GO.
self.addEventListener('activate', (ev) => {
  ev.waitUntil(caches.keys().then((cles) => Promise.all(cles.filter((k) => k.startsWith('hello-go-') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Le réseau d'abord, en revalidant (cache: 'no-cache') : jamais une copie périmée du cache du navigateur. Sans réseau (ou
// serveur en panne) : la copie de cette version, à la même adresse exacte ; pour une page, l'index.html de cette version.
self.addEventListener('fetch', (ev) => {
  const r = ev.request, page = r.mode === 'navigate';
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const copie = () => caches.open(VERSION).then((c) => c.match(page ? 'index.html' : r));
  // Une page est redemandée par son adresse : une requête de navigation ne se recopie pas avec d'autres options partout.
  const reseau = page ? fetch(r.url, { cache: 'no-cache', credentials: 'same-origin', redirect: 'manual' }) : fetch(r, { cache: 'no-cache' });
  ev.respondWith(reseau.then((rep) => {
    if (rep.ok && A_LA_DEMANDE.indexOf(r.url) >= 0) { const c2 = rep.clone(); caches.open(VERSION).then((c) => c.put(r, c2)).catch(() => {}); }
    if (rep.status >= 500) return copie().then((g) => g || rep);
    return rep;
  }, () => copie().then((g) => g || Response.error())));
});
