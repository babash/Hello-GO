// Le suivi (version 1.5.0) : node tests/suivi.test.js
// Les jours de visite, le voyant d'absence (13, 14 et 15 jours), les hauts faits datés, le résumé pour le tableau, et le
// tirage des salves de quiz (10 questions parmi 20, thèmes couverts, jamais vues puis ratées d'abord).
const assert = require('assert');
const A = require('../js/coach.js'), D = require('../js/donnees.js'), R = require('../js/retours.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const jour = (a, m, j, h) => new Date(a, m - 1, j, h === undefined ? 10 : h);

// ---------- Les jours de visite ----------
{
  const d = { v: 1, questions: [] };
  ok(A.noterVisite(d, jour(2026, 11, 17, 8)) === true, 'premier jour noté');
  ok(A.noterVisite(d, jour(2026, 11, 17, 23)) === false, 'le même jour, une seule fois');
  ok(A.noterVisite(d, jour(2026, 11, 18, 0)) === true, 'minuit passé : un autre jour (heure de l’appareil)');
  assert.deepStrictEqual(Object.keys(d.visites).sort(), ['2026-11-17', '2026-11-18']); n++;
  ok(Object.values(d.visites).every((x) => x === 1) && A.dossierValide(d), 'une date par jour, sans heure, dossier valide');
  // 450 jours de suite : on garde les 400 derniers
  const e = { v: 1, questions: [] };
  for (let i = 0; i < 450; i++) A.noterVisite(e, new Date(2025, 0, 1 + i, 12));
  const l = Object.keys(e.visites).sort();
  ok(l.length === A.VISITES_MAX && l[l.length - 1] === A.jourLocal(new Date(2025, 0, 450, 12)), 'borne : les 400 derniers jours');
  // jours actifs sur 7 et 30 jours, et depuis le début
  const f = { v: 1, questions: [] };
  [1, 2, 3, 10, 12, 20, 25, 30].forEach((j) => A.noterVisite(f, jour(2026, 11, j)));
  A.noterVisite(f, jour(2026, 10, 1));
  const s = A.statsVisites(f, jour(2026, 11, 30));
  ok(s.j7 === 2 && s.j30 === 8 && s.total === 9 && s.depuis === '2026-10-01' && s.derniere === '2026-11-30', 'jours actifs ' + JSON.stringify(s));
  ok(A.statsVisites({ v: 1 }, jour(2026, 11, 30)).total === 0, 'sans historique');
  // une forme abîmée est refusée
  [{ '2026-11-17': 'oui' }, { 'hier': 1 }, ['2026-11-17'], { '2026-11-17T10:00': 1 }].forEach((v) => ok(!A.dossierValide({ v: 1, questions: [], visites: v }), 'visites refusées : ' + JSON.stringify(v)));
}

// ---------- Le voyant : plus de 14 jours sans visite, ou jamais revenu·e ----------
{
  const now = jour(2026, 11, 30, 9), il = (k, h) => jour(2026, 11, 30 - k, h === undefined ? 18 : h).toISOString();
  const a13 = A.absence(il(13), il(40), now), a14 = A.absence(il(14), il(40), now), a15 = A.absence(il(15), il(40), now);
  ok(a13.jours === 13 && !a13.alerte, '13 jours : pas de voyant');
  ok(a14.jours === 14 && !a14.alerte, '14 jours : pas encore de voyant');
  ok(a15.jours === 15 && a15.alerte, '15 jours : voyant');
  ok(A.absence(il(14, 23), il(40), now).jours === 14 && A.absence(il(15, 0), il(40), now).jours === 15, 'en jours du calendrier, quelle que soit l’heure');
  ok(A.absence(il(0), il(0), now).jamaisRevenu === false, 'inscrit·e aujourd’hui : pas encore « jamais revenu·e »');
  ok(A.absence(il(3, 10), il(3, 9), now).jamaisRevenu === true && !A.absence(il(3, 10), il(3, 9), now).alerte, 'jamais revenu·e depuis 3 jours : signalé·e, sans le voyant des 14 jours');
  ok(A.absence(il(20, 10), il(20, 9), now).jamaisRevenu && A.absence(il(20, 10), il(20, 9), now).alerte, 'jamais revenu·e depuis 20 jours : les deux');
  ok(A.absence(il(2), il(9), now).jamaisRevenu === false, 'revenu·e après l’inscription');
  ok(A.absence(null, il(9), now).alerte === true, 'sans date de visite : voyant');
}

// ---------- Les hauts faits datés ----------
{
  const d = { v: 1, questions: [], hf: { accroche: '2026-11-12', hello: '2026-11-10', pdf: 'oui', inconnu: '2026-11-11', snap: '2026-11-15T08:00:00Z' } };
  const l = A.hautsFaitsDates(d);
  assert.deepStrictEqual(l.map((h) => h.id), ['hello', 'accroche', 'snap', 'pdf']); n++;
  ok(l[3].le === null && l[2].le === '2026-11-15', 'date inconnue en dernier, date lue sur les 10 premiers caractères');
  ok(l.every((h) => h.titre), 'titres de la page');
}

// ---------- Le résumé pour le tableau ----------
{
  const d = { v: 1, questions: [], hf: {} };
  A.HAUTS_FAITS.forEach((h, i) => { d.hf[h.id] = '2026-' + (i < 27 ? '10' : '11') + '-' + String(1 + (i % 27)).padStart(2, '0'); });
  for (let i = 0; i < 60; i++) A.noterVisite(d, new Date(2026, 9, 1 + i, 12));
  const r = R.resume(d);
  ok(r.hf_recents.length === 10 && /^[a-z0-9]+$/.test(r.hf_recents[0][0]) && /^[0-9]{6}$/.test(r.hf_recents[0][1]) && r.hf_recents[0][1] >= r.hf_recents[9][1], 'les 10 derniers hauts faits, dates compactes, du plus récent');
  ok(r.visites.n === 60 && r.visites.depuis === '261001' && r.visites.jours.length === 35 && r.visites.jours[34] === '261129', 'les visites : nombre, début, 35 derniers jours');
  ok(r.hauts_faits === A.HAUTS_FAITS.length, 'nombre de hauts faits');
  // un dossier très chargé : le résumé reste sous 4 000 caractères
  const g = JSON.parse(JSON.stringify(d)); g.quiz = { reponses: {}, fait: true };
  for (let i = 0; i < 60; i++) g.quiz.reponses['k' + i] = ['un choix assez long numéro ' + i, 'un autre choix assez long'];
  g.questions = [...Array(8).keys()].map((i) => ({ id: 'q' + i, titre: 'Une question très longue '.repeat(8), statut: 'brouillon', echange: [], parties: [] }));
  g.oraux = [...Array(30).keys()].map((i) => ({ id: 'o' + i, nom: 'Oral blanc numéro ' + i, auto: {} }));
  ok(JSON.stringify(R.resume(g)).length <= 4000, 'résumé chargé : ' + JSON.stringify(R.resume(g)).length + ' caractères');
  ok(!('hf_recents' in R.resume({ v: 1, questions: [] })) && !('visites' in R.resume({ v: 1, questions: [] })), 'rien de neuf dans le résumé d’un dossier vide');
}

// ---------- Le tirage des salves ----------
{
  let graine = 7; const alea = () => { graine = (graine * 16807) % 2147483647; return graine / 2147483647; };
  D.COMPRENDRE.forEach((z) => {
    const d = { v: 1, questions: [] }, themes = [...new Set(z.questions.map((q) => q.th))];
    const th = (ids) => ids.reduce((o, k) => { const t = z.questions.find((q) => q.id === k).th; o[t] = (o[t] || 0) + 1; return o; }, {});
    const s1 = A.tirerSalve(d, z, alea);
    ok(s1.length === 10 && new Set(s1).size === 10, z.id + ' : 10 questions différentes');
    ok(themes.every((t) => th(s1)[t] >= 2), z.id + ' : chaque sous-thème couvert, de façon équilibrée ' + JSON.stringify(th(s1)));
    // l'élève rate les deux premières
    A.noterSalve(d, z, s1, s1.map((k, i) => i >= 2), '2026-11-17');
    const r1 = d.comprendre[z.id];
    ok(r1.dernier === 8 && r1.meilleur === 8 && r1.essais === 1 && r1.rates_toutes.length === 2, z.id + ' : résultat sur 10');
    ok(r1.rates.every((k) => z.questions.slice(0, 10).some((q) => q.id === k)) && r1.rates.length === r1.rates_toutes.filter((k) => z.questions.findIndex((q) => q.id === k) < 10).length, z.id + ' : « rates » ne cite que les questions de la 1.4.0');
    ok(A.suiviQuiz(d, z).nVues === 10, z.id + ' : 10 questions vues');
    // deuxième salve : les 10 jamais vues
    const s2 = A.tirerSalve(d, z, alea);
    ok(s2.every((k) => !s1.includes(k)) && s2.length === 10, z.id + ' : la deuxième salve ne reprend aucune question vue');
    A.noterSalve(d, z, s2, s2.map(() => true), '2026-11-18');
    ok(d.comprendre[z.id].meilleur === 10 && A.quizSansFaute(d, z.id) && A.majHautsFaits(d).some((h) => h.id === (z.id === 'epreuve' ? 'regles' : 'accroc')), z.id + ' : sans-faute sur une salve, haut fait');
    ok(A.suiviQuiz(d, z).nVues === 20, z.id + ' : 20 questions vues');
    // troisième salve : les deux ratées d'abord
    const s3 = A.tirerSalve(d, z, alea);
    ok(s1.slice(0, 2).every((k) => s3.includes(k)) && s3.length === 10 && new Set(s3).size === 10, z.id + ' : les ratées reviennent en priorité');
    ok(themes.every((t) => th(s3)[t] >= 1), z.id + ' : toujours tous les sous-thèmes');
    ok(A.dossierValide(d), z.id + ' : dossier valide');
    // l'ordre des questions suit la banque
    const pos = s3.map((k) => z.questions.findIndex((q) => q.id === k)); ok(pos.every((p, i) => !i || p > pos[i - 1]), z.id + ' : ordre de la banque');
  });
  // une forme abîmée de la banque ou du résultat est refusée
  [{ banque: { epreuve: { vues: { e1: -1 } } } }, { banque: { epreuve: 'x' } }, { banque: { epreuve: { vues: { '<img>': 1 } } } },
    { comprendre: { epreuve: { meilleur: 1, dernier: 1, le: '', essais: 1, rates_toutes: ['"x'] } } }]
    .forEach((x) => ok(!A.dossierValide(Object.assign({ v: 1, questions: [] }, x)), 'refusé : ' + JSON.stringify(x)));
  ok(A.dossierValide({ v: 1, questions: [], banque: { epreuve: { le: '2026-11-17', vues: { e1: 2, e99: 1 }, ratees: { e99: 1 } }, autre: { le: '' } } }), 'une question ou un quiz d’une version plus récente est accepté');
}
console.log('suivi : ' + n + ' contrôles (visites, voyant à 13, 14 et 15 jours, hauts faits datés, résumé, salves)');
