// Essais des analyses : node tests/analyse.test.js
const assert = require('assert');
const D = require('../js/donnees.js');
const A = require('../js/analyse.js');
let id = 0; const pt = (texte, etiquette, sources) => ({ id: 'p' + (++id), texte, etiquette: etiquette || '', mots: [], sources: sources || [] });
const question = (n) => ({ id: 'q1', titre: 'Q', statut: 'brouillon', echange: [], parties: [
  { id: 'a', titre: 'Introduction', minutes: 2, points: [] }, { id: 'b', titre: 'Axe 1', minutes: 3, points: [] },
  { id: 'c', titre: 'Axe 2', minutes: 3, points: [] }, { id: 'd', titre: 'Conclusion', minutes: 2, points: [] }] });
const dossier = (q) => ({ questions: q ? [q] : [], mots: [], sources: [], pistes: [], ponts: [], oraux: [], compteurs: {} });

// normalisation et ressemblance
assert.ok(A.contient('Un Algorithme récursif', 'algorithme'));
assert.ok(A.contient('les algorithmes', 'algorithme'));
assert.ok(!A.contient('biaiser', 'biais'));
assert.ok(A.ressemblance('Erreur systématique et manque d’objectivité d’un algorithme', 'erreur systematique et manque d objectivite d un algorithme') > 0.9);
assert.ok(A.ressemblance('Erreur systématique et manque d’objectivité d’un algorithme', 'Quand le programme se trompe toujours dans le même sens') < 0.3);
assert.ok(A.aChiffre('80 % des données') && A.aChiffre('Selon une étude récente') && !A.aChiffre('Les deux axes'));

// coach
let q = question(); let d = dossier(q);
assert.strictEqual(A.coach(q, d).length, 1);
for (let i = 0; i < 35; i++) q.parties[i % 4].points.push(pt('Point numéro ' + i + ' ' + 'abcdefghij'[i % 10].repeat(5 + i)));
assert.ok(A.coach(q, d)[0].niveau === 'ok', 'taille 35');
q.parties[1].points.push(pt('Il y a 80 % de biais dans ce protocole'));
let c = A.coach(q, d).map((x) => x.texte).join('|');
assert.ok(/sans source/.test(c), 'chiffre sans source'); assert.ok(/biais/.test(c) && /protocole/.test(c), 'mots à définir');
assert.ok(/Introduction : il manque/.test(c));
d.mots.push({ id: 'm1', mot: 'Biais', defSource: 'x', defMoi: 'y' });
assert.ok(!/définir[^|]*biais/.test(A.coach(q, d).map((x) => x.texte).join('|')), 'mot défini');
for (let i = 0; i < 20; i++) q.parties[2].points.push(pt('Encore ' + i + ' zzz' + i));
assert.ok(A.coach(q, d)[0].niveau === 'attention', 'trop de points');

// mots
assert.strictEqual(A.motComplet({ mot: 'a', defSource: 'b', defMoi: 'c' }), true);
assert.ok(A.coachMot({ mot: 'Biais', defSource: 'Erreur systématique et manque d’objectivité d’un algorithme', sourceTexte: 's', defMoi: 'Erreur systématique, manque d’objectivité d’un algorithme', analogie: 'a' }).some((x) => /ressemble trop/.test(x)));

// questionnaire
let s = A.suggestions({ i: ['musique'], n: ['ia'], a: 'avenir', s: 'maths' });
assert.strictEqual(s.length, 5); assert.ok(/musicale/.test(s[0].sujet.t), s[0].sujet.t); assert.ok(s[0].raisons.includes('Musique'));
assert.strictEqual(A.suggestions({}).length, 0);
D.SUJETS.forEach((x) => { assert.ok(x.t && x.th && x.i.length && x.n.length && x.a.length, x.t); });
const ids = {}; D.QUIZ.forEach((qz) => { ids[qz.id] = qz.choix.map((x) => x[0]); });
D.SUJETS.forEach((x) => { x.i.forEach((v) => assert.ok(ids.i.includes(v), x.t + ' ' + v)); x.n.forEach((v) => assert.ok(ids.n.includes(v), x.t + ' ' + v)); x.a.forEach((v) => assert.ok(ids.a.includes(v), v)); x.s.forEach((v) => assert.ok(ids.s.includes(v), v)); });

// prochaine action et phase
assert.ok(/questionnaire/.test(A.prochaineAction(dossier()).bouton));
assert.strictEqual(A.phase(dossier()), 0); assert.strictEqual(A.phase(d), 2);
assert.ok(A.prochaineAction(d).vers);

