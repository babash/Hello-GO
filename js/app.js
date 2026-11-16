// Hello GO : l'application. Le dossier est gardé sur l'appareil (localStorage) ; rien n'est envoyé.
(function () {
  'use strict';
  const D = window.HGDonnees, A = window.HGAnalyse;
  const CLE = 'hellogo:dossier:v1';
  const $ = (s, r) => (r || document).querySelector(s);
  const e = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');

  // ---------- Le dossier ----------
  function dossierNeuf() {
    return { v: 1, profil: { prenom: '', vu: false }, quiz: { reponses: {}, fait: false }, interets: ['', '', ''], ponts: [''], pistes: [], questions: [],
      mots: [], sources: [], oraux: [{ id: uid(), nom: 'Oral blanc 1', auto: {} }, { id: uid(), nom: 'Oral blanc 2', auto: {} }], hf: {}, compteurs: {}, vus: {} };
  }
  function charger() {
    try { const t = localStorage.getItem(CLE); if (t) { const d = JSON.parse(t); if (d && d.v === 1) return Object.assign(dossierNeuf(), d); } } catch (x) { /* dossier illisible : on repart d'un dossier neuf */ }
    return dossierNeuf();
  }
  let d = charger(), minuterie = null, memoireOk = true, annulation = null;
  function ecrire() {
    try { localStorage.setItem(CLE, JSON.stringify(d)); memoireOk = true; } catch (x) { memoireOk = false; toast('Impossible d’enregistrer sur cet appareil. Télécharge ton dossier dans « Plus », puis « Réglages ».'); }
  }
  function enregistrer(tout_de_suite) {
    clearTimeout(minuterie);
    if (tout_de_suite) ecrire(); else minuterie = setTimeout(ecrire, 400);
    const nouveaux = A.majHautsFaits(d);
    if (nouveaux.length) { ecrire(); nouveaux.forEach((h) => toast('Haut fait débloqué : ' + h.titre, '#/hauts-faits', 'Voir')); }
  }
  window.addEventListener('pagehide', ecrire);

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
    toast(texte, null, 'Annuler', () => { d = JSON.parse(avant); enregistrer(true); rendre(); });
  }
  const options = (liste, valeur) => liste.map((o) => '<option value="' + e(o[0]) + '"' + (o[0] === (valeur || '') ? ' selected' : '') + '>' + e(o[1]) + '</option>').join('');
  const champ = (f, valeur, attr) => '<input type="text" spellcheck="true" data-f="' + f + '" value="' + e(valeur) + '" ' + (attr || '') + '>';
  const zoneTexte = (f, valeur, attr) => '<textarea spellcheck="true" rows="1" data-f="' + f + '" ' + (attr || '') + '>' + e(valeur) + '</textarea>';
  const conseils = (liste) => liste.length ? '<ul class="conseils">' + liste.map((c) => '<li class="' + (c.niveau || 'info') + '">' + e(c.texte || c) + '</li>').join('') + '</ul>' : '';
  const aide = (texte) => '<details class="aide"><summary aria-label="Aide">?</summary><p>' + texte + '</p></details>';
  const exemple = '<a class="lien-exemple" href="#/aide/exemple">Voir un exemple</a>';

  // ---------- Les vues ----------
  const vues = {};

  vues.bienvenue = () => `
    <section class="carte bienvenue">
      <p class="logo-grand">Hello <b>GO</b></p>
      <h1>Prépare ton Grand oral de NSI, pas à pas</h1>
      <ol class="etapes">
        <li><b>Explore</b> : trouve un sujet qui te plaît, puis ta question.</li>
        <li><b>Construis</b> ton plan point par point, avec tes mots et tes sources.</li>
        <li><b>Prépare</b> l’échange avec le jury et tes oraux blancs.</li>
      </ol>
      <label>Ton prénom (ou un pseudo), jamais ton nom de famille
        <input type="text" id="prenom" maxlength="24" autocomplete="given-name" placeholder="Ton prénom"></label>
      <p class="note">Pour le moment, ton dossier est gardé <b>sur cet appareil seulement</b>, dans ce navigateur. Reviens toujours avec le même appareil, et télécharge ton dossier de temps en temps (« Plus », puis « Réglages »).</p>
      <button class="principal" data-a="demarrer">C’est parti</button>
    </section>`;

  vues.accueil = () => {
    const pa = A.prochaineAction(d), ph = A.phase(d);
    const liste = D.A_SAVOIR.filter((x) => x.p === ph);
    const jour = Math.floor(Date.now() / 864e5) + (d.vus.decalage || 0);
    const savoir = liste[jour % liste.length];
    const nPoints = d.questions.reduce((t, q) => t + A.tousLesPoints(q).length, 0);
    const nHf = Object.keys(d.hf).length;
    const debut = [['Faire le questionnaire', d.quiz.fait, '#/explorer/quiz'], ['Garder une piste', d.pistes.length > 0 || d.questions.length > 0, '#/explorer/sujets'],
      ['Choisir ma question', d.questions.length > 0, '#/explorer/pistes'], ['Écrire 5 points', nPoints >= 5, '#/questions'],
      ['Définir 3 mots', d.mots.filter(A.motComplet).length >= 3, '#/mots'], ['Ajouter 2 sources', d.sources.length >= 2, '#/sources']];
    return `
    <h1>Salut${d.profil.prenom ? ' ' + e(d.profil.prenom) : ''} !</h1>
    <section class="carte action">
      <p class="sur-titre">Ta prochaine étape · ${e(pa.duree)}</p>
      <p class="gros">${e(pa.texte)}</p>
      <a class="bouton principal" href="${pa.vers}">${e(pa.bouton)}</a>
    </section>
    <section class="carte savoir">
      <p class="sur-titre">À savoir aujourd’hui</p>
      <p class="gros">${e(savoir.t)}</p>
      <p><a href="#/aide">En savoir plus</a> · <button class="lien" data-a="autre-savoir">Un autre</button></p>
    </section>
    <section class="chiffres">
      <a href="#/questions"><b>${nPoints}</b> ${nPoints > 1 ? 'points' : 'point'}</a>
      <a href="#/mots"><b>${d.mots.length}</b> ${d.mots.length > 1 ? 'mots' : 'mot'}</a>
      <a href="#/sources"><b>${d.sources.length}</b> ${d.sources.length > 1 ? 'sources' : 'source'}</a>
      <a href="#/hauts-faits"><b>${nHf}</b> ${nHf > 1 ? 'hauts faits' : 'haut fait'}</a>
    </section>
    ${debut.every((x) => x[1]) ? '' : `<section class="carte"><h2>Par où commencer</h2><ul class="coches">${debut.map((x) => `<li class="${x[1] ? 'fait' : ''}"><a href="${x[2]}">${e(x[0])}</a></li>`).join('')}</ul></section>`}`;
  };

  function ongletsExplorer(actif) {
    return `<h1>Explorer</h1><nav class="onglets" aria-label="Explorer">${[['quiz', 'Questionnaire'], ['sujets', 'Sujets'], ['pistes', 'Mes pistes' + (d.pistes.length ? ' (' + d.pistes.length + ')' : '')]]
      .map((o) => `<a href="#/explorer/${o[0]}"${o[0] === actif ? ' aria-current="page"' : ''}>${o[1]}</a>`).join('')}</nav>`;
  }
  function carteSujet(s, raisons) {
    const deja = d.pistes.some((p) => p.titre === s.t);
    return `<li class="carte sujet"><p class="sur-titre">${e(s.th)}</p><p class="gros">${e(s.t)}</p>
      ${raisons && raisons.length ? `<p class="note">Parce que tu as choisi : ${e([...new Set(raisons)].join(', '))}.</p>` : ''}
      ${deja ? '<p class="fait-texte">Dans tes pistes</p>' : `<button data-a="garder" data-t="${e(s.t)}">Garder comme piste</button>`}</li>`;
  }
  vues.quiz = () => {
    const r = d.quiz.reponses, sug = d.quiz.fait ? A.suggestions(r, 5) : [];
    return ongletsExplorer('quiz') + `
    <p class="chapo">4 questions pour te proposer des sujets. Tu peux changer tes réponses quand tu veux.</p>
    ${D.QUIZ.map((q) => `<fieldset class="carte"><legend>${e(q.titre)}</legend><p class="note">${e(q.aide)}</p><div class="puces">${q.choix.map((c) => {
      const coche = q.multi ? (r[q.id] || []).includes(c[0]) : r[q.id] === c[0];
      return `<label class="puce"><input type="${q.multi ? 'checkbox' : 'radio'}" name="quiz-${q.id}" data-quiz="${q.id}" value="${c[0]}"${coche ? ' checked' : ''}><span>${e(c[1])}</span></label>`; }).join('')}</div></fieldset>`).join('')}
    <button class="principal" data-a="quiz-fini">Voir mes sujets</button>
    <div id="resultats">${d.quiz.fait ? `<h2>Des sujets pour toi</h2>${sug.length ? `<ul class="liste">${sug.map((x) => carteSujet(x.sujet, x.raisons)).join('')}</ul>` : '<p>Coche au moins une réponse pour avoir des propositions.</p>'}
      <p><a href="#/explorer/sujets">Voir tous les sujets</a></p>` : ''}</div>`;
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
    ${d.pistes.length ? '' : `<p class="vide">Tu n’as pas encore de piste. <a href="#/explorer/quiz">Fais le questionnaire</a> ou <a href="#/explorer/sujets">parcours les sujets</a>.</p>`}
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
      <p class="bas"><button class="discret danger" data-a="suppr-piste" data-p="${p.id}">Supprimer cette piste</button></p>
    </section>`).join('')}`;

  const STATUTS = { brouillon: 'Brouillon', proposee: 'Proposée à ton prof', validee: 'Validée par ton prof' };
  vues.questions = () => `
    <h1>Mes questions</h1>
    <p class="chapo">Tu peux préparer une ou deux questions qui touchent la NSI. Le jour J, le jury en choisit une.</p>
    ${d.questions.map((q) => { const n = A.tousLesPoints(q).length; return `<a class="carte lien-carte" href="#/question/${q.id}">
      <span class="badge ${q.statut}">${STATUTS[q.statut]}</span><p class="gros">${e(q.titre || 'Question sans titre')}</p>
      <p class="note">${pluriel(n, 'point')} · environ ${Math.round(n * A.SEC_PAR_POINT / 60)} min · ${pluriel((q.echange || []).length, 'question')} pour l’échange</p></a>`; }).join('')}
    ${d.questions.length < 2 ? `<section class="carte"><h2>${d.questions.length ? 'Une deuxième question' : 'Ma question'}</h2>
      <p>Tu as déjà ta question ? Écris-la ici. Sinon, <a href="#/explorer/quiz">commence par Explorer</a>.</p>
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
        <button class="mini croix" data-a="suppr-pt" data-q="${q.id}" data-p="${p.id}" aria-label="Supprimer le point">✕</button></div></div></li>`;
  }
  vues.question = (id, sous) => {
    const q = laQuestion(id); if (!q) return vues.questions();
    const entete = `<p class="retour"><a href="#/questions">← Mes questions</a></p>
      ${zoneTexte('q.' + q.id + '.titre', q.titre, 'class="titre-question" placeholder="Ma question" aria-label="Ma question"')}
      <div class="statut"><span class="badge ${q.statut}">${STATUTS[q.statut]}</span>
        ${q.statut === 'brouillon' ? `<button class="mini" data-a="statut" data-q="${q.id}" data-s="proposee">Je la propose à mon prof</button>` : ''}
        ${q.statut === 'proposee' ? `<button class="mini" data-a="statut" data-q="${q.id}" data-s="validee">Mon prof l’a validée</button>` : ''}
        ${aide('Montre ta question à ton prof en classe. Quand il ou elle est d’accord, indique-le ici.')}</div>
      <nav class="onglets" aria-label="Ma question"><a href="#/question/${q.id}"${sous ? '' : ' aria-current="page"'}>Plan</a>
        <a href="#/question/${q.id}/echange"${sous === 'echange' ? ' aria-current="page"' : ''}>Échange (${(q.echange || []).length})</a></nav>`;
    if (sous === 'echange') {
      const prob = A.questionsProbables(q, d);
      return entete + `<p class="chapo">L’échange dure 10 minutes, autant que l’exposé. Note ici les questions que le jury pourrait poser, et tes idées de réponse.</p>
      ${(q.echange || []).map((x) => `<section class="carte"><div class="tete">${champ('ech.' + q.id + '.' + x.id + '.question', x.question, 'class="titre" aria-label="Question du jury"')}
        <button class="croix" data-a="suppr-ech" data-q="${q.id}" data-e="${x.id}" aria-label="Supprimer la question">✕</button></div>
        ${zoneTexte('ech.' + q.id + '.' + x.id + '.reponse', x.reponse, 'placeholder="Mes idées de réponse, en quelques mots-clés" aria-label="Ma réponse"')}</section>`).join('')}
      <section class="carte"><input type="text" id="ech-libre" placeholder="Une question que le jury pourrait poser" aria-label="Nouvelle question du jury"><button data-a="plus-ech" data-q="${q.id}">Ajouter</button></section>
      ${prob.length ? `<section class="carte"><h2>Des questions probables</h2><p class="note">Proposées d’après ton plan et tes mots.</p><ul class="simples">${prob.map((t) => `<li><span>${e(t)}</span><button data-a="garder-ech" data-q="${q.id}" data-t="${e(t)}">Garder</button></li>`).join('')}</ul></section>` : ''}`;
    }
    return entete + `
      <details class="carte coach" open><summary>Coach</summary><div data-zone="coach" data-q="${q.id}">${zoneCoach(q)}</div></details>
      ${q.parties.map((p) => `<section class="partie" data-partie="${p.id}">
        <div class="tete">${champ('partie.' + q.id + '.' + p.id + '.titre', p.titre, 'class="titre-partie" aria-label="Titre de la partie"')}<span class="note">${p.minutes ? '≈ ' + p.minutes + ' min' : ''}</span></div>
        <ul class="points" data-points="${p.id}">${p.points.map((x) => htmlPoint(q, x)).join('')}</ul>
        ${p.points.length ? '' : `<p class="vide">Aucun point pour le moment. ${exemple}</p>`}
        <button class="ajouter" data-a="plus-pt" data-q="${q.id}" data-partie="${p.id}">+ Ajouter un point</button></section>`).join('')}
      <p class="bas"><button data-a="plus-axe" data-q="${q.id}">+ Ajouter un axe</button>
        <button class="principal" data-a="pdf" data-q="${q.id}">Télécharger en PDF</button></p>
      <p class="bas"><button class="discret danger" data-a="suppr-question" data-q="${q.id}">Supprimer cette question</button></p>`;
  };

  function zoneMot(m) { return conseils(m.mot ? A.coachMot(m) : []); }
  vues.mots = () => `
    <h1>Mes mots</h1>
    <p class="chapo">Chaque mot important se définit de deux manières : avec une source, puis avec tes mots. ${exemple}</p>
    ${d.mots.length ? '' : '<p class="vide">Aucun mot pour le moment. Commence par le mot le plus important de ton sujet.</p>'}
    ${d.mots.map((m) => `<section class="carte mot-carte">
      <div class="tete">${champ('mots.' + m.id + '.mot', m.mot, 'class="titre" placeholder="Le mot" aria-label="Le mot"')}
        <span class="badge ${A.motComplet(m) ? 'validee' : 'brouillon'}" data-zone="etat-mot" data-m="${m.id}">${A.motComplet(m) ? 'Complet' : 'À compléter'}</span>
        <button class="croix" data-a="suppr-mot" data-m="${m.id}" aria-label="Supprimer le mot">✕</button></div>
      <label>Définition d’une source ${zoneTexte('mots.' + m.id + '.defSource', m.defSource, 'placeholder="La définition exacte, recopiée"')}</label>
      <label>D’où vient-elle ? ${champ('mots.' + m.id + '.sourceTexte', m.sourceTexte, 'placeholder="Un dictionnaire, un cours, un site officiel…"')}</label>
      <label>Avec mes mots ${zoneTexte('mots.' + m.id + '.defMoi', m.defMoi, 'placeholder="Comme je l’expliquerais à un·e camarade"')}</label>
      <label>Une image simple, pour le juré non spécialiste ${champ('mots.' + m.id + '.analogie', m.analogie, 'placeholder="C’est comme…"')}</label>
      <div data-zone="mot" data-m="${m.id}">${zoneMot(m)}</div></section>`).join('')}
    <button class="ajouter" data-a="plus-mot">+ Ajouter un mot</button>`;

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
      <label>Ce que j’en retiens, avec mes mots ${zoneTexte('sources.' + s.id + '.retiens', s.retiens)}</label></section>`).join('')}
    <button class="ajouter" data-a="plus-source">+ Ajouter une source</button>`;

  vues.oraux = () => `
    <h1>Mes oraux</h1>
    <p class="chapo">Après chaque oral blanc ou chaque vidéo, évalue-toi. Ton prof te donne ensuite son évaluation : compare.</p>
    <section class="carte"><h2>S’entraîner comme le jour J</h2><ol class="etapes"><li>Tire au sort une de tes questions.</li><li>20 minutes : refais ton plan <b>sur papier</b>, sans regarder l’écran.</li>
      <li>10 minutes : présente debout, à voix haute, avec un chronomètre.</li><li>Demande à quelqu’un de te poser trois questions.</li></ol></section>
    ${d.oraux.map((o) => { const n = Object.keys(o.auto || {}).length, note = Object.values(o.auto || {}).reduce((a, b) => a + b, 0); return `<section class="carte oral">
      <div class="tete">${champ('oral.' + o.id + '.nom', o.nom, 'class="titre" aria-label="Nom de l’oral"')}<button class="croix" data-a="suppr-oral" data-o="${o.id}" aria-label="Supprimer">✕</button></div>
      <div class="grille2"><label>Date <input type="date" data-f="oral.${o.id}.date" value="${e(o.date)}"></label>
        <label class="coche"><input type="checkbox" data-coche="oral.${o.id}.video"${o.video ? ' checked' : ''}> Ma vidéo est déposée sur Pronote</label></div>
      <details${n ? ' open' : ''}><summary>Je m’évalue${n === 5 ? ' · ' + note + ' / 20' : ''}</summary>
      ${D.GRILLE.map((c) => `<fieldset class="critere"><legend>${e(c.titre)}</legend>${c.niveaux.map((t, i) => `<label class="niveau"><input type="radio" name="g-${o.id}-${c.id}" data-grille="${o.id}" data-c="${c.id}" value="${i + 1}"${(o.auto || {})[c.id] === i + 1 ? ' checked' : ''}><span><b>${i + 1}</b> ${e(t)}</span></label>`).join('')}</fieldset>`).join('')}
      </details>
      <label>Mes deux objectifs pour la prochaine fois ${zoneTexte('oral.' + o.id + '.objectifs', o.objectifs)}</label></section>`; }).join('')}
    <button class="ajouter" data-a="plus-oral">+ Ajouter une vidéo ou un entraînement</button>`;

  vues.hf = () => {
    const groupes = [...new Set(A.HAUTS_FAITS.map((h) => h.g))], n = Object.keys(d.hf).length;
    return `<h1>Mes hauts faits</h1><p class="chapo">${n} sur ${A.HAUTS_FAITS.length}. Ils récompensent les bonnes habitudes, pas la quantité.</p>
    ${groupes.map((g) => `<h2>${e(g)}</h2><ul class="hf">${A.HAUTS_FAITS.filter((h) => h.g === g).map((h) => { const ok = d.hf[h.id];
      return `<li class="${ok ? 'gagne' : ''}"><span class="medaille" aria-hidden="true">${ok ? '★' : h.cache ? '?' : '☆'}</span><div><b>${ok || !h.cache ? e(h.titre) : '???'}</b>
        <p>${ok ? e(h.pourquoi) : e(h.cache ? h.indice : h.cond)}</p></div></li>`; }).join('')}</ul>`).join('')}`;
  };

  vues.plus = () => `<h1>Plus</h1><nav class="menu">
    <a href="#/oraux">Mes oraux<span>Oraux blancs, vidéos, auto-évaluation</span></a>
    <a href="#/hauts-faits">Mes hauts faits<span>${Object.keys(d.hf).length} sur ${A.HAUTS_FAITS.length}</span></a>
    <a href="#/aide">Aide et méthode<span>Comprendre l’épreuve, fiches de méthode</span></a>
    <a href="#/aide/exemple">Voir un exemple<span>Un plan complet sur les biais algorithmiques</span></a>
    <a href="#/reglages">Réglages<span>Télécharger, importer ou effacer mon dossier</span></a></nav>`;

  const fiche = (titre, corps, attr) => `<details class="carte fiche" ${attr || ''}><summary>${titre}</summary>${corps}</details>`;
  vues.aide = () => `<h1>Aide et méthode</h1>
    <section class="carte"><h2>Comprendre l’épreuve (session 2027)</h2><ul>
      <li><b>Avant :</b> tu prépares deux questions avec tes profs. Elles ne portent pas sur la même spécialité ; une question peut être transversale.</li>
      <li><b>Préparation, 20 min :</b> le jury choisit une question. Tu prépares tes notes sur papier. Aucun support numérique.</li>
      <li><b>Exposé, 10 min :</b> debout, sans lire. Tu peux garder ta feuille et la montrer au jury.</li>
      <li><b>Échange, 10 min :</b> le jury te questionne sur ton sujet et sur le programme de la spécialité.</li>
      <li><b>Jury :</b> deux profs, dont un·e n’est pas spécialiste de NSI.</li>
      <li><b>Coefficient 8.</b> La question n’est pas notée : ce sont ton argumentation et ton oral qui comptent.</li></ul>
      <p class="note">Source : note de service du 10 septembre 2026, Bulletin officiel spécial n° 4 du 17 septembre 2026.</p></section>
    <h2>Fiches de méthode</h2>
    ${fiche('Un bon point', '<p>1 à 3 lignes, en mots-clés : de quoi dire 3 à 5 phrases.</p><p class="oui">Oui : « IA de recrutement d’Amazon abandonnée : pénalisait les CV de femmes. »</p><p class="non">Non : un paragraphe rédigé que tu serais tenté·e de lire.</p>')}
    ${fiche('Un bon plan', '<p>Introduction (2 min), deux axes (3 min chacun), conclusion (2 min). 30 à 50 points en tout.</p><p>Des plans possibles : avantages et limites ; constat et solutions ; hier, aujourd’hui, demain ; du général au particulier.</p>')}
    ${fiche('Une bonne définition', '<p>Deux versions : celle d’une source sérieuse, recopiée et citée, puis la tienne.</p><p class="oui">Oui : « Algorithme : une liste d’étapes à suivre pour arriver à un résultat. »</p><p class="non">Non : la même phrase que la source avec deux mots changés.</p>')}
    ${fiche('Expliquer à un non-spécialiste', '<p>Un des deux membres du jury ne connaît pas la NSI. Pour chaque mot technique, prépare une image : « un algorithme, c’est comme une recette de cuisine ».</p><p>Astuce de programmeur et de programmeuse : explique ton sujet à voix haute à un canard en plastique. Si tu bloques, c’est que ce n’est pas encore clair pour toi.</p>', 'data-fiche="canard"')}
    ${fiche('Une bonne source', '<p>Demande-toi : qui parle ? Est-ce son métier ? De quand ça date ? Que disent les autres sites de cette source ?</p><p>Croise une source experte (rapport, livre, site officiel) et une source de vulgarisation (vidéo ou article de qualité).</p>')}
    ${fiche('Les types d’arguments', '<ul><li>de droit : une loi, un règlement ;</li><li>de fait : un événement, une étude ;</li><li>scientifique : un résultat reconnu ;</li><li>logique : un raisonnement ;</li><li>d’autorité : une personne ou une institution reconnue ;</li><li>d’expérience : ce que tu as vécu.</li></ul><p>Mélange-les, et dis toujours d’où ils viennent.</p>')}
    ${fiche('Répondre au jury', '<p>Écoute la question jusqu’au bout. Prends quelques secondes. Reformule si besoin : « Si je comprends bien, vous me demandez… ».</p><p>Tu ne sais pas ? « Je n’ai pas la donnée exacte, mais je peux expliquer le principe… »</p>')}
    <p><a class="bouton" href="#/aide/exemple">Voir un exemple de dossier</a></p>`;

  vues.exemple = () => { const x = D.EXEMPLE; return `<p class="retour"><a href="#/aide">← Aide et méthode</a></p><h1>Un exemple</h1>
    <p class="chapo">Le plan de ton prof sur les biais algorithmiques. Il est là pour te montrer la forme : ne le recopie pas.</p>
    <p class="titre-question lecture">${e(x.titre)}</p>
    ${x.parties.map((p) => `<section class="partie"><div class="tete"><b class="titre-partie">${e(p.titre)}</b><span class="note">≈ ${p.minutes} min</span></div>
      <ul class="points lecture">${p.points.map((pt) => `<li class="pt"><div class="corps"><p>${e(pt[1])}</p><span class="etq">${e((D.ETIQUETTES.find((t) => t[0] === pt[0]) || ['', ''])[1])}</span></div></li>`).join('')}</ul></section>`).join('')}
    <h2>Le lexique</h2>${x.mots.map((m) => `<section class="carte"><b>${e(m.mot)}</b><p><span class="note">Source :</span> ${e(m.defSource)}</p><p><span class="note">Avec mes mots :</span> ${e(m.defMoi)}</p><p><span class="note">Image :</span> ${e(m.analogie)}</p></section>`).join('')}`; };

  vues.reglages = () => `<h1>Réglages</h1>
    <section class="carte"><h2>Mon prénom</h2>${champ('profil.prenom', d.profil.prenom, 'maxlength="24" aria-label="Mon prénom"')}</section>
    <section class="carte"><h2>Mon dossier</h2>
      <p>Ton dossier est gardé <b>sur cet appareil seulement</b>. Pour le sauvegarder ou le passer sur un autre appareil, télécharge-le, puis importe-le.</p>
      <p><button data-a="exporter">Télécharger mon dossier</button> <label class="bouton">Importer un dossier<input type="file" id="import" accept="application/json,.json" hidden></label></p></section>
    <section class="carte"><h2>Tout effacer</h2><p>Pour effacer ton dossier de cet appareil, écris EFFACER, puis valide. C’est définitif.</p>
      <input type="text" id="confirmer" aria-label="Écris EFFACER pour confirmer" autocomplete="off"><button class="danger" data-a="effacer">Effacer mon dossier</button></section>
    <p class="note">Hello GO, version ${window.HG_VERSION}.</p>`;

  // ---------- Le routeur ----------
  const NAV = [['#/', 'Accueil', 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'], ['#/explorer/quiz', 'Explorer', 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm3.5 6.5-2 5-5 2 2-5z'],
    ['#/questions', 'Questions', 'M4 5h16M4 10h16M4 15h10M4 20h7'], ['#/mots', 'Mots', 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11'],
    ['#/sources', 'Sources', 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'], ['#/plus', 'Plus', 'M5 12h.01M12 12h.01M19 12h.01']];
  function route() {
    const h = (location.hash || '#/').slice(2).split('/');
    if (!d.profil.vu) return ['bienvenue', '', vues.bienvenue()];
    switch (h[0]) {
      case '': return ['accueil', '#/', vues.accueil()];
      case 'explorer': return [h[1] || 'quiz', '#/explorer/quiz', (vues[h[1]] && ['quiz', 'sujets', 'pistes'].includes(h[1]) ? vues[h[1]] : vues.quiz)()];
      case 'questions': return ['questions', '#/questions', vues.questions()];
      case 'question': return ['question', '#/questions', vues.question(h[1], h[2])];
      case 'mots': return ['mots', '#/mots', vues.mots()];
      case 'sources': return ['sources', '#/sources', vues.sources()];
      case 'oraux': return ['oraux', '#/plus', vues.oraux()];
      case 'hauts-faits': return ['hf', '#/plus', vues.hf()];
      case 'aide': return ['aide', '#/plus', h[1] === 'exemple' ? vues.exemple() : vues.aide()];
      case 'reglages': return ['reglages', '#/plus', vues.reglages()];
      case 'plus': return ['plus', '#/plus', vues.plus()];
      default: return ['accueil', '#/', vues.accueil()];
    }
  }
  function rendre(garderDefilement) {
    const y = window.scrollY, r = route(), main = $('#vue');
    main.innerHTML = r[2]; main.dataset.vue = r[0];
    $('#nav').hidden = !d.profil.vu;
    $('#nav').innerHTML = NAV.map((n) => `<a href="${n[0]}"${n[0] === r[1] ? ' aria-current="page"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${n[2]}"/></svg><span>${n[1]}</span></a>`).join('');
    main.querySelectorAll('textarea').forEach(ajuster);
    main.querySelectorAll('[data-points]').forEach((ul) => { if (window.Sortable) window.Sortable.create(ul, { group: 'pts', handle: '.grip', animation: 150, onEnd: finGlisser }); });
    if (garderDefilement !== false) window.scrollTo(0, y);
  }
  function ajuster(t) { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }
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
      enregistrer(); return; }
    if (t.dataset.grille) { const o = d.oraux.find((x) => x.id === t.dataset.grille); o.auto = o.auto || {}; o.auto[t.dataset.c] = +t.value; enregistrer(true); rendre(); return; }
    if (t.dataset.coche) { const c = cible(t.dataset.coche); c[0][c[1]] = t.checked; enregistrer(true); return; }
    if (t.id === 'import' && t.files[0]) { t.files[0].text().then((txt) => { try { const n = JSON.parse(txt); if (!n || n.v !== 1 || !Array.isArray(n.questions)) throw new Error('format');
      const avant = JSON.stringify(d); d = Object.assign(dossierNeuf(), n); d.profil.vu = true; enregistrer(true); location.hash = '#/'; rendre();
      toast('Dossier importé.', null, 'Annuler', () => { d = JSON.parse(avant); enregistrer(true); rendre(); }); } catch (x) { toast('Ce fichier n’est pas un dossier Hello GO.'); } }); return; }
    if (t.dataset.f) { enregistrer(true); rafraichir(); }
  });
  document.addEventListener('keydown', (ev) => {
    const t = ev.target;
    if (t.classList && t.classList.contains('texte-pt') && ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault(); const p = t.dataset.f.split('.'), q = laQuestion(p[1]);
      for (const partie of q.parties) { const i = partie.points.findIndex((x) => x.id === p[2]); if (i >= 0) { const n = point(); partie.points.splice(i + 1, 0, n); enregistrer(true); rendre(); focusPoint(n.id); break; } }
    }
    konami(ev.key);
  });
  function focusPoint(id) { const t = $('[data-id="' + id + '"] textarea'); if (t) t.focus(); }
  const SUITE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']; let rang = 0;
  function konami(k) { rang = (k === SUITE[rang] || k.toLowerCase() === SUITE[rang]) ? rang + 1 : (k === SUITE[0] ? 1 : 0); if (rang === SUITE.length) { rang = 0; secret(); } }
  function secret() { d.compteurs.secret = 1; enregistrer(true); document.body.classList.add('fete'); setTimeout(() => document.body.classList.remove('fete'), 3000); }
  let touches = 0, dernier = 0;

  // ---------- Les actions ----------
  const actions = {
    demarrer() { d.profil.prenom = ($('#prenom').value || '').trim().slice(0, 24); d.profil.vu = true; enregistrer(true); location.hash = '#/'; rendre(false); },
    'autre-savoir'() { d.vus.decalage = (d.vus.decalage || 0) + 1; enregistrer(); rendre(); },
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
    pdf(b) { faireLePdf(laQuestion(b.dataset.q), b); },
    exporter() { ecrire(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 1)], { type: 'application/json' }));
      a.download = 'hello-go-' + (d.profil.prenom || 'dossier').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); },
    effacer() { if ($('#confirmer').value.trim() !== 'EFFACER') return toast('Écris EFFACER dans la case pour confirmer.'); d = dossierNeuf(); ecrire(); location.hash = '#/'; rendre(false); },
    logo() { const t = Date.now(); touches = t - dernier < 600 ? touches + 1 : 1; dernier = t; if (touches >= 7) { touches = 0; secret(); } },
  };
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
    const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return;
    const f = actions[b.dataset.a]; if (f) f(b);
  });
  document.addEventListener('toggle', (ev) => { if (ev.target.dataset && ev.target.dataset.fiche === 'canard' && ev.target.open) { d.compteurs.canard = 1; enregistrer(true); } }, true);

  // ---------- Relier un point à des mots ou à des sources ----------
  function ouvrirLiens(qid, pid, type) {
    const q = laQuestion(qid), p = lePoint(q, pid), dlg = $('#dialogue'), estMot = type === 'mots', liste = d[type];
    dlg.innerHTML = `<form method="dialog"><h2>${estMot ? 'Les mots de ce point' : 'Les sources de ce point'}</h2>
      ${liste.length ? `<div class="choix">${liste.map((x) => `<label class="niveau"><input type="checkbox" value="${x.id}"${(p[type] || []).includes(x.id) ? ' checked' : ''}><span>${e((estMot ? x.mot : x.titre) || '(sans nom)')}</span></label>`).join('')}</div>` : `<p class="note">${estMot ? 'Tu n’as pas encore de mot.' : 'Tu n’as pas encore de source.'}</p>`}
      <label>${estMot ? 'Un nouveau mot' : 'Une nouvelle source (son titre)'}<input type="text" id="nouveau-lien" autocomplete="off"></label>
      <p class="bas"><button value="annuler">Annuler</button><button class="principal" value="ok">Valider</button></p></form>`;
    dlg.onclose = () => {
      if (dlg.returnValue !== 'ok') return;
      p[type] = [...dlg.querySelectorAll('input[type=checkbox]:checked')].map((c) => c.value);
      const v = $('#nouveau-lien', dlg).value.trim();
      if (v) { const n = estMot ? { id: uid(), mot: v, defSource: '', sourceTexte: '', defMoi: '', analogie: '' } : { id: uid(), titre: v, auteur: '', lien: '', type: '', date: '', retiens: '' }; liste.push(n); p[type].push(n.id);
        toast(estMot ? 'Mot ajouté : pense à le définir.' : 'Source ajoutée : pense à la compléter.', estMot ? '#/mots' : '#/sources', 'Ouvrir'); }
      enregistrer(true); rendre();
    };
    dlg.showModal();
  }

  // ---------- Le PDF : le plan, puis le lexique, puis les sources ----------
  function charger_script(src) { return new Promise((ok, non) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => non(new Error(src)); document.head.appendChild(s); }); }
  function contenuPdf(q) {
    const mots = [], sources = [];
    const numero = (liste, id) => { let i = liste.indexOf(id); if (i < 0) { liste.push(id); i = liste.length - 1; } return i + 1; };
    const corps = [{ text: 'Grand oral de NSI' + (d.profil.prenom ? ' · ' + d.profil.prenom : ''), style: 'petit' }, { text: q.titre || 'Question sans titre', style: 'titre' }];
    q.parties.forEach((p) => {
      corps.push({ text: p.titre + (p.minutes ? '  (≈ ' + p.minutes + ' min)' : ''), style: 'partie' });
      if (!p.points.length) corps.push({ text: '(aucun point)', style: 'petit' });
      else corps.push({ ul: p.points.map((x) => { const et = (D.ETIQUETTES.find((t) => t[0] === x.etiquette) || [])[1];
        const refs = (x.mots || []).filter((i) => d.mots.some((m) => m.id === i)).map((i) => 'M' + numero(mots, i)).concat((x.sources || []).filter((i) => d.sources.some((s) => s.id === i)).map((i) => 'S' + numero(sources, i)));
        return { text: [x.etiquette ? { text: et + ' : ', bold: true } : '', x.texte || '(point vide)', refs.length ? { text: '  [' + refs.join(', ') + ']', style: 'ref' } : ''], margin: [0, 2, 0, 2] }; }) });
    });
    d.mots.forEach((m) => numero(mots, m.id)); d.sources.forEach((s) => numero(sources, s.id));
    corps.push({ text: 'Lexique', style: 'section', pageBreak: 'before' });
    if (!mots.length) corps.push({ text: 'Aucun mot défini.', style: 'petit' });
    mots.forEach((id, i) => { const m = d.mots.find((x) => x.id === id);
      corps.push({ text: [{ text: 'M' + (i + 1) + '  ', style: 'ref' }, { text: m.mot || '(sans nom)', bold: true }], margin: [0, 8, 0, 2] });
      corps.push({ text: [{ text: 'Source : ', bold: true }, (m.defSource || '—') + (m.sourceTexte ? ' (' + m.sourceTexte + ')' : '')] });
      corps.push({ text: [{ text: 'Avec mes mots : ', bold: true }, m.defMoi || '—'] });
      if (m.analogie) corps.push({ text: [{ text: 'Image : ', bold: true }, m.analogie] }); });
    corps.push({ text: 'Sources', style: 'section', margin: [0, 18, 0, 6] });
    if (!sources.length) corps.push({ text: 'Aucune source.', style: 'petit' });
    sources.forEach((id, i) => { const s = d.sources.find((x) => x.id === id), type = (D.TYPES_SOURCE.find((t) => t[0] === s.type && s.type) || [])[1];
      corps.push({ text: [{ text: 'S' + (i + 1) + '  ', style: 'ref' }, A.reference(s) || '(source sans titre)'], margin: [0, 6, 0, 1] });
      if (type || s.retiens) corps.push({ text: [type ? type + '. ' : '', s.retiens ? 'Ce que j’en retiens : ' + s.retiens : ''], style: 'petit' }); });
    return { pageSize: 'A4', pageMargins: [48, 48, 48, 54], content: corps, defaultStyle: { fontSize: 11, lineHeight: 1.25 },
      footer: (page, total) => ({ text: 'Hello GO · page ' + page + ' sur ' + total, alignment: 'center', fontSize: 8, margin: [0, 20, 0, 0] }),
      styles: { titre: { fontSize: 17, bold: true, margin: [0, 4, 0, 10] }, partie: { fontSize: 13, bold: true, margin: [0, 12, 0, 4] }, section: { fontSize: 15, bold: true, margin: [0, 0, 0, 6] }, petit: { fontSize: 9 }, ref: { fontSize: 8, bold: true } } };
  }
  window.HGContenuPdf = contenuPdf;
  function faireLePdf(q, bouton) {
    bouton.disabled = true; const avant = bouton.textContent; bouton.textContent = 'Préparation…';
    const pret = window.pdfMake ? Promise.resolve() : charger_script('vendor/pdfmake.min.js').then(() => charger_script('vendor/vfs_fonts.js'));
    pret.then(() => { window.pdfMake.createPdf(contenuPdf(q)).download('grand-oral-' + (q.titre || 'plan').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '.pdf');
      d.compteurs.pdf = (d.compteurs.pdf || 0) + 1; enregistrer(true); })
      .catch(() => toast('Le PDF n’a pas pu être préparé. Vérifie ta connexion, puis réessaie.'))
      .then(() => { bouton.disabled = false; bouton.textContent = avant; });
  }

  // ---------- Démarrage ----------
  window.addEventListener('hashchange', () => rendre(false));
  A.majHautsFaits(d); rendre(false);
  if (!memoireOk) toast('Ce navigateur ne garde pas ton dossier.');
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
