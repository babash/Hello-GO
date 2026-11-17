// Essais des analyses (js/coach.js) : node tests/analyse.test.js
const assert = require('assert');
const D = require('../js/donnees.js');
const A = require('../js/coach.js');
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
const ids = { i: Object.keys(D.TAGS.i), n: Object.keys(D.TAGS.n), a: ['recit', 'comment', 'debat', 'avenir'], s: D.QUIZ.find((x) => x.id === 'spe').choix.map((x) => x[0]) };
let s = A.suggestions({ gouts: ['musique'], nsi: ['ia'], angle: 'avenir', spe: 'maths' });
assert.strictEqual(s.length, 5); assert.ok(/musicale/.test(s[0].sujet.t), s[0].sujet.t); assert.ok(s[0].raisons.includes('Écouter ou faire de la musique'));
assert.strictEqual(A.suggestions({}).length, 0);
D.SUJETS.forEach((x) => { assert.ok(x.t && x.th && x.i.length && x.n.length && x.a.length, x.t); });
D.SUJETS.forEach((x) => { x.i.forEach((v) => assert.ok(ids.i.includes(v), x.t + ' ' + v)); x.n.forEach((v) => assert.ok(ids.n.includes(v), x.t + ' ' + v)); x.a.forEach((v) => assert.ok(ids.a.includes(v), v)); x.s.forEach((v) => assert.ok(ids.s.includes(v), v)); });
// chaque réponse du questionnaire a un identifiant unique, des étiquettes connues et des mots qui trouvent au moins un sujet
const vusId = new Set(); let nReponses = 0;
D.QUIZ.forEach((q) => { const listes = q.choixSelon ? Object.values(q.choixSelon) : [A.choixDe(q, {})];
  if (q.choixSelon) Object.keys(q.choixSelon).forEach((k) => assert.ok(ids.s.includes(k), k));
  listes.forEach((l) => l.forEach((c) => { nReponses++; const cle = q.id + ':' + c[0]; assert.ok(!vusId.has(cle), cle); vusId.add(cle);
    c[2].i.forEach((v) => assert.ok(ids.i.includes(v), cle + v)); c[2].n.forEach((v) => assert.ok(ids.n.includes(v), cle + v));
    if (c[2].k) assert.ok(D.SUJETS.some((x) => new RegExp(c[2].k, 'i').test(x.t)), 'aucun sujet pour ' + cle + ' /' + c[2].k + '/'); })); });
assert.ok(nReponses >= 90, nReponses);
// chaque réponse qui porte des étiquettes mène à des sujets ; les sous-réponses d'une spécialité en changent le résultat
D.QUIZ.forEach((q) => { if (q.id === 'spe' || q.id === 'angle') return; const tous = q.choixSelon ? Object.entries(q.choixSelon) : [['', A.choixDe(q, {})]];
  tous.forEach(([spe, l]) => l.forEach((c) => { if (!c[2].i.length && !c[2].n.length) return; const r = { spe }; r[q.id] = [c[0]]; assert.ok(A.suggestions(r, 5).length >= 3, q.id + ':' + c[0]); })); });
assert.notDeepStrictEqual(A.suggestions({ spe: 'maths', dansspe: ['arith'] }, 3).map((x) => x.sujet.t), A.suggestions({ spe: 'maths', dansspe: ['geom'] }, 3).map((x) => x.sujet.t));
assert.ok(/fractales/i.test(A.suggestions({ spe: 'maths', dansspe: ['geom'] }, 1)[0].sujet.t));
assert.ok(/dessin animé/.test(A.suggestions({ gouts: ['anime'] }, 1)[0].sujet.t));
const th = {}; A.suggestions({ gouts: ['rs', 'actu', 'justice'], coeur: ['prive', 'vrai'] }, 5).forEach((x) => { th[x.sujet.th] = (th[x.sujet.th] || 0) + 1; }); assert.ok(Object.values(th).every((v) => v <= 2), 'variété des thèmes');
assert.strictEqual(A.profil({ spe: 'ses', dansspe: ['arith'] }).nombre, 1, 'une sous-réponse d’une autre spécialité ne compte pas');

// prochaine action et phase
assert.ok(/Découvrir/.test(A.prochaineAction(dossier()).bouton));
assert.strictEqual(A.phase(dossier()), 0); assert.strictEqual(A.phase(d), 2);
assert.ok(A.prochaineAction(d).vers);

