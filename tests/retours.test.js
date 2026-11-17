// Essais des retours, du résumé, de la fusion et du format pour l'IA : node tests/retours.test.js
'use strict';
const assert = require('assert');
global.HGDonnees = require('../js/donnees.js');
global.HGAnalyse = require('../js/coach.js');
const R = require('../js/retours.js');
const A = global.HGAnalyse;
let n = 0;
const essai = (nom, f) => { f(); n++; };

const dossier = () => ({ v: 1, profil: { prenom: 'Zoé M.', vu: true }, quiz: { reponses: { spe: 'maths' }, fait: true }, interets: ['musique'], ponts: [''],
  pistes: [{ id: 'pi1', titre: 'IA et musique', pourquoi: '', idees: [''], candidates: [''] }],
  questions: [{ id: 'q1', titre: 'Une IA peut-elle composer ?', statut: 'proposee', echange: [{ id: 'e1', question: 'Qui est l’auteur ?', reponse: '' }],
    parties: [{ id: 'pa1', titre: 'Introduction', minutes: 2, points: [{ id: 'p1', texte: 'Accroche : un tube écrit par une IA', etiquette: '', mots: ['m1'], sources: ['s1'] }] },
      { id: 'pa2', titre: 'Axe 1', minutes: 3, points: [{ id: 'p2', texte: 'Comment apprend-elle ?', etiquette: '', mots: [], sources: [] }, { id: 'p3', texte: 'Les données', etiquette: '', mots: [], sources: [] }] }] }],
  decouverte: { reactions: { 3: 1 } }, mots: [{ id: 'm1', mot: 'Réseau de neurones', defSource: 'Un modèle…', sourceTexte: 'CNIL', defMoi: 'Un programme…', analogie: '' }],
  sources: [{ id: 's1', titre: 'IA et création', auteur: 'CNIL', lien: 'https://www.cnil.fr', type: '', date: '2024', retiens: '' }, { id: 's2', titre: 'Vidéo', auteur: '', lien: '', type: '', date: '', retiens: '' }],
  oraux: [{ id: 'o1', nom: 'Oral blanc 1', auto: {} }], hf: {}, compteurs: {}, vus: {} });

essai('le dossier d’essai est valide', () => assert.ok(A.dossierValide(dossier())));
essai('suivi : accepté s’il a la bonne forme, refusé sinon', () => {
  const d = dossier(); d.suivi = { lus: { r1: 1 }, def: { r2: 'm1' }, faits: { r3: 1 }, ressources: { r4: 'ajoutee', r5: 'plus-tard' } }; assert.ok(A.dossierValide(d));
  d.suivi.ressources.r6 = 'autre'; assert.ok(!A.dossierValide(d));
  const e = dossier(); e.suivi = { def: { r1: '<b>' } }; assert.ok(!A.dossierValide(e));
  const f = dossier(); f.suivi = { inconnu: {} }; assert.ok(!A.dossierValide(f));
});

essai('résumé : les chiffres du tableau, moins de 4 000 caractères', () => {
  const r = R.resume(dossier());
  assert.strictEqual(r.points, 3); assert.strictEqual(r.mots, 1); assert.strictEqual(r.mots_complets, 1); assert.strictEqual(r.sources, 2);
  assert.strictEqual(r.questions[0].statut, 'proposee'); assert.strictEqual(r.questions[0].echange, 1); assert.strictEqual(r.pistes, 1); assert.strictEqual(r.gouts.spe, 'maths');
  const d = dossier(); d.questions[0].titre = 'x'.repeat(5000); d.quiz.reponses = {}; for (let i = 0; i < 200; i++) d.quiz.reponses['q' + i] = ['un', 'deux', 'trois'];
  for (let i = 0; i < 60; i++) d.oraux.push({ id: 'o' + (i + 2), nom: 'y'.repeat(100), auto: {} });
  assert.ok(JSON.stringify(R.resume(d)).length <= 4000, JSON.stringify(R.resume(d)).length);
});