// hauts faits
const d2 = dossier(question()); assert.strictEqual(A.majHautsFaits(d2, '2026-11-16').length, 0);
d2.questions[0].parties[0].points.push(pt('Un fait', 'accroche'));
let g = A.majHautsFaits(d2, '2026-11-16').map((h) => h.id); assert.deepStrictEqual(g.sort(), ['accroche', 'hello']);
assert.strictEqual(A.majHautsFaits(d2).length, 0, 'pas deux fois');
d2.questions[0].statut = 'validee'; assert.deepStrictEqual(A.majHautsFaits(d2).map((h) => h.id), ['sujet']);
const d3 = dossier(question()); for (let i = 0; i < 42; i++) d3.questions[0].parties[i % 4].points.push(pt('x' + i));
assert.ok(A.majHautsFaits(d3).some((h) => h.id === 'q42'));
assert.strictEqual(new Set(A.HAUTS_FAITS.map((h) => h.id)).size, A.HAUTS_FAITS.length);
A.HAUTS_FAITS.forEach((h) => { assert.ok(h.titre && h.cond && h.pourquoi && h.g); assert.strictEqual(h.test(dossier()), false, h.id); assert.ok(!h.cache || h.indice, h.id); });

// questions probables, référence, contenus
d.mots[0].mot = 'Biais'; assert.ok(A.questionsProbables(q, d).some((x) => /biais/.test(x)));
assert.strictEqual(A.reference({ auteur: 'A', titre: 'T', date: '2024', lien: 'https://x' }), 'A, « T », 2024. https://x');
assert.ok(D.A_SAVOIR.length >= 40); [0, 1, 2].forEach((p) => assert.ok(D.A_SAVOIR.filter((x) => x.p === p).length >= 10));
D.A_SAVOIR.forEach((x) => assert.ok(x.t.length <= 130, x.t));
D.GRILLE.forEach((g2) => assert.strictEqual(g2.niveaux.length, 4));

// le contrôle des fichiers importés : un dossier exporté passe ; un identifiant, un statut ou une note piégés, un type faux ne passent pas
const exporte = { v: 1, profil: { prenom: 'Zoé', vu: true }, quiz: { reponses: { i: ['musique'], a: 'avenir' }, fait: true }, interets: ['a', '', ''], ponts: [''],
  pistes: [{ id: 'k1', titre: 'T', pourquoi: '', idees: [''], candidates: [''] }], questions: [question()],
  mots: [{ id: 'm1', mot: 'Biais', defSource: 'x', sourceTexte: '', defMoi: 'y', analogie: '' }],
  sources: [{ id: 's1', titre: 'S', auteur: '', lien: '', type: 'experte', date: '', retiens: '' }],
  oraux: [{ id: 'o1', nom: 'Oral blanc 1', auto: { oral: 3 }, video: true, date: '2027-01-15' }], hf: { hello: '2026-11-16' }, compteurs: { pdf: 1 }, vus: { decalage: 2 } };
exporte.questions[0].parties[0].points.push(pt('Un point', 'accroche', ['s1']));
assert.ok(A.dossierValide(exporte), 'un dossier exporté');
assert.ok(A.dossierValide({ v: 1, questions: [] }), 'le minimum');
assert.ok(!A.dossierValide(null) && !A.dossierValide([]) && !A.dossierValide('x'));
const abime = (f) => { const x = JSON.parse(JSON.stringify(exporte)); f(x); return A.dossierValide(x); };
[(x) => { x.v = 2; }, (x) => { delete x.questions; }, (x) => { x.questions[0].id = '"><img src=x onerror=alert(1)>'; }, (x) => { x.questions[0].statut = 'x" onmouseover="y'; },
  (x) => { x.mots[0].id = 'a.b'; }, (x) => { x.questions[0].parties[0].points[0].mots = ['a/b']; }, (x) => { x.oraux[0].auto.oral = '<b>'; }, (x) => { x.oraux[0].auto.oral = 5; },
  (x) => { x.oraux[0].auto.inconnu = 1; }, (x) => { x.vus.decalage = -3; }, (x) => { x.vus.decalage = 'x'; }, (x) => { x.hf = null; }, (x) => { x.mots = 'abc'; },
  (x) => { x.questions[0].parties[0].points[0].etiquette = 'inconnue'; }, (x) => { x.sources[0].type = 'x'; }, (x) => { x.quiz.reponses = null; }, (x) => { x.interets = [1]; },
].forEach((f, i) => assert.ok(!abime(f), 'dossier abîmé n° ' + i));
console.log('analyse : tous les essais passent (' + A.HAUTS_FAITS.length + ' hauts faits, ' + D.SUJETS.length + ' sujets, ' + D.A_SAVOIR.length + ' à savoir)');
