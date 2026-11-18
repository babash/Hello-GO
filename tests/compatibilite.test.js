// Non-régression des dossiers : node tests/compatibilite.test.js (depuis un clone du dépôt, avec son historique Git).
// Règle de l'enseignant (17/11) : les données des élèves déjà inscrit·e·s sont conservées, sans rupture. Donc :
// 1. un dossier de chaque version publiée (1.0.0 à 1.5.0) est accepté par la version actuelle ;
// 2. ouvert, utilisé (visite, quiz, haut fait), résumé, exporté et fusionné par la version actuelle, il ne perd rien,
//    et aucun champ existant ne change de forme ;
// 3. le dossier qui en sort est encore accepté par le dossierValide de CHAQUE version publiée (pris dans l'historique
//    Git) : un appareil resté sur une ancienne version, ou l'enseignant·e sur une ancienne page, ne le refuse pas ;
// 4. un essai de quiz fait ensuite sur un appareil resté en 1.4.0 est repris par la version actuelle.
const fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert'), { execFileSync } = require('child_process');
const RACINE = path.join(__dirname, '..');
const A = require('../js/coach.js'), D = require('../js/donnees.js'), R = require('../js/retours.js'), X = require('../js/export.js');
const { VERSIONS, DOSSIERS } = require('./dossiers-types.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const copie = (x) => JSON.parse(JSON.stringify(x));

// Le dossierValide de chaque version publiée, tiré de l'historique Git.
const anciens = VERSIONS.map((ver) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hello-go-' + ver.v + '-'));
  fs.mkdirSync(path.join(dir, 'js'));
  const lire = (f) => { try { return execFileSync('git', ['-C', RACINE, 'show', ver.commit + ':' + f], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (x) { return null; } };
  ['js/donnees.js', 'js/decouvertes.js'].forEach((f) => { const t = lire(f); if (t !== null) fs.writeFileSync(path.join(dir, f), t); });
  const coach = lire('js/coach.js') !== null ? 'js/coach.js' : 'js/analyse.js', t = lire(coach);
  assert.ok(t, 'version ' + ver.v + ' : ' + coach + ' introuvable dans l’historique Git (commit ' + ver.commit + ') : lancer ce test depuis un clone complet du dépôt');
  fs.writeFileSync(path.join(dir, coach), t);
  // Chaque version charge ses propres données : on vide le cache de require entre deux versions.
  Object.keys(require.cache).filter((k) => k.startsWith(dir)).forEach((k) => delete require.cache[k]);
  const M = require(path.join(dir, coach));
  assert.strictEqual(typeof M.dossierValide, 'function', ver.v + ' : dossierValide absent');
  return { v: ver.v, valide: M.dossierValide };
});
ok(anciens.length === 10, 'neuf versions publiées (1.0.0 à 1.6.0), et la 1.4.0 avant sa pré-validation');

// Ce que fait la version actuelle à l'ouverture (app.js : Object.assign(dossierNeuf(), dossier)), puis à l'usage.
const neuf = () => ({ v: 1, profil: { prenom: '', vu: false }, quiz: { reponses: {}, fait: false }, interets: ['', '', ''], ponts: [''], pistes: [], questions: [],
  decouverte: { reactions: {} }, comprendre: {}, mots: [], sources: [], oraux: [{ id: 'oa', nom: 'Oral blanc 1', auto: {} }, { id: 'ob', nom: 'Oral blanc 2', auto: {} }], hf: {}, compteurs: {}, vus: {} });
function utiliser(F) {
  const d = Object.assign(neuf(), copie(F));
  A.noterVisite(d, new Date(2026, 10, 17, 9)); A.noterVisite(d, new Date(2026, 10, 18, 9));
  D.COMPRENDRE.forEach((z) => { const ids = A.tirerSalve(d, z); A.noterSalve(d, z, ids, ids.map((k, i) => i % 3 !== 0), '2026-11-18'); });
  A.majHautsFaits(d, '2026-11-18');
  return d;
}

Object.keys(DOSSIERS).forEach((v) => {
  const F = DOSSIERS[v]();
  // 1. accepté tel quel
  ok(A.dossierValide(F), v + ' : refusé par la version actuelle');
  anciens.forEach((x) => { if (x.v === v) ok(x.valide(F), v + ' : le dossier type n’est pas accepté par sa propre version'); });
  // 2. utilisé sans perte
  const d = utiliser(F);
  ok(A.dossierValide(d), v + ' : le dossier utilisé est refusé par la version actuelle');
  Object.keys(F).filter((k) => !['comprendre', 'hf', 'visites', 'banque'].includes(k)).forEach((k) => assert.deepStrictEqual(d[k], F[k], v + ' : le champ « ' + k + ' » a changé'));
  // 1.5.0 et suivantes : les jours de visite et les questions vues ne font que s'ajouter.
  Object.keys(F.visites || {}).forEach((j) => ok(d.visites[j] === F.visites[j], v + ' : jour de visite ' + j + ' perdu'));
  Object.keys(F.banque || {}).forEach((k) => Object.keys(F.banque[k].vues || {}).forEach((q) => ok(d.banque[k].vues[q] >= F.banque[k].vues[q], v + ' : question vue ' + q + ' perdue')));
  Object.keys(F.hf).forEach((k) => ok(d.hf[k] === F.hf[k], v + ' : haut fait ' + k + ' perdu ou redaté'));
  Object.keys(F.comprendre || {}).forEach((k) => { const a = F.comprendre[k], b = d.comprendre[k];
    ok(b.essais === a.essais + 1 && b.meilleur >= a.meilleur && b.meilleur <= 10 && b.dernier <= 10, v + ' : résultat du quiz ' + k + ' mal repris');
    ok(b.rates.every((q) => D.COMPRENDRE.find((z) => z.id === k).questions.slice(0, 10).some((x) => x.id === q)), v + ' : « rates » cite une question inconnue de la 1.4.0'); });
  ok(Object.keys(d.visites).length >= 2 && d.banque.epreuve && d.banque.plan, v + ' : visites ou banque absentes');
  // résumé et export : sans erreur, et le résumé reste sous les 4 000 caractères
  const r = R.resume(d); ok(JSON.stringify(r).length <= 4000 && r.hauts_faits === A.hautsFaitsDates(d).length, v + ' : résumé');
  ok(X.dossier(d).length > 200 && X.dossier(F).length > 200, v + ' : export Markdown');
  // 3. accepté par chaque version publiée
  anciens.forEach((x) => ok(x.valide(d), v + ' utilisé en 1.6.0 : refusé par la version ' + x.v));
  // la culture (1.6.0) : regarder une vidéo, jouer une salve, garder une accroche et l'ajouter au plan, sans rien perdre
  const c = copie(d); A.cultureDe(c).videos['ia-langue'] = { vue: '2026-11-19', retiens: 'Des listes de nombres', intrigue: '' };
  A.tirerInfox(c, 7, () => 0.3).forEach((k, i) => A.noterInfox(c, k, i % 2 === 0, '2026-11-19')); A.noterSalveInfox(c, 4, 7); A.garderAccroche(c, 'arpanet-lo', '2026-11-19');
  A.majHautsFaits(c, '2026-11-19');
  ok(A.dossierValide(c) && JSON.stringify(R.resume(c)).length <= 4000, v + ' avec la culture : valide, résumé court');
  Object.keys(d).filter((k) => !['culture', 'hf'].includes(k)).forEach((k) => assert.deepStrictEqual(c[k], d[k], v + ' avec la culture : le champ « ' + k + ' » a changé'));
  anciens.forEach((x) => ok(x.valide(c), v + ' avec la culture : refusé par la version ' + x.v));
  ok(X.dossier(c).includes('Ma culture'), v + ' avec la culture : export Markdown');
  // la fusion à trois (deux appareils) garde les visites des deux côtés
  const autre = copie(F); autre.visites = Object.assign({}, F.visites || {}, { '2026-11-19': 1 }); // un autre appareil ajoute son jour
  const f = R.fusionner(copie(F), d, autre);
  ok(!f.conflit && f.resultat.visites['2026-11-17'] && f.resultat.visites['2026-11-19'] && A.dossierValide(f.resultat), v + ' : fusion des visites');
  anciens.forEach((x) => ok(x.valide(f.resultat), v + ' fusionné : refusé par la version ' + x.v));
});

// 4. Un essai fait ensuite sur un appareil resté en 1.4.0 : il réécrit comprendre.epreuve à sa façon (10 premières questions).
{
  const d = utiliser(DOSSIERS['1.4.0']()), z = D.COMPRENDRE[0];
  d.comprendre.epreuve = { meilleur: d.comprendre.epreuve.meilleur, dernier: 9, le: '2026-11-20', essais: d.comprendre.epreuve.essais + 1, rates: ['e1'] };
  ok(A.dossierValide(d) && anciens.every((x) => x.valide(d)), 'essai 1.4.0 après la 1.5.0 : dossier accepté partout');
  const s = A.suiviQuiz(d, z);
  ok(s.ratees.e1 && z.questions.slice(1, 10).every((q) => !s.ratees[q.id]) && z.questions.slice(0, 10).every((q) => s.vues[q.id]), 'essai 1.4.0 : ses réponses sont reprises');
}
// Un dossier 1.4.0 (toujours les 10 premières questions vues) : la première salve de la 1.5.0 n'a que des nouvelles questions.
{
  const d = Object.assign(neuf(), DOSSIERS['1.4.0']());
  D.COMPRENDRE.forEach((z) => { ok(A.suiviQuiz(d, z).nVues === 10, z.id + ' : 10 questions vues en 1.4.0');
    const ids = A.tirerSalve(d, z); ok(ids.length === 10 && ids.every((k) => z.questions.findIndex((q) => q.id === k) >= 10), z.id + ' : la première salve 1.5.0 commence par les questions jamais vues ' + ids); });
}
console.log('compatibilité : ' + n + ' contrôles, dossiers des versions ' + Object.keys(DOSSIERS).join(', ') + ' et validation par chaque version publiée');
