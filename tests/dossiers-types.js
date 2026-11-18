// Des dossiers types, un par version publiée de Hello GO, tels que chaque version les écrivait (données inventées).
// Servent aux essais de non-régression (tests/compatibilite.test.js) et de l'export (tests/export.test.js).
// Les versions publiées et le commit de leur publication sur main : leur js/donnees.js et leur fichier d'analyses
// (js/analyse.js jusqu'à la 1.3.1, js/coach.js ensuite) donnent leur dossierValide, pour vérifier qu'une ancienne version
// accepte un dossier écrit par la nouvelle.
const VERSIONS = [
  { v: '1.0.0', commit: 'da25fa5' }, { v: '1.1.0', commit: '6b45cf1' }, { v: '1.2.0', commit: 'd654f95' },
  { v: '1.3.0', commit: 'ffdbd76' }, { v: '1.3.1', commit: 'df87f84' }, { v: '1.3.2', commit: 'ef8b049' }, { v: '1.4.0 (branche)', commit: '66dce00' }, { v: '1.4.0', commit: '5c92a5d' },
  { v: '1.5.0', commit: '4af835c' }, { v: '1.6.0', commit: 'd32c149' }, { v: '1.7.0', commit: '284701d' },
];

const point = (id, texte, etiquette, mots, sources) => ({ id: id, texte: texte, etiquette: etiquette || '', mots: mots || [], sources: sources || [] });
// 1.0.0 : le dossier sur l'appareil (profil, questionnaire, pistes, questions et plan, mots, sources, oraux, hauts faits).
function v100() {
  return { v: 1, profil: { prenom: 'Zoé', vu: true }, quiz: { reponses: {}, fait: false }, interets: ['jeux vidéo', '', ''], ponts: [''],
    pistes: [{ id: 'pi1', titre: 'Les biais des IA', pourquoi: 'Ça m’intrigue', idees: ['recrutement'], candidates: ['Les IA sont-elles neutres ?'] }],
    questions: [{ id: 'q1', titre: 'Comment lutter contre les biais algorithmiques ?', statut: 'brouillon', echange: [{ id: 'x1', question: 'Pourquoi ce sujet ?', reponse: 'NSI, société' }],
      parties: [{ id: 'a1', titre: 'Introduction', minutes: 2, points: [point('p1', 'IA de recrutement d’Amazon abandonnée', 'accroche', ['m1'], ['s1'])] },
        { id: 'a2', titre: 'Axe 1', minutes: 3, points: [point('p2', 'Données d’entraînement déséquilibrées')] }] }],
    mots: [{ id: 'm1', mot: 'Algorithme', defSource: 'Suite finie d’instructions', sourceTexte: 'Larousse', defMoi: 'Une liste d’étapes', analogie: 'Une recette de cuisine' }],
    sources: [{ id: 's1', titre: 'Algorithmes : prévenir l’automatisation des discriminations', auteur: 'Défenseur des droits', lien: 'https://www.defenseurdesdroits.fr/', date: '2020', retiens: 'Les biais viennent des données', type: '' }],
    oraux: [{ id: 'o1', nom: 'Oral blanc 1', auto: { oral: 2, continu: 3 } }, { id: 'o2', nom: 'Oral blanc 2', auto: {} }],
    hf: { hello: '2026-11-10', accroche: '2026-11-10' }, compteurs: { jours: 2 }, vus: { jour: 20402 } };
}
// 1.1.0 : les cartes à découvrir (decouverte.reactions) et le questionnaire riche.
function v110() { const d = v100(); d.decouverte = { reactions: { 1: 1, 2: -1, 7: 1 } }; d.quiz = { reponses: { domaines: ['jeux', 'societe'], spe: 'ses' }, fait: true }; return d; }
// 1.2.0 : 52 hauts faits et leurs compteurs (annulations, déplacements, PDF…).
function v120() { const d = v110(); d.hf.ctrlz = '2026-11-12'; Object.assign(d.compteurs, { jours: 4, annulations: 1, deplacements: 3, pdf: 1 }); d.vus.decalage = 2; return d; }
// 1.3.0 à 1.3.2 : la version en ligne, et ce que l'élève fait des retours (suivi).
function v130() { const d = v120(); d.suivi = { lus: { r1: 1 }, faits: { r2: 1 }, def: { r3: 'm1' }, ressources: { r4: 'ajoutee' } }; d.oraux[0].video = true; d.oraux[0].date = '2026-11-14'; d.oraux[0].objectifs = 'Regarder le jury'; return d; }
// 1.4.0 : les quiz « Vérifie que tu as compris » (10 questions par quiz, toujours les mêmes).
function v140() { const d = v130(); d.comprendre = { epreuve: { meilleur: 8, dernier: 8, le: '2026-11-17', essais: 1, rates: ['e3', 'e6'] }, plan: { meilleur: 10, dernier: 10, le: '2026-11-17', essais: 2, rates: [] } }; d.hf.accroc = '2026-11-17'; return d; }

// 1.5.0 : les jours de visite (visites), et, par quiz, les questions vues et ratées d'une salve à l'autre (banque) ;
// « rates_toutes » cite toutes les questions ratées de la dernière salve, « rates » seulement les 10 premières (comme la 1.4.0).
function v150() {
  const d = v140(); d.visites = { '2026-11-16': 1, '2026-11-17': 1 };
  d.comprendre.epreuve = { meilleur: 9, dernier: 9, le: '2026-11-17', essais: 2, rates: [], rates_toutes: ['e16'] };
  d.banque = { epreuve: { le: '2026-11-17', vues: { e1: 2, e2: 1, e3: 2, e5: 1, e6: 2, e11: 1, e14: 1, e16: 1, e17: 1, e20: 1 }, ratees: { e16: 1 } },
    plan: { le: '2026-11-17', vues: { p1: 2, p2: 1, p3: 1 }, ratees: {} } };
  return d;
}

// 1.6.0 : la culture (vidéos regardées et notes, « Info ou infox ? », accroches gardées, affirmation du jour).
function v160() { const d = v150(); d.culture = { videos: { 'craquer-wordle': { vue: '2026-11-18', retiens: 'L’entropie mesure l’information', intrigue: 'Le meilleur premier mot', piste: 'pi1' }, 'terres-rares': { avis: -1 } },
  infox: { 'arpanet-lo': { v: 1, j: 1, d: 1, le: '2026-11-18' }, 'pacman-256': { v: 2, j: 1, d: 0, le: '2026-11-18' } }, accroches: { 'pacman-256': { le: '2026-11-18', q: 'q1', p: 'p1' } },
  salves: 1, sansfaute: 0, jour: { j: '2026-11-18', id: 'arpanet-lo' } }; d.hf.video1 = '2026-11-18'; return d; }

const DOSSIERS = { '1.0.0': v100, '1.1.0': v110, '1.2.0': v120, '1.3.0': v130, '1.3.1': v130, '1.3.2': v130, '1.4.0': v140, '1.5.0': v150, '1.6.0': v160 };
module.exports = { VERSIONS, DOSSIERS };