// hauts faits
const d2 = dossier(question()); assert.strictEqual(A.majHautsFaits(d2, '2026-11-16').length, 0);
d2.questions[0].parties[0].points.push(pt('Un fait', 'accroche'));
let g = A.majHautsFaits(d2, '2026-11-16').map((h) => h.id); assert.deepStrictEqual(g.sort(), ['accroche', 'hello']);
assert.strictEqual(A.majHautsFaits(d2).length, 0, 'pas deux fois');
d2.questions[0].statut = 'validee'; assert.deepStrictEqual(A.majHautsFaits(d2).map((h) => h.id).sort(), ['sujet', 'volontaire']);
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

// découvrir : cartes de la Timeline
const C = A.CARTES; assert.ok(C.length >= 30);
C.forEach((c) => { assert.ok(c.titre && c.texte && c.q && c.q.trim().endsWith('?'), c.titre); c.i.forEach((v) => assert.ok(ids.i.includes(v), c.titre + v)); c.n.forEach((v) => assert.ok(ids.n.includes(v), c.titre + v)); });
let re = {}, vues = []; for (let k = 0; k < 7; k++) { const c = A.prochaineCarte(re); vues.push(c); re[c.num] = -1; }
assert.ok(new Set(vues.flatMap((c) => c.n)).size >= 6, 'les 7 premières cartes couvrent au moins 6 domaines');
while (A.prochaineCarte(re)) re[A.prochaineCarte(re).num] = 1; assert.strictEqual(Object.keys(re).length, C.length);
assert.strictEqual(A.suggestions({}, 5, {}).length, 0);
const r2 = {}; C.filter((c) => c.n.includes('secu')).forEach((c) => { r2[c.num] = 1; });
assert.ok(A.suggestions({}, 5, r2).every((x) => x.sujet.n.includes('secu') || x.score > 0)); assert.ok(A.suggestions({}, 5, r2)[0].sujet.n.includes('secu'));
assert.ok(A.surprises({ nsi: ['ia'] }, r2).some((x) => /sécurité/.test(x))); assert.ok(!A.surprises({ nsi: ['secret'] }, r2).some((x) => /sécurité/.test(x)));
// pas de surprise tant que « Mes goûts » ne dit rien (ni réponse, ni étiquette ; anciennes réponses de la version 1.0.0 ignorées)
assert.deepStrictEqual(A.surprises({}, r2), []); assert.deepStrictEqual(A.surprises({ spe: 'maths', angle: 'recit' }, r2), []);
assert.deepStrictEqual(A.surprises({ i: ['musique'], n: ['ia'], a: 'avenir', s: 'maths' }, r2), []);
const d4 = dossier(); d4.decouverte = { reactions: re }; assert.ok(A.majHautsFaits(d4).some((h) => h.id === 'cartes'));
assert.ok(/Découvrir/.test(A.prochaineAction(dossier()).bouton));
console.log('découvrir : ' + C.length + ' cartes, essais passés');

// import : les nouveaux champs sont contrôlés
const bon = { v: 1, questions: [], quiz: { reponses: { gouts: ['musique'], spe: 'maths', dansspe: ['probas'] }, fait: true }, decouverte: { reactions: { 4: 1, 86: -1 } }, vus: { suite: 1 } };
assert.strictEqual(A.dossierValide(bon), true);
assert.strictEqual(A.dossierValide(Object.assign({}, bon, { decouverte: { reactions: { '"><img>': 1 } } })), false);
assert.strictEqual(A.dossierValide(Object.assign({}, bon, { decouverte: { reactions: { 4: '<b>' } } })), false);
assert.strictEqual(A.dossierValide(Object.assign({}, bon, { quiz: { reponses: { gouts: [{}] } } })), false);
// un fichier de la version 1.0.0 (anciennes réponses i, n, a, s ; pas de « decouverte ») s'importe, et ses réponses sont ignorées
const ancien = { v: 1, questions: [], quiz: { reponses: { i: ['musique', 'jeux'], n: ['ia'], a: 'avenir', s: 'maths' }, fait: true } };
assert.strictEqual(A.dossierValide(ancien), true); assert.strictEqual(A.profil(ancien.quiz.reponses).nombre, 0); assert.strictEqual(A.suggestions(ancien.quiz.reponses, 5).length, 0);
console.log('import : nouveaux champs contrôlés');

