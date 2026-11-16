// Hello GO : les analyses automatiques (coach, questionnaire, questions probables, hauts faits).
// Tout se calcule sur l'appareil, à partir du dossier : rien n'est envoyé.
(function (racine) {
  'use strict';
  const D = racine.HGDonnees || require('./donnees.js');

  const SEC_PAR_POINT = 15; // 30 à 50 points pour 10 minutes (dossier de l'enseignant) : 12 à 20 s par point

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[’']/g, ' ');
  }
  function mots(s) { return norm(s).split(/[^a-z0-9]+/).filter(function (m) { return m.length > 3; }); }
  function ressemblance(a, b) {
    const A = new Set(mots(a)), B = new Set(mots(b));
    if (A.size < 3 || B.size < 3) return 0;
    let commun = 0; A.forEach(function (m) { if (B.has(m)) commun++; });
    return commun / (A.size + B.size - commun);
  }
  function contient(texte, terme) {
    const t = norm(terme).trim(); if (!t) return false;
    return new RegExp('(^|[^a-z0-9])' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 's?([^a-z0-9]|$)').test(norm(texte));
  }
  function tousLesPoints(q) { return q.parties.reduce(function (l, p) { return l.concat(p.points); }, []); }
  function textePlan(q) { return tousLesPoints(q).map(function (p) { return p.texte; }).join('\n'); }
  function aChiffre(texte) { return /\d+\s*(%|pour cent|millions?|milliards?|fois)|\b\d{2,}\b|selon (une|l[ea’']|des) |une etude|d apres /.test(norm(texte)); }

  // Le coach : une liste de conseils { niveau: 'ok' | 'info' | 'attention', texte, cible? }
  function coach(q, dossier) {
    const c = [], pts = tousLesPoints(q), n = pts.length;
    const duree = Math.round(n * SEC_PAR_POINT / 60);
    if (n === 0) return [{ niveau: 'info', texte: 'Ajoute ton premier point : par exemple une accroche, un fait qui surprend.' }];
    if (n < 30) c.push({ niveau: 'info', texte: n + ' point' + (n > 1 ? 's' : '') + ', environ ' + duree + ' min. Vise 30 à 50 points pour tenir 10 minutes.' });
    else if (n > 50) c.push({ niveau: 'attention', texte: n + ' points, environ ' + duree + ' min : c’est trop pour 10 minutes. Garde l’essentiel.' });
    else c.push({ niveau: 'ok', texte: n + ' points, environ ' + duree + ' min : la bonne taille.' });

    q.parties.forEach(function (p) {
      if (!p.points.length) c.push({ niveau: 'info', texte: '« ' + p.titre + ' » est encore vide.' });
      else if (n >= 20 && p.minutes) {
        const m = p.points.length * SEC_PAR_POINT / 60;
        if (m > p.minutes * 1.6) c.push({ niveau: 'attention', texte: '« ' + p.titre + ' » : environ ' + Math.round(m) + ' min pour ' + p.minutes + ' min visées. Allège, ou déplace des points.' });
        else if (m < p.minutes * 0.5) c.push({ niveau: 'info', texte: '« ' + p.titre + ' » est un peu courte pour ' + p.minutes + ' min.' });
      }
    });

    const et = {}; pts.forEach(function (p) { if (p.etiquette) et[p.etiquette] = true; });
    const intro = [['accroche', 'une accroche'], ['problematique', 'ta problématique'], ['annonce', 'l’annonce du plan']].filter(function (e) { return !et[e[0]]; });
    if (n >= 5 && intro.length) c.push({ niveau: 'info', texte: 'Introduction : il manque ' + intro.map(function (e) { return e[1]; }).join(', ') + ' (choisis le type de chaque point).' });
    const fin = [['synthese', 'une synthèse'], ['ouverture', 'une ouverture'], ['relance', 'une question de relance']].filter(function (e) { return !et[e[0]]; });
    if (n >= 15 && fin.length) c.push({ niveau: 'info', texte: 'Conclusion : il manque ' + fin.map(function (e) { return e[1]; }).join(', ') + '.' });
    if (n >= 15 && !et.transition) c.push({ niveau: 'info', texte: 'Écris une transition entre tes parties.' });

    const longs = pts.filter(function (p) { return p.texte.length > 240; }).length;
    if (longs) c.push({ niveau: 'attention', texte: longs + ' point' + (longs > 1 ? 's sont trop longs' : ' est trop long') + ' : garde 1 à 3 lignes, en mots-clés.' });

    const sansSource = pts.filter(function (p) { return aChiffre(p.texte) && !(p.sources || []).length; }).length;
    if (sansSource) c.push({ niveau: 'attention', texte: sansSource + ' point' + (sansSource > 1 ? 's donnent' : ' donne') + ' un chiffre ou cite une étude sans source : ajoute la source.' });

    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      if (ressemblance(pts[i].texte, pts[j].texte) > 0.7) { c.push({ niveau: 'info', texte: 'Deux points se ressemblent beaucoup : « ' + pts[i].texte.slice(0, 40) + '… ». Garde le meilleur.' }); i = pts.length; break; }
    }

    const plan = textePlan(q), lexique = (dossier.mots || []);
    const manquants = D.TERMES.filter(function (t) {
      return contient(plan, t) && !lexique.some(function (m) { return contient(m.mot, t) || contient(t, m.mot); });
    }).slice(0, 4);
    if (manquants.length) c.push({ niveau: 'info', texte: 'Mots techniques à définir dans « Mes mots » : ' + manquants.join(', ') + '.' });
    return c;
  }

  function coachMot(m) {
    const c = [];
    if (!m.defSource || !m.defMoi) c.push('Il manque ' + (!m.defSource && !m.defMoi ? 'les deux définitions' : !m.defSource ? 'la définition d’une source' : 'la définition avec tes mots') + '.');
    if (m.defSource && !m.sourceTexte) c.push('D’où vient la première définition ? Écris sa source.');
    if (m.defSource && m.defMoi && ressemblance(m.defSource, m.defMoi) > 0.6) c.push('Ta définition « avec mes mots » ressemble trop à celle de la source : reformule-la.');
    if (!m.analogie) c.push('Ajoute une image simple pour le membre du jury non spécialiste.');
    return c;
  }
  function motComplet(m) { return !!(m.mot && m.defSource && m.defMoi); }

  function coachSources(dossier) {
    const c = [], s = dossier.sources || [];
    if (!s.length) return c;
    const types = new Set(s.map(function (x) { return x.type; }).filter(Boolean));
    if (s.length >= 2 && types.size < 2) c.push('Varie tes sources : une source experte et une source de vulgarisation, par exemple.');
    if (s.every(function (x) { return x.type === 'encyclopedie' || /wikipedia/i.test(x.lien || ''); })) c.push('Wikipédia est un bon début : va lire les sources citées en bas de l’article.');
    const utilisees = new Set();
    (dossier.questions || []).forEach(function (q) { tousLesPoints(q).forEach(function (p) { (p.sources || []).forEach(function (id) { utilisees.add(id); }); }); });
    const inutiles = s.filter(function (x) { return !utilisees.has(x.id); }).length;
    if (inutiles && (dossier.questions || []).length) c.push(inutiles + ' source' + (inutiles > 1 ? 's ne sont reliées' : ' n’est reliée') + ' à aucun point de tes plans.');
    return c;
  }

  // Le questionnaire : les 5 sujets qui collent le mieux aux réponses, avec la raison.
  function suggestions(reponses, combien) {
    const r = reponses || {}, lib = {};
    D.QUIZ.forEach(function (q) { q.choix.forEach(function (c) { lib[q.id + ':' + c[0]] = c[1]; }); });
    const liste = D.SUJETS.map(function (s, rang) {
      let score = 0; const raisons = [];
      (r.i || []).forEach(function (x) { if (s.i.indexOf(x) >= 0) { score += 3; raisons.push(lib['i:' + x]); } });
      (r.n || []).forEach(function (x) { if (s.n.indexOf(x) >= 0) { score += 2; raisons.push(lib['n:' + x]); } });
      if (r.a && s.a.indexOf(r.a) >= 0) score += 2;
      if (r.s && s.s.indexOf(r.s) >= 0) { score += 2; raisons.push(lib['s:' + r.s]); }
      return { sujet: s, score: score, raisons: raisons, rang: rang };
    }).filter(function (x) { return x.score > 0; });
    liste.sort(function (a, b) { return b.score - a.score || a.rang - b.rang; });
    return liste.slice(0, combien || 5);
  }

  function questionsProbables(q, dossier) {
    const l = ['Pourquoi as-tu choisi cette question ?'];
    const plan = textePlan(q);
    (dossier.mots || []).forEach(function (m) { if (m.mot && contient(plan, m.mot)) l.push('Qu’est-ce que « ' + m.mot.toLowerCase() + ' » ? Explique-le simplement.'); });
    q.parties.forEach(function (p) { if (/axe/i.test(p.titre) && p.points.length) l.push('Quelles sont les limites de ce que tu dis dans « ' + p.titre + ' » ?'); });
    if (tousLesPoints(q).some(function (p) { return aChiffre(p.texte); })) l.push('D’où viennent tes chiffres ? Peut-on leur faire confiance ?');
    l.push('Quel lien fais-tu avec le programme de NSI ?');
    l.push('Si tu devais convaincre quelqu’un qui n’est pas d’accord, que dirais-tu ?');
    const deja = new Set((q.echange || []).map(function (e) { return norm(e.question); }));
    return l.filter(function (x) { return !deja.has(norm(x)); }).slice(0, 8);
  }

  function phase(d) {
    const qs = d.questions || [];
    if (!qs.length) return 0;
    const n = qs.reduce(function (t, q) { return t + tousLesPoints(q).length; }, 0);
    return n >= 25 ? 2 : 1;
  }

  // La prochaine action : une seule, choisie d'après l'état du dossier.
  function prochaineAction(d) {
    const qs = d.questions || [];
    if (!d.quiz || !d.quiz.fait) if (!(d.pistes || []).length && !qs.length) return { texte: 'Trouve ta piste : 4 questions pour te proposer des sujets.', bouton: 'Faire le questionnaire', vers: '#/explorer/quiz', duree: '3 min' };
    if (!qs.length) {
      const p = (d.pistes || [])[0];
      if (!p) return { texte: 'Choisis une piste parmi les sujets proposés.', bouton: 'Voir les sujets', vers: '#/explorer/sujets', duree: '5 min' };
      if (!(p.candidates || []).length) return { texte: 'Transforme ta piste en question : écris une ou deux questions possibles.', bouton: 'Ouvrir mes pistes', vers: '#/explorer/pistes', duree: '5 min' };
      return { texte: 'Choisis ta question et commence ton plan.', bouton: 'Ouvrir mes pistes', vers: '#/explorer/pistes', duree: '2 min' };
    }
    const q = qs.slice().sort(function (a, b) { return tousLesPoints(a).length - tousLesPoints(b).length; })[0];
    const n = tousLesPoints(q).length;
    if (n < 8) return { texte: 'Ajoute des points à ton plan : commence par l’accroche et ta problématique.', bouton: 'Ouvrir mon plan', vers: '#/question/' + q.id, duree: '10 min' };
    const incomplets = (d.mots || []).filter(function (m) { return !motComplet(m); }).length;
    if (incomplets) return { texte: incomplets + ' mot' + (incomplets > 1 ? 's' : '') + ' à compléter : une définition d’une source, une avec tes mots.', bouton: 'Ouvrir mes mots', vers: '#/mots', duree: '5 min' };
    if ((d.mots || []).length < 3) return { texte: 'Définis les mots importants de ton sujet.', bouton: 'Ouvrir mes mots', vers: '#/mots', duree: '5 min' };
    if ((d.sources || []).length < 2) return { texte: 'Ajoute tes sources : au moins deux, de types différents.', bouton: 'Ouvrir mes sources', vers: '#/sources', duree: '5 min' };
    if (n < 30) return { texte: 'Continue ton plan : ' + n + ' points, vise 30 à 50.', bouton: 'Ouvrir mon plan', vers: '#/question/' + q.id, duree: '10 min' };
    const sansReponse = (q.echange || []).filter(function (e) { return !e.reponse; }).length;
    if ((q.echange || []).length < 5 || sansReponse) return { texte: 'Prépare l’échange : réponds aux questions que le jury pourrait poser.', bouton: 'Préparer l’échange', vers: '#/question/' + q.id + '/echange', duree: '10 min' };
    return { texte: 'Entraîne-toi : refais ton plan sur papier en 20 minutes, puis présente-le à voix haute avec un chronomètre.', bouton: 'Voir mes oraux', vers: '#/oraux', duree: '30 min' };
  }

  // Les hauts faits. test(d) dit si le haut fait est gagné ; cache : affiché « ??? » tant qu'il n'est pas gagné.
  function tous(d) { return (d.questions || []).reduce(function (l, q) { return l.concat(tousLesPoints(q)); }, []); }
  function unPlan(d, f) { return (d.questions || []).some(f); }
  function aEtiquette(q, e) { return tousLesPoints(q).some(function (p) { return p.etiquette === e; }); }
  const HAUTS_FAITS = [
    { id: 'quiz', g: 'Explorer', titre: 'Curiosité activée', cond: 'Finir le questionnaire.', pourquoi: 'On parle mieux de ce qu’on aime.', test: function (d) { return !!(d.quiz && d.quiz.fait); } },
    { id: 'pistes3', g: 'Explorer', titre: 'Trois fers au feu', cond: 'Garder 3 pistes.', pourquoi: 'Ne choisis pas trop vite : compare.', test: function (d) { return (d.pistes || []).length >= 3; } },
    { id: 'multivers', g: 'Explorer', titre: 'Multivers', cond: 'Écrire 3 questions possibles pour une même piste.', pourquoi: 'Un même sujet a plusieurs angles : explore-les, comme dans un multivers.', test: function (d) { return (d.pistes || []).some(function (p) { return (p.candidates || []).length >= 3; }); } },
    { id: 'pont', g: 'Explorer', titre: 'Pont-levis', cond: 'Écrire un pont entre un centre d’intérêt et une notion.', pourquoi: 'Le pont, c’est ce qui rend ton sujet personnel.', test: function (d) { return (d.ponts || []).some(function (p) { return p.trim().length > 5; }); } },
    { id: 'sujet', g: 'Explorer', titre: 'Vous avez un sujet !', cond: 'Avoir une question validée par ton prof.', pourquoi: 'Enfin. Maintenant, le vrai travail commence.', test: function (d) { return unPlan(d, function (q) { return q.statut === 'validee'; }); } },
    { id: 'planb', g: 'Explorer', titre: 'Plan B', cond: 'Avoir deux questions.', pourquoi: 'Le jury choisit entre tes deux questions : il en faut deux.', test: function (d) { return (d.questions || []).length >= 2; } },

    { id: 'hello', g: 'Le plan', titre: 'Hello, world', cond: 'Écrire ton premier point.', pourquoi: 'Tout programme commence par une première ligne.', test: function (d) { return tous(d).length >= 1; } },
    { id: 'accroche', g: 'Le plan', titre: 'Accroche-toi', cond: 'Avoir une accroche.', pourquoi: 'Le jury écoute mieux après un fait concret.', test: function (d) { return unPlan(d, function (q) { return aEtiquette(q, 'accroche'); }); } },
    { id: 'avengers', g: 'Le plan', titre: 'Avengers, rassemblement !', cond: 'Avoir au moins un point dans chaque partie.', pourquoi: 'Une équipe complète : introduction, axes, conclusion.', test: function (d) { return unPlan(d, function (q) { return q.parties.length >= 4 && q.parties.every(function (p) { return p.points.length > 0; }); }); } },
    { id: 'taille', g: 'Le plan', titre: 'Ni trop ni trop peu', cond: 'Avoir un plan entre 30 et 50 points.', pourquoi: 'C’est la taille qui tient 10 minutes.', test: function (d) { return unPlan(d, function (q) { const n = tousLesPoints(q).length; return n >= 30 && n <= 50; }); } },
    { id: 'tri', g: 'Le plan', titre: 'Tri par insertion', cond: 'Déplacer un point d’une partie à une autre.', pourquoi: 'Un bon plan se réorganise.', test: function (d) { return ((d.compteurs || {}).deplacements || 0) >= 1; } },
    { id: 'snap', g: 'Le plan', titre: 'Parfaitement équilibré', cond: 'Avoir deux axes de même taille, à un point près (5 points au moins chacun).', pourquoi: 'Comme toute chose devrait l’être : deux axes équilibrés, c’est un exposé clair.', test: function (d) { return unPlan(d, function (q) { const a = q.parties.filter(function (p) { return /axe/i.test(p.titre); }); return a.length >= 2 && a[0].points.length >= 5 && Math.abs(a[0].points.length - a[1].points.length) <= 1; }); } },
    { id: 'fin', g: 'Le plan', titre: 'Le mot de la fin', cond: 'Avoir une synthèse, une ouverture et une question de relance.', pourquoi: 'Le jury retient surtout la fin.', test: function (d) { return unPlan(d, function (q) { return aEtiquette(q, 'synthese') && aEtiquette(q, 'ouverture') && aEtiquette(q, 'relance'); }); } },
    { id: 'pirate', g: 'Le plan', titre: 'Roi ou reine des pirates', cond: 'Avoir un plan complet : 30 à 50 points, accroche, problématique, transition, synthèse et relance.', pourquoi: 'Tu as trouvé ton trésor : un plan prêt pour le jury.', test: function (d) { return unPlan(d, function (q) { const n = tousLesPoints(q).length; return n >= 30 && n <= 50 && ['accroche', 'problematique', 'transition', 'synthese', 'relance'].every(function (e) { return aEtiquette(q, e); }); }); } },
    { id: 'q42', g: 'Le plan', cache: true, indice: 'Un nombre bien connu des geeks…', titre: '42', cond: 'Avoir exactement 42 points.', pourquoi: 'La réponse à la grande question sur la vie, l’univers et le reste… mais pas à ta problématique.', test: function (d) { return unPlan(d, function (q) { return tousLesPoints(q).length === 42; }); } },

    { id: 'dico', g: 'Les mots', titre: 'Dico vivant', cond: 'Avoir 5 mots avec leurs deux définitions.', pourquoi: 'Un mot bien défini, c’est une question du jury en moins.', test: function (d) { return (d.mots || []).filter(motComplet).length >= 5; } },
    { id: 'groot', g: 'Les mots', titre: 'Je s’appelle Groot', cond: 'Écrire 5 analogies.', pourquoi: 'Dire beaucoup avec peu de mots : c’est ce qu’attend le membre du jury non spécialiste.', test: function (d) { return (d.mots || []).filter(function (m) { return (m.analogie || '').trim().length > 5; }).length >= 5; } },
    { id: 'zerocopie', g: 'Les mots', titre: 'Zéro copier-coller', cond: 'Avoir 8 mots complets, aucun recopié sur sa source.', pourquoi: 'Si tu sais le dire avec tes mots, tu l’as compris.', test: function (d) { const c = (d.mots || []).filter(motComplet); return c.length >= 8 && c.every(function (m) { return ressemblance(m.defSource, m.defMoi) <= 0.6; }); } },
    { id: 'recursif', g: 'Les mots', cache: true, indice: 'Pour comprendre cet indice, il faut d’abord comprendre cet indice.', titre: 'Récursif', cond: 'Utiliser un mot de ton lexique dans la définition d’un autre.', pourquoi: 'Pour comprendre ce haut fait, il faut d’abord comprendre ce haut fait.', test: function (d) { const l = d.mots || []; return l.some(function (a) { return l.some(function (b) { return a !== b && b.mot && b.mot.length > 2 && contient((a.defMoi || '') + ' ' + (a.defSource || ''), b.mot); }); }); } },

    { id: 'source1', g: 'Les sources', titre: 'Un grand pouvoir…', cond: 'Ajouter ta première source, avec ce que tu en retiens.', pourquoi: '…implique de grandes responsabilités : dire d’où vient ce qu’on affirme.', test: function (d) { return (d.sources || []).some(function (s) { return s.titre && (s.retiens || '').trim().length > 5; }); } },
    { id: 'types2', g: 'Les sources', titre: 'Deux avis valent mieux qu’un', cond: 'Avoir des sources de deux types différents.', pourquoi: 'Croiser les sources, c’est le début de l’esprit critique.', test: function (d) { return new Set((d.sources || []).map(function (s) { return s.type; }).filter(Boolean)).size >= 2; } },
    { id: 'fact', g: 'Les sources', titre: 'Fact-checkeur·se', cond: 'Avoir au moins 3 points avec un chiffre, tous reliés à une source.', pourquoi: 'Un chiffre sans source, c’est une rumeur.', test: function (d) { const c = tous(d).filter(function (p) { return aChiffre(p.texte); }); return c.length >= 3 && c.every(function (p) { return (p.sources || []).length > 0; }); } },
    { id: 'biblio', g: 'Les sources', titre: 'Que la source soit avec toi', cond: 'Avoir 6 sources, toutes reliées à un point.', pourquoi: 'Une source qui ne sert à rien n’est qu’un lien.', test: function (d) { const u = new Set(); tous(d).forEach(function (p) { (p.sources || []).forEach(function (i) { u.add(i); }); }); const s = d.sources || []; return s.length >= 6 && s.every(function (x) { return u.has(x.id); }); } },

    { id: 'echange10', g: 'L’échange', titre: 'Prêt·e pour le jury', cond: 'Répondre à 10 questions de l’échange.', pourquoi: 'L’échange dure autant que l’exposé.', test: function (d) { return (d.questions || []).reduce(function (t, q) { return t + (q.echange || []).filter(function (e) { return (e.reponse || '').trim().length > 10; }).length; }, 0) >= 10; } },
    { id: 'pourquoi', g: 'L’échange', titre: 'Élémentaire', cond: 'Répondre à « Pourquoi as-tu choisi cette question ? ».', pourquoi: 'C’est souvent la première question du jury.', test: function (d) { return unPlan(d, function (q) { return (q.echange || []).some(function (e) { return /pourquoi as-tu choisi/i.test(e.question) && (e.reponse || '').trim().length > 10; }); }); } },

    { id: 'oral1', g: 'Les oraux', titre: 'Premier passage', cond: 'T’évaluer après un oral blanc.', pourquoi: 'On ne progresse à l’oral qu’en parlant.', test: function (d) { return (d.oraux || []).some(function (o) { return o.auto && Object.keys(o.auto).length >= 5; }); } },
    { id: 'progres', g: 'Les oraux', titre: 'Niveau supérieur', cond: 'Progresser sur un critère entre deux oraux.', pourquoi: 'Chaque passage te fait gagner de l’expérience.', test: function (d) { const o = (d.oraux || []).filter(function (x) { return x.auto && Object.keys(x.auto).length >= 5; }); return o.length >= 2 && Object.keys(o[0].auto).some(function (k) { return o[o.length - 1].auto[k] > o[0].auto[k]; }); } },
    { id: 'video', g: 'Les oraux', titre: 'Sur grand écran', cond: 'Noter qu’une vidéo est déposée sur Pronote.', pourquoi: 'Se revoir, c’est repérer ce qu’on ne sent pas en parlant.', test: function (d) { return (d.oraux || []).some(function (o) { return o.video; }); } },
    { id: 'pdf', g: 'Les oraux', titre: 'Sauvegarde effectuée', cond: 'Télécharger ton dossier en PDF.', pourquoi: 'On sauvegarde toujours avant le boss final.', test: function (d) { return ((d.compteurs || {}).pdf || 0) >= 1; } },

    { id: 'konami', g: 'Cachés', cache: true, indice: 'Haut, haut, bas, bas… (ou 7 touches sur le logo)', titre: 'Easter egg', cond: 'Trouver le passage secret.', pourquoi: 'La curiosité est une qualité de hacker.', test: function (d) { return ((d.compteurs || {}).secret || 0) >= 1; } },
    { id: 'canard', g: 'Cachés', cache: true, indice: 'Coin coin : lis la bonne fiche de méthode.', titre: 'Canard en plastique', cond: 'Lire la fiche « Expliquer à un non-spécialiste ».', pourquoi: 'Les programmeurs et programmeuses expliquent leur code à un canard pour trouver leurs erreurs.', test: function (d) { return ((d.compteurs || {}).canard || 0) >= 1; } },
  ];

  // Renvoie les hauts faits nouvellement gagnés (et les inscrit dans d.hf).
  function majHautsFaits(d, date) {
    d.hf = d.hf || {};
    const nouveaux = [];
    HAUTS_FAITS.forEach(function (h) {
      if (!d.hf[h.id]) { let ok = false; try { ok = h.test(d); } catch (e) { ok = false; } if (ok) { d.hf[h.id] = date || new Date().toISOString().slice(0, 10); nouveaux.push(h); } }
    });
    return nouveaux;
  }

  function reference(s) {
    const morceaux = [];
    if (s.auteur) morceaux.push(s.auteur);
    if (s.titre) morceaux.push('« ' + s.titre + ' »');
    if (s.date) morceaux.push(s.date);
    return morceaux.join(', ') + (s.lien ? (morceaux.length ? '. ' : '') + s.lien : '');
  }

  // Un fichier importé n'est accepté que s'il a la forme d'un dossier Hello GO : des identifiants sûrs (ils vont dans les
  // attributs de la page), des listes, des textes et des nombres. Une partie absente reprend sa valeur par défaut.
  function dossierValide(n) {
    const objet = function (x) { return x !== null && typeof x === 'object' && !Array.isArray(x); };
    const texte = function (x) { return x === undefined || typeof x === 'string'; };
    const textes = function (o, noms) { return noms.every(function (k) { return texte(o[k]); }); };
    const id = function (x) { return typeof x === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(x); };
    const liste = function (x, f) { return Array.isArray(x) && x.every(f); };
    const sinon = function (x, f) { return x === undefined || f(x); };
    const entier = function (x) { return Number.isInteger(x) && x >= 0; };
    const oui = function (x) { return typeof x === 'boolean'; };
    const parmi = function (l) { return function (x) { return x === undefined || l.some(function (e) { return e[0] === x; }); }; };
    const point = function (p) { return objet(p) && id(p.id) && texte(p.texte) && parmi(D.ETIQUETTES)(p.etiquette) && sinon(p.mots, function (l) { return liste(l, id); }) && sinon(p.sources, function (l) { return liste(l, id); }); };
    const partie = function (p) { return objet(p) && id(p.id) && texte(p.titre) && sinon(p.minutes, entier) && liste(p.points, point); };
    const echange = function (x) { return objet(x) && id(x.id) && textes(x, ['question', 'reponse']); };
    const question = function (q) { return objet(q) && id(q.id) && texte(q.titre) && ['brouillon', 'proposee', 'validee'].indexOf(q.statut) >= 0 && liste(q.echange, echange) && liste(q.parties, partie); };
    const piste = function (p) { return objet(p) && id(p.id) && textes(p, ['titre', 'pourquoi']) && sinon(p.idees, function (l) { return liste(l, texte); }) && sinon(p.candidates, function (l) { return liste(l, texte); }); };
    const mot = function (m) { return objet(m) && id(m.id) && textes(m, ['mot', 'defSource', 'sourceTexte', 'defMoi', 'analogie']); };
    const source = function (s) { return objet(s) && id(s.id) && textes(s, ['titre', 'auteur', 'lien', 'date', 'retiens']) && parmi(D.TYPES_SOURCE)(s.type); };
    const criteres = D.GRILLE.map(function (c) { return c.id; });
    const grille = function (a) { return objet(a) && Object.keys(a).every(function (k) { return criteres.indexOf(k) >= 0 && [1, 2, 3, 4].indexOf(a[k]) >= 0; }); };
    const oral = function (o) { return objet(o) && id(o.id) && textes(o, ['nom', 'date', 'objectifs']) && sinon(o.video, oui) && sinon(o.auto, grille); };
    const reponses = function (r) { return objet(r) && sinon(r.i, function (l) { return liste(l, texte); }) && sinon(r.n, function (l) { return liste(l, texte); }) && texte(r.a) && texte(r.s); };
    const valeurs = function (o, f) { return objet(o) && Object.keys(o).every(function (k) { return f(o[k]); }); };
    return objet(n) && n.v === 1 && liste(n.questions, question)
      && sinon(n.profil, function (p) { return objet(p) && texte(p.prenom) && sinon(p.vu, oui); })
      && sinon(n.quiz, function (q) { return objet(q) && reponses(q.reponses) && sinon(q.fait, oui); })
      && sinon(n.interets, function (l) { return liste(l, texte); }) && sinon(n.ponts, function (l) { return liste(l, texte); })
      && sinon(n.pistes, function (l) { return liste(l, piste); }) && sinon(n.mots, function (l) { return liste(l, mot); })
      && sinon(n.sources, function (l) { return liste(l, source); }) && sinon(n.oraux, function (l) { return liste(l, oral); })
      && sinon(n.hf, function (o) { return valeurs(o, function (v) { return typeof v === 'string'; }); })
      && sinon(n.compteurs, function (o) { return valeurs(o, entier); }) && sinon(n.vus, function (o) { return valeurs(o, entier); });
  }

  const api = { coach, coachMot, motComplet, coachSources, suggestions, questionsProbables, phase, prochaineAction, HAUTS_FAITS, majHautsFaits,
    tousLesPoints, ressemblance, contient, aChiffre, reference, dossierValide, SEC_PAR_POINT };
  racine.HGAnalyse = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
