// Hello GO : l'application de l'élève. Le dossier est gardé sur l'appareil (localStorage) et, quand l'élève a rejoint
// sa classe, dans la base : il se retrouve alors depuis n'importe quel appareil avec son code. Sans compte (mode
// découverte), rien n'est envoyé.
(function () {
  'use strict';
  // ---------- Le démarrage : une page complète et d'une seule version, ou un message clair (jamais une page vide) ----------
  // Un ancien index.html (gardé par le navigateur ou par un ancien service worker) peut charger ce fichier neuf sans les
  // autres, et un bloqueur de contenu peut empêcher un fichier de se charger. On répare alors une seule fois (le service
  // worker et les caches de Hello GO effacés, puis la page rechargée à une adresse neuve), puis on explique, avec les détails
  // techniques à recopier. Le dossier de l'élève (localStorage) n'est jamais touché. Le même message est écrit dans
  // index.html (HG_PANNE), pour le cas où ce fichier-ci ne peut pas s'exécuter : les deux textes vont ensemble.
  const VERSION_APP = '1.6.0'; // la même que HG_VERSION (index.html), sw.js et les ?v= de index.html (tests/versions.test.js)
  window.HG_VERSION_APP = VERSION_APP;
  const MODULES = [['HGDonnees', 'js/donnees.js'], ['HGDecouvertes', 'js/decouvertes.js'], ['HGCulture', 'js/culture.js'], ['HGAnalyse', 'js/coach.js'],
    ['HGRetours', 'js/retours.js'], ['HGExport', 'js/export.js'], ['HGEnLigne', 'js/en-ligne.js'], ['HGProf', 'js/prof.js']];
  const CLE_REPARATION = 'hellogo:reparation', BASE = new URL('./', location.href).href;
  function oublierHelloGo() {
    // Le service worker et les caches de Hello GO seulement : ceux des autres applications de babash.github.io restent.
    const essai = (f) => { try { return Promise.resolve(f()).catch(() => {}); } catch (x) { return Promise.resolve(); } };
    const sw = essai(() => navigator.serviceWorker.getRegistrations().then((l) => Promise.all(l.filter((r) => r.scope.indexOf(BASE) === 0).map((r) => r.unregister()))));
    const ca = essai(() => caches.keys().then((l) => Promise.all(l.filter((k) => k.indexOf('hello-go-') === 0).map((k) => caches.delete(k)))));
    return Promise.race([Promise.all([sw, ca]), new Promise((ok) => setTimeout(ok, 3000))]);
  }
  function dejaRepare() {
    let s = null; try { s = sessionStorage.getItem(CLE_REPARATION); } catch (x) { /* pas de mémoire de séance : l'adresse suffit */ }
    return s === VERSION_APP || new URL(location.href).searchParams.get('v') === VERSION_APP;
  }
  function reparer() {
    window.HG_REPARATION = true;
    try { sessionStorage.setItem(CLE_REPARATION, VERSION_APP); } catch (x) { /* l'adresse suffit */ }
    const u = new URL(location.href); u.searchParams.set('v', VERSION_APP);
    oublierHelloGo().then(() => location.replace(u.href));
  }
  // Le texte d'une erreur, sans ce qui suit un guillemet (cela pourrait venir du dossier), sauf un nom de propriété du code.
  function propre(m) {
    const t = String(m == null ? '' : m).replace(/\s+/g, ' '), re = /(^|[\s(\[,:=])(["'«“`])/g; let r;
    while ((r = re.exec(t))) {
      const ouvre = r.index + r[1].length, nom = /^[\w$.\[\]()]{1,60}["'»”`]/.exec(t.slice(ouvre + 1));
      if (nom && /(reading|setting|property|evaluating)\s?$/i.test(t.slice(0, ouvre))) { re.lastIndex = ouvre + 1 + nom[0].length; continue; }
      return t.slice(0, Math.min(ouvre, 200)) + '…';
    }
    return t.slice(0, 200);
  }
  function texteErreur(x) {
    const ou = /(https?:\/\/[^\s()]+?):(\d+):(\d+)/.exec(String((x && x.stack) || ''));
    return 'Erreur : ' + propre(x && x.name ? x.name + ': ' + x.message : x) + (ou ? ' (' + ou[1].split('#')[0].replace(BASE, '') + ', ligne ' + ou[2] + ', colonne ' + ou[3] + ')' : '');
  }
  function causeDe(absents) {
    if (navigator.onLine === false) return 'Tu sembles hors ligne : reconnecte-toi, puis recharge la page.';
    if (window.HG_VERSION !== VERSION_APP) return 'Ton navigateur a gardé une ancienne version de la page (' + (window.HG_VERSION || 'inconnue') + ') : elle ne va pas avec la nouvelle (' + VERSION_APP + ').';
    if (absents.length) {
      const f = absents[0], erreur = (window.HG_ERREURS || []).some((x) => x.message && String(x.fichier || '').indexOf(f) >= 0);
      return erreur ? 'Le fichier ' + f + ' n’a pas pu s’exécuter dans ce navigateur : mets-le à jour, ou essaie avec un autre navigateur.'
        : 'Le fichier ' + f + ' n’a pas pu être chargé : un bloqueur de contenu (de publicités ou de pistage) l’empêche peut-être. Si tu en utilises un, autorise ce site, puis recharge la page.';
    }
    return 'Une erreur a arrêté le démarrage.';
  }
  function panne(cause, details) {
    if (typeof window.HG_PANNE === 'function') return window.HG_PANNE(cause, details);
    window.HG_PANNE_AFFICHEE = true;
    const vue = document.getElementById('vue'); if (!vue) return;
    const el = (tag, texte, classe) => { const x = document.createElement(tag); if (texte) x.textContent = texte; if (classe) x.className = classe; return x; };
    const s = el('section', '', 'carte alerte'); s.setAttribute('role', 'alert');
    s.appendChild(el('h1', 'Hello GO n’a pas pu se charger en entier'));
    s.appendChild(el('p', cause || causeDe([])));
    s.appendChild(el('p', 'Recharge la page : Ctrl+Maj+R sur ordinateur (Cmd+Maj+R sur Mac) ; sur téléphone, ferme l’onglet, puis rouvre-le. Ton dossier n’est pas perdu : il reste sur cet appareil.'));
    const b = el('button', 'Recharger', 'principal'); b.type = 'button';
    b.addEventListener('click', () => { b.disabled = true; oublierHelloGo().then(() => location.reload()); });
    const p = el('p'); p.appendChild(b); s.appendChild(p);
    s.appendChild(el('p', 'Si le problème continue, recopie ces détails pour ton enseignant·e :', 'note'));
    const t = el('p', ['Hello GO : page ' + (window.HG_VERSION || 'inconnue') + ', application ' + VERSION_APP].concat(details || [], ['Navigateur : ' + String(navigator.userAgent).slice(0, 200)]).join('\n'), 'note');
    t.style.whiteSpace = 'pre-line'; t.style.overflowWrap = 'anywhere'; t.style.fontFamily = 'monospace'; s.appendChild(t);
    vue.textContent = ''; vue.appendChild(s);
  }
  const absents = MODULES.filter((m) => !window[m[0]]).map((m) => m[1]);
  if (absents.length || window.HG_VERSION !== VERSION_APP) {
    if (!dejaRepare() && navigator.onLine !== false) { reparer(); return; }
    panne(causeDe(absents), (absents.length ? ['Fichiers absents : ' + absents.join(', ')] : [])
      .concat(window.HG_VERSION !== VERSION_APP ? ['Version de la page : ' + (window.HG_VERSION || 'inconnue') + ', attendue : ' + VERSION_APP] : []));
    return;
  }
  // Une erreur avant le premier affichage : le message, au lieu d'une page vide (index.html a déjà noté l'erreur, s'il est neuf).
  window.addEventListener('error', (ev) => {
    if (window.HG_DEMARRE || window.HG_REPARATION) return;
    panne(null, window.HG_ERREURS ? [] : [texteErreur(ev.error || { message: ev.message, stack: ev.filename + ':' + ev.lineno + ':' + ev.colno })]);
  });

  const D = window.HGDonnees, A = window.HGAnalyse, R = window.HGRetours, EL = window.HGEnLigne;
  const CLE = 'hellogo:dossier:v1', CLE_APART = 'hellogo:a-part:v1', CLE_BASE = 'hellogo:base:v1';
  const $ = (s, r) => (r || document).querySelector(s);
  const e = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');
  const nomDeFichier = (s) => String(s).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); // « Zoé » donne « zoe », « Inès B. » « ines-b »

  // ---------- Le dossier ----------
  function dossierNeuf() {
    return { v: 1, profil: { prenom: '', vu: false }, quiz: { reponses: {}, fait: false }, interets: ['', '', ''], ponts: [''], pistes: [], questions: [],
      decouverte: { reactions: {} }, comprendre: {}, mots: [], sources: [], oraux: [{ id: uid(), nom: 'Oral blanc 1', auto: {} }, { id: uid(), nom: 'Oral blanc 2', auto: {} }], hf: {}, compteurs: {}, vus: {} };
  }
  function charger() {
    let t = null;
    try { t = localStorage.getItem(CLE); if (t) { const d = JSON.parse(t); if (d && d.v === 1) return Object.assign(dossierNeuf(), d); } } catch (x) { /* dossier illisible */ }
    // Un dossier illisible (ou d'une autre version) n'est jamais écrasé sans copie : il reste sous une autre clé.
    try { if (t) localStorage.setItem(CLE + ':illisible', t); } catch (x) { /* pas de place pour la copie */ }
    return dossierNeuf();
  }
  let d = charger(), minuterie = null, memoireOk = true, enAttente = false;
  function ecrire(venuDeLaBase) {
    clearTimeout(minuterie); enAttente = false;
    try { localStorage.setItem(CLE, JSON.stringify(d)); memoireOk = true; } catch (x) { memoireOk = false; if (!EL.session()) toast('Impossible d’enregistrer sur cet appareil. Télécharge ton dossier dans « Plus », puis « Réglages ».'); }
    if (!venuDeLaBase && EL.session()) { EL.majSession({ attente: true }); planifierEnvoi(); }
  }
  function enregistrer(tout_de_suite) {
    clearTimeout(minuterie);
    if (tout_de_suite) ecrire(); else { enAttente = true; minuterie = setTimeout(ecrire, 400); }
    const nouveaux = A.majHautsFaits(d);
    if (nouveaux.length) { ecrire(); nouveaux.forEach((h) => toast('Haut fait débloqué : ' + h.titre, '#/hauts-faits', 'Voir')); }
  }
  // En quittant, on n'écrit que ce qui attend encore : un vieil onglet n'écrase jamais le travail fait dans un autre.
  window.addEventListener('pagehide', () => { if (enAttente) ecrire(); envoiFermeture(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { if (enAttente) ecrire(); envoyer(); } else { envoyer(); interroger(); } });
  // Un autre onglet a enregistré : on reprend son dossier.
  window.addEventListener('storage', (ev) => {
    if (ev.key !== null && ev.key !== CLE) return;
    clearTimeout(minuterie); enAttente = false; d = charger(); retoursProf = R.nettoyer(EL.retours());
    const dlg = $('#dialogue'); if (dlg && dlg.open) dlg.close('annuler');
    rendre();
  });

  // ---------- La version en ligne : l'envoi, les conflits, le hors ligne, les retours ----------
  // Le dossier vit toujours dans localStorage (copie de travail) ; il part dans la base quelques secondes après la
  // dernière frappe, à la fermeture de la page et au retour du réseau. Chaque envoi porte la version connue : si la base
  // a changé entre-temps (autre appareil, ou correction), sa version est reprise, et ce qui n'était pas encore envoyé
  // est gardé à part (« Ma saisie mise de côté »), jamais perdu en silence.
  let retoursProf = R.nettoyer(EL.retours()), envoiMinuterie = null, enCours = false, etat = '', sessionExpiree = false;
  const DELAI_ENVOI = 3000, DELAI_RETOURS = 20000;
  function montrerEtat(t) {
    etat = t; const z = $('#etat-sync'); if (!z) return;
    const textes = { ok: 'Enregistré', envoi: 'Enregistrement…', attente: 'Modifié', horsligne: 'Hors ligne : sera envoyé', expire: 'Session expirée', erreur: 'Pas enregistré en ligne' };
    z.textContent = EL.session() ? (textes[t] || '') : ''; z.className = 'etat-sync ' + t;
  }
  function planifierEnvoi() { clearTimeout(envoiMinuterie); montrerEtat('attente'); envoiMinuterie = setTimeout(envoyer, DELAI_ENVOI); }
  function dossierAEnvoyer() { const c = JSON.parse(JSON.stringify(d)); return c; }
  // La dernière version connue de la base (celle sur laquelle on travaille) : elle sert à fusionner en cas de conflit.
  const garderBase = (t) => { try { if (t == null) localStorage.removeItem(CLE_BASE); else localStorage.setItem(CLE_BASE, typeof t === 'string' ? t : JSON.stringify(t)); } catch (x) { /* pas de place : la fusion sera moins fine */ } };
  const lireBase = () => { try { return JSON.parse(localStorage.getItem(CLE_BASE)); } catch (x) { return null; } };
  function envoyer() {
    const s = EL.session(); clearTimeout(envoiMinuterie);
    if (!s || !s.attente || enCours || sessionExpiree) return Promise.resolve();
    if (enAttente) ecrire();
    enCours = true; montrerEtat('envoi');
    const envoye = JSON.stringify(d), dossier = dossierAEnvoyer();
    return EL.rpc('go_sauvegarde', { p_jeton: s.jeton, p_dossier: dossier, p_resume: R.resume(dossier), p_version_connue: s.version || 0 }).then((r) => {
      enCours = false;
      if (r && r.ok) { garderBase(envoye); const encore = JSON.stringify(d) !== envoye; EL.majSession({ version: r.dossier_version, attente: encore }); montrerEtat(encore ? 'attente' : 'ok'); if (encore) planifierEnvoi(); return; }
      if (r && r.conflit) return conflit(r.dossier, r.dossier_version);
      if (r && /expiré/.test(r.message || '')) { sessionExpiree = true; montrerEtat('expire'); rendre(); return; }
      montrerEtat('erreur'); toast(r && r.message ? r.message : 'Ton dossier n’a pas pu être enregistré en ligne.');
    }, (x) => { enCours = false; montrerEtat(x.reseau ? 'horsligne' : 'erreur'); });
  }
  function envoiFermeture() {
    const s = EL.session(); if (!s || !s.attente || enCours || sessionExpiree) return;
    EL.rpcFermeture('go_sauvegarde', { p_jeton: s.jeton, p_dossier: d, p_resume: R.resume(d), p_version_connue: s.version || 0 });
  }
  // La base a une version plus récente : on fusionne (ce qui n'a changé que d'un côté est gardé), puis on renvoie.
  // Un même texte changé des deux côtés prend la version de la base ; celui de l'appareil est gardé à part.
  function conflit(distant, version) {
    if (!A.dossierValide(distant)) { montrerEtat('erreur'); return; }
    const connu = lireBase(), f = connu ? R.fusionner(connu, d, distant) : { resultat: distant, conflit: true };
    const fusion = A.dossierValide(f.resultat) ? f.resultat : distant;
    // ce qui avait été écrit ici (absent de la version connue) et qui n'est pas dans la fusion
    const connus = new Set(R.textesAbsents(connu || {}, {}).map((x) => x[1])), absents = R.textesAbsents(d, fusion).filter((x) => !connus.has(x[1]));
    if (absents.length) mettreDeCote(absents);
    adopter(distant, version, fusion, absents.length > 0);
    if (absents.length) toast('Ton dossier a été mis à jour. Ce que tu venais d’écrire est gardé à part.', '#/a-part', 'Relire');
  }
  // « Ma saisie mise de côté » : les nouveaux textes s'ajoutent à ceux qui y sont déjà (jamais d'écrasement d'une copie
  // que l'élève n'a pas encore relue).
  function mettreDeCote(textes) {
    let avant = null; try { avant = JSON.parse(localStorage.getItem(CLE_APART)); } catch (x) { /* copie illisible */ }
    const deja = avant && Array.isArray(avant.textes) ? avant.textes.filter((t) => Array.isArray(t) && t.length === 2) : [];
    const vus = new Set(deja.map((t) => t[0] + '\n' + t[1])), tous = deja.concat(textes.filter((t) => !vus.has(t[0] + '\n' + t[1])));
    try { localStorage.setItem(CLE_APART, JSON.stringify({ le: new Date().toISOString(), textes: tous.slice(-300) })); } catch (x) { /* pas de place */ }
  }
  function adopter(distant, version, fusion, forcer) {
    // Un dossier venu de la base n'est repris que s'il a la forme d'un dossier Hello GO (contrat : supabase/LISEZMOI.md) :
    // la base n'en vérifie que la forme générale, et la page insère ses identifiants dans ses liens et ses boutons.
    if (!A.dossierValide(distant) || (fusion && !A.dossierValide(fusion))) { montrerEtat('erreur'); return; }
    const prenom = d.profil.prenom, s = EL.session();
    d = Object.assign(dossierNeuf(), JSON.parse(JSON.stringify(fusion || distant))); d.profil = Object.assign({}, d.profil, { vu: true, prenom: (s && s.pseudo) || prenom });
    const visite = noterVisite(); // le dossier du compte n'a pas encore le jour d'aujourd'hui (premier chargement sur cet appareil)
    garderBase(distant); ecrire(true);
    const encore = (!!fusion && JSON.stringify(fusion) !== JSON.stringify(distant)) || visite;
    EL.majSession({ version: version, attente: encore }); montrerEtat(encore ? 'attente' : 'ok'); if (encore) planifierEnvoi();
    if (!appliquerRetours()) { if (forcer) rendre(); else rendreSiLibre(); }
  }
  // On ne refait pas la page sous les doigts de l'élève : on attend qu'il ou elle quitte le champ.
  let aRefaire = false;
  function rendreSiLibre() {
    const f = document.activeElement;
    if (f && $('#vue').contains(f) && /^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName)) { aRefaire = true; return; }
    if ($('#dialogue').open) { aRefaire = true; return; }
    aRefaire = false; rendre();
  }
  document.addEventListener('focusout', () => { if (aRefaire) setTimeout(() => { const f = document.activeElement; if (aRefaire && !(f && /^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName))) rendreSiLibre(); }, 50); });
  // Les retours : à l'ouverture, puis toutes les 20 secondes quand la page est visible (jamais de temps réel).
  function interroger() {
    const s = EL.session(); if (!s || sessionExpiree || document.visibilityState === 'hidden') return Promise.resolve();
    return EL.rpc('go_retours', { p_jeton: s.jeton, p_version_connue: s.retoursVersion == null ? -1 : s.retoursVersion }).then((r) => {
      if (!r || !r.ok) { if (r && /expiré/.test(r.message || '')) { sessionExpiree = true; montrerEtat('expire'); rendre(); } return; }
      if (etat === 'horsligne') montrerEtat(EL.session().attente ? 'attente' : 'ok');
      if (r.change) { retoursProf = R.nettoyer(r.retours); EL.garderRetours(retoursProf); EL.majSession({ retoursVersion: r.retours_version }); if (!appliquerRetours()) rendreSiLibre(); }
      const s2 = EL.session();
      if (s2.attente) return envoyer();
      if (r.dossier_version > (s2.version || 0) && !enCours) return reprendre();
    }, (x) => { if (x.reseau) montrerEtat('horsligne'); });
  }
  function reprendre() {
    const s = EL.session(); if (!s) return Promise.resolve();
    return EL.rpc('go_reprise', { p_jeton: s.jeton }).then((r) => {
      if (!r || !r.ok) { if (r && r.message) { sessionExpiree = true; montrerEtat('expire'); rendre(); } return; }
      sessionExpiree = false;
      EL.majSession({ pseudo: r.pseudo, code: r.code_affiche, classe: r.classe, enseignant: r.enseignant, retoursVersion: r.retours_version });
      retoursProf = R.nettoyer(r.retours); EL.garderRetours(retoursProf);
      const s2 = EL.session();
      if (s2.attente) { appliquerRetours(); rendreSiLibre(); return envoyer(); }
      if (r.dossier && r.dossier_version !== (s2.version || 0)) return adopter(r.dossier, r.dossier_version);
      if (!r.dossier && (s2.version || 0) === 0) { EL.majSession({ attente: true }); return envoyer(); }
      montrerEtat('ok'); if (!appliquerRetours()) rendreSiLibre();
    }, (x) => { if (x.reseau) montrerEtat('horsligne'); });
  }
  // Ce que les retours changent dans le dossier, une seule fois chacun : le mot demandé est créé, la question validée.
  function appliquerRetours() {
    const su = d.suivi = d.suivi || {}; su.def = su.def || {}; su.faits = su.faits || {}; let change = false;
    const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').trim();
    retoursProf.items.forEach((x) => {
      if (x.type === 'definir' && !su.def[x.id]) {
        let m = d.mots.find((y) => norm(y.mot) === norm(x.mot));
        if (!m) { m = { id: uid(), mot: x.mot, defSource: '', sourceTexte: '', defMoi: '', analogie: '' }; d.mots.push(m); }
        su.def[x.id] = m.id; change = true;
      }
      if (x.type === 'validation' && !su.faits[x.id]) {
        const q = laQuestion(x.qid);
        if (q) q.statut = x.etat === 'validee' ? 'validee' : (q.statut === 'validee' ? 'proposee' : q.statut);
        su.faits[x.id] = 1; change = true;
      }
    });
    if (change) { enregistrer(true); rendreSiLibre(); }
    return change;
  }
  // Mémoire indisponible (navigateur qui bloque les données des sites) : rien à relire, jamais d'erreur.
  const aPartExiste = () => { try { return !!localStorage.getItem(CLE_APART); } catch (x) { return false; } };
  const nonLus = () => retoursProf.items.filter((x) => !((d.suivi || {}).lus || {})[x.id]);
  const motsDemandes = () => new Set(Object.values((d.suivi || {}).def || {}));
  window.addEventListener('online', () => { envoyer().then(interroger); });
  setInterval(() => { if (EL.session()) { if (etat === 'horsligne' || etat === 'erreur') envoyer(); interroger(); } }, DELAI_RETOURS);

  function nouvelleQuestion(titre, idees) {
    const q = { id: uid(), titre: titre || '', statut: 'brouillon', echange: [], parties: [
      { id: uid(), titre: 'Introduction', minutes: 2, points: [] }, { id: uid(), titre: 'Axe 1', minutes: 3, points: [] },
      { id: uid(), titre: 'Axe 2', minutes: 3, points: [] }, { id: uid(), titre: 'Conclusion', minutes: 2, points: [] }] };
    (idees || []).filter((t) => t.trim()).forEach((t) => q.parties[1].points.push(point(t)));
    d.questions.push(q); return q;
  }
  const point = (texte, etiquette) => ({ id: uid(), texte: texte || '', etiquette: etiquette || '', mots: [], sources: [] });
  const laQuestion = (id) => d.questions.find((q) => q.id === id);
  function lePoint(q, pid) { for (const p of q.parties) { const x = p.points.find((y) => y.id === pid); if (x) return x; } return null; }

  // ---------- Petits composants ----------
  let pile = null;
  function toast(texte, vers, bouton, action) {
    pile = pile || $('#toasts');
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = '<span>' + e(texte) + '</span>' + (bouton ? (vers ? '<a href="' + vers + '">' + e(bouton) + '</a>' : '<button type="button">' + e(bouton) + '</button>') : '');
    if (action) $('button', t).addEventListener('click', () => { action(); t.remove(); });
    while (pile.children.length >= 3) pile.firstChild.remove();
    pile.appendChild(t); setTimeout(() => t.remove(), 7000);
  }
  function avecAnnulation(texte, changer) {
    const avant = JSON.stringify(d); changer(); enregistrer(true); rendre();
    toast(texte, null, 'Annuler', () => { d = JSON.parse(avant); d.compteurs.annulations = (d.compteurs.annulations || 0) + 1; enregistrer(true); rendre(); });
  }
  const options = (liste, valeur) => liste.map((o) => '<option value="' + e(o[0]) + '"' + (o[0] === (valeur || '') ? ' selected' : '') + '>' + e(o[1]) + '</option>').join('');
  const champ = (f, valeur, attr) => '<input type="text" spellcheck="true" data-f="' + f + '" value="' + e(valeur) + '" ' + (attr || '') + '>';
  const zoneTexte = (f, valeur, attr) => '<textarea spellcheck="true" rows="1" data-f="' + f + '" ' + (attr || '') + '>' + e(valeur) + '</textarea>';
  const conseils = (liste) => liste.length ? '<ul class="conseils">' + liste.map((c) => '<li class="' + (c.niveau || 'info') + '">' + e(c.texte || c) + '</li>').join('') + '</ul>' : '';
  const aide = (texte) => '<details class="aide"><summary aria-label="Aide">?</summary><p>' + texte + '</p></details>';
  const exemple = '<a class="lien-exemple" href="#/aide/exemple">Voir un exemple</a>';
  // Un retour de l'enseignant·e : tout texte venu de la base est échappé ; la mention de l'IA quand le retour la porte.
  const mentionIA = (x) => x.ia ? '<span class="mention-ia">Préparé avec l’aide d’une IA, relu par ton enseignant·e</span>' : '';
  const nouveauRetour = (x) => ((d.suivi || {}).lus || {})[x.id] ? '' : '<span class="nouveau">Nouveau</span>';
  const unRetour = (x) => `<div class="retour-prof"><p><b>Ton enseignant·e</b> ${nouveauRetour(x)}</p><p>${e(x.texte)}</p>${mentionIA(x)}</div>`;
  const retoursSur = (type, id) => R.pour(retoursProf, type, id).map(unRetour).join('');
  const enLigne = () => !!EL.session();

  // ---------- Les vues ----------
  const vues = {};

  vues.bienvenue = () => `
    <section class="carte bienvenue">
      <p class="logo-grand">Hello <b>GO</b></p>
      <h1>Prépare ton Grand oral de NSI, pas à pas</h1>
      <ol class="etapes">
        <li><b>Explore</b> : découvre des histoires de l’informatique, trouve un sujet qui te plaît, puis ta question.</li>
        <li><b>Construis</b> ton plan point par point, avec tes mots et tes sources.</li>
        <li><b>Prépare</b> l’échange avec le jury et tes oraux blancs.</li>
      </ol>
    </section>
    ${blocRejoindre()}
    <section class="carte"><h2>Essayer sans compte</h2>
      <label>Ton prénom (ou un pseudo), jamais ton nom de famille
        <input type="text" id="prenom" maxlength="24" autocomplete="given-name" placeholder="Ton prénom"></label>
      <p class="note">Sans compte, ton dossier reste <b>sur cet appareil seulement</b>, dans ce navigateur. Tu pourras rejoindre ta classe plus tard : ton dossier te suivra.</p>
      <button class="principal" data-a="demarrer">C’est parti</button>
    </section>`;
  function blocRejoindre() {
    return `<section class="carte rejoindre"><h2>Rejoindre ma classe</h2>
      <p>Ton enseignant·e t’a donné un lien ou un code de classe (4 lettres) : ton dossier sera gardé en ligne, et tu le retrouveras sur ton téléphone comme au lycée.</p>
      <div class="ligne-champ"><input type="text" id="code-classe" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Code de classe" aria-label="Code de classe"><button data-a="aller-classe">Rejoindre</button></div>
      <p><a class="bouton" href="#/entrer">J’ai déjà un code</a></p></section>`;
  }
  const dossierRempli = () => !!(d.questions.length || d.pistes.length || d.mots.length || d.sources.length || Object.keys(d.decouverte.reactions).length || d.quiz.fait);

  vues.classe = (code) => {
    const s = EL.session();
    if (s) return `<h1>Rejoindre une classe</h1><section class="carte"><p>Tu es déjà inscrit·e sur cet appareil : <b>${e(s.pseudo)}</b>, dans la classe ${e(s.classe)}.</p>
      <p>Ce n’est pas toi ? Quitte d’abord cet appareil dans les <a href="#/reglages">réglages</a>.</p><p><a class="bouton principal" href="#/">Revenir à mon dossier</a></p></section>`;
    const c = infoClasse;
    return `<h1>Rejoindre ma classe</h1>
    <section class="carte" id="zone-classe">${!c || c.code !== code ? '<p>Recherche de la classe…</p>' : c.erreur ? `<p class="erreur">${e(c.erreur)}</p><p><a href="#/">Revenir à l’accueil</a></p>`
      : `<p class="sur-titre">Classe ${e(c.classe)} · ${e(c.enseignant)}</p>
      ${c.ouverte ? `<label>Ton prénom et l’initiale de ton nom
        <input type="text" id="pseudo" maxlength="24" autocomplete="off" placeholder="Par exemple : Inès B." value="${e(d.profil.prenom)}"></label>
      <p class="note">Jamais ton nom complet. Ton enseignant·e te reconnaîtra avec ton prénom et ton initiale.</p>
      ${dossierRempli() ? '<label class="coche"><input type="checkbox" id="envoyer-local" checked> Envoyer le dossier déjà commencé sur cet appareil</label>' : ''}
      <button class="principal" data-a="inscription">M’inscrire</button>` : '<p class="erreur">Les inscriptions de cette classe sont fermées : demande à ton enseignant·e de les ouvrir.</p>'}`}</section>
    <p><a href="#/entrer">J’ai déjà un code</a></p>`;
  };
  vues.entrer = () => `<h1>J’ai déjà un code</h1>
    <section class="carte"><label>Ton code (2 mots et 3 chiffres)
      <input type="text" id="code-eleve" maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Par exemple : MICRO-DECOR-123"></label>
      <p class="note">Majuscules ou minuscules, avec ou sans tirets : peu importe. Tu l’as perdu ? Ton enseignant·e le retrouve.</p>
      ${!EL.session() && dossierRempli() ? '<label class="coche"><input type="checkbox" id="envoyer-local" checked> Si mon compte est encore vide, y envoyer le dossier commencé sur cet appareil</label>' : ''}
      <button class="principal" data-a="connexion">Entrer</button></section>
    ${d.profil.vu ? '' : '<p><a href="#/">Revenir à l’accueil</a></p>'}`;
  vues.tonCode = () => { const s = EL.session(); if (!s) return vues.entrer(); return `<h1>Ton code</h1>
    <section class="carte action"><p class="sur-titre">Note-le maintenant</p><p class="code-eleve">${e(s.code)}</p>
      <p>Avec ce code, tu retrouves ton dossier depuis n’importe quel appareil : ton téléphone, l’ordinateur du lycée, celui de chez toi. Note-le dans ton agenda ou ton carnet. Si tu le perds, ton enseignant·e le retrouve.</p>
      <p><a class="bouton principal" href="#/">Je l’ai noté</a></p></section>`; };

  vues.accueil = () => {
    const pa = A.prochaineAction(d);
    const nPoints = d.questions.reduce((t, q) => t + A.tousLesPoints(q).length, 0);
    const nHf = A.hautsFaitsDates(d).length;
    const debut = [['Découvrir 10 cartes', Object.keys(d.decouverte.reactions).length >= 10, '#/explorer/decouvrir'], ['Dire ce que j’aime', d.quiz.fait, '#/explorer/quiz'], ['Garder une piste', d.pistes.length > 0 || d.questions.length > 0, '#/explorer/sujets'],
      ['Choisir ma question', d.questions.length > 0, '#/explorer/pistes'], ['Écrire 5 points', nPoints >= 5, '#/questions'],
      ['Définir 3 mots', d.mots.filter(A.motComplet).length >= 3, '#/mots'], ['Ajouter 2 sources', d.sources.length >= 2, '#/sources']];
    const s = EL.session(), n = s ? nonLus().length : 0;
    return `
    <h1>Salut${d.profil.prenom ? ' ' + e(d.profil.prenom) : ''} !</h1>
    ${s ? `<p class="compte">Classe ${e(s.classe)} · ${e(s.enseignant)} · <a href="#/reglages">Ce n’est pas toi ?</a></p>` : ''}
    ${s && sessionExpiree ? '<section class="carte alerte"><p>Ta session a expiré sur cet appareil : ton travail reste ici, et part dès que tu entres de nouveau ton code.</p><p><a class="bouton principal" href="#/entrer">Entrer mon code</a></p></section>' : ''}
    ${n ? `<a class="carte lien-carte nouveautes" href="#/retours"><span class="pastille">${n}</span> ${n > 1 ? 'nouveautés' : 'nouveauté'} de ton enseignant·e</a>` : ''}
    ${aPartExiste() ? '<p class="note"><a href="#/a-part">Relire ma saisie mise de côté</a></p>' : ''}
    <section class="carte action">
      <p class="sur-titre">Ta prochaine étape · ${e(pa.duree)}</p>
      <p class="gros">${e(pa.texte)}</p>
      <a class="bouton principal" href="${pa.vers}">${e(pa.bouton)}</a>
    </section>
    ${blocConseil()}
    ${blocInfoxJour()}
    ${blocVideoAccueil()}
    <section class="chiffres">
      <a href="#/questions"><b>${nPoints}</b> ${nPoints > 1 ? 'points' : 'point'}</a>
      <a href="#/mots"><b>${d.mots.length}</b> ${d.mots.length > 1 ? 'mots' : 'mot'}</a>
      <a href="#/sources"><b>${d.sources.length}</b> ${d.sources.length > 1 ? 'sources' : 'source'}</a>
      <a href="#/hauts-faits"><b>${nHf}</b> ${nHf > 1 ? 'hauts faits' : 'haut fait'}</a>
    </section>
    ${blocComprendre()}
    ${s ? (retoursProf.items.length ? '<p class="bas"><a href="#/retours">Tous les retours de ton enseignant·e</a></p>' : '') : `<section class="carte invitation"><h2>Retrouve ton dossier partout</h2><p>Pour le moment, ton dossier reste sur cet appareil. Rejoins ta classe avec le lien ou le code de ton enseignant·e : ton dossier te suit, et ton enseignant·e peut te faire des retours.</p><p><a class="bouton" href="#/rejoindre">Rejoindre ma classe</a></p></section>`}
    ${debut.every((x) => x[1]) ? '' : `<section class="carte"><h2>Par où commencer</h2><ul class="coches">${debut.map((x) => `<li class="${x[1] ? 'fait' : ''}"><a href="${x[2]}">${e(x[0])}</a></li>`).join('')}</ul></section>`}`;
  };

  function ongletsExplorer(actif) {
    return `<h1>Explorer</h1><nav class="onglets" aria-label="Explorer">${[['decouvrir', 'Découvrir'], ['infox', 'Info ou infox ?'], ['quiz', 'Mes goûts'], ['videos', 'Vidéos'], ['sujets', 'Sujets'], ['pistes', 'Mes pistes' + (d.pistes.length ? ' (' + d.pistes.length + ')' : '')]]
      .map((o) => `<a href="#/explorer/${o[0]}"${o[0] === actif ? ' aria-current="page"' : ''}>${o[1]}</a>`).join('')}</nav>`;
  }
  function carteSujet(s, raisons) {
    const deja = d.pistes.some((p) => p.titre === s.t);
    return `<li class="carte sujet"><p class="sur-titre">${e(s.th)}</p><p class="gros">${e(s.t)}</p>
      ${raisons && raisons.length ? `<p class="note">Parce que tu as choisi : ${e([...new Set(raisons)].join(', '))}.</p>` : ''}
      ${deja ? '<p class="fait-texte">Dans tes pistes</p>' : `<button data-a="garder" data-t="${e(s.t)}">Garder comme piste</button>`}</li>`;
  }
  vues.decouvrir = () => {
    const re = d.decouverte.reactions, n = Object.keys(re).length, total = A.CARTES.length, c = A.prochaineCarte(re);
    const aimees = A.CARTES.filter((x) => re[x.num] === 1), bilan = n >= 10 && (n % 10 === 0 || !c) && !d.vus.suite;
    const sug = A.suggestions(d.quiz.reponses, 5, re), surp = A.surprises(d.quiz.reponses, re);
    const resultats = n ? `<h2>Ce qui t’intrigue</h2>
      ${aimees.length ? `<ul class="liste">${aimees.map((x) => { const deja = d.pistes.some((p) => p.titre === x.q);
        return `<li class="carte sujet"><p class="sur-titre">${e(x.titre)} · ${e(x.date)}</p><p class="gros">${e(x.q)}</p>${deja ? '<p class="fait-texte">Dans tes pistes</p>' : `<button data-a="garder" data-t="${e(x.q)}">Garder comme piste</button>`}</li>`; }).join('')}</ul>`
        : `<p class="vide">${c ? 'Aucune carte pour le moment : continue, il y en a pour tous les goûts.' : 'Aucune carte ne t’a intrigué·e : dis ce que tu aimes dans « Mes goûts », ou parcours les sujets.'}</p>`}
      ${surp.length ? `<section class="carte savoir"><p class="sur-titre">Ta surprise</p><p class="gros">Tu ne l’avais pas coché dans tes goûts, mais ça t’intrigue : ${e(surp.join(', '))}.</p></section>` : ''}
      ${sug.length ? `<h2>Des sujets qui pourraient te plaire</h2><ul class="liste">${sug.map((x) => carteSujet(x.sujet, x.raisons)).join('')}</ul>` : ''}` : '';
    return ongletsExplorer('decouvrir') + `
    <p class="chapo">Des histoires vraies de l’informatique. Pour chacune, dis simplement si elle t’intrigue : tu découvriras peut-être un sujet auquel tu n’avais pas pensé.</p>
    ${c && !bilan ? `<section class="carte decouverte">
      <p class="sur-titre">Carte ${n + 1} sur ${total} · ${e(c.cat)}</p>
      <h2>${e(c.titre)} <span class="note">${e(c.date)}</span></h2>
      <p class="gros">${e(c.texte)}</p>
      <p>${e(c.note)}</p>
      <p class="question-carte">${e(c.q)}</p>
      <div class="deux"><button data-a="reagir" data-n="${c.num}" data-v="-1">Pas pour moi</button><button class="principal" data-a="reagir" data-n="${c.num}" data-v="1">Ça m’intrigue</button></div>
      <p class="note"><a href="https://babash.github.io/TimelineNSI/" target="_blank" rel="noopener">Voir toutes les cartes sur la Timeline</a></p>
    </section>` : `<section class="carte action"><p class="gros">${c ? 'Tu as vu ' + n + ' cartes sur ' + total + '. Regarde ce qui ressort, ou continue.' : 'Tu as vu toutes les cartes.'}</p>
      ${c ? '<button class="principal" data-a="suite-cartes">Voir 10 autres cartes</button>' : ''} <a class="bouton" href="#/explorer/quiz">Dire ce que j’aime</a></section>`}
    ${resultats}
    ${n ? '<p class="bas"><button class="discret" data-a="recommencer-cartes">Revoir toutes les cartes depuis le début</button></p>' : ''}`;
  };
  vues.quiz = () => {
    const r = d.quiz.reponses, sug = d.quiz.fait ? A.suggestions(r, 5, d.decouverte.reactions) : [];
    return ongletsExplorer('quiz') + `
    <p class="chapo">Plus tu coches, plus les propositions te ressemblent. Rien n’est définitif : tu peux revenir changer tes réponses.</p>
    ${D.QUIZ.map((q) => { const liste = A.choixDe(q, r); if (q.selon && !liste.length) return '';
      const puce = (c) => { const coche = q.multi ? (r[q.id] || []).includes(c[0]) : r[q.id] === c[0];
        return `<label class="puce"><input type="${q.multi ? 'checkbox' : 'radio'}" name="quiz-${q.id}" data-quiz="${q.id}" value="${c[0]}"${coche ? ' checked' : ''}><span>${e(c[1])}</span></label>`; };
      return `<fieldset class="carte"><legend>${e(q.titre)}</legend><p class="note">${e(q.aide)}</p>
        ${q.groupes ? q.groupes.map((g) => `<h3>${e(g[0])}</h3><div class="puces">${g[1].map(puce).join('')}</div>`).join('') : `<div class="puces">${liste.map(puce).join('')}</div>`}</fieldset>`; }).join('')}
    <section class="carte"><h2>Une actualité ou une question qui t’a marqué·e</h2><p class="note">Facultatif. Elle devient une piste.</p>
      <input type="text" id="piste-libre" placeholder="Par exemple : une panne, une arnaque, une invention…" aria-label="Une actualité qui m’a marqué·e"><button data-a="piste-libre">Ajouter à mes pistes</button></section>
    <button class="principal" data-a="quiz-fini">Voir mes sujets</button>
    <div id="resultats">${d.quiz.fait ? `<h2>Des sujets pour toi</h2>${sug.length ? `<ul class="liste">${sug.map((x) => carteSujet(x.sujet, x.raisons)).join('')}</ul>` : '<p>Coche au moins une réponse pour avoir des propositions.</p>'}
      <p><a href="#/explorer/sujets">Voir tous les sujets</a></p>${troisVideos('Des vidéos pour toi')}` : ''}</div>`;
  };
  vues.sujets = (arg) => {
    const themes = [...new Set(D.SUJETS.map((s) => s.th))];
    return ongletsExplorer('sujets') + `
    <p class="chapo">Des idées pour démarrer : ce ne sont pas encore des questions. Garde celles qui t’attirent, puis fais-en ta question.</p>
    <input type="search" id="recherche" placeholder="Chercher un mot : musique, IA, sécurité…" aria-label="Chercher un sujet">
    ${themes.map((th) => `<section class="theme"><h2>${e(th)}</h2><ul class="liste">${D.SUJETS.filter((s) => s.th === th).map((s) => carteSujet(s)).join('')}</ul></section>`).join('')}
    <section class="carte"><h2>Une autre idée ?</h2><p>Une actualité, une passion, un métier : écris ta propre piste.</p>
      <input type="text" id="piste-libre" placeholder="Mon idée de sujet" aria-label="Mon idée de sujet"><button data-a="piste-libre">Ajouter à mes pistes</button></section>`;
  };
  vues.pistes = () => ongletsExplorer('pistes') + `
    <section class="carte"><h2>Mes centres d’intérêt et mes ponts ${aide('Un pont relie ce que tu aimes à une notion. Exemple : jeux vidéo + intelligence artificielle = « Comment l’IA fait-elle vivre les personnages non-joueurs ? »')}</h2>
      <div class="grille3">${d.interets.map((v, i) => champ('interets.' + i, v, 'placeholder="Un centre d’intérêt" aria-label="Centre d’intérêt ' + (i + 1) + '"')).join('')}</div>
      ${d.ponts.map((v, i) => champ('ponts.' + i, v, 'placeholder="Un pont : ce que j’aime + une notion = une question" aria-label="Pont ' + (i + 1) + '"')).join('')}
      <button class="discret" data-a="plus-pont">+ Un autre pont</button></section>
    ${d.pistes.length ? '' : `<p class="vide">Tu n’as pas encore de piste. <a href="#/explorer/decouvrir">Découvre des cartes</a> ou <a href="#/explorer/sujets">parcours les sujets</a>.</p>`}
    ${d.pistes.map((p) => `<section class="carte piste">
      ${champ('piste.' + p.id + '.titre', p.titre, 'class="titre" aria-label="Titre de la piste"')}
      <label>Pourquoi ce sujet m’intéresse ${zoneTexte('piste.' + p.id + '.pourquoi', p.pourquoi, 'placeholder="Sois convaincant·e : c’est aussi ta réponse au jury."')}</label>
      <h3>Mes idées en vrac</h3>
      <ul class="simples">${(p.idees || []).map((t, i) => `<li>${champ('piste.' + p.id + '.idees.' + i, t, 'aria-label="Idée"')}<button class="croix" data-a="suppr-liste" data-p="${p.id}" data-l="idees" data-i="${i}" aria-label="Supprimer l’idée">✕</button></li>`).join('')}</ul>
      <button class="discret" data-a="plus-liste" data-p="${p.id}" data-l="idees">+ Une idée</button>
      <h3>Mes questions possibles ${aide('Une bonne question ouvre le débat : on ne peut pas y répondre par oui ou par non sans argumenter.')}</h3>
      <p class="note">Des débuts possibles : ${D.DEBUTS_QUESTION.map(e).join(' · ')}</p>
      <ul class="simples">${(p.candidates || []).map((t, i) => `<li>${champ('piste.' + p.id + '.candidates.' + i, t, 'aria-label="Question possible"')}
        <button data-a="choisir" data-p="${p.id}" data-i="${i}">Choisir</button><button class="croix" data-a="suppr-liste" data-p="${p.id}" data-l="candidates" data-i="${i}" aria-label="Supprimer la question">✕</button></li>`).join('')}</ul>
      <button class="discret" data-a="plus-liste" data-p="${p.id}" data-l="candidates">+ Une question possible</button>
      ${retoursSur('piste', p.id)}
      <p class="bas"><button class="discret danger" data-a="suppr-piste" data-p="${p.id}">Supprimer cette piste</button></p>
    </section>`).join('')}`;

  const STATUTS = { brouillon: 'Brouillon', proposee: 'Proposée à ton enseignant·e', validee: 'Validée par ton enseignant·e' };
  vues.questions = () => `
    <h1>Mes questions</h1>
    <p class="chapo">Tu peux préparer une ou deux questions qui touchent la NSI. Le jour J, le jury en choisit une.</p>
    ${d.questions.map((q) => { const n = A.tousLesPoints(q).length; return `<a class="carte lien-carte" href="#/question/${q.id}">
      <span class="badge ${q.statut}">${STATUTS[q.statut]}</span><p class="gros">${e(q.titre || 'Question sans titre')}</p>
      <p class="note">${pluriel(n, 'point')} · environ ${Math.round(n * A.SEC_PAR_POINT / 60)} min · ${pluriel((q.echange || []).length, 'question')} pour l’échange</p></a>`; }).join('')}
    ${d.questions.length < 2 ? `<section class="carte"><h2>${d.questions.length ? 'Une deuxième question' : 'Ma question'}</h2>
      <p>Tu as déjà ta question ? Écris-la ici. Sinon, <a href="#/explorer/decouvrir">commence par Explorer</a>.</p>
      <input type="text" id="question-libre" placeholder="Ma question, avec un point d’interrogation" aria-label="Ma question"><button data-a="question-libre">Commencer le plan</button></section>` : ''}`;

  function zoneCoach(q) { return conseils(A.coach(q, d)); }
  function htmlPoint(q, p) {
    const m = (p.mots || []).map((id) => d.mots.find((x) => x.id === id)).filter(Boolean);
    const s = (p.sources || []).map((id) => d.sources.find((x) => x.id === id)).filter(Boolean);
    return `<li class="pt" data-id="${p.id}"><span class="grip" aria-hidden="true" title="Glisser pour déplacer">⠿</span><div class="corps">
      ${zoneTexte('pt.' + q.id + '.' + p.id + '.texte', p.texte, 'class="texte-pt" placeholder="Un point : 1 à 3 lignes, en mots-clés" aria-label="Texte du point"')}
      <div class="ligne"><select data-f="pt.${q.id}.${p.id}.etiquette" aria-label="Type de point">${options(D.ETIQUETTES, p.etiquette)}</select>
        ${m.map((x) => `<span class="etq mot">${e(x.mot || 'mot')}</span>`).join('')}${s.map((x) => `<span class="etq src">${e(x.titre || 'source')}</span>`).join('')}
        <button class="mini" data-a="lier" data-q="${q.id}" data-p="${p.id}" data-t="mots">+ mot</button>
        <button class="mini" data-a="lier" data-q="${q.id}" data-p="${p.id}" data-t="sources">+ source</button>
        <span class="pousse"></span>
        <button class="mini" data-a="monter" data-q="${q.id}" data-p="${p.id}" aria-label="Monter le point">↑</button>
        <button class="mini" data-a="descendre" data-q="${q.id}" data-p="${p.id}" aria-label="Descendre le point">↓</button>
        <button class="mini croix" data-a="suppr-pt" data-q="${q.id}" data-p="${p.id}" aria-label="Supprimer le point">✕</button></div>${retoursSur('point', p.id)}</div></li>`;
  }
  vues.question = (id, sous) => {
    const q = laQuestion(id); if (!q) return vues.questions();
    const entete = `<p class="retour"><a href="#/questions">← Mes questions</a></p>
      ${zoneTexte('q.' + q.id + '.titre', q.titre, 'class="titre-question" placeholder="Ma question" aria-label="Ma question"')}
      <div class="statut"><span class="badge ${q.statut}">${STATUTS[q.statut]}</span>
        ${q.statut === 'brouillon' ? `<button class="mini" data-a="statut" data-q="${q.id}" data-s="proposee">Je la propose à mon enseignant·e</button>` : ''}
        ${q.statut === 'proposee' && !enLigne() ? `<button class="mini" data-a="statut" data-q="${q.id}" data-s="validee">Mon enseignant·e l’a validée</button>` : ''}
        ${aide(enLigne() ? 'Propose ta question : ton enseignant·e la valide depuis son espace, ou te demande de la retravailler.' : 'Montre ta question à ton enseignant·e en classe. Quand il ou elle est d’accord, indique-le ici.')}</div>
      ${(() => { const v = R.validation(retoursProf, q.id); return v ? `<div class="retour-prof ${v.etat}"><p><b>${v.etat === 'validee' ? 'Ton enseignant·e a validé ta question' : 'Ton enseignant·e te demande de retravailler ta question'}</b> ${nouveauRetour(v)}</p>${v.texte ? '<p>' + e(v.texte) + '</p>' : ''}${mentionIA(v)}</div>` : ''; })()}
      ${retoursSur('question', q.id)}
      <nav class="onglets" aria-label="Ma question"><a href="#/question/${q.id}"${sous ? '' : ' aria-current="page"'}>Plan</a>
        <a href="#/question/${q.id}/echange"${sous === 'echange' ? ' aria-current="page"' : ''}>Échange (${(q.echange || []).length})</a></nav>`;
    if (sous === 'echange') {
      const prob = A.questionsProbables(q, d);
      return entete + `<p class="chapo">L’échange dure 10 minutes, autant que l’exposé. Note ici les questions que le jury pourrait poser, et tes idées de réponse.</p>
      ${(q.echange || []).map((x) => `<section class="carte"><div class="tete">${champ('ech.' + q.id + '.' + x.id + '.question', x.question, 'class="titre" aria-label="Question du jury"')}
        <button class="croix" data-a="suppr-ech" data-q="${q.id}" data-e="${x.id}" aria-label="Supprimer la question">✕</button></div>
        ${zoneTexte('ech.' + q.id + '.' + x.id + '.reponse', x.reponse, 'placeholder="Mes idées de réponse, en quelques mots-clés" aria-label="Ma réponse"')}${retoursSur('echange', x.id)}</section>`).join('')}
      ${(() => { const deja = new Set((q.echange || []).map((x) => x.question.trim())); const l = retoursProf.items.filter((x) => x.type === 'question' && (!x.qid || x.qid === q.id) && !deja.has(x.texte.trim()));
        return l.length ? `<section class="carte"><h2>Proposées par ton enseignant·e</h2><ul class="simples">${l.map((x) => `<li><span>${e(x.texte)} ${mentionIA(x)}</span><button data-a="garder-ech" data-q="${q.id}" data-t="${e(x.texte)}">Garder</button></li>`).join('')}</ul></section>` : ''; })()}
      <section class="carte"><input type="text" id="ech-libre" placeholder="Une question que le jury pourrait poser" aria-label="Nouvelle question du jury"><button data-a="plus-ech" data-q="${q.id}">Ajouter</button></section>
      ${prob.length ? `<section class="carte"><h2>Des questions probables</h2><p class="note">Proposées d’après ton plan et tes mots.</p><ul class="simples">${prob.map((t) => `<li><span>${e(t)}</span><button data-a="garder-ech" data-q="${q.id}" data-t="${e(t)}">Garder</button></li>`).join('')}</ul></section>` : ''}`;
    }
    return entete + `
      <details class="carte coach" open><summary>Coach</summary><div data-zone="coach" data-q="${q.id}">${zoneCoach(q)}</div></details>
      ${q.parties.map((p) => `<section class="partie" data-partie="${p.id}">
        <div class="tete">${champ('partie.' + q.id + '.' + p.id + '.titre', p.titre, 'class="titre-partie" aria-label="Titre de la partie"')}<span class="note">${p.minutes ? '≈ ' + p.minutes + ' min' : ''}</span></div>
        <ul class="points" data-points="${p.id}">${p.points.map((x) => htmlPoint(q, x)).join('')}</ul>
        ${p.points.length ? '' : `<p class="vide">Aucun point pour le moment. ${exemple}</p>`}
        <button class="ajouter" data-a="plus-pt" data-q="${q.id}" data-partie="${p.id}">+ Ajouter un point</button>
        ${p === (q.parties.find((x) => /intro/i.test(x.titre)) || q.parties[0]) ? `<button class="ajouter discret" data-a="piocher" data-q="${q.id}">Piocher une accroche</button>` : ''}</section>`).join('')}
      <p class="bas"><button data-a="plus-axe" data-q="${q.id}">+ Ajouter un axe</button>
        <button class="principal" data-a="pdf" data-q="${q.id}">Télécharger en PDF</button></p>
      ${blocMarkdown()}
      <p class="bas"><button class="discret danger" data-a="suppr-question" data-q="${q.id}">Supprimer cette question</button></p>`;
  };

  function zoneMot(m) { return conseils(m.mot ? A.coachMot(m) : []); }
  vues.mots = () => { const demandes = motsDemandes(); return `
    <h1>Mes mots</h1>
    <p class="chapo">Chaque mot important se définit de deux manières : avec une source, puis avec tes mots. ${exemple}</p>
    ${d.mots.length ? '' : '<p class="vide">Aucun mot pour le moment. Commence par le mot le plus important de ton sujet.</p>'}
    ${d.mots.map((m) => `<section class="carte mot-carte">
      <div class="tete">${champ('mots.' + m.id + '.mot', m.mot, 'class="titre" placeholder="Le mot" aria-label="Le mot"')}
        <span class="badge ${A.motComplet(m) ? 'validee' : 'brouillon'}" data-zone="etat-mot" data-m="${m.id}">${A.motComplet(m) ? 'Complet' : 'À compléter'}</span>
        <button class="croix" data-a="suppr-mot" data-m="${m.id}" aria-label="Supprimer le mot">✕</button></div>
      ${demandes.has(m.id) ? '<p><span class="badge prof">Demandé par ton enseignant·e</span></p>' : ''}
      <label>Définition d’une source ${zoneTexte('mots.' + m.id + '.defSource', m.defSource, 'placeholder="La définition exacte, recopiée"')}</label>
      <label>D’où vient-elle ? ${champ('mots.' + m.id + '.sourceTexte', m.sourceTexte, 'placeholder="Un dictionnaire, un cours, un site officiel…"')}</label>
      <label>Avec mes mots ${zoneTexte('mots.' + m.id + '.defMoi', m.defMoi, 'placeholder="Comme je l’expliquerais à un·e camarade"')}</label>
      <label>Une image simple, pour le membre du jury non spécialiste ${champ('mots.' + m.id + '.analogie', m.analogie, 'placeholder="C’est comme…"')}</label>
      <div data-zone="mot" data-m="${m.id}">${zoneMot(m)}</div>${demandes.has(m.id) ? retoursProf.items.filter((x) => x.type === 'definir' && (d.suivi.def || {})[x.id] === m.id && x.texte).map(unRetour).join('') : ''}${retoursSur('mot', m.id)}</section>`).join('')}
    <button class="ajouter" data-a="plus-mot">+ Ajouter un mot</button>`; };

  function zoneSources() { return conseils(A.coachSources(d)); }
  vues.sources = () => `
    <h1>Mes sources</h1>
    <p class="chapo">Note chaque source dès que tu la trouves, et ce que tu en retiens avec tes mots.</p>
    <div data-zone="sources">${zoneSources()}</div>
    ${d.sources.length ? '' : '<p class="vide">Aucune source pour le moment. Une vidéo, un article, un livre, un site officiel : ajoute la première.</p>'}
    ${d.sources.map((s) => `<section class="carte">
      <div class="tete">${champ('sources.' + s.id + '.titre', s.titre, 'class="titre" placeholder="Titre de la source" aria-label="Titre de la source"')}
        <button class="croix" data-a="suppr-source" data-s="${s.id}" aria-label="Supprimer la source">✕</button></div>
      <div class="grille2"><label>Auteur·e ou site ${champ('sources.' + s.id + '.auteur', s.auteur)}</label><label>Date ${champ('sources.' + s.id + '.date', s.date, 'placeholder="2025"')}</label></div>
      <label>Lien <input type="url" inputmode="url" data-f="sources.${s.id}.lien" value="${e(s.lien)}" placeholder="https://…"></label>
      <label>Type <select data-f="sources.${s.id}.type">${options(D.TYPES_SOURCE, s.type)}</select></label>
      <label>Ce que j’en retiens, avec mes mots ${zoneTexte('sources.' + s.id + '.retiens', s.retiens)}</label>${retoursSur('source', s.id)}</section>`).join('')}
    ${blocRessources(false)}
    <button class="ajouter" data-a="plus-source">+ Ajouter une source</button>`;

  vues.oraux = () => `
    <h1>Mes oraux</h1>
    <p class="chapo">Après chaque oral blanc ou chaque vidéo, évalue-toi. Ton enseignant·e te donne ensuite son évaluation : compare.</p>
    <section class="carte"><h2>S’entraîner comme le jour J</h2><ol class="etapes"><li>Tire au sort une de tes questions.</li><li>20 minutes : refais ton plan <b>sur papier</b>, sans regarder l’écran.</li>
      <li>10 minutes : présente debout, à voix haute, avec un chronomètre.</li><li>Demande à quelqu’un de te poser trois questions.</li></ol></section>
    ${d.oraux.map((o) => { const n = Object.keys(o.auto || {}).length, note = Object.values(o.auto || {}).reduce((a, b) => a + b, 0); return `<section class="carte oral">
      <div class="tete">${champ('oral.' + o.id + '.nom', o.nom, 'class="titre" aria-label="Nom de l’oral"')}<button class="croix" data-a="suppr-oral" data-o="${o.id}" aria-label="Supprimer">✕</button></div>
      <div class="grille2"><label>Date <input type="date" data-f="oral.${o.id}.date" value="${e(o.date)}"></label>
        <label class="coche"><input type="checkbox" data-coche="oral.${o.id}.video"${o.video ? ' checked' : ''}> Ma vidéo est déposée sur Pronote</label></div>
      <details${n ? ' open' : ''}><summary>Je m’évalue${n === 5 ? ' · ' + note + ' / 20' : ''}</summary>
      ${D.GRILLE.map((c) => `<fieldset class="critere"><legend>${e(c.titre)}</legend>${c.niveaux.map((t, i) => `<label class="niveau"><input type="radio" name="g-${o.id}-${c.id}" data-grille="${o.id}" data-c="${c.id}" value="${i + 1}"${(o.auto || {})[c.id] === i + 1 ? ' checked' : ''}><span><b>${i + 1}</b> ${e(t)}</span></label>`).join('')}</fieldset>`).join('')}
      </details>
      ${blocEvaluation(o, n)}
      <label>Mes deux objectifs pour la prochaine fois ${zoneTexte('oral.' + o.id + '.objectifs', o.objectifs)}</label>${retoursSur('oral', o.id)}</section>`; }).join('')}
    <button class="ajouter" data-a="plus-oral">+ Ajouter une vidéo ou un entraînement</button>`;

  vues.hf = () => {
    const groupes = [...new Set(A.HAUTS_FAITS.map((h) => h.g))], n = A.hautsFaitsDates(d).length; // seulement les hauts faits que connaît cette version
    return `<h1>Mes hauts faits</h1><p class="chapo">${n} sur ${A.HAUTS_FAITS.length}. Ils récompensent les bonnes habitudes, pas la quantité.</p>
    ${groupes.map((g) => `<h2>${e(g)}</h2><ul class="hf">${A.HAUTS_FAITS.filter((h) => h.g === g).map((h) => { const ok = d.hf[h.id];
      return `<li class="${ok ? 'gagne' : ''}"><span class="medaille" aria-hidden="true">${ok ? '★' : h.cache ? '?' : '☆'}</span><div><b>${ok || !h.cache ? e(h.titre) : '???'}</b>
        <p>${ok ? e(h.pourquoi) : e(h.cache ? h.indice : h.cond)}</p>${ok ? `<p class="note">${/^[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(ok) ? 'Gagné le ' + e(dateLongue(ok)) : 'Date inconnue'}</p>` : ''}</div></li>`; }).join('')}</ul>`).join('')}`;
  };
  // « 2026-11-17 » devient « 17 novembre 2026 ».
  function dateLongue(j) { const p = String(j).slice(0, 10).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // L'évaluation de l'enseignant·e se montre après l'auto-évaluation complète : l'élève se juge d'abord, puis compare.
  function blocEvaluation(o, n) {
    const ev = R.evaluation(retoursProf, o.id); if (!ev) return '';
    if (n < 5) return '<p class="note">Ton enseignant·e a évalué cet oral : termine ton auto-évaluation pour voir son avis.</p>';
    const total = Object.values(ev.notes).reduce((a, b) => a + b, 0), complet = Object.keys(ev.notes).length === 5;
    return `<div class="retour-prof"><p><b>L’évaluation de ton enseignant·e</b>${complet ? ' · ' + total + ' / 20' : ''} ${nouveauRetour(ev)}</p>
      <ul class="comparaison">${D.GRILLE.map((c) => `<li>${e(c.titre)} : toi <b>${(o.auto || {})[c.id] || '–'}</b>, ton enseignant·e <b>${ev.notes[c.id] || '–'}</b></li>`).join('')}</ul>
      ${ev.texte ? '<p>' + e(ev.texte) + '</p>' : ''}${mentionIA(ev)}</div>`;
  }
  // Les ressources suggérées : « Ajouter à mes sources » ou « Plus tard ». Le lien ne s'ouvre que s'il est en http(s).
  function blocRessources(tout) {
    const etat = (d.suivi || {}).ressources || {};
    const l = retoursProf.items.filter((x) => x.type === 'ressource' && (tout || etat[x.id] !== 'ajoutee'));
    if (!l.length) return '';
    return `<section class="carte"><h2>Proposées par ton enseignant·e</h2>${l.map((x) => `<div class="retour-prof"><p><b>${e(x.titre || x.url)}</b> ${nouveauRetour(x)}</p>
      ${R.lienSur(x.url) ? `<p><a href="${e(x.url)}" target="_blank" rel="noopener noreferrer">${e(x.url)}</a></p>` : ''}${x.texte ? '<p>' + e(x.texte) + '</p>' : ''}
      ${x.verifier ? '<p class="note">Lien à vérifier avant de t’en servir.</p>' : ''}${mentionIA(x)}
      ${etat[x.id] === 'ajoutee' ? '<p class="fait-texte">Dans tes sources</p>' : `<p><button data-a="ressource-ajouter" data-r="${x.id}">Ajouter à mes sources</button>${etat[x.id] === 'plus-tard' ? '' : ` <button class="discret" data-a="ressource-plus-tard" data-r="${x.id}">Plus tard</button>`}</p>`}</div>`).join('')}</section>`;
  }
  const CIBLE_NOM = { point: 'ton point', mot: 'ton mot', source: 'ta source', piste: 'ta piste', question: 'ta question', echange: 'ta question pour l’échange', oral: 'ton oral' };
  function ouEst(x) {
    const c = x.cible || {};
    if (c.type === 'point') { for (const q of d.questions) { const p = lePoint(q, c.id); if (p) return ['Sur ton point', p.texte, '#/question/' + q.id]; } }
    if (c.type === 'mot') { const m = d.mots.find((y) => y.id === c.id); if (m) return ['Sur ton mot', m.mot, '#/mots']; }
    if (c.type === 'source') { const m = d.sources.find((y) => y.id === c.id); if (m) return ['Sur ta source', m.titre, '#/sources']; }
    if (c.type === 'piste') { const m = d.pistes.find((y) => y.id === c.id); if (m) return ['Sur ta piste', m.titre, '#/explorer/pistes']; }
    if (c.type === 'question') { const m = laQuestion(c.id); if (m) return ['Sur ta question', m.titre, '#/question/' + m.id]; }
    if (c.type === 'echange') { for (const q of d.questions) { const m = (q.echange || []).find((y) => y.id === c.id); if (m) return ['Sur ta question pour l’échange', m.question, '#/question/' + q.id + '/echange']; } }
    if (c.type === 'oral') { const m = d.oraux.find((y) => y.id === c.id); if (m) return ['Sur ton oral', m.nom, '#/oraux']; }
    if (c.type === 'bilan') return ['Bilan', '', ''];
    return [c.type ? 'Sur ' + (CIBLE_NOM[c.type] || 'ton dossier') + ' (supprimé depuis)' : '', '', ''];
  }
  vues.retours = () => {
    const l = retoursProf.items.slice().reverse(), lus = (d.suivi || {}).lus || {};
    const quoi = (x) => {
      if (x.type === 'commentaire') { const o = ouEst(x); return `<p class="sur-titre">${e(o[0])}</p>${o[1] ? `<p class="cite">« ${e(o[1])} »</p>` : ''}<p>${e(x.texte)}</p>${o[2] ? `<p><a href="${o[2]}">Y aller</a></p>` : ''}`; }
      if (x.type === 'definir') return `<p class="sur-titre">Un mot à définir</p><p class="gros">${e(x.mot)}</p>${x.texte ? '<p>' + e(x.texte) + '</p>' : ''}<p><a href="#/mots">Ouvrir mes mots</a></p>`;
      if (x.type === 'ressource') return `<p class="sur-titre">Une ressource</p><p><b>${e(x.titre || x.url)}</b></p>${x.texte ? '<p>' + e(x.texte) + '</p>' : ''}<p><a href="#/sources">Voir dans mes sources</a></p>`;
      if (x.type === 'question') return `<p class="sur-titre">Une question pour l’échange</p><p>${e(x.texte)}</p>${d.questions.length ? `<p><a href="#/question/${(laQuestion(x.qid) || d.questions[0]).id}/echange">Préparer l’échange</a></p>` : ''}`;
      if (x.type === 'validation') { const q = laQuestion(x.qid); return `<p class="sur-titre">${x.etat === 'validee' ? 'Question validée' : 'Question à retravailler'}</p>${q ? `<p class="cite">« ${e(q.titre)} »</p>` : ''}${x.texte ? '<p>' + e(x.texte) + '</p>' : ''}`; }
      if (x.type === 'evaluation') { const o = d.oraux.find((y) => y.id === x.oral); return `<p class="sur-titre">L’évaluation d’un oral</p><p>${e(o ? o.nom : 'Un oral')}</p><p><a href="#/oraux">Comparer avec mon auto-évaluation</a></p>`; }
      return '';
    };
    return `<h1>Les retours de ton enseignant·e</h1>
    ${l.length ? l.map((x) => `<section class="carte retour-carte">${lus[x.id] ? '' : '<span class="nouveau">Nouveau</span>'}${quoi(x)}${mentionIA(x)}</section>`).join('') : '<p class="vide">Pas encore de retour. Ton enseignant·e les écrit depuis son espace : ils apparaîtront ici et à côté de ton travail.</p>'}`;
  };
  vues.aPart = () => { let a = null; try { a = JSON.parse(localStorage.getItem(CLE_APART)); } catch (x) { /* illisible */ }
    return `<h1>Ma saisie mise de côté</h1>
    ${a && Array.isArray(a.textes) && a.textes.length ? `<p class="chapo">Ton dossier a été mis à jour pendant que tu écrivais. Voici ce que tu avais écrit et qui n’y est plus : recopie ce que tu veux garder.</p>
      <ul class="liste">${a.textes.map((t) => `<li class="carte"><p class="sur-titre">${e(t[0])}</p><p class="cite">${e(t[1])}</p></li>`).join('')}</ul>
      <p class="bas"><button class="discret" data-a="effacer-a-part">J’ai fini : effacer cette copie</button></p>` : '<p class="vide">Rien n’est mis de côté.</p>'}`; };

  vues.plus = () => `<h1>Plus</h1><nav class="menu">
    <a href="#/oraux">Mes oraux<span>Oraux blancs, vidéos, auto-évaluation</span></a>
    <a href="#/hauts-faits">Mes hauts faits<span>${A.hautsFaitsDates(d).length} sur ${A.HAUTS_FAITS.length}</span></a>
    <a href="#/aide">Aide et méthode<span>Comprendre l’épreuve, fiches de méthode</span></a>
    <a href="#/comprendre">Vérifier que j’ai compris<span>Deux quiz : l’épreuve, la méthode du plan</span></a>
    <a href="#/conseils">Les conseils, et pourquoi<span>${C.CONSEILS.length} conseils fondés sur des résultats observés</span></a>
    <a href="#/explorer/infox">Info ou infox ?<span>Des faits de l’informatique, et mes accroches</span></a>
    <a href="#/explorer/videos">Vidéos et chaînes<span>Pour nourrir ma culture scientifique</span></a>
    <a href="#/aide/exemple">Voir un exemple<span>Un plan complet sur les biais algorithmiques</span></a>
    ${enLigne() ? `<a href="#/retours">Les retours de mon enseignant·e<span>${retoursProf.items.length} retour${retoursProf.items.length > 1 ? 's' : ''}</span></a>` : ''}
    <a href="#/reglages">Réglages<span>${enLigne() ? 'Mon code, quitter cet appareil, télécharger mon dossier' : 'Rejoindre ma classe, télécharger, importer ou effacer mon dossier'}</span></a></nav>`;

  // Une fiche de méthode : #/aide/<id> l'ouvre et la montre (lien « Revoir » des quiz).
  const fiche = (f, cible) => { const l = C.CONSEILS.filter((c) => (c.fiches || []).includes(f.id));
    return `<details class="carte fiche" id="fiche-${f.id}"${f.id === 'non-specialiste' ? ' data-fiche="canard"' : ''}${f.id === cible ? ' open data-cible' : ''}><summary>${e(f.titre)}</summary>${f.html}${l.length ? `<p class="note">Pourquoi ça marche, d’après les études et les consignes aux jurys : ${l.map((c) => `<a href="#/conseils/${c.id}">${e(c.titre)}</a>`).join(' · ')}</p>` : ''}</details>`; };
  // La vidéo du ministère (2021) : un simple lien, sans lecteur intégré, et ce qui a changé pour la session 2027.
  const blocVideo = (ici) => { const v = D.VIDEO_EPREUVE; return `<div class="video-lien">
      <p><a href="${e(v.lien)}" target="_blank" rel="noopener noreferrer">Vidéo : « ${e(v.titre)} »</a> <span class="note">(${e(v.auteur)}, ${e(v.date)} ; sur YouTube, dans un nouvel onglet)</span></p>
      <div class="mise-en-garde"><p><b>Attention : cette vidéo date de 2021.</b> Elle donne les anciennes règles. Pour la session 2027 :</p>
        <ul><li>coefficient 8, et non plus 10 ;</li><li>10 minutes d’exposé, puis 10 minutes d’échange ;</li><li>deux questions qui ne portent pas sur la même spécialité.</li></ul>
        <p>En cas de différence, c’est ${ici ? 'cette page' : 'la page <a href="#/aide/epreuve">« Comprendre l’épreuve »</a>'} qui fait foi.</p></div></div>`; };
  const boutonQuiz = (id) => { const z = D.COMPRENDRE.find((x) => x.id === id), r = (d.comprendre || {})[id];
    return `<p><a class="bouton" href="#/comprendre/${id}">${e(z.titre)}</a> <span class="note">${quizEnCours && quizEnCours.id === id && !quizEnCours.fini ? 'en cours' : r && r.essais ? 'meilleur score : ' + r.meilleur + ' sur ' + A.surSalve(z) : A.surSalve(z) + ' questions'}</span></p>`; };
  vues.aide = (cible) => `<h1>Aide et méthode</h1>
    <section class="carte" id="epreuve"${cible === 'epreuve' ? ' data-cible' : ''}><h2>Comprendre l’épreuve (session 2027)</h2><ul>
      <li><b>Avant :</b> tu prépares deux questions avec tes enseignant·e·s. Elles ne portent pas sur la même spécialité ; une question peut être transversale.</li>
      <li><b>Préparation, 20 min :</b> le jury choisit une question. Tu prépares tes notes sur papier, avec un schéma si tu veux. Aucun autre support, rien de numérique.</li>
      <li><b>Exposé, 10 min :</b> debout, sans lire. Tu n’as que les notes écrites pendant la préparation : garde ta feuille, et montre au jury le schéma que tu y as fait, s’il l’aide à suivre. Le jury ne note pas ta feuille.</li>
      <li><b>Échange, 10 min :</b> le jury te questionne sur ton sujet et sur tout le programme des spécialités concernées.</li>
      <li><b>Jury :</b> deux enseignant·e·s, dont un·e n’est pas spécialiste de NSI.</li>
      <li><b>Coefficient 8</b> en voie générale. La question n’est pas notée : ce sont ton argumentation et ton oral qui comptent.</li>
      <li><b>La grille indicative</b> a 5 critères : qualité orale, prise de parole en continu, connaissances, interaction avec le jury, construction de l’argumentation.</li></ul>
      <p class="note">Source : note de service du 10 septembre 2026, Bulletin officiel spécial n° 4 du 17 septembre 2026.</p>
      ${blocVideo(true)}
      ${boutonQuiz('epreuve')}</section>
    <h2>Fiches de méthode</h2>
    ${boutonQuiz('plan')}
    <p><a class="bouton" href="#/conseils">Les conseils, et pourquoi</a></p>
    ${D.FICHES.map((f) => fiche(f, cible)).join('')}
    <p><a class="bouton" href="#/aide/exemple">Voir un exemple de dossier</a></p>`;

  // ---------- Les quiz « Vérifie que tu as compris » ----------
  // Une question par écran, le retour juste après la réponse, puis le score et les points à revoir. L'essai en cours reste
  // en mémoire de la page (un lien « Revoir » ne le perd pas) ; seul le résultat va dans le dossier.
  let quizEnCours = null;
  const leQuiz = (id) => D.COMPRENDRE.find((x) => x.id === id);
  // Le retour de la bonne réponse, montré après une erreur : sans son « Oui : » du début.
  const pourquoiJuste = (q) => { const t = q.o[q.b][1].replace(/^(Oui|Exact) : /, ''); return t.charAt(0).toUpperCase() + t.slice(1); };
  // Échappé, avec une espace fine insécable avant « ? ! : ; » et après « (le signe ne part pas seul à la ligne).
  const typo = (t) => e(t).replace(/ ([?!:;»])/g, '&#x202F;$1').replace(/« /g, '«&#x202F;');
  function melanger(n) { const l = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; }
  function etatQuiz(z) { const r = (d.comprendre || {})[z.id], t = A.surSalve(z); return r && r.essais ? `Meilleur score : ${r.meilleur} sur ${t} · dernier : ${r.dernier} sur ${t} · ${pluriel(r.essais, 'essai')}` : 'Pas encore fait'; }
  // Combien de questions de la banque l'élève a déjà vues, et par où commencera le prochain essai.
  function noteVues(z) { const v = A.suiviQuiz(d, z).nVues, t = z.questions.length;
    return `<p class="note">Questions déjà vues : ${v} sur ${t}${v ? (v < t ? ' : le prochain essai commence par celles que tu n’as pas encore vues.' : ' : le prochain essai commence par celles que tu as ratées.') : '.'}</p>`; }
  // Les questions qu'une salve tire : celles de l'essai en cours, dans l'ordre de la salve.
  const questionsDe = (Q, z) => Q.ids.map((k) => z.questions.find((q) => q.id === k)).filter(Boolean);
  function blocComprendre() {
    if (D.COMPRENDRE.every((z) => A.quizEssaye(d, z.id))) return '';
    return `<section class="carte"><h2>Vérifie que tu as compris</h2><p>Deux quiz de 10 questions, avec une explication après chaque réponse. Ce n’est pas noté.</p>
      <ul class="coches">${D.COMPRENDRE.map((z) => `<li class="${A.quizEssaye(d, z.id) ? 'fait' : ''}"><a href="#/comprendre/${z.id}">${e(z.titre)}</a></li>`).join('')}</ul></section>`;
  }
  vues.comprendre = (id) => {
    const z = leQuiz(id);
    if (!z) return `<h1>Vérifie que tu as compris</h1><p class="chapo">Deux quiz de 10 questions. Après chaque réponse, une explication. Ce n’est pas noté : refais-les autant que tu veux.</p>
      ${D.COMPRENDRE.map((x) => `<a class="carte lien-carte" href="#/comprendre/${x.id}"><p class="gros">${typo(x.titre)}</p><p class="note">${e(etatQuiz(x))}</p></a>`).join('')}`;
    const tete = `<p class="retour"><a href="#/comprendre">← Les quiz</a></p><h1>${typo(z.titre)}</h1>`, Q = quizEnCours;
    if (!Q || Q.id !== id) return tete + `<p class="chapo">${e(z.chapo)}</p>${id === 'epreuve' ? blocVideo(false) : ''}
      <section class="carte"><p class="sur-titre">Tes résultats</p><p>${e(etatQuiz(z))}</p>${noteVues(z)}</section>
      <p><button class="principal" data-a="quiz-commencer" data-q="${id}">${A.quizEssaye(d, id) ? 'Refaire le quiz' : 'Commencer'}</button></p>`;
    const qs = questionsDe(Q, z), n = qs.length;
    if (Q.fini) {
      const juste = Q.reponses.filter((k, i) => k === qs[i].b).length, rates = qs.filter((q, i) => Q.reponses[i] !== q.b);
      const mot = juste === n ? 'Sans faute : tu as tout compris. Bravo !' : juste >= 7 ? 'Presque tout est clair. Revois les points ci-dessous, puis refais le quiz quand tu veux.'
        : 'Ce quiz sert à repérer ce qui reste flou : revois les points ci-dessous, puis refais-le quand tu veux.';
      const autre = D.COMPRENDRE.find((x) => x.id !== id && !A.quizEssaye(d, x.id));
      return tete + `<section class="carte action" id="quiz-fin"><p class="sur-titre">Ton résultat</p><p class="score" tabindex="-1">${juste} sur ${n}</p><p>${mot}</p>${noteVues(z)}</section>
        ${rates.length ? `<h2>Les points à revoir</h2><ul class="liste">${rates.map((q) => `<li class="carte"><p><b>${e(q.q)}</b></p><p>La bonne réponse : ${e(q.o[q.b][0])}</p><p class="note">${e(pourquoiJuste(q))}</p><p><a href="${q.r[0]}">Revoir : ${e(q.r[1])}</a></p></li>`).join('')}</ul>` : ''}
        <p class="bas"><button class="principal" data-a="quiz-commencer" data-q="${id}">Refaire le quiz</button>${autre ? `<a class="bouton" href="#/comprendre/${autre.id}">${e(autre.titre)}</a>` : '<a class="bouton" href="#/aide">Aide et méthode</a>'}</p>`;
    }
    const q = qs[Q.i], rep = Q.reponses[Q.i], valide = rep !== undefined, ordre = Q.ordres[Q.i];
    const option = (k) => { const choisie = valide ? rep === k : Q.choix === k, bonne = k === q.b;
      const etat = valide ? (bonne ? ' juste' : choisie ? ' faux' : '') : '';
      const marque = valide && bonne ? '<b class="marque">Bonne réponse · </b>' : valide && choisie ? '<b class="marque">Ta réponse · </b>' : '';
      return `<label class="niveau option${etat}"><input type="radio" name="quiz-rep" value="${k}"${choisie ? ' checked' : ''}${valide ? ' disabled' : ''}><span>${marque}${e(q.o[k][0])}</span></label>`; };
    const retour = valide ? `<div class="carte retour-quiz ${rep === q.b ? 'juste' : 'faux'}" id="quiz-retour" tabindex="-1">
        <p><b>${rep === q.b ? 'Bien vu.' : 'Pas tout à fait.'}</b> ${e(q.o[rep][1])}</p>
        ${rep === q.b ? '' : `<p><b>La bonne réponse :</b> ${e(q.o[q.b][0])}</p><p>${e(pourquoiJuste(q))}</p>`}
        <p><a href="${q.r[0]}">Revoir : ${e(q.r[1])}</a></p></div>` : '';
    return tete + `<p class="sur-titre">Question ${Q.i + 1} sur ${n}</p><div class="avance" aria-hidden="true"><span style="width:${Math.round(100 * (Q.i + (valide ? 1 : 0)) / n)}%"></span></div>
      <fieldset class="carte quiz-q" data-qid="${e(q.id)}"><legend id="quiz-question" tabindex="-1">${typo(q.q)}</legend>${ordre.map(option).join('')}</fieldset>
      <div aria-live="polite">${retour}</div>
      <p class="bas"><span></span>${valide ? `<button class="principal" data-a="quiz-suivant">${Q.i + 1 < n ? 'Question suivante' : 'Voir mon résultat'}</button>` : '<button class="principal" data-a="quiz-valider">Valider ma réponse</button>'}</p>`;
  };
  function focusQuiz(sel) { const t = $(sel); if (t) { t.focus({ preventScroll: true }); t.scrollIntoView({ block: 'nearest' }); } }

  vues.exemple = () => { const x = D.EXEMPLE; return `<p class="retour"><a href="#/aide">← Aide et méthode</a></p><h1>Un exemple</h1>
    <p class="chapo">Le plan de ton enseignant·e sur les biais algorithmiques. Il est là pour te montrer la forme : ne le recopie pas.</p>
    <p class="titre-question lecture">${e(x.titre)}</p>
    ${x.parties.map((p) => `<section class="partie"><div class="tete"><b class="titre-partie">${e(p.titre)}</b><span class="note">≈ ${p.minutes} min</span></div>
      <ul class="points lecture">${p.points.map((pt) => `<li class="pt"><div class="corps"><p>${e(pt[1])}</p><span class="etq">${e((D.ETIQUETTES.find((t) => t[0] === pt[0]) || ['', ''])[1])}</span></div></li>`).join('')}</ul></section>`).join('')}
    <h2>Le lexique</h2>${x.mots.map((m) => `<section class="carte"><b>${e(m.mot)}</b><p><span class="note">Source :</span> ${e(m.defSource)}</p><p><span class="note">Avec mes mots :</span> ${e(m.defMoi)}</p><p><span class="note">Image :</span> ${e(m.analogie)}</p></section>`).join('')}`; };

  // Le dossier en Markdown (js/export.js) : un texte lisible tel quel, et une fois rendu. Sans les retours de
  // l'enseignant·e, sauf si la case est cochée.
  const blocMarkdown = () => `<div class="bloc-md"><p><button data-a="markdown">Télécharger mon dossier en Markdown</button></p>
      ${enLigne() && retoursProf.items.length ? '<label class="coche"><input type="checkbox" id="md-retours"> Inclure les retours de mon enseignant·e</label>' : ''}</div>`;
  vues.reglages = () => { const s = EL.session(); return `<h1>Réglages</h1>
    ${s ? `<section class="carte"><h2>Mon compte</h2><p><b>${e(s.pseudo)}</b>, classe ${e(s.classe)} (${e(s.enseignant)}).</p>
      <p>Mon code : <span class="code-eleve petit" id="mon-code" hidden>${e(s.code)}</span> <button class="mini" data-a="voir-code" aria-controls="mon-code">Voir mon code</button></p>
      <p class="note">Ton prénom ou ton initiale est faux ? Demande à ton enseignant·e de les corriger.</p></section>
    <section class="carte"><h2>Quitter cet appareil</h2><p>Sur un ordinateur partagé du lycée, quitte l’appareil en partant : la personne suivante ne verra pas ton dossier. Il reste en ligne : tu le retrouves avec ton code.</p>
      <button data-a="deconnexion">Quitter cet appareil</button></section>`
    : `<section class="carte"><h2>Mon prénom</h2>${champ('profil.prenom', d.profil.prenom, 'maxlength="24" aria-label="Mon prénom"')}</section>${blocRejoindre()}`}
    <section class="carte"><h2>Mon dossier</h2>
      ${s ? '<p>Ton dossier est gardé en ligne et sur cet appareil. Tu peux aussi en télécharger une copie.</p>' : '<p>Ton dossier est gardé <b>sur cet appareil seulement</b>. Pour le sauvegarder ou le passer sur un autre appareil, télécharge-le, puis importe-le.</p>'}
      <p><button data-a="exporter">Télécharger mon dossier</button> <label class="bouton fichier">Importer un dossier<input type="file" id="import" accept="application/json,.json"></label></p>
      <p class="note">Ce fichier (JSON) sert à sauvegarder ton dossier et à l’importer. Pour le lire, le relire ou le partager, prends plutôt le Markdown :</p>
      ${blocMarkdown()}</section>
    ${s ? '' : `<section class="carte"><h2>Tout effacer</h2><p>Pour effacer ton dossier de cet appareil, écris EFFACER, puis valide. C’est définitif.</p>
      <input type="text" id="confirmer" aria-label="Écris EFFACER pour confirmer" autocomplete="off"><button class="danger" data-a="effacer">Effacer mon dossier</button></section>`}
    <p class="note">Hello GO, version ${window.HG_VERSION}.</p>`; };

  // ---------- La culture (version 1.6.0) : vidéos conseillées, « Info ou infox ? », conseils fondés sur des résultats ----------
  // Les vidéos sont de simples liens vers leur plateforme, dans un nouvel onglet, sans transmettre l'adresse de la page :
  // aucun lecteur intégré, aucune miniature, rien n'est chargé d'un autre site.
  const C = window.HGCulture, aujourdhui = () => A.jourLocal(new Date());
  const cult = () => A.cultureDe(d);
  const lienExterne = (url, html) => (R.lienSur(url) ? `<a href="${e(url)}" target="_blank" rel="noopener noreferrer">${html}</a>` : html);
  let decalageVideo = 0, decalageTrois = 0, filtreVideos = '', salveInfox = null;
  function apresVideo(v, s) {
    const piste = s.piste && d.pistes.some((p) => p.id === s.piste), source = s.source && d.sources.some((x) => x.id === s.source);
    return `<div class="apres-video"><p class="fait-texte">Regardée${/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s.vue) ? ' le ' + e(dateLongue(s.vue)) : ''}</p>
      <label>Ce que j’en retiens ${zoneTexte('cv.' + v.id + '.retiens', s.retiens, 'maxlength="400" placeholder="Une ou deux lignes, avec tes mots"')}</label>
      <label>Ce qui m’a intrigué·e ${zoneTexte('cv.' + v.id + '.intrigue', s.intrigue, 'maxlength="400" placeholder="Une question, un détail, une surprise"')}</label>
      <p class="note">Une question qu’elle peut ouvrir : « ${e(v.question)} »</p>
      <p class="boutons">${piste ? '<span class="fait-texte">Dans tes pistes</span>' : `<button data-a="video-piste" data-v="${e(v.id)}">En faire une piste</button>`}
        ${source ? '<span class="fait-texte">Dans tes sources</span>' : `<button data-a="video-source" data-v="${e(v.id)}">Ajouter à mes sources</button>`}</p></div>`;
  }
  // Une vidéo : sa chaîne, qui la conseille, sa langue, son lien, son accroche, pourquoi elle est proposée, puis la suite.
  function carteVideo(x, tag) {
    const v = x.video, s = ((d.culture || {}).videos || {})[v.id] || {}, t = tag || 'li';
    const tete = [e(v.chaine), v.origine === 'enseignant' ? 'conseillée par ton enseignant·e' : 'en complément', v.langue !== 'fr' ? '<b>en anglais</b>' : ''].filter(Boolean).join(' · ');
    return `<${t} class="carte video" id="video-${e(v.id)}"><p class="sur-titre">${tete}</p>
      <p class="gros">${lienExterne(v.url, e(v.titre))} <span class="note">(${e(v.plateforme)}, dans un nouvel onglet)</span></p>
      <p>${e(v.accroche)}</p>${x.pourquoi ? `<p class="note pourquoi-video">${e(x.pourquoi)}</p>` : ''}
      ${s.vue ? apresVideo(v, s) : `<p class="boutons"><span>Tu l’as regardée ?</span> <button data-a="video-vue" data-v="${e(v.id)}">Oui, je l’ai regardée</button>
        ${s.avis === -1 ? `<button class="discret" data-a="video-oui" data-v="${e(v.id)}">Remettre dans mes suggestions</button>` : `<button class="discret" data-a="video-non" data-v="${e(v.id)}">Pas pour moi</button>`}</p>`}</${t}>`;
  }
  const troisVideos = (titre) => { const l = A.videosPour(d, 3, decalageTrois * 3); return l.length ? `<h2>${titre}</h2><ul class="liste">${l.map((x) => carteVideo(x)).join('')}</ul>
    <p class="bas"><button class="discret" data-a="videos-autres">Trois autres</button> <a href="#/explorer/videos">Toutes les vidéos</a></p>` : ''; };
  function blocVideoAccueil() {
    const x = A.videosPour(d, 1, decalageVideo)[0]; if (!x) return '';
    const vide = !Object.keys((d.quiz || {}).reponses || {}).length && !Object.keys(d.decouverte.reactions).length;
    return `<section class="video-accueil"><p class="sur-titre">Une vidéo pour toi</p>${carteVideo(x, 'div')}
      <p class="note"><button class="lien" data-a="video-autre">Une autre</button> · <a href="#/explorer/videos">Toutes les vidéos</a>${vide ? ' · <a href="#/explorer/quiz">Dire ce que j’aime</a>' : ''}</p></section>`;
  }
  vues.videos = () => {
    const tags = [['', 'Tous les thèmes']].concat(Object.keys(D.TAGS.i).map((k) => ['i.' + k, D.TAGS.i[k]]), Object.keys(D.TAGS.n).map((k) => ['n.' + k, D.TAGS.n[k]]));
    const classe = A.classerVideos(d), pourquoi = {}; classe.forEach((x) => { pourquoi[x.video.id] = x.pourquoi; });
    const f = filtreVideos.split('.'), l = C.VIDEOS.filter((v) => !filtreVideos || (f[0] === 'i' ? v.interets : v.notions).includes(f[1]));
    const vues2 = A.chiffresCulture(d).videos;
    return ongletsExplorer('videos') + `
    <p class="chapo">Des vidéos choisies par ton enseignant·e, et quelques compléments, pour nourrir ta culture scientifique et trouver des idées. Après une vidéo, note ce que tu en retiens : elle peut devenir une piste ou une source.</p>
    ${vues2 ? `<p class="note">Tu en as regardé ${vues2}.</p>` : ''}
    ${troisVideos('Pour toi')}
    <h2 id="toutes-videos">Toutes les vidéos</h2>
    <label>Thème <select id="filtre-videos" aria-label="Filtrer les vidéos par thème">${options(tags, filtreVideos)}</select></label>
    <p class="note">${pluriel(l.length, 'vidéo')}${filtreVideos ? ' sur ce thème' : ''}.</p>
    <ul class="liste">${l.map((v) => carteVideo({ video: v, pourquoi: pourquoi[v.id] || '' })).join('')}</ul>
    <section class="carte" id="chaines"><h2>Chaînes à découvrir</h2><p class="note">Pour continuer après les vidéos : des chaînes et un site sérieux, en français.</p>
      <ul class="simples chaines">${C.CHAINES.map((c) => `<li><div><p><b>${lienExterne(c.url, e(c.nom))}</b> <span class="note">(${e(c.plateforme)})</span></p><p class="note">${e(c.phrase)}</p></div></li>`).join('')}</ul></section>
    <p class="note">Liens vérifiés le ${e(dateLongue(C.VERIFIE.videos))} (titre et chaîne de chaque vidéo).</p>`;
  };

  // « Info ou infox ? » : une affirmation par écran, la réponse, l'explication, la source, et « Garder comme accroche ».
  // Une affirmation fausse n'apparaît jamais sans son démenti juste après la réponse ; seule la formulation « accroche »
  // (un fait vrai, ou le démenti) peut rejoindre « Mes accroches » et le plan.
  const accrocheDe = (a) => String(a.accroche).replace(/^«\s*/, '').replace(/\s*»$/, '');
  const sourceInfox = (a) => `<p class="note">Source : ${lienExterne(a.source.url, e(a.source.titre))}${(a.autres || []).map((s) => ' · ' + lienExterne(s.url, e(s.titre))).join('')}</p>`;
  function verdictInfox(a, juste, id) {
    const gardee = !!((d.culture || {}).accroches || {})[a.id];
    return `<div class="carte retour-quiz ${juste ? 'juste' : 'faux'}"${id ? ' id="' + id + '" tabindex="-1"' : ''}>
      <p><b>${juste ? 'Bien vu !' : 'Pas tout à fait.'}</b> C’est ${a.vrai ? 'une <b>info</b> : c’est vrai.' : 'une <b>infox</b> : c’est faux.'}</p>
      <p>${e(a.explication)}</p><p class="accroche-texte"><span class="note">À retenir :</span> ${e(accrocheDe(a))}</p>${sourceInfox(a)}
      <p>${gardee ? '<span class="fait-texte">Dans « Mes accroches »</span>' : `<button data-a="infox-garder" data-x="${e(a.id)}">Garder comme accroche</button>`}</p></div>`;
  }
  function blocInfoxJour() {
    const j = A.infoxDuJour(d, aujourdhui()), a = j.a, c = cult();
    if (j.neuf) c.jour = { j: aujourdhui(), id: a.id };
    const s = c.infox[a.id], repondu = s && s.le === aujourdhui();
    return `<section class="carte infox-jour"><p class="sur-titre">Info ou infox ? · l’affirmation du jour</p><p class="gros">${typo(a.affirmation)}</p>
      ${repondu ? verdictInfox(a, s.d === 1) + '<p><a href="#/explorer/infox">Une salve de 7 affirmations</a></p>'
        : `<div class="deux"><button data-a="infox-jour" data-r="0">Infox</button><button data-a="infox-jour" data-r="1">Info</button></div>`}</section>`;
  }
  function mesAccroches() {
    const acc = (d.culture || {}).accroches || {}, l = C.INFOX.filter((a) => acc[a.id]).sort((x, y) => String(acc[y.id].le).localeCompare(String(acc[x.id].le)));
    if (!l.length) return '<section class="carte" id="mes-accroches"><h2>Mes accroches</h2><p class="vide">Aucune pour le moment : après une réponse, « Garder comme accroche » met le fait de côté, pour l’introduction de ta question.</p></section>';
    return `<section class="carte" id="mes-accroches"><h2>Mes accroches (${l.length})</h2><p class="note">Un fait vrai, daté et sourcé, pour ouvrir ton exposé. Ajouté à ta question, il devient le premier point de l’introduction, avec sa source : reformule-le à ta façon.</p>
      <ul class="simples accroches">${l.map((a) => { const x = acc[a.id], q = x.q && laQuestion(x.q), dans = q && A.tousLesPoints(q).some((p) => p.id === x.p);
        return `<li><div><p>${e(accrocheDe(a))}</p>${sourceInfox(a)}
          ${dans ? `<p class="fait-texte">Dans ton plan : <a href="#/question/${q.id}">« ${e(q.titre || 'ta question')} »</a></p>`
          : d.questions.length ? `<p class="boutons">${d.questions.map((q2) => `<button class="mini" data-a="accroche-ajouter" data-x="${e(a.id)}" data-q="${q2.id}">Ajouter à « ${e((q2.titre || 'ma question').slice(0, 50))} »</button>`).join(' ')}</p>`
          : '<p class="note">Tu pourras l’ajouter à l’introduction de ta question dès que tu l’auras choisie.</p>'}
          <p><button class="mini discret" data-a="accroche-retirer" data-x="${e(a.id)}">Retirer de mes accroches</button></p></div></li>`; }).join('')}</ul></section>`;
  }
  vues.infox = () => {
    const S = salveInfox, ch = A.chiffresCulture(d), tete = ongletsExplorer('infox');
    const intro = `<p class="chapo">Des faits marquants de l’informatique : vrai ou faux ? À chaque réponse, l’explication et la source. Ce n’est pas noté. Un fait qui te plaît peut devenir l’accroche de ton exposé.</p>`;
    if (!S) return tete + intro + `<section class="carte"><p class="sur-titre">Tes résultats</p><p>${ch.infox ? `${pluriel(ch.infox, 'affirmation')} vue${ch.infox > 1 ? 's' : ''} sur ${C.INFOX.length}, dont ${ch.reussies} réussie${ch.reussies > 1 ? 's' : ''} la dernière fois.` : 'Pas encore joué.'}</p>
        <p class="note">Chaque salve commence par les affirmations que tu n’as jamais vues, d’abord celles qui touchent à tes goûts et à ton sujet, puis d’autres pour découvrir autre chose.</p>
        <p><button class="principal" data-a="infox-commencer">${ch.salves ? 'Encore une salve' : 'Commencer'} (${A.SALVE_INFOX} affirmations)</button></p></section>${mesAccroches()}`;
    const n = S.ids.length;
    if (S.fini) {
      const justes = S.reponses.filter((r, i) => r === A.lInfox(S.ids[i]).vrai).length;
      return tete + `<section class="carte action-infox" id="infox-fin"><p class="sur-titre">Ta salve</p><p class="score" tabindex="-1">${justes} sur ${n}</p>
        <p>${justes === n ? 'Sans faute : ta culture informatique est solide !' : 'Chaque erreur est un fait de plus que tu connais maintenant. Les affirmations ratées reviendront dans une prochaine salve.'}</p></section>
        <h2>Ce qu’il faut retenir</h2><ul class="liste">${S.ids.map((k, i) => { const a = A.lInfox(k), ok = S.reponses[i] === a.vrai;
          return `<li class="carte"><p class="sur-titre">${ok ? 'Réussie' : 'Ratée'} · ${a.vrai ? 'info' : 'infox'}</p><p>${e(accrocheDe(a))}</p>${sourceInfox(a)}
            <p>${((d.culture || {}).accroches || {})[a.id] ? '<span class="fait-texte">Dans « Mes accroches »</span>' : `<button class="mini" data-a="infox-garder" data-x="${e(a.id)}">Garder comme accroche</button>`}</p></li>`; }).join('')}</ul>
        <p class="bas"><button class="principal" data-a="infox-commencer">Encore une salve</button> <button data-a="infox-quitter">Terminer</button></p>${mesAccroches()}`;
    }
    const a = A.lInfox(S.ids[S.i]), rep = S.reponses[S.i], valide = rep !== undefined;
    return tete + `<p class="sur-titre">Affirmation ${S.i + 1} sur ${n}</p><div class="avance" aria-hidden="true"><span style="width:${Math.round(100 * (S.i + (valide ? 1 : 0)) / n)}%"></span></div>
      <section class="carte infox-carte${valide ? '' : ' a-glisser'}" data-infox="${e(a.id)}"><p class="gros" id="infox-affirmation" tabindex="-1">${typo(a.affirmation)}</p>
        ${valide ? '' : `<div class="deux grands"><button data-a="infox-repondre" data-r="0"><span aria-hidden="true">← </span>Infox</button><button class="principal" data-a="infox-repondre" data-r="1">Info<span aria-hidden="true"> →</span></button></div>
        <p class="note">Au clavier : flèche gauche pour « Infox », flèche droite pour « Info ». Sur téléphone, tu peux aussi glisser la carte.</p>`}</section>
      <div aria-live="polite">${valide ? verdictInfox(a, rep === a.vrai, 'infox-retour') : ''}</div>
      <p class="bas"><button class="discret" data-a="infox-quitter">Arrêter la salve</button>${valide ? `<button class="principal" data-a="infox-suivante">${S.i + 1 < n ? 'Affirmation suivante' : 'Voir mon score'}</button>` : ''}</p>`;
  };
  function repondreInfox(vrai) {
    const S = salveInfox; if (!S || S.fini || S.reponses[S.i] !== undefined) return;
    const a = A.lInfox(S.ids[S.i]); S.reponses[S.i] = vrai; A.noterInfox(d, a.id, vrai === a.vrai);
    enregistrer(true); rendre(false); focusQuiz('#infox-retour');
  }
  // Le point « accroche » au début de l'introduction de la question, avec sa source (reprise si elle y est déjà), reliée.
  function ajouterAccroche(xid, qid) {
    const a = A.lInfox(xid), q = laQuestion(qid); if (!a || !q) return;
    const intro = q.parties.find((p) => /intro/i.test(p.titre)) || q.parties[0]; if (!intro) return;
    let s = d.sources.find((x) => (x.lien || '').trim() === a.source.url);
    if (!s) { s = { id: uid(), titre: a.source.titre, auteur: '', lien: a.source.url, type: /wikipedia\.org|britannica\.com/.test(a.source.url) ? 'encyclopedie' : '', date: '', retiens: '' }; d.sources.push(s); }
    const pt = point(accrocheDe(a), 'accroche'); pt.sources = [s.id]; intro.points.unshift(pt);
    A.garderAccroche(d, xid); Object.assign(cult().accroches[xid], { q: q.id, p: pt.id });
    enregistrer(true); return pt;
  }
  function ouvrirPioche(qid) {
    const q = laQuestion(qid), dlg = $('#dialogue'); if (!q) return;
    const l = A.accrochesPour(d, q), acc = (d.culture || {}).accroches || {}, ids = new Set(A.tousLesPoints(q).map((p) => p.id));
    const dans = (a) => acc[a.id] && acc[a.id].q === q.id && ids.has(acc[a.id].p);
    const lies = l.filter((x) => x.rel > 0).slice(0, 8), gardees = l.filter((x) => x.gardee && lies.indexOf(x) < 0);
    const item = (x) => `<li><div><p>${e(accrocheDe(x.a))}</p>${sourceInfox(x.a)}</div>${dans(x.a) ? '<span class="fait-texte">Dans ce plan</span>' : `<button class="mini" data-a="accroche-piocher" data-x="${e(x.a.id)}" data-q="${q.id}">Ajouter</button>`}</li>`;
    dlg.innerHTML = `<form method="dialog"><h2 id="titre-dialogue">Piocher une accroche</h2>
      <p class="note">Un fait vrai et sourcé de « Info ou infox ? ». Il devient le premier point de ton introduction, avec sa source : reformule-le à ta façon.</p>
      ${lies.length ? `<h3>Liées à ton sujet</h3><ul class="simples accroches">${lies.map(item).join('')}</ul>` : '<p class="note">Aucun fait n’est encore relié à ton sujet.</p>'}
      ${gardees.length ? `<h3>Mes accroches</h3><ul class="simples accroches">${gardees.map(item).join('')}</ul>` : ''}
      <p><a href="#/explorer/infox">Jouer à « Info ou infox ? » pour en trouver d’autres</a></p>
      <p class="bas"><button type="button" data-a="fermer-dialogue">Fermer</button></p></form>`;
    dlg.onclose = null; dlg.returnValue = ''; dlg.setAttribute('aria-labelledby', 'titre-dialogue'); dlg.showModal();
  }

  // Les conseils fondés sur des résultats observés : le conseil, puis, repliable, « Pourquoi ? » (le résultat, sa solidité en
  // clair, la source cliquable) ; auteur·e·s et titres tels que le fichier les donne.
  const PHASES = ['Choisir ta question', 'Construire ton plan', 'Préparer l’oral et l’échange'];
  function sourceConseil(c) {
    const s = c.source, quoi = [s.auteurs ? e(s.auteurs) : '', s.annee ? '(' + e(s.annee) + ')' : ''].filter(Boolean).join(' ');
    return `${quoi}${quoi ? ', ' : ''}${lienExterne(s.url, s.titre ? '« ' + e(s.titre) + ' »' : 'la source')}${s.lien ? ' <span class="note">(lien : ' + e(s.lien) + ')</span>' : ''}`;
  }
  const liensConseil = (c) => { const l = (c.fiches || []).map((f) => { const x = D.FICHES.find((y) => y.id === f); return x ? `<a href="#/aide/${x.id}">Fiche : ${e(x.titre)}</a>` : ''; }).filter(Boolean);
    const z = c.quiz && D.COMPRENDRE.find((y) => y.id === c.quiz); if (z) l.push(`<a href="#/comprendre/${z.id}">Quiz : ${e(z.titre)}</a>`);
    return l.length ? '<p class="note">' + l.join(' · ') + '</p>' : ''; };
  const pourquoiConseil = (c, ouvert) => `<details class="pourquoi"${ouvert ? ' open' : ''}><summary>Pourquoi ?</summary><p>${e(c.pourquoi)}</p>
    <p class="note">Solidité : <b>${e(c.solidite)}</b>. Source : ${sourceConseil(c)}</p>${liensConseil(c)}</details>`;
  vues.conseils = (cible) => `<p class="retour"><a href="#/aide">← Aide et méthode</a></p><h1>Les conseils, et pourquoi</h1>
    <p class="chapo">Chaque conseil s’appuie sur un résultat observé ou sur les consignes données aux jurys. « Pourquoi ? » dit d’où il vient et à quel point il est solide :</p>
    <ul class="note"><li><b>bien établi</b> : un résultat retrouvé par de nombreuses études ;</li><li><b>plusieurs études</b> : des résultats concordants ;</li><li><b>une étude</b> : un seul travail, à prendre avec prudence ;</li><li><b>repère de manuel</b> : un ordre de grandeur, pas une expérience ;</li><li><b>consignes aux jurys</b> : ce que les textes officiels demandent d’évaluer.</li></ul>
    <p class="note">Plusieurs résultats portent sur des listes de mots, des visages ou des sensations, pas sur des exposés : « Pourquoi ? » le dit à chaque fois. Sources ouvertes le ${e(dateLongue(C.VERIFIE.conseils))}.</p>
    ${PHASES.map((t, ph) => `<h2>${e(t)}</h2>${C.CONSEILS.filter((c) => c.phase === ph).map((c) => `<section class="carte conseil" id="conseil-${e(c.id)}"${c.id === cible ? ' data-cible' : ''}><h3>${e(c.titre)}</h3><p>${e(c.conseil)}</p>${pourquoiConseil(c, c.id === cible)}</section>`).join('')}`).join('')}`;
  function blocConseil() {
    const liste = A.conseilsDuJour(d), jour = Math.floor(Date.now() / 864e5) + (d.vus.decalage || 0), x = liste[((jour % liste.length) + liste.length) % liste.length];
    if (!x.conseil) return `<section class="carte savoir"><p class="sur-titre">À savoir aujourd’hui</p><p class="gros">${e(x.t)}</p>
      <p><a href="#/aide">En savoir plus</a> · <a href="#/conseils">Tous les conseils</a> · <button class="lien" data-a="autre-savoir">Un autre</button></p></section>`;
    const c = x.conseil;
    return `<section class="carte savoir"><p class="sur-titre">Le conseil du jour</p><p class="gros"><b>${typo(c.titre)}.</b> ${typo(c.conseil)}</p>${pourquoiConseil(c)}
      <p><a href="#/conseils">Tous les conseils</a> · <button class="lien" data-a="autre-savoir">Un autre</button></p></section>`;
  }

  // ---------- Le routeur ----------
  const NAV = [['#/', 'Accueil', 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'], ['#/explorer/decouvrir', 'Explorer', 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm3.5 6.5-2 5-5 2 2-5z'],
    ['#/questions', 'Questions', 'M4 5h16M4 10h16M4 15h10M4 20h7'], ['#/mots', 'Mots', 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11'],
    ['#/sources', 'Sources', 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'], ['#/plus', 'Plus', 'M5 12h.01M12 12h.01M19 12h.01']];
  function route() {
    const h = (location.hash || '#/').slice(2).split('/');
    if (h[0] === 'classe') { chercherClasse(h[1]); return ['classe', '', vues.classe(lireCodeClasse(h[1]))]; }
    if (h[0] === 'entrer') return ['entrer', '', vues.entrer()];
    if (h[0] === 'prof' && window.HGProf) return ['prof', '', window.HGProf.vue(h.slice(1))];
    if (h[0] === 'rejoindre') return ['rejoindre', '', '<h1>Rejoindre ma classe</h1>' + blocRejoindre()];
    if (!d.profil.vu) return ['bienvenue', '', vues.bienvenue()];
    switch (h[0]) {
      case '': return ['accueil', '#/', vues.accueil()];
      case 'explorer': return [h[1] || 'decouvrir', '#/explorer/decouvrir', (vues[h[1]] && ['decouvrir', 'quiz', 'sujets', 'pistes', 'videos', 'infox'].includes(h[1]) ? vues[h[1]] : vues.decouvrir)()];
      case 'questions': return ['questions', '#/questions', vues.questions()];
      case 'question': return ['question', '#/questions', vues.question(h[1], h[2])];
      case 'mots': return ['mots', '#/mots', vues.mots()];
      case 'sources': return ['sources', '#/sources', vues.sources()];
      case 'oraux': return ['oraux', '#/plus', vues.oraux()];
      case 'hauts-faits': return ['hf', '#/plus', vues.hf()];
      case 'aide': return ['aide', '#/plus', h[1] === 'exemple' ? vues.exemple() : vues.aide(h[1])];
      case 'comprendre': return ['comprendre', '#/plus', vues.comprendre(h[1])];
      case 'conseils': return ['conseils', '#/plus', vues.conseils(h[1])];
      case 'reglages': return ['reglages', '#/plus', vues.reglages()];
      case 'plus': return ['plus', '#/plus', vues.plus()];
      case 'ton-code': return ['ton-code', '#/', vues.tonCode()];
      case 'retours': return ['retours', '#/plus', vues.retours()];
      case 'a-part': return ['a-part', '#/', vues.aPart()];
      default: return ['accueil', '#/', vues.accueil()];
    }
  }
  // Le lien de classe : le nom de la classe et de l'enseignant·e, demandés une fois par code.
  let infoClasse = null;
  const lireCodeClasse = (c) => String(c || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8);
  function chercherClasse(brut) {
    const code = lireCodeClasse(brut);
    if (EL.session() || (infoClasse && infoClasse.code === code)) return;
    infoClasse = { code: code, attente: true };
    if (code.length !== 4) { infoClasse = { code: code, erreur: 'Ce code de classe n’existe pas : il a 4 lettres. Vérifie le lien donné par ton enseignant·e.' }; return; }
    EL.rpc('go_classe_par_code', { p_code_classe: code }).then((r) => {
      infoClasse = r && r.ok ? { code: code, classe: r.classe, enseignant: r.enseignant, ouverte: r.ouverte } : { code: code, erreur: (r && r.message) || 'Ce code de classe n’existe pas.' };
    }, (x) => { infoClasse = { code: code, erreur: x.reseau ? 'Pas de réseau : reconnecte-toi, puis recharge la page.' : 'La classe n’a pas pu être trouvée. Réessaie dans un moment.' }; })
      .then(() => { if (location.hash.startsWith('#/classe/')) rendre(); });
  }
  function rendre(garderDefilement) {
    const y = window.scrollY, r = route(), main = $('#vue');
    main.innerHTML = r[2]; main.dataset.vue = r[0];
    $('#nav').hidden = !d.profil.vu || r[0] === 'prof';
    document.body.classList.toggle('espace-prof', r[0] === 'prof');
    $('#nav').innerHTML = NAV.map((n) => `<a href="${n[0]}"${n[0] === r[1] ? ' aria-current="page"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${n[2]}"/></svg><span>${n[1]}</span></a>`).join('');
    main.querySelectorAll('textarea').forEach(ajuster);
    main.querySelectorAll('[data-points]').forEach((ul) => { if (window.Sortable) window.Sortable.create(ul, { group: 'pts', handle: '.grip', animation: 150, onEnd: finGlisser }); });
    if (garderDefilement !== false) window.scrollTo(0, y);
    montrerEtat(etat);
    // Les retours affichés sur leur page sont lus (la mention « Nouveau » reste jusqu'à la page suivante).
    if (r[0] === 'retours' && nonLus().length) { const su = d.suivi = d.suivi || {}; su.lus = su.lus || {}; nonLus().forEach((x) => { su.lus[x.id] = 1; }); enregistrer(true); }
  }
  function ajuster(t) { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }
  // Téléphone tourné, fenêtre réduite : les zones de texte reprennent leur hauteur (sinon la fin d'un point est cachée).
  let retaille = null;
  window.addEventListener('resize', () => { clearTimeout(retaille); retaille = setTimeout(() => document.querySelectorAll('#vue textarea').forEach(ajuster), 150); });
  function rafraichir() {
    document.querySelectorAll('[data-zone]').forEach((z) => {
      const m = z.dataset.m && d.mots.find((x) => x.id === z.dataset.m);
      if (z.dataset.zone === 'coach') { const q = laQuestion(z.dataset.q); if (q) z.innerHTML = zoneCoach(q); }
      else if (z.dataset.zone === 'mot' && m) z.innerHTML = zoneMot(m);
      else if (z.dataset.zone === 'etat-mot' && m) { z.textContent = A.motComplet(m) ? 'Complet' : 'À compléter'; z.className = 'badge ' + (A.motComplet(m) ? 'validee' : 'brouillon'); }
      else if (z.dataset.zone === 'sources') z.innerHTML = zoneSources();
    });
  }
  function finGlisser(ev) {
    const q = laQuestion((location.hash.split('/')[2])); if (!q) return;
    const tous = {}; q.parties.forEach((p) => p.points.forEach((x) => { tous[x.id] = x; }));
    q.parties.forEach((p) => { const ul = $('[data-points="' + p.id + '"]'); if (ul) p.points = [...ul.children].map((li) => tous[li.dataset.id]).filter(Boolean); });
    if (ev.from !== ev.to) { d.compteurs.deplacements = (d.compteurs.deplacements || 0) + 1; }
    enregistrer(true); rendre();
  }

  // ---------- Les champs ----------
  function cible(f) {
    const p = f.split('.');
    switch (p[0]) {
      case 'profil': return [d.profil, p[1]];
      case 'interets': case 'ponts': return [d[p[0]], +p[1]];
      case 'mots': case 'sources': return [d[p[0]].find((x) => x.id === p[1]), p[2]];
      case 'oral': return [d.oraux.find((x) => x.id === p[1]), p[2]];
      case 'q': return [laQuestion(p[1]), p[2]];
      case 'partie': { const q = laQuestion(p[1]); return [q && q.parties.find((x) => x.id === p[2]), p[3]]; }
      case 'pt': { const q = laQuestion(p[1]); return [q && lePoint(q, p[2]), p[3]]; }
      case 'ech': { const q = laQuestion(p[1]); return [q && q.echange.find((x) => x.id === p[2]), p[3]]; }
      case 'piste': { const x = d.pistes.find((y) => y.id === p[1]); return p.length === 4 ? [x && x[p[2]], +p[3]] : [x, p[2]]; }
      case 'cv': { if (!A.laVideo(p[1]) || ['retiens', 'intrigue'].indexOf(p[2]) < 0) return [null, null]; const c = cult(); c.videos[p[1]] = c.videos[p[1]] || {}; return [c.videos[p[1]], p[2]]; }
    }
    return [null, null];
  }
  document.addEventListener('input', (ev) => {
    const t = ev.target;
    if (t.tagName === 'TEXTAREA') ajuster(t);
    if (t.dataset.f) { const c = cible(t.dataset.f); if (c[0]) { c[0][c[1]] = t.value; enregistrer(); } }
    if (t.id === 'recherche') { const v = t.value.trim().toLowerCase(); document.querySelectorAll('.sujet').forEach((li) => { li.hidden = v && !li.textContent.toLowerCase().includes(v); });
      document.querySelectorAll('.theme').forEach((s) => { s.hidden = ![...s.querySelectorAll('.sujet')].some((li) => !li.hidden); }); }
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.dataset.quiz) { const q = D.QUIZ.find((x) => x.id === t.dataset.quiz), r = d.quiz.reponses;
      if (q.multi) { r[q.id] = (r[q.id] || []).filter((v) => v !== t.value); if (t.checked) r[q.id].push(t.value); } else r[q.id] = t.value;
      // La spécialité change les réponses de la question suivante : la page est refaite, mais le focus reste sur la spécialité
      // choisie (les flèches parcourent toujours la liste ; pas de changement de contexte à la saisie).
      if (q.id === 'spe') { r.dansspe = []; enregistrer(true); rendre(); const s2 = [...document.querySelectorAll('[name="quiz-spe"]')].find((x) => x.value === t.value); if (s2) s2.focus(); return; }
      enregistrer(); return; }
    if (t.name === 'quiz-rep' && quizEnCours) { quizEnCours.choix = +t.value; return; }
    if (t.dataset.grille) { const o = d.oraux.find((x) => x.id === t.dataset.grille); o.auto = o.auto || {}; o.auto[t.dataset.c] = +t.value; enregistrer(true); rendre(); return; }
    if (t.dataset.coche) { const c = cible(t.dataset.coche); c[0][c[1]] = t.checked; enregistrer(true); return; }
    if (t.id === 'filtre-videos') { filtreVideos = t.value; rendre(); const f = $('#filtre-videos'); if (f) f.focus(); return; }
    if (t.id === 'import' && t.files[0]) { t.files[0].text().then((txt) => {
      // Rien ne change tant que le fichier n'est pas reconnu ; s'il ne s'affiche pas, l'ancien dossier revient.
      let n = null; try { n = JSON.parse(txt); } catch (x) { /* fichier illisible */ }
      if (!A.dossierValide(n)) return toast('Ce fichier n’est pas un dossier Hello GO.');
      const avant = JSON.stringify(d);
      try { d = Object.assign(dossierNeuf(), n); d.profil.vu = true; enregistrer(true); location.hash = '#/'; rendre(); }
      catch (x) { d = JSON.parse(avant); enregistrer(true); rendre(); return toast('Ce fichier n’est pas un dossier Hello GO.'); }
      toast('Dossier importé.', null, 'Annuler', () => { d = JSON.parse(avant); enregistrer(true); rendre(); }); }); return; }
    if (t.dataset.f) { enregistrer(true); rafraichir(); }
  });
  document.addEventListener('keydown', (ev) => {
    const t = ev.target;
    if (t.classList && t.classList.contains('texte-pt') && ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) {
      ev.preventDefault(); const p = t.dataset.f.split('.'), q = laQuestion(p[1]);
      for (const partie of q.parties) { const i = partie.points.findIndex((x) => x.id === p[2]); if (i >= 0) { const n = point(); partie.points.splice(i + 1, 0, n); enregistrer(true); rendre(); focusPoint(n.id); break; } }
    }
    if (salveInfox && !salveInfox.fini && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') && $('#vue').dataset.vue === 'infox' && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !$('#dialogue').open && !ev.altKey && !ev.ctrlKey && !ev.metaKey) {
      if (salveInfox.reponses[salveInfox.i] === undefined) { ev.preventDefault(); repondreInfox(ev.key === 'ArrowRight'); }
    }
    if (typeof ev.key === 'string') konami(ev.key); // la saisie automatique envoie des touches sans nom
  });
  // Sur téléphone, « Info ou infox ? » se joue aussi en glissant la carte (à droite : info, à gauche : infox) ; jamais obligatoire.
  let glisse = null;
  document.addEventListener('touchstart', (ev) => { const c = ev.target.closest && ev.target.closest('.infox-carte.a-glisser');
    glisse = c && ev.touches.length === 1 && !ev.target.closest('button') ? { x: ev.touches[0].clientX, y: ev.touches[0].clientY } : null; }, { passive: true });
  document.addEventListener('touchend', (ev) => { if (!glisse) return; const t = ev.changedTouches[0], dx = t.clientX - glisse.x, dy = t.clientY - glisse.y; glisse = null;
    if (Math.abs(dx) > 80 && Math.abs(dy) < 60) repondreInfox(dx > 0); }, { passive: true });
  function focusPoint(id) { const t = $('[data-id="' + id + '"] textarea'); if (t) t.focus(); }
  // La carte suivante (ou le bilan) remplace la précédente : le focus va à son titre, pour que le clavier reste dans la carte
  // et que les lecteurs d'écran la lisent (le bouton pressé n'existe plus).
  function focusCarte() { const t = $('.decouverte h2, .action .gros'); if (t) { t.tabIndex = -1; t.focus({ preventScroll: true }); t.scrollIntoView({ block: 'center' }); } }
  const SUITE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']; let rang = 0;
  function konami(k) { rang = (k === SUITE[rang] || k.toLowerCase() === SUITE[rang]) ? rang + 1 : (k === SUITE[0] ? 1 : 0); if (rang === SUITE.length) { rang = 0; secret(); } }
  function secret() { d.compteurs.secret = 1; enregistrer(true); document.body.classList.add('fete'); setTimeout(() => document.body.classList.remove('fete'), 3000); }
  let touches = 0, dernier = 0;

  // ---------- Les actions ----------
  const actions = {
    demarrer() { d.profil.prenom = ($('#prenom').value || '').trim().slice(0, 24); d.profil.vu = true; noterVisite(); enregistrer(true); location.hash = '#/'; rendre(false); },
    'autre-savoir'() { d.vus.decalage = (d.vus.decalage || 0) + 1; enregistrer(); rendre(); },
    reagir(b) { d.decouverte.reactions[b.dataset.n] = +b.dataset.v; delete d.vus.suite; enregistrer(true); rendre(false); focusCarte(); },
    'suite-cartes'() { d.vus.suite = 1; enregistrer(); rendre(false); focusCarte(); },
    'recommencer-cartes'() { avecAnnulation('Tes avis sur les cartes sont effacés.', () => { d.decouverte.reactions = {}; delete d.vus.suite; }); },
    'quiz-fini'() { d.quiz.fait = true; enregistrer(true); rendre(); const r = $('#resultats'); if (r) r.scrollIntoView({ behavior: 'smooth' }); },
    garder(b) { d.pistes.push({ id: uid(), titre: b.dataset.t, pourquoi: '', idees: [''], candidates: [''] }); enregistrer(true); rendre(); toast('Ajouté à tes pistes.', '#/explorer/pistes', 'Ouvrir'); },
    'piste-libre'() { const v = $('#piste-libre').value.trim(); if (!v) return toast('Écris d’abord ton idée.'); d.pistes.push({ id: uid(), titre: v, pourquoi: '', idees: [''], candidates: [''] }); enregistrer(true); location.hash = '#/explorer/pistes'; },
    'plus-pont'() { d.ponts.push(''); enregistrer(); rendre(); },
    'plus-liste'(b) { const p = d.pistes.find((x) => x.id === b.dataset.p); (p[b.dataset.l] = p[b.dataset.l] || []).push(''); enregistrer(); rendre(); },
    'suppr-liste'(b) { const p = d.pistes.find((x) => x.id === b.dataset.p); avecAnnulation('Supprimé.', () => p[b.dataset.l].splice(+b.dataset.i, 1)); },
    'suppr-piste'(b) { avecAnnulation('Piste supprimée.', () => { d.pistes = d.pistes.filter((x) => x.id !== b.dataset.p); }); },
    choisir(b) { const p = d.pistes.find((x) => x.id === b.dataset.p), t = (p.candidates[+b.dataset.i] || '').trim();
      if (!t) return toast('Écris d’abord ta question.'); if (d.questions.length >= 2) return toast('Tu as déjà deux questions. Supprime-en une pour en choisir une autre.');
      const q = nouvelleQuestion(t, p.idees); enregistrer(true); location.hash = '#/question/' + q.id; },
    'question-libre'() { const t = $('#question-libre').value.trim(); if (!t) return toast('Écris d’abord ta question.'); const q = nouvelleQuestion(t); enregistrer(true); location.hash = '#/question/' + q.id; },
    statut(b) { laQuestion(b.dataset.q).statut = b.dataset.s; enregistrer(true); rendre(); },
    'plus-pt'(b) { const q = laQuestion(b.dataset.q), n = point(); q.parties.find((x) => x.id === b.dataset.partie).points.push(n); enregistrer(true); rendre(); focusPoint(n.id); },
    'suppr-pt'(b) { const q = laQuestion(b.dataset.q); avecAnnulation('Point supprimé.', () => q.parties.forEach((p) => { p.points = p.points.filter((x) => x.id !== b.dataset.p); })); },
    monter(b) { bouger(b, -1); }, descendre(b) { bouger(b, 1); },
    'plus-axe'(b) { const q = laQuestion(b.dataset.q), n = q.parties.filter((p) => /axe/i.test(p.titre)).length; q.parties.splice(q.parties.length - 1, 0, { id: uid(), titre: 'Axe ' + (n + 1), minutes: 2, points: [] }); enregistrer(true); rendre(); },
    'suppr-question'(b) { avecAnnulation('Question supprimée.', () => { d.questions = d.questions.filter((x) => x.id !== b.dataset.q); location.hash = '#/questions'; }); },
    'plus-ech'(b) { const v = $('#ech-libre').value.trim(); if (!v) return toast('Écris d’abord la question.'); laQuestion(b.dataset.q).echange.push({ id: uid(), question: v, reponse: '' }); enregistrer(true); rendre(); },
    'garder-ech'(b) { laQuestion(b.dataset.q).echange.push({ id: uid(), question: b.dataset.t, reponse: '' }); enregistrer(true); rendre(); },
    'suppr-ech'(b) { const q = laQuestion(b.dataset.q); avecAnnulation('Question supprimée.', () => { q.echange = q.echange.filter((x) => x.id !== b.dataset.e); }); },
    'plus-mot'() { const m = { id: uid(), mot: '', defSource: '', sourceTexte: '', defMoi: '', analogie: '' }; d.mots.push(m); enregistrer(true); rendre(); const t = $('[data-f="mots.' + m.id + '.mot"]'); if (t) t.focus(); },
    'suppr-mot'(b) { avecAnnulation('Mot supprimé.', () => { d.mots = d.mots.filter((x) => x.id !== b.dataset.m); nettoyerLiens(); }); },
    'plus-source'() { const s = { id: uid(), titre: '', auteur: '', lien: '', type: '', date: '', retiens: '' }; d.sources.push(s); enregistrer(true); rendre(); const t = $('[data-f="sources.' + s.id + '.titre"]'); if (t) t.focus(); },
    'suppr-source'(b) { avecAnnulation('Source supprimée.', () => { d.sources = d.sources.filter((x) => x.id !== b.dataset.s); nettoyerLiens(); }); },
    'plus-oral'() { d.oraux.push({ id: uid(), nom: 'Vidéo d’entraînement', auto: {} }); enregistrer(true); rendre(); },
    'suppr-oral'(b) { avecAnnulation('Supprimé.', () => { d.oraux = d.oraux.filter((x) => x.id !== b.dataset.o); }); },
    lier(b) { ouvrirLiens(b.dataset.q, b.dataset.p, b.dataset.t); },
    'fermer-dialogue'() { $('#dialogue').close('annuler'); },
    pdf(b) { faireLePdf(laQuestion(b.dataset.q), b); },
    markdown() { ecrire(); const avec = !!($('#md-retours') && $('#md-retours').checked);
      const t = window.HGExport.dossier(d, { retours: retoursProf, avecRetours: avec });
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/markdown;charset=utf-8' }));
      a.download = 'hello-go-' + nomDeFichier(d.profil.prenom || 'dossier') + '-' + new Date().toISOString().slice(0, 10) + '.md'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000); toast('Ton dossier en Markdown est téléchargé.'); },
    exporter() { ecrire(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 1)], { type: 'application/json' }));
      a.download = 'hello-go-' + nomDeFichier(d.profil.prenom || 'dossier') + '-' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); },
    effacer() { if ($('#confirmer').value.trim() !== 'EFFACER') return toast('Écris EFFACER dans la case pour confirmer.'); d = dossierNeuf(); ecrire(); location.hash = '#/'; rendre(false); },
    'aller-classe'() { const c = lireCodeClasse($('#code-classe').value); if (!c) return toast('Écris le code de classe donné par ton enseignant·e.'); location.hash = '#/classe/' + c; },
    inscription(b) {
      const pseudo = ($('#pseudo').value || '').trim().replace(/\s+/g, ' '), envoyerLocal = !!($('#envoyer-local') && $('#envoyer-local').checked), c = infoClasse;
      if (pseudo.length < 2) return toast('Écris ton prénom et l’initiale de ton nom, par exemple « Inès B. ».');
      const mots = pseudo.split(' ');
      if (mots.length > 1 && mots[mots.length - 1].replace('.', '').length > 2) return toast('Seulement ton prénom et l’initiale de ton nom, par exemple « Inès B. » : jamais ton nom complet.');
      b.disabled = true;
      EL.rpc('go_inscription', { p_code_classe: c.code, p_pseudo: pseudo }).then((r) => {
        b.disabled = false;
        if (!r || !r.ok) return toast((r && r.message) || 'L’inscription n’a pas pu se faire.');
        entrerAvec(r, envoyerLocal, true); location.hash = '#/ton-code';
      }, (x) => { b.disabled = false; toast(x.reseau ? 'Pas de réseau : reconnecte-toi, puis réessaie.' : 'L’inscription n’a pas pu se faire. Réessaie dans un moment.'); });
    },
    connexion(b) {
      const code = R.lireCode($('#code-eleve').value), envoyerLocal = !!($('#envoyer-local') && $('#envoyer-local').checked);
      if (code.replace(/-/g, '').length < 6) return toast('Écris ton code : 2 mots et 3 chiffres.');
      const entrer = () => {
        b.disabled = true;
        EL.rpc('go_connexion', { p_code: code }).then((r) => {
          b.disabled = false;
          if (!r || !r.ok) return toast((r && r.message) || 'Ce code n’a pas marché.');
          const meme = EL.session() && EL.session().code === r.code_affiche;
          entrerAvec(r, envoyerLocal || meme, meme); location.hash = '#/'; reprendre();
        }, (x) => { b.disabled = false; toast(x.reseau ? 'Pas de réseau : reconnecte-toi, puis réessaie.' : 'L’entrée n’a pas pu se faire. Réessaie dans un moment.'); });
      };
      // Un autre code que celui de cet appareil : ce qui n'est pas encore en ligne (travail pas encore envoyé, saisie mise
      // de côté) serait effacé de l'appareil. On essaie d'abord d'envoyer ; s'il reste quelque chose, l'élève décide.
      const avant = EL.session();
      if (avant && avant.code !== code) {
        if (enAttente) ecrire();
        return envoyer().then(() => {
          const s2 = EL.session(); let aPart = null; try { aPart = localStorage.getItem(CLE_APART); } catch (x) { /* rien */ }
          if (((s2 && s2.attente) || aPart) && !window.confirm('Une partie du travail de cet appareil n’est pas encore en ligne (travail pas encore envoyé, ou saisie mise de côté). Avec un autre code, elle sera effacée de cet appareil. Pour la garder, annule, puis télécharge ton dossier dans les réglages. Continuer quand même ?')) return;
          entrer();
        });
      }
      entrer();
    },
    'voir-code'(b) { const z = $('#mon-code'); z.hidden = !z.hidden; b.textContent = z.hidden ? 'Voir mon code' : 'Cacher mon code'; },
    deconnexion() {
      const s = EL.session(); if (!s) return;
      const fin = () => { EL.fermerSession(); try { localStorage.removeItem(CLE); localStorage.removeItem(CLE_APART); localStorage.removeItem(CLE_BASE); } catch (x) { /* rien */ }
        d = dossierNeuf(); retoursProf = R.vides(); sessionExpiree = false; etat = ''; location.hash = '#/'; rendre(false); toast('Tu as quitté cet appareil. Ton dossier t’attend en ligne.'); };
      const partir = () => EL.rpc('go_deconnexion', { p_jeton: s.jeton }).then(fin, fin);
      if (s.attente || enAttente) {
        ecrire(); return envoyer().then(() => { const s2 = EL.session(); if (s2 && s2.attente) { if (window.confirm('Ton dernier travail n’est pas encore envoyé (pas de réseau). Si tu quittes cet appareil maintenant, il sera perdu. Quitter quand même ?')) partir(); } else partir(); });
      }
      partir();
    },
    'ressource-ajouter'(b) { const x = retoursProf.items.find((y) => y.id === b.dataset.r); if (!x) return;
      d.sources.push({ id: uid(), titre: x.titre || '', auteur: '', lien: R.lienSur(x.url) ? x.url : '', type: '', date: '', retiens: '' });
      const su = d.suivi = d.suivi || {}; su.ressources = su.ressources || {}; su.ressources[x.id] = 'ajoutee'; enregistrer(true); rendre(); toast('Ajoutée à tes sources : note ce que tu en retiens.'); },
    'ressource-plus-tard'(b) { const su = d.suivi = d.suivi || {}; su.ressources = su.ressources || {}; su.ressources[b.dataset.r] = 'plus-tard'; enregistrer(true); rendre(); },
    'effacer-a-part'() { try { localStorage.removeItem(CLE_APART); } catch (x) { /* rien */ } location.hash = '#/'; },
    'quiz-commencer'(b) { const z = leQuiz(b.dataset.q), ids = A.tirerSalve(d, z); quizEnCours = { id: z.id, ids: ids, i: 0, choix: null, reponses: [], ordres: ids.map(() => melanger(4)), fini: false };
      rendre(false); focusQuiz('#quiz-question'); },
    'quiz-valider'() { const Q = quizEnCours; if (!Q) return; if (Q.choix === null) return toast('Choisis d’abord une réponse.');
      Q.reponses[Q.i] = Q.choix; rendre(); focusQuiz('#quiz-retour'); },
    'quiz-suivant'() { const Q = quizEnCours, z = Q && leQuiz(Q.id); if (!z) return;
      Q.i++; Q.choix = null;
      const qs = questionsDe(Q, z);
      if (Q.i < qs.length) { rendre(false); focusQuiz('#quiz-question'); return; }
      Q.fini = true;
      A.noterSalve(d, z, qs.map((q) => q.id), qs.map((q, i) => Q.reponses[i] === q.b));
      enregistrer(true); rendre(false); focusQuiz('#quiz-fin .score'); },
    // La culture (version 1.6.0)
    'video-vue'(b) { const c = cult(), id = b.dataset.v; if (!A.laVideo(id)) return; c.videos[id] = Object.assign({ retiens: '', intrigue: '' }, c.videos[id], { vue: aujourdhui() });
      if (c.videos[id].avis === -1) c.videos[id].avis = 0; enregistrer(true); rendre(); const z = $('[data-f="cv.' + id + '.retiens"]'); if (z) z.focus(); },
    'video-non'(b) { const c = cult(), id = b.dataset.v; if (!A.laVideo(id)) return; c.videos[id] = Object.assign({}, c.videos[id], { avis: -1 }); enregistrer(true); rendre();
      toast('C’est noté : les suggestions s’en souviendront.'); },
    'video-oui'(b) { const c = cult(), id = b.dataset.v; if (!c.videos[id]) return; c.videos[id].avis = 0; enregistrer(true); rendre(); },
    'video-piste'(b) { const v = A.laVideo(b.dataset.v), c = cult(); if (!v) return; const s = c.videos[v.id] = c.videos[v.id] || {};
      const pi = { id: uid(), titre: v.question, pourquoi: (s.intrigue || '').trim(), idees: [(s.retiens || '').trim()], candidates: [v.question] }; d.pistes.push(pi); s.piste = pi.id;
      enregistrer(true); rendre(); toast('Ta piste est prête, avec la question que la vidéo inspire.', '#/explorer/pistes', 'Ouvrir'); },
    'video-source'(b) { const v = A.laVideo(b.dataset.v), c = cult(); if (!v) return; const s = c.videos[v.id] = c.videos[v.id] || {};
      const so = { id: uid(), titre: v.titre, auteur: v.chaine, lien: v.url, type: 'vulgarisee', date: '', retiens: (s.retiens || '').trim() }; d.sources.push(so); s.source = so.id;
      enregistrer(true); rendre(); toast('Ajoutée à tes sources.', '#/sources', 'Ouvrir'); },
    'video-autre'() { decalageVideo++; rendre(); const t = $('.video-accueil .gros a'); if (t) t.focus(); },
    'videos-autres'() { decalageTrois++; rendre(); },
    'infox-jour'(b) { const c = cult(), j = c.jour && A.lInfox(c.jour.id); if (!j) return; A.noterInfox(d, j.id, (b.dataset.r === '1') === j.vrai); enregistrer(true); rendre(); },
    'infox-commencer'() { salveInfox = { ids: A.tirerInfox(d), i: 0, reponses: [], fini: false }; rendre(false); focusQuiz('#infox-affirmation'); },
    'infox-repondre'(b) { repondreInfox(b.dataset.r === '1'); },
    'infox-suivante'() { const S = salveInfox; if (!S) return; S.i++;
      if (S.i < S.ids.length) { rendre(false); focusQuiz('#infox-affirmation'); return; }
      S.fini = true; A.noterSalveInfox(d, S.reponses.filter((r, i) => r === A.lInfox(S.ids[i]).vrai).length, S.ids.length); enregistrer(true); rendre(false); focusQuiz('#infox-fin .score'); },
    'infox-quitter'() { salveInfox = null; rendre(false); },
    'infox-garder'(b) { if (A.garderAccroche(d, b.dataset.x)) { enregistrer(true); rendre(); toast('Gardée dans « Mes accroches ».', '#/explorer/infox', 'Voir'); } },
    'accroche-retirer'(b) { const id = b.dataset.x; avecAnnulation('Retirée de tes accroches.', () => { delete cult().accroches[id]; }); },
    'accroche-ajouter'(b) { const pt = ajouterAccroche(b.dataset.x, b.dataset.q); if (!pt) return; rendre(); toast('Ajoutée au début de ton introduction : reformule-la à ta façon.', '#/question/' + b.dataset.q, 'Voir'); },
    piocher(b) { ouvrirPioche(b.dataset.q); },
    'accroche-piocher'(b) { const pt = ajouterAccroche(b.dataset.x, b.dataset.q); $('#dialogue').close('annuler'); if (!pt) return; rendre(); focusPoint(pt.id); toast('Accroche ajoutée, avec sa source : reformule-la à ta façon.'); },
    logo() { const t = Date.now(); touches = t - dernier < 600 ? touches + 1 : 1; dernier = t; if (touches >= 7) { touches = 0; secret(); } },
  };
  // Après l'inscription ou l'entrée avec un code : la session de cet appareil. Le dossier déjà commencé ici part avec
  // (s'il est demandé) ; sinon il est remplacé par celui du compte, et ce qui était écrit ici reste lisible à part.
  function entrerAvec(r, garderLocal, neuf) {
    const avant = EL.session();
    EL.ouvrirSession({ jeton: r.jeton, pseudo: r.pseudo, code: r.code_affiche, classe: r.classe, enseignant: r.enseignant,
      version: avant && avant.code === r.code_affiche ? avant.version : 0, attente: !!(garderLocal && dossierRempli()) || !!(avant && avant.code === r.code_affiche && avant.attente), retoursVersion: null });
    // Un autre compte que celui de cet appareil : rien de l'ancien compte ne reste lisible (pas même sa saisie mise de côté).
    if (avant && avant.code !== r.code_affiche) { try { localStorage.removeItem(CLE_APART); } catch (x) { /* rien */ } }
    else if (!garderLocal && dossierRempli()) { const t = R.textesAbsents(d, {}); if (t.length) mettreDeCote(t); }
    if (!garderLocal) d = dossierNeuf();
    if (neuf || !d.profil.prenom) d.profil.prenom = r.pseudo;
    d.profil.vu = true; noterVisite(); sessionExpiree = false; retoursProf = R.vides(); EL.garderRetours(null);
    if (!(avant && avant.code === r.code_affiche)) garderBase(null);
    ecrire(true); if (EL.session().attente) envoyer();
  }
  function bouger(b, sens) {
    const q = laQuestion(b.dataset.q);
    for (let i = 0; i < q.parties.length; i++) { const l = q.parties[i].points, j = l.findIndex((x) => x.id === b.dataset.p); if (j < 0) continue;
      const x = l.splice(j, 1)[0];
      if (j + sens >= 0 && j + sens <= l.length) l.splice(j + sens, 0, x);
      else if (q.parties[i + sens]) { if (sens < 0) q.parties[i + sens].points.push(x); else q.parties[i + sens].points.unshift(x); d.compteurs.deplacements = (d.compteurs.deplacements || 0) + 1; }
      else l.splice(j, 0, x);
      break; }
    enregistrer(true); rendre(); const t = $('[data-id="' + b.dataset.p + '"] [data-a="' + (sens < 0 ? 'monter' : 'descendre') + '"]'); if (t) t.focus();
  }
  function nettoyerLiens() {
    const m = new Set(d.mots.map((x) => x.id)), s = new Set(d.sources.map((x) => x.id));
    d.questions.forEach((q) => A.tousLesPoints(q).forEach((p) => { p.mots = (p.mots || []).filter((i) => m.has(i)); p.sources = (p.sources || []).filter((i) => s.has(i)); }));
  }
  document.addEventListener('click', (ev) => {
    // Le lien d'évitement mène au contenu de la page affichée, sans changer d'adresse (« #vue » n'est pas une page).
    if (ev.target.closest('.evitement')) { ev.preventDefault(); $('#vue').focus(); return; }
    const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return;
    const f = actions[b.dataset.a]; if (f) f(b);
  });
  document.addEventListener('toggle', (ev) => { if (ev.target.dataset && ev.target.dataset.fiche === 'canard' && ev.target.open) { d.compteurs.canard = 1; enregistrer(true); } }, true);

  // ---------- Relier un point à des mots ou à des sources ----------
  function ouvrirLiens(qid, pid, type) {
    const q = laQuestion(qid), p = lePoint(q, pid), dlg = $('#dialogue'), estMot = type === 'mots', liste = d[type];
    dlg.innerHTML = `<form method="dialog"><h2 id="titre-dialogue">${estMot ? 'Les mots de ce point' : 'Les sources de ce point'}</h2>
      ${liste.length ? `<div class="choix">${liste.map((x) => `<label class="niveau"><input type="checkbox" value="${x.id}"${(p[type] || []).includes(x.id) ? ' checked' : ''}><span>${e((estMot ? x.mot : x.titre) || '(sans nom)')}</span></label>`).join('')}</div>` : `<p class="note">${estMot ? 'Tu n’as pas encore de mot.' : 'Tu n’as pas encore de source.'}</p>`}
      <label>${estMot ? 'Un nouveau mot' : 'Une nouvelle source (son titre)'}<input type="text" id="nouveau-lien" autocomplete="off"></label>
      <p class="bas"><button type="button" data-a="fermer-dialogue">Annuler</button><button class="principal" value="ok">Valider</button></p></form>`;
    dlg.onclose = () => {
      if (dlg.returnValue !== 'ok') return;
      p[type] = [...dlg.querySelectorAll('input[type=checkbox]:checked')].map((c) => c.value);
      const v = $('#nouveau-lien', dlg).value.trim();
      if (v) { const n = estMot ? { id: uid(), mot: v, defSource: '', sourceTexte: '', defMoi: '', analogie: '' } : { id: uid(), titre: v, auteur: '', lien: '', type: '', date: '', retiens: '' }; liste.push(n); p[type].push(n.id);
        toast(estMot ? 'Mot ajouté : pense à le définir.' : 'Source ajoutée : pense à la compléter.', estMot ? '#/mots' : '#/sources', 'Ouvrir'); }
      enregistrer(true); rendre();
    };
    // Entrée valide (Valider est le seul bouton d'envoi) ; Échap annule, même après une validation précédente.
    dlg.returnValue = ''; dlg.setAttribute('aria-labelledby', 'titre-dialogue');
    dlg.showModal();
  }

  // ---------- Le PDF : le plan, puis le lexique, puis les sources ----------
  function charger_script(src) { return new Promise((ok, non) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => non(new Error(src)); document.head.appendChild(s); }); }
  function contenuPdf(q, autre) {
    const dd = autre || d;
    const mots = [], sources = [];
    const numero = (liste, id) => { let i = liste.indexOf(id); if (i < 0) { liste.push(id); i = liste.length - 1; } return i + 1; };
    const corps = [{ text: 'Grand oral de NSI' + (dd.profil.prenom ? ' · ' + dd.profil.prenom : ''), style: 'petit' }, { text: q.titre || 'Question sans titre', style: 'titre' }];
    q.parties.forEach((p) => {
      corps.push({ text: p.titre + (p.minutes ? '  (≈ ' + p.minutes + ' min)' : ''), style: 'partie' });
      if (!p.points.length) corps.push({ text: '(aucun point)', style: 'petit' });
      else corps.push({ ul: p.points.map((x) => { const et = (D.ETIQUETTES.find((t) => t[0] === x.etiquette) || [])[1];
        const refs = (x.mots || []).filter((i) => dd.mots.some((m) => m.id === i)).map((i) => 'M' + numero(mots, i)).concat((x.sources || []).filter((i) => dd.sources.some((s) => s.id === i)).map((i) => 'S' + numero(sources, i)));
        return { text: [x.etiquette ? { text: et + ' : ', bold: true } : '', x.texte || '(point vide)', refs.length ? { text: '  [' + refs.join(', ') + ']', style: 'ref' } : ''], margin: [0, 2, 0, 2] }; }) });
    });
    dd.mots.forEach((m) => numero(mots, m.id)); dd.sources.forEach((s) => numero(sources, s.id));
    corps.push({ text: 'Lexique', style: 'section', pageBreak: 'before' });
    if (!mots.length) corps.push({ text: 'Aucun mot défini.', style: 'petit' });
    mots.forEach((id, i) => { const m = dd.mots.find((x) => x.id === id);
      corps.push({ text: [{ text: 'M' + (i + 1) + '  ', style: 'ref' }, { text: m.mot || '(sans nom)', bold: true }], margin: [0, 8, 0, 2] });
      corps.push({ text: [{ text: 'Source : ', bold: true }, (m.defSource || '—') + (m.sourceTexte ? ' (' + m.sourceTexte + ')' : '')] });
      corps.push({ text: [{ text: 'Avec mes mots : ', bold: true }, m.defMoi || '—'] });
      if (m.analogie) corps.push({ text: [{ text: 'Image : ', bold: true }, m.analogie] }); });
    corps.push({ text: 'Sources', style: 'section', margin: [0, 18, 0, 6] });
    if (!sources.length) corps.push({ text: 'Aucune source.', style: 'petit' });
    sources.forEach((id, i) => { const s = dd.sources.find((x) => x.id === id), type = (D.TYPES_SOURCE.find((t) => t[0] === s.type && s.type) || [])[1];
      corps.push({ text: [{ text: 'S' + (i + 1) + '  ', style: 'ref' }, A.reference(s) || '(source sans titre)'], margin: [0, 6, 0, 1] });
      if (type || s.retiens) corps.push({ text: [type ? type + '. ' : '', s.retiens ? 'Ce que j’en retiens : ' + s.retiens : ''], style: 'petit' }); });
    return { pageSize: 'A4', pageMargins: [48, 48, 48, 54], content: corps, defaultStyle: { fontSize: 11, lineHeight: 1.25 },
      footer: (page, total) => ({ text: 'Hello GO · page ' + page + ' sur ' + total, alignment: 'center', fontSize: 8, margin: [0, 20, 0, 0] }),
      styles: { titre: { fontSize: 17, bold: true, margin: [0, 4, 0, 10] }, partie: { fontSize: 13, bold: true, margin: [0, 12, 0, 4] }, section: { fontSize: 15, bold: true, margin: [0, 0, 0, 6] }, petit: { fontSize: 9 }, ref: { fontSize: 8, bold: true } } };
  }
  window.HGContenuPdf = contenuPdf;
  function faireLePdf(q, bouton, autre) {
    bouton.disabled = true; const avant = bouton.textContent; bouton.textContent = 'Préparation…';
    const pret = window.pdfMake ? Promise.resolve() : charger_script('vendor/pdfmake.min.js').then(() => charger_script('vendor/vfs_fonts.js'));
    pret.then(() => { window.pdfMake.createPdf(contenuPdf(q, autre)).download('grand-oral-' + nomDeFichier(q.titre || 'plan').slice(0, 40) + '.pdf');
      if (!autre) { d.compteurs.pdf = (d.compteurs.pdf || 0) + 1; enregistrer(true); } })
      .catch(() => toast('Le PDF n’a pas pu être préparé. Vérifie ta connexion, puis réessaie.'))
      .then(() => { bouton.disabled = false; bouton.textContent = avant; });
  }

  // L'espace de l'enseignant·e (js/prof.js) se sert des mêmes outils : échappement, messages, PDF.
  window.HGOutils = { e, toast, rendre: () => rendre(), pdf: faireLePdf, nomDeFichier, uid };

  // ---------- Démarrage ----------
  // Une nouvelle page commence en haut, et le focus va à son contenu (clavier, lecteurs d'écran).
  // Une adresse vers une fiche ou une section (#/aide/<id>, liens « Revoir » des quiz) : elle est ouverte, montrée et prend le focus.
  window.addEventListener('hashchange', () => { rendre(false); window.scrollTo(0, 0); $('#vue').focus({ preventScroll: true });
    const c = $('#vue [data-cible]'); if (c) { const t = $('summary, h2', c); if (t) { t.tabIndex = t.tagName === 'SUMMARY' ? 0 : -1; t.focus({ preventScroll: true }); } c.scrollIntoView({ block: 'start' }); } });
  // Le jour de visite, pour l'historique que voit l'enseignant·e (d.visites, version 1.5.0) : noté à l'ouverture et au
  // retour sur la page (elle peut rester ouverte d'un jour à l'autre), jamais depuis l'espace de l'enseignant·e.
  function noterVisite() { return d.profil.vu && !/^#\/prof/.test(location.hash) && A.noterVisite(d); }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && window.HG_DEMARRE && noterVisite()) enregistrer(true); });
  // Un jour de travail de plus (sans jamais rien retirer : pas de série à tenir).
  // Un haut fait gagné au chargement (« Nage droit devant », au 5e jour) est annoncé comme les autres, et enregistré.
  try {
    const nouveauJour = (function () { const jour = Math.floor(Date.now() / 864e5); if (d.vus.jour !== jour) { d.vus.jour = jour; d.compteurs.jours = (d.compteurs.jours || 0) + 1; return true; } return false; })();
    const visite = noterVisite();
    const gagnes = A.majHautsFaits(d); rendre(false);
    window.HG_DEMARRE = true; try { sessionStorage.removeItem(CLE_REPARATION); } catch (x) { /* rien */ }
    if (d.profil.vu && (nouveauJour || visite || gagnes.length)) ecrire();
    if (d.profil.vu) gagnes.forEach((h) => toast('Haut fait débloqué : ' + h.titre, '#/hauts-faits', 'Voir'));
    if (EL.session()) { if (EL.session().attente) montrerEtat('attente'); reprendre().then(interroger); }
    if (!memoireOk) toast('Ce navigateur ne garde pas ton dossier.');
  } catch (x) {
    if (!window.HG_DEMARRE) panne(causeDe([]), [texteErreur(x)]);
  }
  try { if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (x) { /* pas de service worker ici */ }
})();
