// Une seule version partout, et des noms de fichiers que les bloqueurs de contenu laissent passer : node tests/versions.test.js
// (index.html, js/app.js et sw.js portent la même version ; chaque script et feuille de style de index.html a son ?v= ;
// le service worker garde exactement ces fichiers ; les deux messages de panne disent la même chose.)
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const RACINE = path.join(__dirname, '..'), lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const index = lire('index.html'), app = lire('js/app.js'), sw = lire('sw.js'), readme = lire('README.md');
let n = 0; const ok = (c, m) => { assert(c, m); n++; };

// 1. La même version partout
const v = (/window\.HG_VERSION = '([0-9]+\.[0-9]+\.[0-9]+)'/.exec(index) || [])[1];
ok(v, 'HG_VERSION absent de index.html');
ok((/const VERSION_APP = '([0-9.]+)'/.exec(app) || [])[1] === v, 'VERSION_APP (js/app.js) n’est pas ' + v);
ok((/const V = '([0-9.]+)'/.exec(sw) || [])[1] === v, 'V (sw.js) n’est pas ' + v);
ok(readme.includes('Version ' + v + ' :'), 'README : « Version ' + v + ' : » absent');

// 2. Chaque script et feuille de style de la page porte ?v=<version>, et le fichier existe
const locaux = [...index.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/g)].map((m) => m[1]).filter((u) => !/^[a-z]+:/i.test(u));
const versionnes = locaux.filter((u) => /\.(js|css)(\?|$)/.test(u));
ok(versionnes.length >= 10, 'trop peu de scripts et de feuilles de style trouvés dans index.html');
versionnes.forEach((u) => { ok(u.endsWith('?v=' + v), u + ' : sans ?v=' + v); ok(fs.existsSync(path.join(RACINE, u.split('?')[0])), u + ' : fichier absent'); });

// 3. Le service worker garde exactement index.html, ces fichiers, l'icône et le manifeste (même adresse, même ?v=)
const ctx = { self: { addEventListener() {}, location: { href: 'https://exemple.org/Hello-GO/sw.js' } }, location: { origin: 'https://exemple.org' }, URL, caches: {}, fetch() {}, Request: function () {}, Response: {} };
vm.createContext(ctx);
const S = vm.runInContext(sw + '\n;({ VERSION, FICHIERS, AVEC_VERSION, A_LA_DEMANDE })', ctx);
ok(S.VERSION === 'hello-go-' + v, 'sw.js : VERSION n’est pas hello-go-' + v);
const attendus = ['index.html'].concat(locaux.filter((u) => !/\.(js|css)(\?|$)/.test(u)), versionnes).sort();
ok(JSON.stringify(S.FICHIERS.slice().sort()) === JSON.stringify([...new Set(attendus)].sort()), 'sw.js : FICHIERS ne correspond pas à index.html\n  ' + S.FICHIERS.slice().sort().join(' ') + '\n  ' + [...new Set(attendus)].sort().join(' '));
S.FICHIERS.forEach((f) => ok(fs.existsSync(path.join(RACINE, f.split('?')[0])), 'sw.js : ' + f + ' n’existe pas'));
Object.keys(S.AVEC_VERSION).forEach((f) => ok(lire(f.split('?')[0]).includes(S.AVEC_VERSION[f]), 'sw.js : ' + f + ' ne contient pas « ' + S.AVEC_VERSION[f] + ' »'));
S.A_LA_DEMANDE.forEach((u) => ok(fs.existsSync(path.join(RACINE, u.replace('https://exemple.org/Hello-GO/', ''))), 'sw.js : ' + u + ' n’existe pas'));

// 4. Les modules vérifiés au démarrage sont ceux de la page, dans index.html comme dans js/app.js
const modules = (t) => [...t.matchAll(/\['(HG\w+)', '(js\/[\w.-]+)'\]/g)].map((m) => m[1] + ' ' + m[2]);
const mApp = modules(app), mIndex = modules(index);
ok(mApp.length === 7 && JSON.stringify(mIndex) === JSON.stringify(mApp.concat(['HG_VERSION_APP js/app.js'])), 'les modules vérifiés diffèrent entre index.html et js/app.js');
mIndex.forEach((m) => ok(versionnes.includes(m.split(' ')[1] + '?v=' + v), m + ' : absent de index.html'));
[['HGDonnees', 'js/donnees.js'], ['HGDecouvertes', 'js/decouvertes.js'], ['HGAnalyse', 'js/coach.js'], ['HGRetours', 'js/retours.js'], ['HGExport', 'js/export.js'], ['HGEnLigne', 'js/en-ligne.js'], ['HGProf', 'js/prof.js']]
  .forEach((m) => ok(lire(m[1]).includes('racine.' + m[0] + ' ='), m[1] + ' ne définit pas ' + m[0]));
ok(app.includes('window.HG_VERSION_APP = VERSION_APP;'), 'js/app.js ne définit pas HG_VERSION_APP');

// 5. Les deux messages de panne (index.html, js/app.js) disent la même chose
['Hello GO n’a pas pu se charger en entier', 'Recharge la page : Ctrl+Maj+R sur ordinateur (Cmd+Maj+R sur Mac) ; sur téléphone, ferme l’onglet, puis rouvre-le. Ton dossier n’est pas perdu : il reste sur cet appareil.',
  ' n’a pas pu être chargé : un bloqueur de contenu (de publicités ou de pistage) l’empêche peut-être. Si tu en utilises un, autorise ce site, puis recharge la page.',
  ' n’a pas pu s’exécuter dans ce navigateur : mets-le à jour, ou essaie avec un autre navigateur.', 'Tu sembles hors ligne : reconnecte-toi, puis recharge la page.',
  'Une erreur a arrêté le démarrage.', 'Ton navigateur a gardé une ancienne version de la page (', ') : elle ne va pas avec la nouvelle (', 'Si le problème continue, recopie ces détails pour ton enseignant·e :', "k.indexOf('hello-go-') === 0"]
  .forEach((t) => ok(index.includes(t) && app.includes(t), 'texte différent entre index.html et js/app.js : ' + t));

// 6. Aucun fichier de la page n'a un nom que visent les listes de filtres (EasyPrivacy bloque « /analyse.js », par exemple)
const servis = [];
(function parcourir(d) { fs.readdirSync(path.join(RACINE, d), { withFileTypes: true }).forEach((e) => { const p = path.posix.join(d, e.name);
  if (e.isDirectory()) { if (['js', 'css', 'vendor'].includes(p.split('/')[0]) || d !== '.') parcourir(p); } else servis.push(p); }); })('.');
const suspect = /analy[sz]|statisti|(^|[^a-z])stats?([^a-z]|$)|track|pixel|(^|[^a-z])ads?([^a-z]|$)|advert|banner|beacon|telemetr|metric|counter|collect|piwik|matomo|gtag|(^|[^a-z])tag(s|manager)?([^a-z]|$)|(^|[^a-z])hit([^a-z]|$)/i;
servis.filter((p) => /^(js|css|vendor)\//.test(p) || !p.includes('/')).forEach((p) => ok(!suspect.test(p), p + ' : nom de fichier visé par les bloqueurs de contenu'));
ok(!fs.existsSync(path.join(RACINE, 'js/analyse.js')), 'js/analyse.js existe encore');

console.log('versions : tous les essais passent (' + n + ' contrôles, version ' + v + ')');
