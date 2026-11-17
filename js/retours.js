// Hello GO : les retours de l'enseignant·e, le résumé du dossier et le format pour l'IA.
// Fonctions pures, sans page : elles servent à l'élève, à l'enseignant·e et aux tests (node tests/retours.test.js).
(function (racine) {
  'use strict';
  const A = racine.HGAnalyse || (typeof require !== 'undefined' ? require('./coach.js') : null);
  const D = racine.HGDonnees || (typeof require !== 'undefined' ? require('./donnees.js') : null);
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const objet = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
  const texte = (x, max) => (typeof x === 'string' ? x : '').slice(0, max || 2000);
  const id = (x) => typeof x === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(x);
  const court = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  const lienSur = (u) => typeof u === 'string' && /^https?:\/\/[^\s<>"]+$/i.test(u.trim());

  // ---------- Le format des retours (voir le README, « Les retours ») ----------
  const TYPES = ['commentaire', 'definir', 'ressource', 'question', 'validation', 'evaluation'];
  const CIBLES = ['point', 'mot', 'source', 'piste', 'question', 'echange', 'oral', 'bilan'];
  const vides = () => ({ v: 1, items: [] });
  // Ne garde que ce qui a la forme attendue : un retour abîmé est écarté, jamais affiché.
  function nettoyer(r) {
    if (!objet(r) || !Array.isArray(r.items)) return vides();
    const items = [];
    r.items.forEach((x) => {
      if (!objet(x) || !id(x.id) || TYPES.indexOf(x.type) < 0) return;
      const y = { id: x.id, type: x.type, texte: texte(x.texte), le: texte(x.le, 40) };
      if (x.ia === true) y.ia = true;
      if (x.type === 'commentaire') { if (!objet(x.cible) || CIBLES.indexOf(x.cible.type) < 0 || (x.cible.type !== 'bilan' && !id(x.cible.id))) return; y.cible = { type: x.cible.type, id: x.cible.type === 'bilan' ? '' : x.cible.id }; }
      if (x.type === 'definir') { y.mot = texte(x.mot, 80); if (!y.mot.trim()) return; }
      if (x.type === 'ressource') { y.url = texte(x.url, 500).trim(); y.titre = texte(x.titre, 200); if (!lienSur(y.url)) return; if (x.verifier === true) y.verifier = true; }
      if (x.type === 'question') { if (!y.texte.trim()) return; if (id(x.qid)) y.qid = x.qid; }
      if (x.type === 'validation') { if (!id(x.qid) || ['validee', 'retravailler'].indexOf(x.etat) < 0) return; y.qid = x.qid; y.etat = x.etat; }
      if (x.type === 'evaluation') { if (!id(x.oral)) return; y.oral = x.oral; y.notes = {};
        (D ? D.GRILLE : []).forEach((c) => { const n = objet(x.notes) ? x.notes[c.id] : null; if ([1, 2, 3, 4].indexOf(n) >= 0) y.notes[c.id] = n; }); }
      items.push(y);
    });
    return { v: 1, items: items };
  }
  const nouveau = (type, champs) => Object.assign({ id: uid(), type: type, texte: '', le: new Date().toISOString() }, champs || {});
  const pour = (r, type, idCible) => (r.items || []).filter((x) => x.type === 'commentaire' && x.cible.type === type && x.cible.id === idCible);
  // La dernière validation d'une question (l'enseignant·e peut changer d'avis).
  function validation(r, qid) { const l = (r.items || []).filter((x) => x.type === 'validation' && x.qid === qid); return l[l.length - 1] || null; }
  function evaluation(r, oid) { const l = (r.items || []).filter((x) => x.type === 'evaluation' && x.oral === oid); return l[l.length - 1] || null; }

  // ---------- Le résumé, pour le tableau de la classe (4 000 caractères au plus) ----------
  function resume(d) {
    const qs = d.questions || [], tous = qs.reduce((t, q) => t + A.tousLesPoints(q).length, 0);
    const r = { v: 1, etape: A.phase(d), prochaine: court(A.prochaineAction(d).texte, 90),
      cartes: Object.keys((d.decouverte || {}).reactions || {}).length, quiz: !!(d.quiz && d.quiz.fait),
      gouts: Object.assign({}, (d.quiz || {}).reponses || {}), pistes: (d.pistes || []).length,
      questions: qs.map((q) => ({ titre: court(q.titre, 120), statut: q.statut, points: A.tousLesPoints(q).length, echange: (q.echange || []).length })),
      points: tous, mots: (d.mots || []).length, mots_complets: (d.mots || []).filter(A.motComplet).length, sources: (d.sources || []).length,
      oraux: (d.oraux || []).map((o) => { const n = Object.keys(o.auto || {}).length; return { nom: court(o.nom, 40), criteres: n, note: n === 5 ? Object.values(o.auto).reduce((a, b) => a + b, 0) : null, video: !!o.video }; }),
      hauts_faits: A.hautsFaitsDates(d).length };
    // Les quiz « Vérifie que tu as compris » : seulement ceux qui ont été essayés (meilleur et dernier score, essais).
    const cq = {};
    (D ? D.COMPRENDRE : []).forEach((z) => { const x = (d.comprendre || {})[z.id]; if (x && x.essais) cq[z.id] = { meilleur: x.meilleur, dernier: x.dernier, essais: x.essais, sur: A.surSalve(z), vues: A.suiviQuiz(d, z).nVues }; });
    if (Object.keys(cq).length) r.comprendre = cq;
    // Le suivi (version 1.5.0) : les derniers hauts faits gagnés, avec leur date compacte (AAMMJJ), du plus récent au plus
    // ancien ; les jours de visite des 35 derniers jours (AAMMJJ), leur nombre et le premier jour noté. Le détail est
    // dans le dossier. Le tableau de la classe recalcule tout par rapport au jour où il est lu.
    const compact = (j) => j.slice(2).replace(/-/g, '');
    const hf = A.hautsFaitsDates(d).filter((h) => h.le);
    if (hf.length) r.hf_recents = hf.slice(-10).reverse().map((h) => [h.id, compact(h.le)]);
    const v = A.statsVisites(d);
    if (v.total) { r.visites = { n: v.total, depuis: compact(v.depuis), jours: v.jours.slice(-35).map(compact) }; }
    // Trop long (beaucoup de réponses au questionnaire, de longs titres) : on retire le moins utile d'abord.
    if (JSON.stringify(r).length > 3900) r.gouts = Object.keys(r.gouts).reduce((o, k) => { o[k] = Array.isArray(r.gouts[k]) ? r.gouts[k].length : 1; return o; }, {});
    if (JSON.stringify(r).length > 3900) r.questions.forEach((q) => { q.titre = court(q.titre, 40); });
    if (JSON.stringify(r).length > 3900) { delete r.gouts; r.oraux = r.oraux.slice(0, 10); }
    if (JSON.stringify(r).length > 3900) { if (r.hf_recents) r.hf_recents = r.hf_recents.slice(0, 3); if (r.visites) r.visites.jours = r.visites.jours.slice(-7); }
    if (JSON.stringify(r).length > 3900) r.questions = r.questions.slice(0, 3);
    return r;
  }

  // ---------- Les repères stables : P (point), M (mot), S (source), Q (question de l'échange) ----------
  function reperes(d) {
    const vers = {}, de = {}; let p = 0, q = 0;
    (d.questions || []).forEach((x) => { x.parties.forEach((pa) => pa.points.forEach((pt) => { p++; vers['P' + p] = { type: 'point', id: pt.id }; de[pt.id] = 'P' + p; }));
      (x.echange || []).forEach((ec) => { q++; vers['Q' + q] = { type: 'echange', id: ec.id }; de[ec.id] = 'Q' + q; }); });
    (d.mots || []).forEach((m, i) => { vers['M' + (i + 1)] = { type: 'mot', id: m.id }; de[m.id] = 'M' + (i + 1); });
    (d.sources || []).forEach((s, i) => { vers['S' + (i + 1)] = { type: 'source', id: s.id }; de[s.id] = 'S' + (i + 1); });
    return { vers: vers, de: de };
  }

  // ---------- Le texte pour l'IA : un·e élève à la fois, sans prénom ni code ----------
  const EXEMPLE_IA = ['@P3 Ton accroche est forte. Ajoute la date de l’événement pour la rendre précise.',
    '@M1 Ta définition reprend presque mot pour mot ta source : redis-la avec tes mots.',
    '@S2 Cette source date un peu : cherche un chiffre plus récent.',
    '@Q1 Bonne question. Prépare un exemple concret pour ta réponse.',
    '@DEFINIR apprentissage automatique | tu l’utilises dans ton axe 1 sans l’expliquer',
    '@SOURCE https://www.cnil.fr/fr/intelligence-artificielle | Intelligence artificielle, CNIL | une source officielle sur les risques',
    '@QUESTION Comment vérifier qu’un algorithme ne discrimine pas ?',
    '@BILAN Ton plan est clair et équilibré. Ta priorité : définir tes mots techniques.'];
  const FORMAT_IA = ['@P3 texte : une remarque sur le point P3 (même chose avec @M1 pour un mot, @S2 pour une source, @Q1 pour une question de l’échange)',
    '@DEFINIR mot | pourquoi : un mot que l’élève devrait définir',
    '@SOURCE adresse | titre | ce qu’elle apporte : une ressource à lire (seulement une adresse dont tu es sûr·e qu’elle existe ; sinon, n’en propose pas)',
    '@QUESTION texte : une question que le jury pourrait poser',
    '@BILAN texte : un bilan général, en deux ou trois phrases'];
  function texteIA(d) {
    const R = reperes(d), L = [];
    const etq = (v) => (D.ETIQUETTES.find((t) => t[0] === v && v) || [])[1];
    L.push('CONSIGNES', 'Tu aides un·e enseignant·e de NSI à relire le dossier de Grand oral d’un·e élève de terminale.',
      '- Sois bienveillant·e et encourageant·e. Tutoie l’élève. Écris en français, avec des phrases courtes.',
      '- Ne réécris pas le plan : signale ce qui manque ou ce qui peut s’améliorer, et dis pourquoi.',
      '- N’invente jamais de lien ni de référence. Si tu n’es pas sûr·e qu’une adresse existe, ne la donne pas.',
      '- Une remarque = une ligne, qui commence par @ suivi d’un repère (P pour un point, M pour un mot, S pour une source, Q pour une question de l’échange). 15 lignes au plus.',
      '- Rien d’autre que ces lignes : pas d’introduction, pas de titre.', '');
    L.push('LE DOSSIER');
    (d.questions || []).forEach((q, i) => {
      L.push('', 'Question ' + (i + 1) + ' : ' + (q.titre || '(sans titre)') + (q.statut === 'validee' ? ' (validée)' : ''));
      q.parties.forEach((pa) => { L.push('  ' + (pa.titre || 'Partie') + (pa.minutes ? ' (≈ ' + pa.minutes + ' min)' : ''));
        if (!pa.points.length) L.push('    (aucun point)');
        pa.points.forEach((pt) => { const refs = (pt.mots || []).map((x) => R.de[x]).concat((pt.sources || []).map((x) => R.de[x])).filter(Boolean);
          L.push('    ' + R.de[pt.id] + ' ' + (etq(pt.etiquette) ? '[' + etq(pt.etiquette) + '] ' : '') + court(pt.texte || '(point vide)', 600) + (refs.length ? '  (liés : ' + refs.join(', ') + ')' : '')); }); });
      if ((q.echange || []).length) { L.push('  Questions préparées pour l’échange');
        q.echange.forEach((x) => L.push('    ' + R.de[x.id] + ' ' + court(x.question, 300) + (x.reponse ? ' / idées de réponse : ' + court(x.reponse, 400) : ''))); }
    });
    L.push('', 'Lexique'); if (!(d.mots || []).length) L.push('  (aucun mot)');
    (d.mots || []).forEach((m) => L.push('  ' + R.de[m.id] + ' ' + (m.mot || '(sans nom)') + ' / définition d’une source : ' + court(m.defSource || '—', 400) + (m.sourceTexte ? ' (' + court(m.sourceTexte, 120) + ')' : '') +
      ' / avec ses mots : ' + court(m.defMoi || '—', 400) + (m.analogie ? ' / image : ' + court(m.analogie, 200) : '')));
    L.push('', 'Sources'); if (!(d.sources || []).length) L.push('  (aucune source)');
    (d.sources || []).forEach((s) => { const t = (D.TYPES_SOURCE.find((x) => x[0] === s.type && s.type) || [])[1];
      L.push('  ' + R.de[s.id] + ' ' + court(A.reference(s) || '(sans titre)', 400) + (t ? ' / ' + t : '') + (s.retiens ? ' / ce qu’il ou elle en retient : ' + court(s.retiens, 400) : '')); });
    L.push('', 'FORMAT DE TA RÉPONSE (rappel)', 'Une remarque par ligne, chaque ligne commence par @ :');
    FORMAT_IA.forEach((x) => L.push('- ' + x));
    L.push('', 'Exemple complet de réponse :'); EXEMPLE_IA.forEach((x) => L.push(x));
    return L.join('\n');
  }

  // ---------- La lecture du retour de l'IA, tolérante ----------
  // Seules les lignes qui commencent par @ (ou [P3]) comptent, après retrait des puces, numéros, gras, guillemets.
  // Chaque ligne reconnue devient un brouillon de retour ; les autres lignes à @ sont rendues à part.
  function lireIA(brut, d) {
    const R = reperes(d), brouillons = [], inconnues = []; let ignorees = 0;
    String(brut || '').replace(/\r/g, '').split('\n').forEach((ligne) => {
      if (/^\s*(```|~~~)/.test(ligne)) return;
      let l = ligne.replace(/^(?:\s|[-*•+>"'«»“”‘’`]|\d{1,3}[.)]|_{2})+/, '').replace(/(?:\s|\*|_{2}|["'«»“”`])+$/, '');
      if (!l) return;
      const m = /^(?:@\s*|\[\s*@?)([A-Za-zÉé]+)\s*(\d*)\s*(?:\*\*|__)?\s*\]?\s*(?:\*\*|__)?\s*[:\-–—.]?\s*([\s\S]*)$/.exec(l);
      if (!m || (l[0] === '[' && !m[2])) { if (/^\s*@/.test(l)) inconnues.push(l); else ignorees++; return; }
      const tag = m[1].toUpperCase().replace('É', 'E'), n = m[2], reste = m[3].replace(/^(?:\*\*|__)\s*[:\-–—]?\s*/, '').trim();
      const parts = reste.split('|').map((x) => x.trim());
      const ia = { ia: true };
      if (/^[PMSQ]$/.test(tag) && n) {
        const c = R.vers[tag + n];
        if (!c || !reste) return inconnues.push(l);
        brouillons.push(nouveau('commentaire', Object.assign({ cible: c, texte: reste, repere: tag + n }, ia)));
      } else if (tag === 'DEFINIR' && !n && parts[0]) brouillons.push(nouveau('definir', Object.assign({ mot: parts[0].slice(0, 80), texte: parts.slice(1).join(' | ') }, ia)));
      else if (tag === 'SOURCE' && !n && lienSur(parts[0])) brouillons.push(nouveau('ressource', Object.assign({ url: parts[0], titre: parts[1] || '', texte: parts.slice(2).join(' | '), verifier: true }, ia)));
      else if (tag === 'QUESTION' && !n && reste) brouillons.push(nouveau('question', Object.assign({ texte: reste }, ia)));
      else if (tag === 'BILAN' && !n && reste) brouillons.push(nouveau('commentaire', Object.assign({ cible: { type: 'bilan', id: '' }, texte: reste }, ia)));
      else inconnues.push(l);
    });
    return { brouillons: brouillons, inconnues: inconnues, ignorees: ignorees };
  }

  // ---------- Les textes d'un dossier absents d'un autre (une saisie refusée, à relire) ----------
  function textes(d) {
    const l = [], ajoute = (quoi, t) => { if (typeof t === 'string' && t.trim()) l.push([quoi, t.trim()]); };
    (d.questions || []).forEach((q) => { ajoute('Question', q.titre); q.parties.forEach((p) => { ajoute('Partie', p.titre); p.points.forEach((x) => ajoute('Point', x.texte)); }); (q.echange || []).forEach((x) => { ajoute('Question du jury', x.question); ajoute('Réponse', x.reponse); }); });
    (d.mots || []).forEach((m) => ['mot', 'defSource', 'sourceTexte', 'defMoi', 'analogie'].forEach((k) => ajoute('Mot', m[k])));
    (d.sources || []).forEach((s) => ['titre', 'auteur', 'lien', 'date', 'retiens'].forEach((k) => ajoute('Source', s[k])));
    (d.pistes || []).forEach((p) => { ajoute('Piste', p.titre); ajoute('Piste', p.pourquoi); (p.idees || []).concat(p.candidates || []).forEach((t) => ajoute('Piste', t)); });
    (d.oraux || []).forEach((o) => { ajoute('Oral', o.nom); ajoute('Oral', o.objectifs); });
    (d.interets || []).concat(d.ponts || []).forEach((t) => ajoute('Centre d’intérêt', t));
    return l;
  }
  function textesAbsents(local, base) {
    const deja = new Set(textes(base || {}).map((x) => x[1]));
    return textes(local || {}).filter((x) => !deja.has(x[1]));
  }

  // ---------- La fusion à trois : la version connue (base), la copie de l'appareil (local), la version de la base (distant) ----------
  // Ce qui n'a changé que d'un côté est gardé ; un même texte changé des deux côtés prend la version de la base (la copie
  // de l'appareil est alors gardée à part par la page). Les listes à identifiants (questions, points, mots, sources…) sont
  // fusionnées élément par élément : un ajout de chaque côté est gardé, une suppression aussi si l'autre côté n'a rien changé.
  // Comparer le contenu, pas l'ordre des clés : la base (jsonb) range les clés à sa façon, la page dans l'ordre de création.
  const canon = (x) => (Array.isArray(x) ? x.map(canon) : objet(x) ? Object.keys(x).sort().reduce((o, k) => { o[k] = canon(x[k]); return o; }, {}) : x);
  const pareil = (a, b) => a === b || JSON.stringify(canon(a)) === JSON.stringify(canon(b));
  const listeAId = (x) => Array.isArray(x) && x.length > 0 && x.every((y) => objet(y) && id(y.id));
  function fusionner(base, local, distant) {
    let conflit = false;
    function f(b, l, r) {
      if (pareil(l, b)) return r;
      if (pareil(r, b) || pareil(l, r)) return l;
      if (objet(l) && objet(r)) {
        const o = {}, bb = objet(b) ? b : {};
        Object.keys(r).concat(Object.keys(l).filter((k) => !(k in r))).forEach((k) => { const v = f(bb[k], l[k], r[k]); if (v !== undefined) o[k] = v; });
        return o;
      }
      if ((listeAId(l) || Array.isArray(l) && !l.length) && (listeAId(r) || Array.isArray(r) && !r.length) && (b === undefined || Array.isArray(b))) {
        const bm = {}, lm = {}, rm = {}; (b || []).forEach((x) => { if (objet(x)) bm[x.id] = x; }); l.forEach((x) => { lm[x.id] = x; }); r.forEach((x) => { rm[x.id] = x; });
        const out = [];
        r.forEach((x) => {
          if (bm[x.id] && !lm[x.id]) { if (!pareil(x, bm[x.id])) out.push(x); return; } // supprimé ici : gardé seulement si la base l'a changé
          out.push(lm[x.id] ? f(bm[x.id], lm[x.id], x) : x);
        });
        l.forEach((x, i) => { if (bm[x.id] || rm[x.id]) return; // ajouté ici : après son voisin d'avant, s'il est encore là
          const avant = i > 0 ? out.findIndex((y) => y.id === l[i - 1].id) : -1; out.splice(avant >= 0 ? avant + 1 : (i === 0 ? 0 : out.length), 0, x); });
        // un élément supprimé par la base mais modifié ici n'est pas remis : c'est un conflit, et la page garde à part
        // ce qui y avait été écrit (« Ma saisie mise de côté »)
        l.forEach((x) => { if (bm[x.id] && !rm[x.id] && !pareil(x, bm[x.id])) { conflit = true; } });
        return out;
      }
      conflit = true; return r;
    }
    const resultat = f(base, local, distant);
    return { resultat: resultat, conflit: conflit };
  }

  // ---------- Le code : lecture tolérante (minuscules, espaces, tirets, O/0, I/1) ----------
  function lireCode(s) {
    const t = String(s || '').toUpperCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^A-Z0-9]+/g, ' ').trim();
    // Dans la partie en chiffres, O et I sont des chiffres mal tapés ; dans les mots, 0 et 1 sont des lettres.
    const chiffres = (m) => m.replace(/O/g, '0').replace(/I/g, '1'), lettres = (m) => m.replace(/0/g, 'O').replace(/1/g, 'I');
    const l = t.split(' ').filter(Boolean);
    return l.map((m, i) => {
      if (/^[0-9OI]+$/.test(m) && /[0-9]/.test(m)) return chiffres(m);
      const f = i === l.length - 1 && /^(.*[A-Z])([0-9][0-9OI]{2,3})$/.exec(m); // « DECOR482 », collé : le mot, puis les chiffres
      if (f) return lettres(f[1]) + '-' + chiffres(f[2]);
      return lettres(m);
    }).join('-');
  }

  const api = { TYPES, CIBLES, vides, nettoyer, nouveau, pour, validation, evaluation, resume, reperes, texteIA, lireIA, textesAbsents, fusionner, lireCode, lienSur, FORMAT_IA, EXEMPLE_IA };
  racine.HGRetours = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
