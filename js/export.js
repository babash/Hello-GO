// Hello GO : le dossier en Markdown (version 1.5.0), lisible tel quel et une fois rendu. Fonctions pures, sans page :
// elles servent à l'élève (« Télécharger mon dossier en Markdown »), à l'enseignant·e (un·e élève, ou toute la classe)
// et aux tests (node tests/export.test.js).
// Tout texte venu du dossier est neutralisé : aucun caractère spécial de Markdown ne peut y créer un titre, une liste,
// un lien, une image ou du HTML. Un lien n'est écrit comme lien que s'il commence par http:// ou https://.
// Ni code ni jeton : le code d'un·e élève n'apparaît que si l'enseignant·e coche « Inclure les codes ».
(function (racine) {
  'use strict';
  const A = racine.HGAnalyse || (typeof require !== 'undefined' ? require('./coach.js') : null);
  const D = racine.HGDonnees || (typeof require !== 'undefined' ? require('./donnees.js') : null);
  const R = racine.HGRetours || (typeof require !== 'undefined' ? require('./retours.js') : null);

  // ---------- Neutraliser un texte ----------
  // Une ligne : les espaces et retours à la ligne deviennent une espace ; chaque caractère qui a un sens en Markdown
  // (ou en HTML) reçoit une barre oblique inverse ; un début de ligne qui ferait une liste, un titre ou une citation aussi.
  function texte(t) {
    let s = String(t == null ? '' : t).replace(/[\x00-\x1f\x7f]+/g, ' ').replace(/\s+/g, ' ').trim();
    s = s.replace(/[\\`*_[\]<>|~#$^{}]/g, '\\$&').replace(/&(?=#?[A-Za-z0-9]+;)/g, '\\&').replace(/!(?=\\\[)/g, '\\!');
    s = s.replace(/^([-+=>])/, '\\$1').replace(/^(\d+)([.)])/, '$1\\$2');
    return s;
  }
  const lienSur = (u) => typeof u === 'string' && /^https?:\/\/[^\s<>"\\]+$/i.test(u.trim());
  // Un lien : [texte](adresse), seulement en http(s) ; les parenthèses de l'adresse sont encodées.
  function lien(titre, url) {
    if (!lienSur(url)) return texte(titre || url);
    const u = url.trim().replace(/\(/g, '%28').replace(/\)/g, '%29');
    return '[' + (texte(titre) || texte(u)) + '](' + u + ')';
  }
  const dateLongue = (j) => { const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})/.exec(String(j || '')); if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); };
  const etiquette = (v) => ((D.ETIQUETTES.find((t) => t[0] === v && v) || [])[1]) || '';
  const typeSource = (v) => ((D.TYPES_SOURCE.find((t) => t[0] === v && v) || [])[1]) || '';
  const STATUTS = { brouillon: 'brouillon', proposee: 'proposée', validee: 'validée' };

  // ---------- Le dossier d'un·e élève ----------
  // o : { titre, niveau (1 : le titre est un #, 2 : un ##), retours (déjà nettoyés), avecRetours, code, le (Date) }
  function dossier(d, o) {
    o = o || {};
    const n0 = o.niveau || 1, h = (k, t) => '#'.repeat(n0 - 1 + k) + ' ' + t, L = [];
    const ret = o.avecRetours && o.retours && Array.isArray(o.retours.items) ? o.retours : null;
    const qs = d.questions || [], mots = d.mots || [], sources = d.sources || [];
    const numM = {}, numS = {}; mots.forEach((m, i) => { numM[m.id] = 'M' + (i + 1); }); sources.forEach((s, i) => { numS[s.id] = 'S' + (i + 1); });
    const bloc = () => { if (L.length && L[L.length - 1] !== '') L.push(''); };
    // Les retours de l'enseignant·e sur un élément : une citation, sous l'élément.
    const retoursSur = (type, id, retrait) => { if (!ret) return; R.pour(ret, type, id).forEach((x) => { if (x.texte.trim()) L.push((retrait || '') + '> **Retour de l’enseignant·e :** ' + texte(x.texte)); }); };

    L.push(h(1, texte(o.titre || ('Mon dossier de Grand oral' + (d.profil && d.profil.prenom ? ' · ' + d.profil.prenom : '')))));
    bloc(); L.push('*Hello GO, préparer le Grand oral de NSI · dossier téléchargé le ' + texte(dateLongue(A.jourLocal(o.le || new Date()))) + '*');
    if (o.code) { bloc(); L.push('Code : ' + texte(o.code)); }
    if (ret) { const b = R.pour(ret, 'bilan', ''); if (b.length) { bloc(); L.push(h(2, 'Bilan de l’enseignant·e')); bloc(); b.forEach((x) => L.push('> ' + texte(x.texte))); } }

    // Les questions et leur plan
    if (!qs.length) { bloc(); L.push(h(2, 'Ma question')); bloc(); L.push('Pas encore de question.'); }
    qs.forEach((q, iq) => {
      bloc(); L.push(h(2, (qs.length > 1 ? 'Question ' + (iq + 1) : 'Ma question') + ' : ' + (texte(q.titre) || 'question sans titre')));
      bloc(); L.push('Statut : ' + (STATUTS[q.statut] || 'brouillon') + '.');
      if (ret) { const v = R.validation(ret, q.id); if (v) L.push('', '> **Avis de l’enseignant·e :** ' + (v.etat === 'validee' ? 'question validée' : 'question à retravailler') + (v.texte.trim() ? '. ' + texte(v.texte) : '')); retoursSur('question', q.id); }
      bloc(); L.push(h(3, 'Le plan'));
      (q.parties || []).forEach((p) => {
        bloc(); L.push(h(4, (texte(p.titre) || 'Partie') + (p.minutes ? ' (environ ' + p.minutes + ' min)' : '')));
        bloc();
        if (!(p.points || []).length) L.push('*(aucun point)*');
        (p.points || []).forEach((x) => {
          const et = etiquette(x.etiquette), refs = (x.mots || []).filter((k) => numM[k]).map((k) => numM[k]).concat((x.sources || []).filter((k) => numS[k]).map((k) => numS[k]));
          L.push('- ' + (et ? '**' + texte(et) + ' :** ' : '') + (texte(x.texte) || '*(point vide)*') + (refs.length ? ' (' + refs.join(', ') + ')' : ''));
          retoursSur('point', x.id, '  ');
        });
      });
      bloc(); L.push(h(3, 'L’échange avec le jury'));
      bloc();
      if (!(q.echange || []).length) L.push('*(aucune question préparée)*');
      (q.echange || []).forEach((x) => {
        L.push('- **' + (texte(x.question) || 'question sans texte') + '**');
        if ((x.reponse || '').trim()) L.push('  - Idées de réponse : ' + texte(x.reponse));
        retoursSur('echange', x.id, '  ');
      });
      if (ret) { const sug = ret.items.filter((x) => x.type === 'question' && (x.qid === q.id || (!x.qid && iq === 0))); if (sug.length) { bloc(); L.push('Questions suggérées par l’enseignant·e :'); bloc(); sug.forEach((x) => L.push('- ' + texte(x.texte))); } }
    });

    // Le lexique
    bloc(); L.push(h(2, 'Lexique'));
    bloc(); if (!mots.length) L.push('Aucun mot défini.');
    mots.forEach((m) => {
      bloc(); L.push(h(3, numM[m.id] + '. ' + (texte(m.mot) || 'mot sans nom')));
      bloc();
      L.push('- **Définition d’une source :** ' + (texte(m.defSource) || '—') + (m.sourceTexte && m.sourceTexte.trim() ? ' (source : ' + texte(m.sourceTexte) + ')' : ''));
      L.push('- **Avec mes mots :** ' + (texte(m.defMoi) || '—'));
      if ((m.analogie || '').trim()) L.push('- **Image :** ' + texte(m.analogie));
      retoursSur('mot', m.id);
    });
    if (ret) { const def = ret.items.filter((x) => x.type === 'definir'); if (def.length) { bloc(); L.push('Mots à définir, demandés par l’enseignant·e :'); bloc(); def.forEach((x) => L.push('- **' + texte(x.mot) + '**' + (x.texte.trim() ? ' : ' + texte(x.texte) : ''))); } }

    // Les sources
    bloc(); L.push(h(2, 'Sources'));
    bloc(); if (!sources.length) L.push('Aucune source.');
    sources.forEach((s) => {
      const ref = [s.auteur && s.auteur.trim() ? texte(s.auteur) : '', s.titre && s.titre.trim() ? '« ' + (lienSur(s.lien) ? lien(s.titre, s.lien) : texte(s.titre)) + ' »' : (lienSur(s.lien) ? lien(s.lien, s.lien) : ''), s.date && s.date.trim() ? texte(s.date) : ''].filter(Boolean).join(', ');
      L.push('- **' + numS[s.id] + '.** ' + (ref || 'source sans titre') + (s.lien && s.lien.trim() && !lienSur(s.lien) ? ' (adresse : ' + texte(s.lien) + ')' : ''));
      const t = typeSource(s.type);
      if (t || (s.retiens || '').trim()) L.push('  - ' + [t ? texte(t) + '.' : '', (s.retiens || '').trim() ? 'Ce que j’en retiens : ' + texte(s.retiens) : ''].filter(Boolean).join(' '));
      retoursSur('source', s.id, '  ');
    });
    if (ret) { const res = ret.items.filter((x) => x.type === 'ressource'); if (res.length) { bloc(); L.push('Ressources suggérées par l’enseignant·e :'); bloc();
      res.forEach((x) => L.push('- ' + lien(x.titre || x.url, x.url) + (x.verifier ? ' (lien à vérifier)' : '') + (x.texte.trim() ? ' : ' + texte(x.texte) : ''))); } }

    // Les pistes
    const pistes = (d.pistes || []).filter((p) => (p.titre || '').trim() || (p.pourquoi || '').trim());
    if (pistes.length) {
      bloc(); L.push(h(2, 'Mes pistes'));
      pistes.forEach((p) => {
        bloc(); L.push(h(3, texte(p.titre) || 'piste sans titre'));
        bloc(); if ((p.pourquoi || '').trim()) L.push(texte(p.pourquoi), '');
        const idees = (p.idees || []).filter((t) => t.trim()), cand = (p.candidates || []).filter((t) => t.trim());
        if (idees.length) { L.push('Idées :', ''); idees.forEach((t) => L.push('- ' + texte(t))); bloc(); }
        if (cand.length) { L.push('Questions possibles :', ''); cand.forEach((t) => L.push('- ' + texte(t))); }
        retoursSur('piste', p.id);
      });
    }

    // Les oraux blancs et les vidéos
    const oraux = (d.oraux || []).filter((x) => x.video || Object.keys(x.auto || {}).length || (x.date || '').trim() || (x.objectifs || '').trim() || (ret && R.evaluation(ret, x.id)));
    if (oraux.length) {
      bloc(); L.push(h(2, 'Mes oraux et mes vidéos'));
      oraux.forEach((x) => {
        bloc(); L.push(h(3, texte(x.nom) || 'Oral'));
        bloc();
        const info = [(x.date || '').trim() ? texte(x.date) : '', x.video ? 'vidéo déposée' : ''].filter(Boolean);
        if (info.length) L.push(info.join(' · ') + '.', '');
        const auto = D.GRILLE.filter((c) => (x.auto || {})[c.id]);
        if (auto.length) { L.push('Mon auto-évaluation (de 1 à 4) :', ''); auto.forEach((c) => L.push('- ' + texte(c.titre) + ' : ' + x.auto[c.id])); bloc(); }
        if ((x.objectifs || '').trim()) L.push('Mes objectifs pour la prochaine fois : ' + texte(x.objectifs));
        if (ret) { const ev = R.evaluation(ret, x.id); if (ev) { bloc(); L.push('Évaluation de l’enseignant·e (de 1 à 4) :', ''); D.GRILLE.filter((c) => ev.notes[c.id]).forEach((c) => L.push('- ' + texte(c.titre) + ' : ' + ev.notes[c.id]));
          if (ev.texte.trim()) L.push('', '> ' + texte(ev.texte)); } retoursSur('oral', x.id); }
      });
    }

    // Les quiz « Vérifie que tu as compris »
    const quiz = D.COMPRENDRE.filter((z) => ((d.comprendre || {})[z.id] || {}).essais);
    if (quiz.length) {
      bloc(); L.push(h(2, 'Vérifie que tu as compris : mes quiz'));
      bloc(); quiz.forEach((z) => { const r = d.comprendre[z.id], t = A.surSalve(z);
        L.push('- **' + texte(z.titre) + '** : meilleur score ' + r.meilleur + ' sur ' + t + ', dernier ' + r.dernier + ' sur ' + t + ', ' + r.essais + ' essai' + (r.essais > 1 ? 's' : '') + (dateLongue(r.le) ? ' (le dernier le ' + dateLongue(r.le) + ')' : '') + '.'); });
    }

    // La culture (version 1.6.0) : vidéos regardées et notes, « Info ou infox ? », accroches gardées. Titres et liens de la page.
    const C = racine.HGCulture || (typeof require !== 'undefined' ? require('./culture.js') : null), cu = d.culture || {}, ch = A.chiffresCulture(d);
    if (C && (ch.videos || ch.infox || ch.accroches)) {
      const v = cu.videos || {}, acc = cu.accroches || {};
      bloc(); L.push(h(2, 'Ma culture : vidéos et « Info ou infox ? »'));
      const vues = A.vuesVideos(d);
      if (vues.length) { bloc(); L.push(h(3, 'Les vidéos que j’ai regardées')); bloc();
        vues.forEach((k) => { const x = A.laVideo(k), n = v[k];
          L.push('- ' + lien(x.titre, x.url) + ', ' + texte(x.chaine) + (dateLongue(n.vue) ? ' (le ' + dateLongue(n.vue) + ')' : ''));
          if (String(n.retiens || '').trim()) L.push('  - Ce que j’en retiens : ' + texte(n.retiens));
          if (String(n.intrigue || '').trim()) L.push('  - Ce qui m’a intrigué·e : ' + texte(n.intrigue)); }); }
      if (ch.infox) { bloc(); L.push('« Info ou infox ? » : ' + ch.infox + ' affirmation' + (ch.infox > 1 ? 's' : '') + ' vue' + (ch.infox > 1 ? 's' : '') + ', dont ' + ch.reussies + ' réussie' + (ch.reussies > 1 ? 's' : '') + ' la dernière fois.'); }
      const gardees = C.INFOX.filter((a) => acc[a.id]);
      if (gardees.length) { bloc(); L.push(h(3, 'Mes accroches')); bloc();
        gardees.forEach((a) => L.push('- ' + texte(String(a.accroche).replace(/^«\s*|\s*»$/g, '')) + ' (source : ' + lien(a.source.titre, a.source.url) + ')' + (acc[a.id].p ? ' : dans mon plan' : ''))); }
    }

    // Les hauts faits, dans l'ordre où ils ont été gagnés
    const hf = A.hautsFaitsDates(d);
    if (hf.length) {
      bloc(); L.push(h(2, 'Mes hauts faits (' + hf.length + ' sur ' + A.HAUTS_FAITS.length + ')'));
      bloc(); hf.forEach((x) => L.push('- ' + (x.le ? dateLongue(x.le) : 'date inconnue') + ' : ' + texte(x.titre)));
    }
    bloc();
    return L.join('\n');
  }

  // ---------- Toute une classe : un fichier, une section par élève ----------
  // eleves : [{ pseudo, code, dossier (déjà relu par dossierValide, ou null), retours (déjà nettoyés) }]
  function classe(nom, eleves, o) {
    o = o || {};
    const L = ['# ' + texte('Classe ' + (nom || '') + ' · Hello GO'), '', '*Dossiers de Grand oral, téléchargés le ' + texte(dateLongue(A.jourLocal(o.le || new Date()))) + ' · ' + eleves.length + ' élève' + (eleves.length > 1 ? 's' : '') + '*', ''];
    if (eleves.length) { L.push('## Sommaire', ''); eleves.forEach((x, i) => L.push((i + 1) + '. ' + (texte(x.pseudo) || 'élève'))); L.push(''); }
    eleves.forEach((x) => {
      L.push('---', '');
      if (!x.dossier) { L.push('## ' + (texte(x.pseudo) || 'élève'), '', o.avecCodes && x.code ? 'Code : ' + texte(x.code) + '\n' : '', 'Aucun dossier lisible pour le moment.', ''); return; }
      L.push(dossier(x.dossier, { titre: x.pseudo || 'élève', niveau: 2, retours: x.retours, avecRetours: o.avecRetours, code: o.avecCodes ? x.code : null, le: o.le }));
    });
    return L.join('\n').replace(/\n{3,}/g, '\n\n');
  }

  const api = { texte, lien, dossier, classe };
  racine.HGExport = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
