// La culture (version 1.6.0) : node tests/culture.test.js
// Données (liens, étiquettes, sources, champs), recommandations de vidéos (chaque réponse du questionnaire mène à au moins
// 3 vidéos, « pourquoi » justes, variété, jamais une vidéo vue en tête), salves « Info ou infox ? » et accroches, conseils
// du jour, dossier (validation, fusion), résumé, export Markdown.
const assert = require('assert'), fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const C = require('../js/culture.js'), D = require('../js/donnees.js'), A = require('../js/coach.js'), R = require('../js/retours.js'), X = require('../js/export.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const lien = (u) => typeof u === 'string' && /^https:\/\/[^\s<>"\\]+$/.test(u);
const neuf = () => ({ v: 1, profil: { prenom: 'Zoé', vu: true }, quiz: { reponses: {}, fait: false }, interets: ['', '', ''], ponts: [''], pistes: [], questions: [],
  decouverte: { reactions: {} }, comprendre: {}, mots: [], sources: [], oraux: [], hf: {}, compteurs: {}, vus: {} });
const alea = (g) => () => { g = (g * 16807) % 2147483647; return g / 2147483647; };

// ---------- 1. Les données ----------
const RECH = path.join(__dirname, '..', 'outils', 'culture'), lire = (f) => JSON.parse(fs.readFileSync(path.join(RECH, f), 'utf8'));
const V0 = lire('videos.json'), X0 = lire('info-ou-infox.json'), C0 = lire('conseils.json');
ok(C.VIDEOS.length === V0.videos.filter((v) => v.statut !== 'non_verifie').length && C.VIDEOS.length >= 40, 'vidéos : toutes les vérifiées, aucune autre');
ok(!C.VIDEOS.some((v) => /Dessous des cartes|Scilabus/i.test(v.titre + v.chaine)), 'vidéos non vérifiées écartées (Le Dessous des cartes, Scilabus)');
C.VIDEOS.forEach((v) => {
  const o = V0.videos.find((x) => x.id === v.id);
  ok(o && o.url === v.url && o.titre === v.titre && o.chaine === v.chaine, v.id + ' : lien, titre ou chaîne changé');
  ok(lien(v.url) && /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/.test(v.url), v.id + ' : lien mal formé');
  ok(v.interets.length && v.interets.every((t) => D.TAGS.i[t]) && v.notions.length && v.notions.every((t) => D.TAGS.n[t]), v.id + ' : étiquettes inconnues');
  ['titre', 'chaine', 'accroche', 'question', 'plateforme', 'langue'].forEach((k) => ok(typeof v[k] === 'string' && v[k].trim(), v.id + ' : ' + k));
  ok(['enseignant', 'proposee'].includes(v.origine), v.id + ' : origine');
});
ok(new Set(C.VIDEOS.map((v) => v.id)).size === C.VIDEOS.length, 'vidéos : identifiants uniques');
['reseaux-deuil', 'chatgpt-dissertations', 'jeu-de-la-vie', 'blockchain-comment', 'reseaux-neurones'].forEach((k) => ok(C.VIDEOS.some((v) => v.id === k), 'correspondance acceptée par l’enseignant : ' + k));
C.CHAINES.forEach((c) => ok(lien(c.url) && c.nom && c.phrase && V0.chaines.some((x) => x.url === c.url), 'chaîne ' + c.nom));
ok(C.CHAINES.length === V0.chaines.length, 'toutes les chaînes');
ok(C.INFOX.length === X0.affirmations.length && C.INFOX.length >= 60, 'toutes les affirmations');
C.INFOX.forEach((a) => {
  const o = X0.affirmations.find((x) => x.id === a.id);
  ok(o && o.affirmation === a.affirmation && o.vrai === a.vrai && o.accroche === a.accroche && o.source.url === a.source.url, a.id + ' : texte ou source changé');
  ok(typeof a.vrai === 'boolean' && a.explication && a.accroche && a.source.titre && lien(a.source.url), a.id + ' : champs');
  ok(a.sujets.length && a.interets.every((t) => D.TAGS.i[t]) && a.notions.every((t) => D.TAGS.n[t]), a.id + ' : étiquettes');
  (a.autres || []).forEach((s) => ok(lien(s.url) && s.titre, a.id + ' : source complémentaire'));
});
ok(C.CONSEILS.length === C0.conseils.length && C.CONSEILS.length === 40, '40 conseils');
const SOLIDITES = ['bien établi', 'plusieurs études', 'une étude', 'repère de manuel', 'consignes aux jurys'];
C.CONSEILS.forEach((c) => {
  const o = C0.conseils.find((x) => x.id === c.id);
  ok(o && o.conseil === c.conseil && o.pourquoi === c.pourquoi && o.source.url === c.source.url && o.phase === c.phase, c.id + ' : texte ou source changé');
  ok(SOLIDITES.includes(c.solidite) && lien(c.source.url) && c.source.annee, c.id + ' : solidité ou source');
  if (/contrôler/.test(o.source.lu_par || '')) ok(!c.source.auteurs && !c.source.titre, c.id + ' : détail à contrôler affiché');
  else ok(c.source.auteurs === o.source.auteurs && c.source.titre === o.source.titre, c.id + ' : auteur·e·s ou titre changés');
  (c.fiches || []).forEach((f) => ok(D.FICHES.some((x) => x.id === f), c.id + ' : fiche ' + f));
  if (c.quiz) ok(D.COMPRENDRE.some((z) => z.id === c.quiz), c.id + ' : quiz ' + c.quiz);
});
['premiere-phrase', 'debut-et-fin', 'derniere-phrase', 'un-temps-fort'].forEach((k) => ok(C.CONSEILS.find((c) => c.id === k).fiches.includes('plan'), k + ' : relié à la fiche du plan'));
ok(C.CONSEILS.filter((c) => c.solidite === 'consignes aux jurys').length && !C.CONSEILS.some((c) => c.solidite === 'retour de jurys'), 'retour de jurys → consignes aux jurys');
// Le fichier fabriqué est à jour (l'outil le régénère à l'identique).
const avant = fs.readFileSync(path.join(__dirname, '..', 'js', 'culture.js'), 'utf8');
execFileSync('python3', ['-I', path.join(__dirname, '..', 'outils', 'generer_culture.py')], { stdio: 'ignore' });
ok(fs.readFileSync(path.join(__dirname, '..', 'js', 'culture.js'), 'utf8') === avant, 'js/culture.js est celui que fabrique outils/generer_culture.py');

// ---------- 2. Les vidéos conseillées ----------
// Sans réponse : 3 vidéos d'entrée, variées, et l'invitation à « Mes goûts ».
const e0 = A.videosPour(neuf());
ok(e0.length === 3 && e0.every((x) => C.ENTREE.includes(x.video.id) && /Mes goûts/.test(x.pourquoi)), 'sans réponse : 3 vidéos d’entrée');
ok(new Set(e0.map((x) => x.video.chaine)).size === 3 && new Set(e0.map((x) => x.video.interets[0])).size === 3, 'vidéos d’entrée variées');
// Chaque réponse du questionnaire mène à au moins 3 vidéos, avec des « pourquoi » justes.
let reponses = 0;
D.QUIZ.forEach((q) => {
  const choix = q.groupes ? q.groupes.reduce((l, g) => l.concat(g[1]), []) : q.choixSelon ? Object.keys(q.choixSelon).reduce((l, k) => l.concat(q.choixSelon[k].map((c) => ({ c: c, spe: k }))), []) : q.choix;
  choix.forEach((c0) => {
    const c = c0.c || c0, spe = c0.spe || null;
    const d = neuf(); d.quiz.reponses[q.id] = q.multi ? [c[0]] : c[0]; if (spe) d.quiz.reponses.spe = spe;
    const l = A.videosPour(d); reponses++;
    ok(l.length === 3, q.id + '/' + c[0] + ' : 3 vidéos');
    ok(new Set(l.map((x) => x.video.id)).size === 3 && new Set(l.map((x) => x.video.chaine)).size === 3, q.id + '/' + c[0] + ' : trois chaînes différentes');
    const noms = c[2].i.map((t) => D.TAGS.i[t]).concat(c[2].n.map((t) => D.TAGS.n[t]));
    l.forEach((x) => {
      ok(x.pourquoi && x.pourquoi.length > 10, q.id + '/' + c[0] + ' : pourquoi absent');
      x.choisi.forEach((t) => ok(noms.includes(t) || (c[2].k && t === '« ' + c[1] + ' »'), q.id + '/' + c[0] + ' : raison « ' + t + ' » non choisie'));
      x.choisi.filter((t) => noms.includes(t)).forEach((t) => ok(x.video.interets.map((k) => D.TAGS.i[k]).concat(x.video.notions.map((k) => D.TAGS.n[k])).includes(t), x.video.id + ' : raison « ' + t + ' » absente de ses étiquettes'));
      if (/tu as choisi/.test(x.pourquoi)) ok(x.choisi.length && x.choisi.every((t) => x.pourquoi.includes(t)), x.video.id + ' : pourquoi incohérent');
    });
    if (noms.length) ok(l.some((x) => x.choisi.length), q.id + '/' + c[0] + ' : aucune vidéo liée à la réponse');
  });
});
ok(reponses > 80, 'toutes les réponses du questionnaire essayées (' + reponses + ')');
// Les cartes aimées comptent ; la raison le dit.
{ const d = neuf(); [58, 80].forEach((k) => { d.decouverte.reactions[k] = 1; }); const l = A.videosPour(d);
  ok(l[0].cartes.length && /cartes sur .* t’ont intrigué·e/.test(l[0].pourquoi), 'cartes aimées : raison « des cartes sur… »'); }
// Enseignant·e avant les compléments à pertinence égale ; jamais une vidéo vue en tête ; « Pas pour moi » écarte et affine.
{ const d = neuf(); d.quiz.reponses.gouts = ['jv']; const cl = A.classerVideos(d);
  for (let i = 1; i < cl.length; i++) if (cl[i].score === cl[i - 1].score && !cl[i].vue && !cl[i - 1].vue) ok(!(cl[i].video.origine === 'enseignant' && cl[i - 1].video.origine !== 'enseignant'), 'enseignant·e avant les compléments');
  const t = A.videosPour(d)[0].video.id; A.cultureDe(d).videos[t] = { vue: '2026-11-18', retiens: '', intrigue: '' };
  ok(A.videosPour(d)[0].video.id !== t && A.videosPour(d, 1, 0)[0].video.id !== t, 'une vidéo vue ne revient pas en tête');
  for (let k = 0; k < 10; k++) ok(!A.videosPour(d, 1, k)[0].vue, '« Une autre » (' + k + ') : jamais une vidéo vue');
  const u = A.videosPour(d)[0].video.id; d.culture.videos[u] = { avis: -1 };
  ok(!A.classerVideos(d).some((x) => x.video.id === u), '« Pas pour moi » : la vidéo n’est plus proposée');
  const avantR = A.classerVideos(neuf()).length; ok(A.classerVideos(d).length === C.VIDEOS.length - 1 && avantR === C.VIDEOS.length, '« Pas pour moi » n’écarte qu’une vidéo'); }
{ const d = neuf(); d.quiz.reponses.gouts = ['musique']; d.quiz.reponses.nsi = ['ia'];
  const l = A.videosPour(d); ok(l.some((x) => x.choisi.includes('la musique')) && l.some((x) => x.choisi.includes('l’intelligence artificielle')), 'les raisons sont variées (musique et IA)'); }

// ---------- 3. « Info ou infox ? » ----------
{ const d = neuf(); d.quiz.reponses.gouts = ['jv']; d.questions = []; d.pistes = [{ id: 'p1', titre: 'Les bugs célèbres', pourquoi: '', idees: [], candidates: ['Un bug peut-il coûter des vies ?'] }];
  const s1 = A.tirerInfox(d, 7, alea(3));
  ok(s1.length === 7 && new Set(s1).size === 7 && s1.every((k) => A.lInfox(k)), 'une salve : 7 affirmations différentes');
  ok(s1.filter((k) => /jeux/.test(A.lInfox(k).interets.join()) || A.lInfox(k).sujets.some((t) => /bug/i.test(t))).length >= 3, 'la salve commence par les goûts et le sujet');
  ok(new Set(s1.reduce((l, k) => l.concat(A.lInfox(k).notions), [])).size >= 4, 'la salve fait découvrir d’autres notions');
  s1.forEach((k, i) => A.noterInfox(d, k, i !== 2, '2026-11-18')); A.noterSalveInfox(d, 6, 7);
  const s2 = A.tirerInfox(d, 7, alea(5)); ok(s2.every((k) => !s1.includes(k)), 'la salve suivante : jamais vues d’abord');
  // toutes vues : la ratée revient en premier
  C.INFOX.forEach((a) => { if (!d.culture.infox[a.id]) A.noterInfox(d, a.id, true, '2026-11-18'); });
  ok(A.tirerInfox(d, 7, alea(7)).includes(s1[2]), 'toutes vues : la ratée revient');
  ok(A.chiffresCulture(d).infox === C.INFOX.length && A.majHautsFaits(d, '2026-11-18').some((h) => h.id === 'infox30'), 'haut fait : 30 affirmations vues');
  ok(!d.hf.infoxsf, 'pas de sans-faute sans salve sans faute'); A.noterSalveInfox(d, 7, 7); A.majHautsFaits(d, '2026-11-18'); ok(d.hf.infoxsf, 'haut fait : sans-faute');
  // accroches : seules les formulations « accroche » (vraies, ou le démenti) ; pour une question sur les bugs, les faits sur les bugs d'abord
  ok(A.garderAccroche(d, 'gandhi-nucleaire') && !A.garderAccroche(d, 'inconnue'), 'garder une accroche connue seulement');
  const q = { id: 'q1', titre: 'Un bug peut-il coûter des vies ?', statut: 'brouillon', echange: [], parties: [{ id: 'a0', titre: 'Introduction', minutes: 2, points: [] }] };
  const l = A.accrochesPour(d, q); ok(l[0].rel > 0 && l.slice(0, 5).some((x) => x.a.sujets.some((t) => /bug/i.test(t))), 'piocher : les faits liés au sujet d’abord');
  C.INFOX.filter((a) => !a.vrai).forEach((a) => ok(!a.accroche.includes(a.affirmation), a.id + ' : l’accroche d’une infox n’est pas l’affirmation fausse'));
  // l'affirmation du jour : une jamais vue, la même toute la journée
  const e = neuf(), j = A.infoxDuJour(e, '2026-11-18'); ok(j.neuf && A.lInfox(j.a.id), 'affirmation du jour');
  A.cultureDe(e).jour = { j: '2026-11-18', id: j.a.id }; A.noterInfox(e, j.a.id, true, '2026-11-18');
  ok(A.infoxDuJour(e, '2026-11-18').a.id === j.a.id && !A.infoxDuJour(e, '2026-11-18').neuf, 'la même toute la journée');
  ok(A.infoxDuJour(e, '2026-11-19').a.id !== j.a.id, 'le lendemain, une autre, jamais vue'); }

// ---------- 4. Les conseils du jour ----------
[0, 1, 2].forEach((ph) => { const d = neuf(); if (ph) { d.questions = [{ id: 'q', titre: 'Q ?', statut: 'brouillon', echange: [], parties: [{ id: 'a', titre: 'Introduction', minutes: 2, points: Array.from({ length: ph === 2 ? 30 : 3 }, (_, i) => ({ id: 'p' + i, texte: 'x', etiquette: '', mots: [], sources: [] })) }] }]; }
  const l = A.conseilsDuJour(d); ok(A.phase(d) === ph, 'phase ' + ph);
  ok(l.filter((x) => x.conseil).length === C.CONSEILS.filter((c) => c.phase === ph).length && l.filter((x) => x.t).length === D.A_SAVOIR.filter((x) => x.p === ph).length, 'phase ' + ph + ' : les conseils et tous les « à savoir »');
  ok(l[0].conseil && l[1].t, 'phase ' + ph + ' : en alternance'); });
ok(D.A_SAVOIR.length === 42, 'les « à savoir » existants sont gardés');

// ---------- 5. Le dossier : validation, fusion, résumé, export, prochaine étape ----------
{ const d = neuf(); ok(/Découvrir/.test(A.prochaineAction(d).bouton), 'prochaine étape : découvrir d’abord');
  for (let i = 1; i <= 10; i++) d.decouverte.reactions[i] = 1; d.quiz.fait = true;
  ok(A.prochaineAction(d).vers === '#/explorer/infox', 'prochaine étape : Info ou infox ? au début du parcours');
  A.noterInfox(d, 'bug-hopper', true); ok(A.prochaineAction(d).vers === '#/explorer/videos' && /«/.test(A.prochaineAction(d).texte), 'prochaine étape : une vidéo tant qu’il n’y a pas de piste');
  d.culture.videos['craquer-wordle'] = { vue: '2026-11-18', retiens: '', intrigue: '' }; ok(A.prochaineAction(d).vers === '#/explorer/sujets', 'puis les sujets');
  ok(A.dossierValide(d), 'dossier avec la culture : valide');
  const mauvais = [{ videos: [] }, { videos: { 'a b': {} } }, { videos: { x: { vue: 3 } } }, { videos: { x: { avis: 2 } } }, { videos: { x: { piste: '<b>' } } }, { infox: { x: { v: -1 } } }, { infox: { x: { d: 2 } } }, { accroches: { x: { p: 'a"b' } } }, { salves: 1.5 }, { jour: 'x' }, 'culture'];
  mauvais.forEach((m) => { const x = JSON.parse(JSON.stringify(d)); x.culture = m; ok(!A.dossierValide(x), 'forme refusée : ' + JSON.stringify(m)); });
  const futur = JSON.parse(JSON.stringify(d)); futur.culture.videos['video-de-2027'] = { vue: '2027-01-01', retiens: 'x', intrigue: '', nouveau: 1 }; futur.culture.inconnu = { a: 1 };
  ok(A.dossierValide(futur) && A.chiffresCulture(futur).videos === 1, 'identifiants et clés d’une version plus récente : acceptés, ignorés');
  // fusion à trois : une vidéo de chaque côté
  const b = JSON.parse(JSON.stringify(d)), l2 = JSON.parse(JSON.stringify(d)), r2 = JSON.parse(JSON.stringify(d));
  l2.culture.videos['ia-langue'] = { vue: '2026-11-19', retiens: 'ici', intrigue: '' }; A.noterInfox(r2, 'arobase', false, '2026-11-19');
  const f = R.fusionner(b, l2, r2); ok(!f.conflit && f.resultat.culture.videos['ia-langue'] && f.resultat.culture.infox.arobase, 'fusion : rien de perdu des deux côtés');
  ok(R.textesAbsents(l2, r2).some((t) => t[1] === 'ici'), 'une note de vidéo est gardée à part en cas de conflit');
  // résumé
  const r = R.resume(d); ok(r.culture && r.culture.videos === 1 && r.culture.infox === 1 && JSON.stringify(r).length <= 4000, 'résumé : la culture');
  ok(!R.resume(neuf()).culture, 'résumé : rien sans culture');
  // export : titres et liens de la page, notes échappées, liens https seulement
  d.culture.videos['craquer-wordle'].retiens = '# titre ? [lien](javascript:alert(1)) <img src=x>'; A.garderAccroche(d, 'pacman-256');
  const md = X.dossier(d);
  ok(md.includes('## Ma culture') && md.includes('[JE CRAQUE WORDLE') && md.includes('(https://www.youtube.com/watch?v=iw4_7ioHWF4)'), 'export : la vidéo et son lien');
  ok(!/(^|[^\\])\]\(javascript/.test(md) && !/(^|[^\\])<img/.test(md) && md.includes('\\# titre') && md.includes('\\[lien\\]'), 'export : la note est neutralisée');
  ok(md.includes('Pac-Man a une fin') && md.includes('(https://en.wikipedia.org/wiki/Pac-Man)'), 'export : l’accroche et sa source');
  ok(!md.includes('Le niveau 256 de Pac-Man est impossible'), 'export : jamais l’affirmation seule'); }

// ---------- 6. Les hauts faits ----------
{ const d = neuf(); A.cultureDe(d);
  ['bug-hopper', 'craquer-wordle', 'terres-rares'].forEach((k) => { if (A.laVideo(k)) d.culture.videos[k] = { vue: '2026-11-18', retiens: '', intrigue: '' }; });
  d.culture.videos['histoire-info-condense'] = { vue: '2026-11-18', retiens: 'Une longue histoire', intrigue: '' };
  A.majHautsFaits(d, '2026-11-18'); ok(d.hf.video1 && d.hf.videos3 && !d.hf.videopiste && !d.hf.hamecon, 'hauts faits : première vidéo notée, 3 thèmes');
  d.culture.videos['craquer-wordle'].piste = 'p9'; A.garderAccroche(d, 'arobase'); d.culture.accroches.arobase.p = 'pt1';
  d.questions = [{ id: 'q', titre: 'Q ?', statut: 'brouillon', echange: [], parties: [{ id: 'a', titre: 'Introduction', minutes: 2, points: [{ id: 'pt1', texte: 'x', etiquette: 'accroche', mots: [], sources: [] }] }] }];
  A.majHautsFaits(d, '2026-11-18'); ok(d.hf.videopiste && d.hf.hamecon, 'hauts faits : vidéo devenue piste, accroche dans un plan'); }

console.log('culture : ' + n + ' contrôles (' + C.VIDEOS.length + ' vidéos, ' + C.INFOX.length + ' affirmations, ' + C.CONSEILS.length + ' conseils)');