essai('retours : un retour abîmé ou piégé est écarté', () => {
  const r = R.nettoyer({ v: 1, items: [
    { id: 'a', type: 'commentaire', cible: { type: 'point', id: 'p1' }, texte: 'Bien' },
    { id: 'b', type: 'commentaire', cible: { type: 'point', id: '"><img>' }, texte: 'x' },
    { id: 'c', type: 'ressource', url: 'javascript:alert(1)', titre: 't' },
    { id: 'd', type: 'ressource', url: 'https://exemple.fr/a', titre: 't', verifier: true, ia: true },
    { id: 'e', type: 'evaluation', oral: 'o1', notes: { oral: 3, continu: 9, autre: 2 } },
    { id: 'f', type: 'inconnu' }, { id: 'g h', type: 'question', texte: 'x' }, { id: 'i', type: 'validation', qid: 'q1', etat: 'oui' },
    { id: 'j', type: 'commentaire', cible: { type: 'bilan' }, texte: 'Bilan' }] });
  assert.deepStrictEqual(r.items.map((x) => x.id), ['a', 'd', 'e', 'j']);
  assert.deepStrictEqual(r.items[2].notes, { oral: 3 });
  assert.ok(r.items[1].ia && r.items[1].verifier);
  assert.deepStrictEqual(R.nettoyer({}), { v: 1, items: [] }); assert.deepStrictEqual(R.nettoyer(null), { v: 1, items: [] });
});

essai('format pour l’IA : repères stables, sans prénom, consignes et exemple', () => {
  const t = R.texteIA(dossier());
  assert.ok(!t.includes('Zoé'));
  ['P1 ', 'P2 ', 'P3 ', 'M1 ', 'S1 ', 'S2 ', 'Q1 ', 'CONSIGNES', 'FORMAT DE TA RÉPONSE', '@DEFINIR', '@SOURCE', '@BILAN', 'N’invente jamais de lien', 'Tutoie'].forEach((x) => assert.ok(t.includes(x), x));
  assert.ok(t.includes('(liés : M1, S1)'));
  assert.ok(t.indexOf('CONSIGNES') < t.indexOf('LE DOSSIER') && t.indexOf('LE DOSSIER') < t.indexOf('FORMAT DE TA RÉPONSE'));
});

essai('lecture du retour de l’IA : tolérante', () => {
  const d = dossier();
  const brut = ['Voici mes remarques :', '```', '@P1 Bonne accroche.', '- @P2 : Précise la question.', '1. **@P3** - Ajoute une source.', '* [M1] Définition claire.',
    '> « @S2 — Donne l’auteur. »', '@q1 Prépare un exemple.', '@Definir apprentissage | tu l’utilises sans l’expliquer', '@SOURCE https://www.cnil.fr/fr/ia | La CNIL | officiel',
    '@SOURCE www.sans-protocole.fr | x | y', '@QUESTION Qui est responsable ?', '@BILAN Plan clair.', '@P9 Repère inconnu.', '@AUTRE chose', '```', 'Bon courage !'].join('\n');
  const r = R.lireIA(brut, d);
  const desc = r.brouillons.map((x) => x.type + ':' + (x.cible ? x.cible.type + '/' + x.cible.id : x.mot || x.url || '') + ':' + x.texte);
  assert.deepStrictEqual(desc, [
    'commentaire:point/p1:Bonne accroche.', 'commentaire:point/p2:Précise la question.', 'commentaire:point/p3:Ajoute une source.', 'commentaire:mot/m1:Définition claire.',
    'commentaire:source/s2:Donne l’auteur.', 'commentaire:echange/e1:Prépare un exemple.', 'definir:apprentissage:tu l’utilises sans l’expliquer',
    'ressource:https://www.cnil.fr/fr/ia:officiel', 'question::Qui est responsable ?', 'commentaire:bilan/:Plan clair.']);
  assert.ok(r.brouillons.every((x) => x.ia === true));
  assert.ok(r.brouillons[7].verifier && r.brouillons[7].titre === 'La CNIL');
  assert.deepStrictEqual(r.inconnues, ['@SOURCE www.sans-protocole.fr | x | y', '@P9 Repère inconnu.', '@AUTRE chose']);
  assert.strictEqual(r.ignorees, 2);
  // tout ce qui sort de la lecture repasse le contrôle des retours
  assert.strictEqual(R.nettoyer({ v: 1, items: r.brouillons }).items.length, r.brouillons.length);
});

essai('code : lecture tolérante', () => {
  assert.strictEqual(R.lireCode(' micro decor 4o2 '), 'MICRO-DECOR-402');
  assert.strictEqual(R.lireCode('Micro-Décor-I23'), 'MICRO-DECOR-123');
  assert.strictEqual(R.lireCode('MICR0–DEC0R–123'), 'MICRO-DECOR-123');
  assert.strictEqual(R.lireCode('micro  decor482'), 'MICRO-DECOR-482');
});