// les mots cherchés dans les titres : pas de faux amis (« jeu » dans « enjeux », « art » dans « smart » ou « artificielle »),
// pas de lien entre « mon île » et la fracture numérique
const trouves = (qid, id, spe) => { const c = A.choixDe(D.QUIZ.find((x) => x.id === qid), { spe }).find((x) => x[0] === id); const r = new RegExp(c[2].k, 'i'); return D.SUJETS.filter((x) => r.test(x.t)).map((x) => x.t); };
[['gouts', 'jv'], ['gouts', 'plateau']].forEach(([q, id]) => { assert.ok(trouves(q, id).length && !trouves(q, id).some((t) => /enjeux/.test(t)), id); });
[['gouts', 'dessin'], ['coeur', 'creer'], ['dansspe', 'creation', 'hlp']].forEach(([q, id, spe]) => { assert.ok(trouves(q, id, spe).length && !trouves(q, id, spe).some((t) => /smart|artificielle/i.test(t)), id); });
assert.ok(!trouves('coeur', 'prive').some((t) => /centres de données|match/.test(t)));
assert.ok(trouves('gouts', 'ile').some((t) => /câbles/.test(t)) && !trouves('gouts', 'ile').some((t) => /fracture/.test(t)));
assert.ok(trouves('dansspe', 'mers', 'hggsp').some((t) => /câbles/.test(t))); assert.ok(trouves('dansspe', 'traduire', 'llce').every((t) => /tradui/.test(t)));
// des faits exacts : WannaCry est un rançongiciel (pas un virus) ; Wikipédia, « que tout le monde peut modifier » ; pas « presque toutes nos données »
C.concat(D.SUJETS.map((x) => ({ q: x.t }))).forEach((x) => { assert.ok(!/virus informatique|écrite par tout le monde|presque toutes nos données/.test(x.q), x.q); });
console.log('mots cherchés et faits : essais passés');
// hauts faits ajoutés (T74)
const d5 = dossier(question()); d5.compteurs = { jours: 5, deplacements: 5, annulations: 1 };
d5.sources = [{ id: 's1', titre: 'A', date: '1948', type: 'experte', lien: 'https://a.fr/x', retiens: 'une idée forte' }];
d5.mots = [{ id: 'm1', mot: 'Bit', defSource: 'a', defMoi: 'b', analogie: 'un interrupteur' }];
d5.questions[0].parties[0].points.push({ id: 'p1', texte: 'sudo apt install', etiquette: 'exemple', mots: ['m1'], sources: ['s1'] });
const g5 = A.majHautsFaits(d5).map((h) => h.id);
['dory', 'nami', 'ctrlz', 'lara', 'zelda', 'sudo'].forEach((x) => assert.ok(g5.includes(x), x));
['vingt', 'cape', 'tetris', 'arya', 'onze', 'hermione', 'enola', 'p404', 'leia', 'gear', 'shuri', 'volontaire'].forEach((x) => assert.ok(!g5.includes(x), x));
assert.ok(A.HAUTS_FAITS.length >= 50);
console.log('hauts faits : ' + A.HAUTS_FAITS.length);

