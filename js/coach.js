// Hello GO : les analyses automatiques (coach, questionnaire, questions probables, hauts faits).
// Nom de fichier neutre : un fichier nommé « analyse.js » est bloqué par les bloqueurs de contenu (règle « /analyse.js »
// d'EasyPrivacy, liste active par défaut dans uBlock Origin) ; ne pas le renommer en analyse, analytics, stats, track…
// Tout se calcule sur l'appareil, à partir du dossier : rien n'est envoyé.
(function (racine) {
  'use strict';
  const D = racine.HGDonnees || require('./donnees.js');
  const CARTES = racine.HGDecouvertes || require('./decouvertes.js');

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
  // Les goûts que montrent les cartes « Ça m'intrigue » : { i: { tag: nombre }, n: { tag: nombre } }
  function gouts(reactions) {
    const g = { i: {}, n: {} };
    CARTES.forEach(function (c) { if ((reactions || {})[c.num] === 1) { c.i.forEach(function (t) { g.i[t] = (g.i[t] || 0) + 1; }); c.n.forEach(function (t) { g.n[t] = (g.n[t] || 0) + 1; }); } });
    return g;
  }
  // La prochaine carte : jamais vue, et du domaine le moins montré jusqu'ici, pour faire découvrir autre chose.
  function prochaineCarte(reactions) {
    const r = reactions || {}, vus = {};
    CARTES.forEach(function (c) { if (r[c.num]) c.n.forEach(function (t) { vus[t] = (vus[t] || 0) + 1; }); });
    const reste = CARTES.filter(function (c) { return !r[c.num]; });
    if (!reste.length) return null;
    const poids = function (c) { return Math.min.apply(null, c.n.map(function (t) { return vus[t] || 0; })); };
    reste.sort(function (a, b) { return poids(a) - poids(b) || ((a.num * 37) % 101) - ((b.num * 37) % 101); });
    return reste[0];
  }
  // Les réponses possibles d'une question (celles de « dansspe » dépendent de la spécialité choisie).
  function choixDe(q, reponses) {
    if (q.groupes) return q.groupes.reduce(function (l, g) { return l.concat(g[1]); }, []);
    if (q.choixSelon) return q.choixSelon[(reponses || {})[q.selon]] || [];
    return q.choix;
  }
  // Le profil que dessinent les réponses : des poids par étiquette, les mots cherchés, l'angle et la spécialité.
  function profil(reponses) {
    const r = reponses || {}, p = { i: {}, n: {}, raison: { i: {}, n: {} }, mots: [], angle: r.angle || '', spe: r.spe || '', nombre: 0 };
    D.QUIZ.forEach(function (q) {
      if (q.id === 'angle' || q.id === 'spe') { if (r[q.id]) p.nombre++; return; }
      const coches = [].concat(r[q.id] || []);
      choixDe(q, r).forEach(function (c) {
        if (coches.indexOf(c[0]) < 0) return;
        p.nombre++;
        ['i', 'n'].forEach(function (k) { c[2][k].forEach(function (t) { p[k][t] = (p[k][t] || 0) + 1; if (!p.raison[k][t]) p.raison[k][t] = c[1]; }); });
        if (c[2].k) p.mots.push({ re: new RegExp(c[2].k, 'i'), texte: c[1] });
      });
    });
    return p;
  }
  // Ce qui intrigue l'élève dans les cartes sans qu'il ou elle l'ait coché dans « Mes goûts » : la surprise.
  // Rien à comparer tant que « Mes goûts » ne dit rien : pas de surprise (sinon « tu ne l'avais pas coché » serait faux).
  function surprises(reponses, reactions) {
    const g = gouts(reactions), p = profil(reponses), l = [];
    if (!Object.keys(p.i).length && !Object.keys(p.n).length) return l;
    ['n', 'i'].forEach(function (k) { Object.keys(g[k]).forEach(function (t) { if (g[k][t] >= 2 && !p[k][t]) l.push({ nom: D.TAGS[k][t], n: g[k][t] }); }); });
    return l.sort(function (a, b) { return b.n - a.n; }).slice(0, 3).map(function (x) { return x.nom; });
  }

  // Les sujets qui collent le mieux aux réponses et aux cartes aimées, avec la raison.
  function suggestions(reponses, combien, reactions) {
    const p = profil(reponses), g = gouts(reactions);
    const liste = D.SUJETS.map(function (s, rang) {
      let score = 0; const raisons = [];
      const plus = function (texte) { if (texte && raisons.indexOf(texte) < 0) raisons.push(texte); };
      s.i.forEach(function (x) { if (p.i[x]) { score += 1 + Math.min(p.i[x], 3); plus(p.raison.i[x]); } if (g.i[x]) { score += Math.min(g.i[x], 3); } });
      s.n.forEach(function (x) { if (p.n[x]) { score += 1 + Math.min(p.n[x], 3); plus(p.raison.n[x]); } if (g.n[x]) { score += Math.min(g.n[x], 3); } });
      p.mots.forEach(function (m) { if (m.re.test(s.t)) { score += 4; plus(m.texte); } });
      if (score > 0 && p.angle && s.a.indexOf(p.angle) >= 0) score += 2;
      if (p.spe && s.s.indexOf(p.spe) >= 0) { score += 3; plus('ta spécialité'); }
      if (!raisons.length && score > 0) plus('les cartes qui t’ont intrigué·e');
      return { sujet: s, score: score, raisons: raisons.slice(0, 3), rang: rang };
    }).filter(function (x) { return x.score > 0; });
    liste.sort(function (a, b) { return b.score - a.score || a.rang - b.rang; });
    // De la variété : pas plus de deux sujets du même thème dans la sélection.
    const parTheme = {}, choisis = [];
    liste.forEach(function (x) { if (choisis.length < (combien || 5) && (parTheme[x.sujet.th] || 0) < 2) { choisis.push(x); parTheme[x.sujet.th] = (parTheme[x.sujet.th] || 0) + 1; } });
    return choisis;
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

  // Les quiz « Vérifie que tu as compris » : essayé au moins une fois, réussi sans faute.
  function quizEssaye(d, id) { const r = (d.comprendre || {})[id]; return !!(r && r.essais); }
  // Le sans-faute porte sur une salve (10 questions), même si la banque du quiz en compte plus.
  function surSalve(z) { return Math.min(D.SALVE, z.questions.length); }
  function quizSansFaute(d, id) { const r = (d.comprendre || {})[id], z = D.COMPRENDRE.find(function (x) { return x.id === id; }); return !!(r && z && r.meilleur === surSalve(z)); }

  // Ce que l'élève a déjà vu d'un quiz : pour chaque question, le nombre de fois où elle est apparue (vues) et si elle a
  // été ratée la dernière fois (ratees). Vient de d.banque (version 1.5.0 et suivantes) ; un résultat plus récent que la
  // banque (dossier de la version 1.4.0, ou essai fait sur un appareil resté en 1.4.0) compte aussi : cette version
  // montrait toujours les 10 premières questions, et « rates » dit lesquelles ont été ratées.
  function suiviQuiz(d, z) {
    const b = ((d.banque || {})[z.id]) || null, r = (d.comprendre || {})[z.id], vues = {}, ratees = {};
    if (b) { Object.keys(b.vues || {}).forEach(function (k) { vues[k] = b.vues[k]; }); Object.keys(b.ratees || {}).forEach(function (k) { ratees[k] = 1; }); }
    if (r && r.essais && (!b || (typeof r.le === 'string' && r.le > (b.le || '')))) {
      const rates = r.rates || [];
      z.questions.slice(0, D.ANCIENNES).forEach(function (q) { vues[q.id] = vues[q.id] || 1; if (rates.indexOf(q.id) >= 0) ratees[q.id] = 1; else delete ratees[q.id]; });
    }
    const connues = z.questions.map(function (q) { return q.id; });
    return { vues: vues, ratees: ratees, nVues: connues.filter(function (k) { return vues[k]; }).length };
  }
  // Une salve : SALVE questions différentes. D'abord une question de chaque sous-thème (th), pour les couvrir tous ; puis,
  // une à une, la question la plus prioritaire qui reste : jamais vue, puis ratée la dernière fois, puis les autres ; à
  // priorité égale, celle du sous-thème le moins représenté dans la salve, puis au hasard. Les questions sont rendues dans
  // l'ordre de la banque. alea : une fonction comme Math.random (les essais en donnent une prévisible).
  function tirerSalve(d, z, alea) {
    alea = alea || Math.random;
    const s = suiviQuiz(d, z), rang = function (q) { return !s.vues[q.id] ? 0 : s.ratees[q.id] ? 1 : 2; };
    const themes = {};
    z.questions.forEach(function (q) { const t = q.th || ''; (themes[t] = themes[t] || []).push({ q: q, rang: rang(q), x: alea() }); });
    const files = Object.keys(themes).map(function (t) { return { l: themes[t].sort(function (a, b) { return a.rang - b.rang || a.x - b.x; }), pris: 0, x: alea() }; });
    const n = surSalve(z), pris = [], prendre = function (f) { pris.push(f.l.shift().q); f.pris++; };
    files.slice().sort(function (a, b) { return a.l[0].rang - b.l[0].rang || a.x - b.x; }).forEach(function (f) { if (pris.length < n) prendre(f); });
    while (pris.length < n) {
      const restent = files.filter(function (f) { return f.l.length; });
      if (!restent.length) break;
      prendre(restent.sort(function (a, b) { return a.l[0].rang - b.l[0].rang || a.pris - b.pris || a.l[0].x - b.l[0].x; })[0]);
    }
    return z.questions.filter(function (q) { return pris.indexOf(q) >= 0; }).map(function (q) { return q.id; });
  }
  // Le résultat d'une salve, dans le dossier. d.comprendre[id] garde la forme de la version 1.4.0 (scores sur 10, et
  // « rates » ne cite que les 10 premières questions, les seules qu'une version 1.4.0 accepte) ; « rates_toutes » cite
  // toutes les questions ratées de la salve. d.banque[id] retient les questions vues et ratées, d'une salve à l'autre.
  function noterSalve(d, z, ids, justes, le) {
    le = le || jourLocal(new Date()); // le jour du calendrier de l'appareil, comme les visites (et non celui de Greenwich)
    const avant = (d.comprendre || {})[z.id] || {}, s = suiviQuiz(d, z), anciennes = z.questions.slice(0, D.ANCIENNES).map(function (q) { return q.id; });
    const ratees = ids.filter(function (k, i) { return !justes[i]; }), juste = ids.length - ratees.length;
    d.comprendre = d.comprendre || {};
    d.comprendre[z.id] = { meilleur: Math.max(avant.meilleur || 0, juste), dernier: juste, le: le, essais: (avant.essais || 0) + 1,
      rates: ratees.filter(function (k) { return anciennes.indexOf(k) >= 0; }), rates_toutes: ratees };
    ids.forEach(function (k) { s.vues[k] = (s.vues[k] || 0) + 1; if (ratees.indexOf(k) >= 0) s.ratees[k] = 1; else delete s.ratees[k]; });
    d.banque = d.banque || {};
    d.banque[z.id] = { le: le, vues: s.vues, ratees: s.ratees };
    return juste;
  }

  // ---------- Le suivi : les jours de visite, l'absence, les hauts faits datés (version 1.5.0) ----------
  // Une date du calendrier de l'appareil, sans heure : AAAA-MM-JJ.
  function jourLocal(t) { const x = t instanceof Date ? t : new Date(t); const z = function (n) { return (n < 10 ? '0' : '') + n; }; return x.getFullYear() + '-' + z(x.getMonth() + 1) + '-' + z(x.getDate()); }
  const DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  // Le nombre de jours du calendrier entre deux dates (AAAA-MM-JJ, Date ou horodatage), sans souci d'heure d'été.
  function ecartJours(a, b) {
    const j = function (x) { const s = typeof x === 'string' && DATE.test(x) ? x : jourLocal(x), p = s.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); };
    return Math.round((j(b) - j(a)) / 864e5);
  }
  const VISITES_MAX = 400;
  // Note le jour de visite dans d.visites ({ "AAAA-MM-JJ": 1 }), une fois par jour, en gardant les 400 derniers jours.
  // Un objet plutôt qu'une liste : deux appareils qui notent chacun leur jour se fusionnent sans conflit.
  function noterVisite(d, quand) {
    const k = jourLocal(quand || new Date());
    d.visites = d.visites && typeof d.visites === 'object' && !Array.isArray(d.visites) ? d.visites : {};
    if (d.visites[k]) return false;
    d.visites[k] = 1;
    const l = Object.keys(d.visites).filter(function (x) { return DATE.test(x); }).sort();
    l.slice(0, Math.max(0, l.length - VISITES_MAX)).forEach(function (x) { delete d.visites[x]; });
    return true;
  }
  // Les jours de visite (du plus ancien au plus récent) et les jours actifs sur 7 et 30 jours (aujourd'hui compris).
  function statsVisites(d, maintenant) {
    const l = Object.keys((d && d.visites) || {}).filter(function (x) { return DATE.test(x); }).sort(), auj = jourLocal(maintenant || new Date());
    const dans = function (n) { return l.filter(function (x) { const e = ecartJours(x, auj); return e >= 0 && e < n; }).length; };
    return { jours: l, j7: dans(7), j30: dans(30), total: l.length, depuis: l[0] || null, derniere: l[l.length - 1] || null };
  }
  // Les mois de la frise des visites, du plus ancien au mois en cours ([année, mois]) : les 12 derniers au plus. Un premier
  // jour à venir ou abîmé (horloge d'un appareil, fuseau d'avance, dossier importé) fait commencer la frise au mois en cours :
  // jamais de boucle sans fin.
  function moisFrise(depuis, maintenant) {
    const auj = jourLocal(maintenant || new Date()), anF = +auj.slice(0, 4), moF = +auj.slice(5, 7), s = String(depuis || '');
    let an = +s.slice(0, 4), mo = +s.slice(5, 7);
    if (!DATE.test(s) || !(mo >= 1 && mo <= 12) || an * 12 + mo > anF * 12 + moF) { an = anF; mo = moF; }
    if ((anF - an) * 12 + (moF - mo) > 12) { an = moF === 12 ? anF : anF - 1; mo = moF === 12 ? 1 : moF + 1; }
    const l = [];
    while (l.length < 13) { l.push([an, mo]); if (an === anF && mo === moF) break; mo++; if (mo > 12) { mo = 1; an++; } }
    return l;
  }
  // L'absence d'un·e élève, d'après la dernière visite que garde la base (vu_le) et la date d'inscription (cree_le) :
  // le voyant s'allume au-delà de 14 jours sans visite ; « jamais revenu·e » : aucune visite après le jour de l'inscription.
  const ABSENCE_MAX = 14;
  function absence(vuLe, creeLe, maintenant) {
    const now = maintenant || new Date(), ok = function (x) { return x && !isNaN(new Date(x).getTime()); };
    const jours = ok(vuLe) ? Math.max(0, ecartJours(new Date(vuLe), now)) : null;
    const jamaisRevenu = ok(creeLe) && ok(vuLe) && jourLocal(new Date(vuLe)) === jourLocal(new Date(creeLe)) && ecartJours(new Date(creeLe), now) >= 1;
    return { jours: jours, alerte: jours === null || jours > ABSENCE_MAX, jamaisRevenu: !!jamaisRevenu };
  }
  // Les hauts faits gagnés, dans l'ordre où ils l'ont été. Un haut fait gagné avant que sa date soit lisible garde sa
  // place, avec « le: null » (date inconnue) ; un identifiant inconnu de cette version est laissé de côté.
  function hautsFaitsDates(d) {
    const hf = (d && d.hf) || {};
    return HAUTS_FAITS.filter(function (h) { return hf[h.id]; }).map(function (h) { const v = String(hf[h.id]).slice(0, 10); return { id: h.id, titre: h.titre, le: DATE.test(v) ? v : null }; })
      .sort(function (a, b) { return a.le === b.le ? 0 : a.le === null ? 1 : b.le === null ? -1 : a.le < b.le ? -1 : 1; });
  }

  // La prochaine action : une seule, choisie d'après l'état du dossier. Un quiz est proposé une fois, au bon moment
  // (avant de choisir sa question, puis quand le plan prend forme) : dès qu'il est essayé, la suite reprend.
  function prochaineAction(d) {
    const qs = d.questions || [];
    const nCartes = Object.keys((d.decouverte || {}).reactions || {}).length;
    if (nCartes < 10 && !(d.pistes || []).length && !qs.length) return { texte: 'Découvre 10 histoires de l’informatique : dis ce qui t’intrigue, et trouve des idées de sujets.', bouton: 'Découvrir', vers: '#/explorer/decouvrir', duree: '5 min' };
    if (!d.quiz || !d.quiz.fait) if (!(d.pistes || []).length && !qs.length) return { texte: 'Dis ce que tu aimes, ce qui te tient à cœur et ce que tu préfères dans ta spécialité : tes sujets s’affinent.', bouton: 'Faire le questionnaire', vers: '#/explorer/quiz', duree: '3 min' };
    if (!qs.length) {
      const p = (d.pistes || [])[0];
      if (!p) return { texte: 'Choisis une piste parmi les sujets proposés.', bouton: 'Voir les sujets', vers: '#/explorer/sujets', duree: '5 min' };
      if (!quizEssaye(d, 'epreuve')) return { texte: 'Avant de choisir ta question, vérifie que tu as compris les règles de l’épreuve : 10 questions, avec une explication après chaque réponse.', bouton: 'Faire le quiz', vers: '#/comprendre/epreuve', duree: '5 min' };
      if (!(p.candidates || []).length) return { texte: 'Transforme ta piste en question : écris une ou deux questions possibles.', bouton: 'Ouvrir mes pistes', vers: '#/explorer/pistes', duree: '5 min' };
      return { texte: 'Choisis ta question et commence ton plan.', bouton: 'Ouvrir mes pistes', vers: '#/explorer/pistes', duree: '2 min' };
    }
    const q = qs.slice().sort(function (a, b) { return tousLesPoints(a).length - tousLesPoints(b).length; })[0];
    const n = tousLesPoints(q).length;
    if (n < 8) return { texte: 'Ajoute des points à ton plan : commence par l’accroche et ta problématique.', bouton: 'Ouvrir mon plan', vers: '#/question/' + q.id, duree: '10 min' };
    if (!quizEssaye(d, 'plan')) return { texte: 'Ton plan prend forme : vérifie que tu as compris la méthode du plan, en 10 situations.', bouton: 'Faire le quiz', vers: '#/comprendre/plan', duree: '5 min' };
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
    { id: 'cartes10', g: 'Explorer', titre: 'Un petit pas pour toi', cond: 'Donner ton avis sur 10 cartes de « Découvrir ».', pourquoi: 'On ne peut pas aimer ce qu’on n’a jamais croisé.', test: function (d) { return Object.keys((d.decouverte || {}).reactions || {}).length >= 10; } },
    { id: 'cartes', g: 'Explorer', titre: 'Attrapez-les toutes !', cond: 'Donner ton avis sur toutes les cartes de « Découvrir ».', pourquoi: 'Tu as fait le tour : tu choisis ton sujet en connaissant le terrain.', test: function (d) { return Object.keys((d.decouverte || {}).reactions || {}).length >= CARTES.length; } },
    { id: 'surprise', g: 'Explorer', cache: true, indice: 'Laisse-toi surprendre par une carte que tu n’attendais pas.', titre: 'Plot twist', cond: 'Être intrigué·e par un domaine que tu n’avais pas coché dans tes goûts.', pourquoi: 'Les meilleurs sujets sont souvent ceux qu’on n’attendait pas.', test: function (d) { return !!(d.quiz && d.quiz.fait) && surprises(d.quiz.reponses, (d.decouverte || {}).reactions).length > 0; } },
    { id: 'quiz', g: 'Explorer', titre: 'Curiosité activée', cond: 'Finir le questionnaire.', pourquoi: 'On parle mieux de ce qu’on aime.', test: function (d) { return !!(d.quiz && d.quiz.fait); } },
    { id: 'pistes3', g: 'Explorer', titre: 'Trois fers au feu', cond: 'Garder 3 pistes.', pourquoi: 'Ne choisis pas trop vite : compare.', test: function (d) { return (d.pistes || []).length >= 3; } },
    { id: 'multivers', g: 'Explorer', titre: 'Multivers', cond: 'Écrire 3 questions possibles pour une même piste.', pourquoi: 'Un même sujet a plusieurs angles : explore-les, comme dans un multivers.', test: function (d) { return (d.pistes || []).some(function (p) { return (p.candidates || []).length >= 3; }); } },
    { id: 'pont', g: 'Explorer', titre: 'Pont-levis', cond: 'Écrire un pont entre un centre d’intérêt et une notion.', pourquoi: 'Le pont, c’est ce qui rend ton sujet personnel.', test: function (d) { return (d.ponts || []).some(function (p) { return p.trim().length > 5; }); } },
    { id: 'sujet', g: 'Explorer', titre: 'Vous avez un sujet !', cond: 'Avoir une question validée par ton enseignant·e.', pourquoi: 'Enfin. Maintenant, le vrai travail commence.', test: function (d) { return unPlan(d, function (q) { return q.statut === 'validee'; }); } },
    { id: 'volontaire', g: 'Explorer', titre: 'Je me porte volontaire !', cond: 'Proposer ta question à ton enseignant·e.', pourquoi: 'Comme Katniss : il faut oser s’avancer. Une question proposée tôt, c’est du temps gagné.', test: function (d) { return unPlan(d, function (q) { return q.statut === 'proposee' || q.statut === 'validee'; }); } },
    { id: 'dory', g: 'Explorer', titre: 'Nage droit devant', cond: 'Revenir travailler 5 jours différents.', pourquoi: 'Comme Dory : un peu, souvent. Dix minutes par jour valent mieux qu’une nuit la veille.', test: function (d) { return ((d.compteurs || {}).jours || 0) >= 5; } },
    { id: 'planb', g: 'Explorer', titre: 'Plan B', cond: 'Avoir deux questions.', pourquoi: 'Le jury choisit entre tes deux questions : il en faut deux.', test: function (d) { return (d.questions || []).length >= 2; } },

    { id: 'regles', g: 'Comprendre', titre: 'Maître·sse du jeu', cond: 'Faire un sans-faute au quiz « Ai-je compris l’épreuve ? ».', pourquoi: 'Quand on connaît les règles du jeu, le jour J ne réserve plus de mauvaise surprise.', test: function (d) { return quizSansFaute(d, 'epreuve'); } },
    { id: 'accroc', g: 'Comprendre', titre: 'Un plan sans accroc', cond: 'Faire un sans-faute au quiz « Ai-je compris la méthode du plan ? ».', pourquoi: 'Comme Hannibal Smith : j’adore quand un plan se déroule sans accroc. Tu sais comment construire le tien.', test: function (d) { return quizSansFaute(d, 'plan'); } },

    { id: 'hello', g: 'Le plan', titre: 'Hello, world', cond: 'Écrire ton premier point.', pourquoi: 'Tout programme commence par une première ligne.', test: function (d) { return tous(d).length >= 1; } },
    { id: 'accroche', g: 'Le plan', titre: 'Accroche-toi', cond: 'Avoir une accroche.', pourquoi: 'Le jury écoute mieux après un fait concret.', test: function (d) { return unPlan(d, function (q) { return aEtiquette(q, 'accroche'); }); } },
    { id: 'avengers', g: 'Le plan', titre: 'Avengers, rassemblement !', cond: 'Avoir au moins un point dans chaque partie.', pourquoi: 'Une équipe complète : introduction, axes, conclusion.', test: function (d) { return unPlan(d, function (q) { return q.parties.length >= 4 && q.parties.every(function (p) { return p.points.length > 0; }); }); } },
    { id: 'taille', g: 'Le plan', titre: 'Ni trop ni trop peu', cond: 'Avoir un plan entre 30 et 50 points.', pourquoi: 'C’est la taille qui tient 10 minutes.', test: function (d) { return unPlan(d, function (q) { const n = tousLesPoints(q).length; return n >= 30 && n <= 50; }); } },
    { id: 'tri', g: 'Le plan', titre: 'Tri par insertion', cond: 'Déplacer un point d’une partie à une autre.', pourquoi: 'Un bon plan se réorganise.', test: function (d) { return ((d.compteurs || {}).deplacements || 0) >= 1; } },
    { id: 'snap', g: 'Le plan', titre: 'Parfaitement équilibré', cond: 'Avoir deux axes de même taille, à un point près (5 points au moins chacun).', pourquoi: 'Comme toute chose devrait l’être : deux axes équilibrés, c’est un exposé clair.', test: function (d) { return unPlan(d, function (q) { const a = q.parties.filter(function (p) { return /axe/i.test(p.titre); }); return a.length >= 2 && a[0].points.length >= 5 && Math.abs(a[0].points.length - a[1].points.length) <= 1; }); } },
    { id: 'fin', g: 'Le plan', titre: 'Le mot de la fin', cond: 'Avoir une synthèse, une ouverture et une question de relance.', pourquoi: 'Le jury retient surtout la fin.', test: function (d) { return unPlan(d, function (q) { return aEtiquette(q, 'synthese') && aEtiquette(q, 'ouverture') && aEtiquette(q, 'relance'); }); } },
    { id: 'pirate', g: 'Le plan', titre: 'Roi ou reine des pirates', cond: 'Avoir un plan complet : 30 à 50 points, accroche, problématique, transition, synthèse et relance.', pourquoi: 'Tu as trouvé ton trésor : un plan prêt pour le jury.', test: function (d) { return unPlan(d, function (q) { const n = tousLesPoints(q).length; return n >= 30 && n <= 50 && ['accroche', 'problematique', 'transition', 'synthese', 'relance'].every(function (e) { return aEtiquette(q, e); }); }); } },
    { id: 'vingt', g: 'Le plan', titre: 'Plus haut, plus loin', cond: 'Avoir 20 points dans un plan.', pourquoi: 'La devise de Captain Marvel : tu es à mi-chemin, continue.', test: function (d) { return unPlan(d, function (q) { return tousLesPoints(q).length >= 20; }); } },
    { id: 'nami', g: 'Le plan', titre: 'Navigatrice', cond: 'Déplacer des points 5 fois d’une partie à une autre.', pourquoi: 'Comme Nami sur le Vogue Merry : on ajuste le cap autant de fois qu’il le faut.', test: function (d) { return ((d.compteurs || {}).deplacements || 0) >= 5; } },
    { id: 'cape', g: 'Le plan', titre: 'Pas de cape !', cond: 'Avoir 15 points ou plus, dont aucun n’est trop long.', pourquoi: 'Edna Mode a raison : ce qui dépasse fait trébucher. Des points courts, et tu ne liras pas tes notes.', test: function (d) { return unPlan(d, function (q) { const p = tousLesPoints(q); return p.length >= 15 && p.every(function (x) { return x.texte.length <= 240; }); }); } },
    { id: 'tetris', g: 'Le plan', titre: 'Ligne complète', cond: 'Donner un type à tous les points d’un plan de 12 points ou plus.', pourquoi: 'Comme au Tetris : quand chaque pièce est à sa place, tout s’emboîte.', test: function (d) { return unPlan(d, function (q) { const p = tousLesPoints(q); return p.length >= 12 && p.every(function (x) { return !!x.etiquette; }); }); } },
    { id: 'zelda', g: 'Le plan', titre: 'Il est dangereux d’y aller seul·e', cond: 'Relier un mot et une source à un même point.', pourquoi: 'Prends ceci : un point accompagné d’une définition et d’une source est bien mieux armé.', test: function (d) { return tous(d).some(function (p) { return (p.mots || []).length > 0 && (p.sources || []).length > 0; }); } },
    { id: 'ctrlz', g: 'Le plan', titre: 'Ctrl + Z', cond: 'Annuler une suppression.', pourquoi: 'Grace Hopper a rendu célèbre le mot « bug » : se tromper puis corriger, c’est le métier.', test: function (d) { return ((d.compteurs || {}).annulations || 0) >= 1; } },
    { id: 'sudo', g: 'Le plan', cache: true, indice: 'Demande-le… avec les droits d’administration.', titre: 'sudo', cond: 'Écrire le mot « sudo » dans un point.', pourquoi: 'Avec de grands droits viennent de grandes précautions : relis toujours avant de valider.', test: function (d) { return tous(d).some(function (p) { return contient(p.texte, 'sudo'); }); } },
    { id: 'q42', g: 'Le plan', cache: true, indice: 'Un nombre bien connu des geeks…', titre: '42', cond: 'Avoir exactement 42 points.', pourquoi: 'La réponse à la grande question sur la vie, l’univers et le reste… mais pas à ta problématique.', test: function (d) { return unPlan(d, function (q) { return tousLesPoints(q).length === 42; }); } },

    { id: 'dico', g: 'Les mots', titre: 'Dico vivant', cond: 'Avoir 5 mots avec leurs deux définitions.', pourquoi: 'Un mot bien défini, c’est une question du jury en moins.', test: function (d) { return (d.mots || []).filter(motComplet).length >= 5; } },
    { id: 'groot', g: 'Les mots', titre: 'Je s’appelle Groot', cond: 'Écrire 5 analogies.', pourquoi: 'Dire beaucoup avec peu de mots : c’est ce qu’attend le membre du jury non spécialiste.', test: function (d) { return (d.mots || []).filter(function (m) { return (m.analogie || '').trim().length > 5; }).length >= 5; } },
    { id: 'zerocopie', g: 'Les mots', titre: 'Zéro copier-coller', cond: 'Avoir 8 mots complets, aucun recopié sur sa source.', pourquoi: 'Si tu sais le dire avec tes mots, tu l’as compris.', test: function (d) { const c = (d.mots || []).filter(motComplet); return c.length >= 8 && c.every(function (m) { return ressemblance(m.defSource, m.defMoi) <= 0.6; }); } },
    { id: 'shuri', g: 'Les mots', titre: 'Au labo de Shuri', cond: 'Avoir 3 mots complets, chacun avec son image.', pourquoi: 'Comme Shuri : la technique la plus pointue s’explique avec le sourire, et un bon exemple.', test: function (d) { return (d.mots || []).filter(function (m) { return motComplet(m) && (m.analogie || '').trim().length > 5; }).length >= 3; } },
    { id: 'arya', g: 'Les mots', titre: 'Pas aujourd’hui', cond: 'N’avoir plus aucun mot « à compléter » (4 mots au moins).', pourquoi: 'Que dit-on au mot non défini ? Pas aujourd’hui. Le jury ne te prendra pas en défaut.', test: function (d) { const l = d.mots || []; return l.length >= 4 && l.every(motComplet); } },
    { id: 'onze', g: 'Les mots', cache: true, indice: 'Un nombre, et une héroïne de Hawkins.', titre: 'Onze', cond: 'Avoir exactement 11 mots dans ton lexique.', pourquoi: 'Comme Onze : peu de mots, mais chacun a du pouvoir.', test: function (d) { return (d.mots || []).length === 11; } },
    { id: 'recursif', g: 'Les mots', cache: true, indice: 'Pour comprendre cet indice, il faut d’abord comprendre cet indice.', titre: 'Récursif', cond: 'Utiliser un mot de ton lexique dans la définition d’un autre.', pourquoi: 'Pour comprendre ce haut fait, il faut d’abord comprendre ce haut fait.', test: function (d) { const l = d.mots || []; return l.some(function (a) { return l.some(function (b) { return a !== b && b.mot && b.mot.length > 2 && contient((a.defMoi || '') + ' ' + (a.defSource || ''), b.mot); }); }); } },

    { id: 'source1', g: 'Les sources', titre: 'Un grand pouvoir…', cond: 'Ajouter ta première source, avec ce que tu en retiens.', pourquoi: '…implique de grandes responsabilités : dire d’où vient ce qu’on affirme.', test: function (d) { return (d.sources || []).some(function (s) { return s.titre && (s.retiens || '').trim().length > 5; }); } },
    { id: 'types2', g: 'Les sources', titre: 'Deux avis valent mieux qu’un', cond: 'Avoir des sources de deux types différents.', pourquoi: 'Croiser les sources, c’est le début de l’esprit critique.', test: function (d) { return new Set((d.sources || []).map(function (s) { return s.type; }).filter(Boolean)).size >= 2; } },
    { id: 'fact', g: 'Les sources', titre: 'Fact-checkeur·se', cond: 'Avoir au moins 3 points avec un chiffre, tous reliés à une source.', pourquoi: 'Un chiffre sans source, c’est une rumeur.', test: function (d) { const c = tous(d).filter(function (p) { return aChiffre(p.texte); }); return c.length >= 3 && c.every(function (p) { return (p.sources || []).length > 0; }); } },
    { id: 'hermione', g: 'Les sources', titre: 'Hermione approuve', cond: 'Avoir 5 sources, chacune avec ce que tu en retiens.', pourquoi: 'En cas de doute, on va à la bibliothèque. Et on sait dire ce qu’on y a lu.', test: function (d) { return (d.sources || []).filter(function (s) { return s.titre && (s.retiens || '').trim().length > 5; }).length >= 5; } },
    { id: 'enola', g: 'Les sources', titre: 'Enola mène l’enquête', cond: 'Avoir des sources de 3 types différents.', pourquoi: 'Une bonne enquêtrice ne se fie jamais à un seul témoin.', test: function (d) { return new Set((d.sources || []).map(function (s) { return s.type; }).filter(Boolean)).size >= 3; } },
    { id: 'lara', g: 'Les sources', titre: 'Chasseuse de reliques', cond: 'Avoir une source datée d’avant l’an 2000.', pourquoi: 'Comme Lara Croft : remonter à la source d’origine, c’est souvent là qu’est le trésor.', test: function (d) { return (d.sources || []).some(function (s) { const m = /\b(1[0-9]{3})\b/.exec(s.date || ''); return !!m && +m[1] < 2000; }); } },
    { id: 'p404', g: 'Les sources', cache: true, indice: 'Page non trouvée ? Pas chez toi.', titre: 'Aucune erreur 404', cond: 'Avoir 4 sources ou plus, toutes avec un lien.', pourquoi: 'Une source qu’on peut retrouver est une source qu’on peut vérifier.', test: function (d) { const s = d.sources || []; return s.length >= 4 && s.every(function (x) { return /^https?:\/\/\S+\.\S+/.test((x.lien || '').trim()); }); } },
    { id: 'biblio', g: 'Les sources', titre: 'Que la source soit avec toi', cond: 'Avoir 6 sources, toutes reliées à un point.', pourquoi: 'Une source qui ne sert à rien n’est qu’un lien.', test: function (d) { const u = new Set(); tous(d).forEach(function (p) { (p.sources || []).forEach(function (i) { u.add(i); }); }); const s = d.sources || []; return s.length >= 6 && s.every(function (x) { return u.has(x.id); }); } },

    { id: 'echange10', g: 'L’échange', titre: 'Prêt·e pour le jury', cond: 'Répondre à 10 questions de l’échange.', pourquoi: 'L’échange dure autant que l’exposé.', test: function (d) { return (d.questions || []).reduce(function (t, q) { return t + (q.echange || []).filter(function (e) { return (e.reponse || '').trim().length > 10; }).length; }, 0) >= 10; } },
    { id: 'pourquoi', g: 'L’échange', titre: 'Élémentaire', cond: 'Répondre à « Pourquoi as-tu choisi cette question ? ».', pourquoi: 'C’est souvent la première question du jury.', test: function (d) { return unPlan(d, function (q) { return (q.echange || []).some(function (e) { return /pourquoi as-tu choisi/i.test(e.question) && (e.reponse || '').trim().length > 10; }); }); } },

    { id: 'leia', g: 'L’échange', titre: 'Un nouvel espoir', cond: 'Répondre à 5 questions de l’échange.', pourquoi: 'Comme Leia : garder son calme sous les questions, ça se prépare.', test: function (d) { return (d.questions || []).reduce(function (t, q) { return t + (q.echange || []).filter(function (e) { return (e.reponse || '').trim().length > 10; }).length; }, 0) >= 5; } },
    { id: 'gear', g: 'Les oraux', titre: 'Gear Second', cond: 'T’évaluer après un deuxième oral.', pourquoi: 'Comme Luffy : à chaque combat, on passe la vitesse supérieure.', test: function (d) { return (d.oraux || []).filter(function (o) { return o.auto && Object.keys(o.auto).length >= 5; }).length >= 2; } },
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
      if (!d.hf[h.id]) { let ok = false; try { ok = h.test(d); } catch (e) { ok = false; } if (ok) { d.hf[h.id] = date || jourLocal(new Date()); nouveaux.push(h); } }
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
    const cles = function (o) { return objet(o) && Object.keys(o).every(id); };
    const valeurs = function (o, f) { return objet(o) && Object.keys(o).every(function (k) { return f(o[k]); }); };
    const reponses = function (r) { return valeurs(r, function (v) { return typeof v === 'string' || liste(v, function (x) { return typeof x === 'string'; }); }); };
    const reactions = function (r) { return objet(r) && Object.keys(r).every(function (k) { return /^[0-9]{1,3}$/.test(k) && (r[k] === 1 || r[k] === -1); }); };
    return objet(n) && n.v === 1 && liste(n.questions, question)
      && sinon(n.profil, function (p) { return objet(p) && texte(p.prenom) && sinon(p.vu, oui); })
      && sinon(n.quiz, function (q) { return objet(q) && reponses(q.reponses) && sinon(q.fait, oui); })
      && sinon(n.interets, function (l) { return liste(l, texte); }) && sinon(n.ponts, function (l) { return liste(l, texte); })
      && sinon(n.pistes, function (l) { return liste(l, piste); }) && sinon(n.mots, function (l) { return liste(l, mot); })
      && sinon(n.sources, function (l) { return liste(l, source); }) && sinon(n.oraux, function (l) { return liste(l, oral); })
      && sinon(n.decouverte, function (o) { return objet(o) && reactions(o.reactions); })
      // Les quiz « Vérifie que tu as compris » : par quiz, meilleur et dernier score, date, essais, questions ratées au dernier essai.
      // Tolérant pour ce qu'une version plus récente pourrait écrire (un quiz, une question, des questions de plus) : un
      // appareil resté sur cette version ne refuse jamais le dossier (tests/dossiers.py). Ce qui s'affiche reste contrôlé :
      // des entiers pour les scores, un texte pour la date, des identifiants pour les questions ratées (seules celles de la
      // page sont montrées) ; un quiz inconnu est gardé tel quel, jamais lu.
      && sinon(n.comprendre, function (o) { return objet(o) && Object.keys(o).every(function (k) {
        const z = D.COMPRENDRE.find(function (x) { return x.id === k; }), r = o[k];
        if (!z) return id(k) && objet(r);
        return objet(r) && entier(r.meilleur) && entier(r.dernier) && entier(r.essais) && texte(r.le) && sinon(r.rates, function (l) { return liste(l, id); })
          && sinon(r.rates_toutes, function (l) { return liste(l, id); });
      }); })
      // Version 1.5.0, tout est facultatif. Les questions vues et ratées de chaque quiz (une question d'une version plus
      // récente est acceptée : seule sa forme compte), et les jours de visite.
      && sinon(n.banque, function (o) { return cles(o) && valeurs(o, function (b) { return objet(b) && texte(b.le)
        && sinon(b.vues, function (x) { return cles(x) && valeurs(x, entier); }) && sinon(b.ratees, function (x) { return cles(x) && valeurs(x, entier); }); }); })
      && sinon(n.visites, function (o) { return objet(o) && Object.keys(o).every(function (k) { return DATE.test(k) && entier(o[k]); }); })
      && sinon(n.hf, function (o) { return valeurs(o, function (v) { return typeof v === 'string'; }); })
      && sinon(n.compteurs, function (o) { return valeurs(o, entier); }) && sinon(n.vus, function (o) { return valeurs(o, entier); })
      // Ce que l'élève a fait des retours de son enseignant·e (version en ligne) : lus, mots créés, ressources gardées.
      && sinon(n.suivi, function (o) { return objet(o) && Object.keys(o).every(function (k) { return ['lus', 'faits', 'def', 'ressources'].indexOf(k) >= 0; })
        && sinon(o.lus, function (x) { return cles(x) && valeurs(x, entier); }) && sinon(o.faits, function (x) { return cles(x) && valeurs(x, entier); })
        && sinon(o.def, function (x) { return cles(x) && valeurs(x, id); })
        && sinon(o.ressources, function (x) { return cles(x) && valeurs(x, function (v) { return v === 'ajoutee' || v === 'plus-tard'; }); }); });
  }

  const api = { choixDe, profil, gouts, prochaineCarte, surprises, CARTES, coach, coachMot, motComplet, coachSources, suggestions, questionsProbables, phase, prochaineAction, HAUTS_FAITS, majHautsFaits,
    tousLesPoints, ressemblance, contient, aChiffre, reference, dossierValide, SEC_PAR_POINT, quizEssaye, quizSansFaute,
    surSalve, suiviQuiz, tirerSalve, noterSalve, jourLocal, ecartJours, noterVisite, statsVisites, moisFrise, absence, ABSENCE_MAX, VISITES_MAX, hautsFaitsDates };
  racine.HGAnalyse = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