essai('fusion à trois : chaque côté garde ce qu’il a changé seul', () => {
  const base = dossier(), local = dossier(), distant = dossier();
  local.mots.push({ id: 'm2', mot: 'Biais', defSource: '', sourceTexte: '', defMoi: '', analogie: '' });
  local.questions[0].parties[1].points[0].texte = 'Modifié ici';
  distant.questions[0].parties[1].points[1].texte = 'Modifié ailleurs';
  distant.sources = distant.sources.filter((s) => s.id !== 's2');
  const f = R.fusionner(base, local, distant);
  assert.ok(!f.conflit); assert.ok(A.dossierValide(f.resultat));
  assert.deepStrictEqual(f.resultat.mots.map((m) => m.id), ['m1', 'm2']);
  assert.strictEqual(f.resultat.questions[0].parties[1].points[0].texte, 'Modifié ici');
  assert.strictEqual(f.resultat.questions[0].parties[1].points[1].texte, 'Modifié ailleurs');
  assert.deepStrictEqual(f.resultat.sources.map((s) => s.id), ['s1']);
});
essai('fusion à trois : le même texte changé des deux côtés prend la version de la base', () => {
  const base = dossier(), local = dossier(), distant = dossier();
  local.questions[0].titre = 'Ici'; distant.questions[0].titre = 'Ailleurs';
  const f = R.fusionner(base, local, distant);
  assert.ok(f.conflit); assert.strictEqual(f.resultat.questions[0].titre, 'Ailleurs');
  assert.deepStrictEqual(R.textesAbsents(local, f.resultat).map((x) => x[1]), ['Ici']);
  // de même pour le titre d'une partie et le nom d'un oral (gardés à part, jamais perdus en silence)
  const b2 = dossier(), l2 = dossier(), r2 = dossier();
  l2.questions[0].parties[1].titre = 'Axe 1 : ici'; r2.questions[0].parties[1].titre = 'Axe 1 : ailleurs';
  l2.oraux[0].nom = 'Oral du lundi'; r2.oraux[0].nom = 'Oral du mardi';
  const f2 = R.fusionner(b2, l2, r2);
  assert.ok(f2.conflit); assert.deepStrictEqual(R.textesAbsents(l2, f2.resultat).map((x) => x[1]), ['Axe 1 : ici', 'Oral du lundi']);
});
essai('fusion à trois : un point ajouté ici reste à sa place', () => {
  const base = dossier(), local = dossier(), distant = dossier();
  local.questions[0].parties[1].points.splice(1, 0, { id: 'pn', texte: 'Nouveau', etiquette: '', mots: [], sources: [] });
  distant.questions[0].parties[1].points.push({ id: 'pd', texte: 'De la base', etiquette: '', mots: [], sources: [] });
  const f = R.fusionner(base, local, distant);
  assert.deepStrictEqual(f.resultat.questions[0].parties[1].points.map((p) => p.id), ['p2', 'pn', 'p3', 'pd']);
});

// La base (jsonb) rend les clés dans son ordre à elle : par longueur, puis dans l'ordre des caractères.
const commeLaBase = (x) => Array.isArray(x) ? x.map(commeLaBase) : (x && typeof x === 'object')
  ? Object.keys(x).sort((a, b) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0)).reduce((o, k) => { o[k] = commeLaBase(x[k]); return o; }, {}) : x;
essai('fusion à trois : l’ordre des clés rendu par la base ne compte pas (une suppression ici reste faite)', () => {
  const base = dossier(), local = dossier(), distant = commeLaBase(dossier());
  local.questions[0].parties[1].points = local.questions[0].parties[1].points.filter((p) => p.id !== 'p3');
  local.mots = [];
  distant.questions[0].parties[1].points[0].texte = 'Modifié ailleurs';
  const f = R.fusionner(base, local, distant);
  assert.ok(!f.conflit, 'pas de conflit');
  assert.deepStrictEqual(f.resultat.questions[0].parties[1].points.map((p) => p.id), ['p2']);
  assert.strictEqual(f.resultat.questions[0].parties[1].points[0].texte, 'Modifié ailleurs');
  assert.deepStrictEqual(f.resultat.mots, []);
  assert.ok(A.dossierValide(f.resultat));
  // et la même chose quand la version connue vient elle-même de la base
  const f2 = R.fusionner(commeLaBase(dossier()), local, distant);
  assert.ok(!f2.conflit); assert.deepStrictEqual(f2.resultat.questions[0].parties[1].points.map((p) => p.id), ['p2']);
});

console.log('retours, résumé, fusion et format pour l’IA : ' + n + ' essais passés');