// ---------- Les quiz « Vérifie que tu as compris » (1.4.0) ----------
assert.strictEqual(A.HAUTS_FAITS.length, 54, 'hauts faits : 52 + 2 pour les quiz');
assert.deepStrictEqual(D.COMPRENDRE.map((z) => z.id), ['epreuve', 'plan']);
const cibles = ['#/aide/epreuve', '#/aide/exemple'].concat(D.FICHES.map((f) => '#/aide/' + f.id));
const idsQ = new Set();
D.COMPRENDRE.forEach((z) => {
  assert.ok(z.titre && z.court && z.chapo, z.id);
  assert.strictEqual(z.questions.length, 10, z.id + ' : 10 questions');
  const positions = new Set();
  z.questions.forEach((q) => {
    assert.ok(/^[a-z0-9]{1,8}$/.test(q.id) && !idsQ.has(q.id), 'identifiant ' + q.id); idsQ.add(q.id);
    assert.ok(q.q.trim().length > 10, q.id + ' : question');
    assert.strictEqual(q.o.length, 4, q.id + ' : 4 options');
    assert.ok(Number.isInteger(q.b) && q.b >= 0 && q.b < 4, q.id + ' : une seule bonne réponse, b entre 0 et 3'); positions.add(q.b);
    q.o.forEach((o, k) => { assert.ok(Array.isArray(o) && o.length === 2 && o[0].trim() && o[1].trim(), q.id + ' option ' + k + ' : texte et retour non vides');
      assert.ok(!/\\u[0-9a-f]{4}/i.test(o.join('')), q.id + ' : pas de séquence \\u'); });
    assert.strictEqual(new Set(q.o.map((o) => o[0])).size, 4, q.id + ' : 4 options différentes');
    assert.ok(Array.isArray(q.r) && cibles.includes(q.r[0]) && q.r[1], q.id + ' : lien « Revoir » valide ' + q.r);
  });
  assert.ok(positions.size === 4, z.id + ' : la bonne réponse change de position');
});
assert.ok(/^https:\/\/www\.youtube\.com\/watch\?v=3mN9w6rpXgE$/.test(D.VIDEO_EPREUVE.lien));
// le résultat dans le dossier : accepté s'il a la bonne forme, refusé sinon ; un ancien dossier reste valide
const base = () => ({ v: 1, questions: [] });
assert.ok(A.dossierValide(base()), 'ancien dossier, sans quiz');
assert.ok(A.dossierValide(Object.assign(base(), { comprendre: { epreuve: { meilleur: 10, dernier: 8, le: '2026-11-17', essais: 2, rates: ['e3', 'e6'] } } })));
[{ plan: { meilleur: 2, dernier: -1, le: '', essais: 1 } }, { plan: { meilleur: '10', dernier: 1, le: '', essais: 1 } }, { plan: { meilleur: 2, dernier: 1, le: '', essais: 1.5 } },
  { plan: { meilleur: 2, dernier: 1, le: 3, essais: 1 } }, { plan: { meilleur: 2, dernier: 1, le: '', essais: 1, rates: ['<img>'] } }, { plan: null }, { autre: 3 }, { '<b>': {} }, []]
  .forEach((c) => assert.ok(!A.dossierValide(Object.assign(base(), { comprendre: c })), JSON.stringify(c)));
// ce qu'une version plus récente pourrait écrire (un quiz de plus, plus de questions, une question nouvelle) : accepté,
// pour qu'un appareil resté sur cette version ne refuse jamais le dossier (tests/dossiers.py)
[{ autre: { meilleur: 1, dernier: 1, le: '', essais: 1, nouveau: [1] } }, { plan: { meilleur: 11, dernier: 1, le: '', essais: 1 } },
  { plan: { meilleur: 2, dernier: 1, le: '', essais: 1, rates: ['e1', 'p11'], duree: 300 } }]
  .forEach((c) => assert.ok(A.dossierValide(Object.assign(base(), { comprendre: c })), JSON.stringify(c)));
// hauts faits et prochaine étape
const dq = dossier(question()); dq.comprendre = { epreuve: { meilleur: 9, dernier: 9, le: '2026-11-17', essais: 1, rates: ['e1'] } };
assert.ok(!A.majHautsFaits(dq).some((h) => h.id === 'regles'));
dq.comprendre.epreuve.meilleur = 10; dq.comprendre.plan = { meilleur: 10, dernier: 10, le: '2026-11-17', essais: 3, rates: [] };
const gq = A.majHautsFaits(dq).map((h) => h.id); assert.ok(gq.includes('regles') && gq.includes('accroc'), gq);
const dp = dossier(); dp.decouverte = { reactions: {} }; for (let i = 1; i <= 10; i++) dp.decouverte.reactions[i] = 1;
dp.pistes = [{ id: 'x', titre: 'Une piste', candidates: [] }];
assert.strictEqual(A.prochaineAction(dp).vers, '#/comprendre/epreuve', 'quiz proposé avant de choisir sa question');
dp.comprendre = { epreuve: { meilleur: 3, dernier: 3, le: '', essais: 1, rates: [] } };
assert.strictEqual(A.prochaineAction(dp).vers, '#/explorer/pistes', 'un essai suffit : la suite reprend, sans exiger de score');
const dpl = dossier(question()); for (let i = 0; i < 9; i++) dpl.questions[0].parties[1].points.push(pt('point ' + i));
dpl.comprendre = { epreuve: { meilleur: 3, dernier: 3, le: '', essais: 1, rates: [] } };
assert.strictEqual(A.prochaineAction(dpl).vers, '#/comprendre/plan', 'quiz du plan quand le plan prend forme');
console.log('quiz : 2 quiz de 10 questions, données, dossier, hauts faits et prochaine étape vérifiés');
