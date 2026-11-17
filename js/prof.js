// Hello GO : l'espace de l'enseignant·e (#/prof). Ses classes, le tableau de chaque classe, le dossier de chaque élève
// et les outils de retour. Le code de l'enseignant·e n'est gardé que pour la séance (sessionStorage), sauf si la case
// « Rester connecté·e sur cet appareil » est cochée (localStorage, décision de l'enseignant du 17/11) ; jamais dans un
// cookie ni dans une adresse. Tout texte venu de la base est échappé avant affichage, et ce que la page de l'élève
// écrit (dossier, résumé) est relu avant d'être montré.
(function (racine) {
  'use strict';
  const EL = racine.HGEnLigne, R = racine.HGRetours, A = racine.HGAnalyse, D = racine.HGDonnees;
  const O = () => racine.HGOutils;
  const e = (s) => O().e(s), toast = (...a) => O().toast(...a), rendre = () => O().rendre();
  const $ = (s, r) => (r || document).querySelector(s);
  const CLE_CODE = 'hellogo:prof:code', CLE_VUS = 'hellogo:prof:vus';
  const date = (x) => x ? new Date(x).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'jamais';
  const lien = () => location.origin + location.pathname + '#/classe/';
  // Le suivi (version 1.5.0). Une date du dossier (AAAA-MM-JJ) ou du résumé (AAMMJJ, compacte), relue avant d'être montrée.
  const jourDe = (x) => { const s = String(x || ''), m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s) || (/^([0-9]{2})([0-9]{2})([0-9]{2})$/.test(s) ? ['', '20' + s.slice(0, 2), s.slice(2, 4), s.slice(4, 6)] : null);
    return m && +m[2] >= 1 && +m[2] <= 12 && +m[3] >= 1 && +m[3] <= 31 ? m[1] + '-' + m[2] + '-' + m[3] : null; };
  const dateJour = (j, long) => { const x = jourDe(j); if (!x) return 'date inconnue'; const p = x.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('fr-FR', long ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric' }); };
  const titreHf = (id) => { const h = A.HAUTS_FAITS.find((x) => x.id === id); return h ? h.titre : null; };
  const pl = (n, un, plusieurs) => n + ' ' + (n > 1 ? plusieurs : un);

  // ---------- L'état de la page ----------
  const P = { code: null, ouvert: null, classe: null, eleve: null, nouveauCode: null, charge: {}, ia: null, codesVus: false, filtre: 'tous', tri: 'nom' };
  function lireCode() { try { return sessionStorage.getItem(CLE_CODE) || localStorage.getItem(CLE_CODE); } catch (x) { return null; } }
  function garderCode(code, resterConnecte) {
    try { sessionStorage.setItem(CLE_CODE, code); if (resterConnecte) localStorage.setItem(CLE_CODE, code); else if (localStorage.getItem(CLE_CODE) !== null) localStorage.setItem(CLE_CODE, code); } catch (x) { /* mémoire de la page seulement */ }
    P.code = code;
  }
  function oublierCode() { try { sessionStorage.removeItem(CLE_CODE); localStorage.removeItem(CLE_CODE); } catch (x) { /* rien */ } P.code = null; P.ouvert = P.classe = P.eleve = null; }
  const vus = () => { try { return JSON.parse(localStorage.getItem(CLE_VUS)) || {}; } catch (x) { return {}; } };
  const marquerVu = (id, v) => { const x = vus(); x[id] = v; try { localStorage.setItem(CLE_VUS, JSON.stringify(x)); } catch (y) { /* rien */ } };

  // Un appel avec le code : un message clair si le code n'est plus bon, ou si le réseau manque.
  function appel(nom, params) {
    return EL.rpc(nom, Object.assign({ p_code: P.code }, params || {})).then((r) => {
      // Le code n'existe plus (changé sur un autre appareil, espace supprimé) : on l'oublie ici, et la page redemande le code.
      if (r && r.ok === false && /code enseignant·e n'existe pas/.test(r.message || '')) { oublierCode(); P.erreur = r.message; setTimeout(rendre, 0); }
      return r;
    }, (x) => ({ ok: false, message: x.reseau ? 'Pas de réseau : vérifiez votre connexion, puis réessayez.' : 'La base n’a pas répondu. Réessayez dans un moment.' }));
  }
  // Charger une fois, puis refaire la page (jamais deux chargements du même objet en même temps).
  function charger(cle, f) {
    if (P.charge[cle]) return; P.charge[cle] = true;
    f().then(() => { P.charge[cle] = false; if (location.hash.startsWith('#/prof')) rendre(); });
  }
  function ouvrir() { return appel('go_prof_ouvrir').then((r) => { if (r.ok) P.ouvert = r; else { P.ouvert = null; P.erreur = r.message; } }); }
  function chargerClasse(id) { return appel('go_prof_classe', { p_classe: id }).then((r) => { P.classe = r.ok ? r : { erreur: r.message, classe: { id: id } }; }); }
  function chargerEleve(id) {
    return appel('go_prof_dossier', { p_eleve: id }).then((r) => {
      if (!r.ok) { P.eleve = { erreur: r.message, id: id }; return; }
      const dossier = r.dossier && A.dossierValide(r.dossier) ? r.dossier : null;
      P.eleve = Object.assign(r, { dossier: dossier, illisible: !!r.dossier && !dossier, retours: R.nettoyer(r.retours) });
      marquerVu(id, r.dossier_version);
    });
  }

  // ---------- Les vues ----------
  function vue(h) {
    if (!P.code) P.code = lireCode();
    if (!P.code) return vueEntree();
    if (!P.ouvert) { charger('ouvrir', ouvrir); return P.erreur && !P.charge.ouvrir ? vueEntree(P.erreur) : '<h1>Mon espace</h1><p>Ouverture…</p>'; }
    if (h[0] === 'classe' && h[1]) {
      if (!P.classe || P.classe.classe.id !== h[1]) { charger('classe', () => chargerClasse(h[1])); return '<h1>Ma classe</h1><p>Chargement…</p>'; }
      return vueClasse();
    }
    if (h[0] === 'eleve' && h[1]) {
      if (!P.eleve || P.eleve.id !== h[1]) { charger('eleve', () => chargerEleve(h[1])); return '<h1>Dossier</h1><p>Chargement…</p>'; }
      return vueEleve(h[2]);
    }
    return vueEspace();
  }

  function vueEntree(erreur) {
    if (P.nouveauCode) return vueNouveauCode();
    return `<h1>Espace enseignant·e</h1>
    <p class="chapo">Suivez les dossiers de Grand oral de vos élèves, et faites-leur des retours.</p>
    ${erreur ? `<p class="erreur">${e(erreur)}</p>` : ''}
    <section class="carte"><h2>Ouvrir mon espace</h2>
      <label>Mon code (3 mots et 4 chiffres)<input type="text" id="prof-code" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="60"></label>
      <label class="coche"><input type="checkbox" id="prof-rester"> Rester connecté·e sur cet appareil (seulement sur un appareil personnel)</label>
      <button class="principal" data-pa="ouvrir">Ouvrir</button></section>
    <section class="carte"><h2>Créer mon espace</h2>
      <label>Le nom que verront vos élèves<input type="text" id="prof-nom" maxlength="40" placeholder="Par exemple : M. Martin" autocomplete="off"></label>
      <p class="note">Un code vous sera donné, une seule fois : il est votre seule clé (aucun courriel, aucun mot de passe).</p>
      <button data-pa="creer-espace">Créer mon espace</button></section>
    <p class="note"><a href="#/">Revenir à l’application de l’élève</a></p>`;
  }
  function vueNouveauCode() {
    return `<h1>Votre code</h1><section class="carte action"><p class="sur-titre">Montré une seule fois : notez-le maintenant</p>
      <p class="code-eleve">${e(P.nouveauCode)}</p>
      <p>Ce code ouvre votre espace depuis n’importe quel appareil. Il n’est gardé nulle part en clair : perdu, il ne peut pas être retrouvé.</p>
      <label class="coche"><input type="checkbox" id="prof-rester"> Rester connecté·e sur cet appareil (seulement sur un appareil personnel)</label>
      <button class="principal" data-pa="code-note">Je l’ai noté : ouvrir mon espace</button></section>`;
  }

  function vueEspace() {
    const o = P.ouvert;
    return `<h1>Mon espace · ${e(o.nom)}</h1>
    ${o.alarme ? '<section class="carte alerte"><p>Beaucoup d’essais de code ont échoué dans l’heure : si ce n’est pas vous, changez votre code.</p></section>' : ''}
    <h2>Mes classes</h2>
    ${o.classes.length ? `<ul class="liste">${o.classes.map((c) => `<li><a class="carte lien-carte" href="#/prof/classe/${e(c.id)}"><p class="gros">${e(c.nom)}</p>
      <p class="note">${c.eleves} élève${c.eleves > 1 ? 's' : ''} · code de classe ${e(c.code)} · inscriptions ${c.ouverte ? 'ouvertes' : 'fermées'} · dernière visite d’un·e élève : ${e(date(c.derniere_visite))}</p></a></li>`).join('')}</ul>`
      : '<p class="vide">Aucune classe pour le moment.</p>'}
    <section class="carte"><h2>Créer une classe</h2><div class="ligne-champ"><input type="text" id="prof-classe-nom" maxlength="40" placeholder="Par exemple : Terminale NSI 2" aria-label="Nom de la classe"><button data-pa="creer-classe">Créer</button></div></section>
    <section class="carte"><h2>Réglages de mon espace</h2>
      <p><button data-pa="exporter">Exporter tout mon espace (JSON)</button></p>
      <p><button data-pa="debloquer">Débloquer le réseau</button> <span class="note">après beaucoup d’inscriptions depuis le même réseau du lycée</span></p>
      <p><button data-pa="changer-code">Changer mon code</button></p>
      <p><button data-pa="quitter">Fermer mon espace sur cet appareil</button></p>
      <p class="note">En fin d’année : exportez, puis supprimez vos classes. Rien n’est effacé automatiquement.</p></section>
    <details class="carte"><summary>Supprimer tout mon espace</summary>
      <p>Toutes vos classes, tous les comptes et tous les dossiers de vos élèves seront effacés. C’est définitif. Téléchargez d’abord l’export.</p>
      <p><button data-pa="exporter">Télécharger l’export</button></p>
      <label>Écrivez SUPPRIMER pour confirmer<input type="text" id="prof-supprimer" autocomplete="off"></label>
      <button class="danger" data-pa="supprimer-espace">Supprimer mon espace</button></details>`;
  }

  function vueClasse() {
    const c = P.classe;
    if (c.erreur) return `<p class="retour"><a href="#/prof">← Mon espace</a></p><p class="erreur">${e(c.erreur)}</p>`;
    const k = c.classe, v = vus(), l = lien() + k.code, maintenant = new Date();
    // Le voyant : plus de 14 jours sans visite (d'après la base), ou jamais revenu·e depuis l'inscription.
    const lignes = c.eleves.map((x) => ({ x: x, a: A.absence(x.vu_le, x.cree_le, maintenant) }));
    const absents = lignes.filter((y) => y.a.alerte).length, jamais = lignes.filter((y) => y.a.jamaisRevenu).length, aRelancer = lignes.filter((y) => y.a.alerte || y.a.jamaisRevenu);
    let montres = P.filtre === 'relancer' ? aRelancer : lignes.slice();
    if (P.tri === 'visite') montres = montres.slice().sort((a, b) => (b.a.jours === null ? 1e9 : b.a.jours) - (a.a.jours === null ? 1e9 : a.a.jours) || String(a.x.pseudo).localeCompare(String(b.x.pseudo), 'fr'));
    else montres = montres.slice().sort((a, b) => String(a.x.pseudo).localeCompare(String(b.x.pseudo), 'fr'));
    return `<p class="retour"><a href="#/prof">← Mon espace</a></p>
    <h1>${e(k.nom)}</h1>
    <section class="carte lien-classe"><h2>Le lien de la classe</h2>
      <div class="qr-et-lien"><div id="qr" class="qr" aria-label="QR code du lien de la classe" role="img"></div>
        <div><p><a href="${e(l)}" target="_blank" rel="noopener">${e(l)}</a></p><p>Code de classe : <b>${e(k.code)}</b></p>
        <p><button class="mini" data-pa="copier-lien">Copier le lien</button></p>
        <p>Inscriptions ${k.ouverte ? '<b>ouvertes</b>' : '<b>fermées</b>'} <button class="mini" data-pa="inscriptions" data-v="${k.ouverte ? '0' : '1'}">${k.ouverte ? 'Fermer' : 'Ouvrir'} les inscriptions</button></p></div></div></section>
    <h2>Les élèves (${c.eleves.length})</h2>
    ${c.eleves.length ? `<div class="carte ${absents || jamais ? 'alerte ' : ''}bilan-visites" role="status">${absents || jamais
        ? `<p><span class="voyant-icone" aria-hidden="true">⚠</span> <b>${absents ? pl(absents, 'élève sans visite', 'élèves sans visite') + ' depuis plus de deux semaines' : ''}${absents && jamais ? ' · ' : ''}${jamais ? pl(jamais, 'élève jamais revenu·e', 'élèves jamais revenu·e·s') + ' depuis l’inscription' : ''}</b></p>`
        : '<p><span aria-hidden="true">✓</span> Tous les élèves sont venu·e·s dans les deux dernières semaines.</p>'}
      <div class="filtres" role="group" aria-label="Afficher et trier"><button class="mini" data-pa="filtre" data-v="tous" aria-pressed="${P.filtre !== 'relancer'}">Tous les élèves (${lignes.length})</button><button class="mini" data-pa="filtre" data-v="relancer" aria-pressed="${P.filtre === 'relancer'}">À relancer (${aRelancer.length})</button>
        <button class="mini" data-pa="tri" data-v="nom" aria-pressed="${P.tri !== 'visite'}">Trier par prénom</button><button class="mini" data-pa="tri" data-v="visite" aria-pressed="${P.tri === 'visite'}">Trier par dernière visite</button></div></div>
    <p><button class="mini" data-pa="voir-codes">${P.codesVus ? 'Masquer les codes' : 'Voir tous les codes'}</button> <button class="mini" data-pa="imprimer-codes">Imprimer les codes</button></p>
    ${montres.length ? '' : '<p class="vide">Aucun·e élève à relancer.</p>'}
    <div class="tableau-classe"><table><thead><tr><th scope="col">Élève</th><th scope="col">Avancement</th><th scope="col">Hauts faits</th><th scope="col">Dernière visite</th><th scope="col">Code</th><th scope="col">Actions</th></tr></thead><tbody>
    ${montres.map((y) => { const x = y.x, r = x.resume || {}, neuf = x.dossier_version > (v[x.id] || 0);
      return `<tr${y.a.alerte || y.a.jamaisRevenu ? ' class="a-relancer"' : ''}><th scope="row"><a href="#/prof/eleve/${e(x.id)}">${e(x.pseudo)}</a>${neuf ? ' <span class="nouveau">Nouveau travail</span>' : ''}</th>
      <td>${resumeHtml(r)}</td><td>${hautsFaitsHtml(r)}</td><td>${visiteHtml(x, y.a, r, maintenant)}</td>
      <td><span class="code-masque" data-code="${e(x.id)}">${P.codesVus ? e(x.code_affiche) : '••••••'}</span> ${P.codesVus ? '' : `<button class="mini" data-pa="voir-code" data-e="${e(x.id)}" aria-label="Voir le code de ${e(x.pseudo)}">Voir</button>`}</td>
      <td class="actions"><a class="bouton mini" href="#/prof/eleve/${e(x.id)}">Dossier</a><button class="mini" data-pa="renommer-eleve" data-e="${e(x.id)}">Renommer</button>
        <button class="mini" data-pa="code-eleve" data-e="${e(x.id)}">Nouveau code</button><button class="mini danger" data-pa="supprimer-eleve" data-e="${e(x.id)}">Supprimer</button></td></tr>`; }).join('')}
    </tbody></table></div>
    ${derniersHautsFaits(c.eleves)}` : `<p class="vide">Aucun·e élève pour le moment. Donnez le lien ou le QR code de la classe.</p>`}
    <section class="codes-impression" aria-hidden="true"><h1>${e(k.nom)} : les codes Hello GO</h1><p>Lien de la classe : ${e(l)}</p>
      <table><tbody>${c.eleves.map((x) => `<tr><td>${e(x.pseudo)}</td><td class="code-eleve petit">${e(x.code_affiche)}</td></tr>`).join('')}</tbody></table></section>
    <section class="carte"><h2>Réglages de la classe</h2>
      <div class="ligne-champ"><input type="text" id="prof-renommer-classe" maxlength="40" value="${e(k.nom)}" aria-label="Nom de la classe"><button data-pa="renommer-classe">Renommer</button></div>
      <p><button data-pa="exporter-classe">Exporter cette classe (JSON)</button></p>
      <p><button data-pa="md-classe">Toute la classe en Markdown</button></p>
      <label class="coche"><input type="checkbox" id="md-classe-retours"> Inclure mes retours</label>
      <label class="coche"><input type="checkbox" id="md-classe-codes"> Inclure les codes des élèves</label>
      <p class="note">Un seul fichier, une section par élève, lisible tel quel. Sans les codes, sauf si vous cochez la case.</p></section>
    <details class="carte"><summary>Supprimer la classe</summary><p>La classe, ses élèves et leurs dossiers seront effacés. C’est définitif. Exportez-la d’abord.</p>
      <p><button data-pa="exporter-classe">Télécharger l’export</button> <button class="danger" data-pa="supprimer-classe">Supprimer la classe</button></p></details>`;
  }
  // Le résumé est écrit par la page de l'élève, et la base n'en vérifie que la taille : rien n'y est sûr. Chaque nombre
  // est relu comme un nombre, chaque texte est échappé, et une forme inattendue ne casse pas le tableau.
  function resumeHtml(r) {
    if (!r || typeof r !== 'object' || !r.v) return '<span class="note">Rien d’enregistré</span>';
    const n = (x) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0);
    const liste = (x) => (Array.isArray(x) ? x.filter((y) => y && typeof y === 'object') : []);
    const q = liste(r.questions).map((x) => `${x.statut === 'validee' ? '✓ ' : ''}${e(typeof x.titre === 'string' && x.titre ? x.titre : 'sans titre')} (${n(x.points)} pts)`).join(' ; ');
    const oraux = liste(r.oraux).filter((o) => o.criteres === 5).length;
    // Les quiz : les noms viennent de la page (D.COMPRENDRE), les scores du résumé, relus comme des nombres.
    const cq = r.comprendre && typeof r.comprendre === 'object' ? D.COMPRENDRE.filter((z) => r.comprendre[z.id] && typeof r.comprendre[z.id] === 'object')
      .map((z) => `${e(z.court)} ${Math.min(n(r.comprendre[z.id].meilleur), A.surSalve(z))}/${A.surSalve(z)}`) : [];
    return `<span class="resume">${q || 'Pas encore de question'}<br>${n(r.mots_complets)}/${n(r.mots)} mots · ${n(r.sources)} sources · ${oraux} oral${oraux > 1 ? 's' : ''} évalué${oraux > 1 ? 's' : ''}<br>Quiz : ${cq.length ? cq.join(' · ') : 'pas encore faits'}</span>`;
  }

  // Les hauts faits d'un·e élève dans le tableau : leur nombre et le dernier gagné (résumé, relu).
  function hautsFaitsHtml(r) {
    const n = r && typeof r.hauts_faits === 'number' && r.hauts_faits >= 0 ? Math.floor(r.hauts_faits) : 0;
    const der = r && Array.isArray(r.hf_recents) ? r.hf_recents.find((h) => Array.isArray(h) && titreHf(h[0])) : null;
    return `<span class="resume">${pl(n, 'haut fait', 'hauts faits')}${der ? `<br>Dernier : ${e(titreHf(der[0]))}, ${e(dateJour(der[1]))}` : ''}</span>`;
  }
  // La dernière visite (base), le voyant, et les jours actifs sur 30 jours (résumé, depuis la version 1.5.0 de l'élève).
  function visiteHtml(x, a, r, maintenant) {
    const v = r && r.visites && typeof r.visites === 'object' && Array.isArray(r.visites.jours) ? r.visites : null;
    const auj = A.jourLocal(maintenant), j30 = v ? new Set(v.jours.map(jourDe).filter((j) => j && A.ecartJours(j, auj) >= 0 && A.ecartJours(j, auj) < 30)).size : null;
    const voyant = a.alerte ? `<span class="voyant"><span aria-hidden="true">⚠</span> ${a.jours === null ? 'Aucune visite' : 'Sans visite depuis ' + pl(a.jours, 'jour', 'jours')}</span>`
      : a.jamaisRevenu ? '<span class="voyant"><span aria-hidden="true">⚠</span> Jamais revenu·e depuis l’inscription</span>' : '';
    const aussi = a.alerte && a.jamaisRevenu ? '<br><span class="note">Jamais revenu·e depuis l’inscription</span>' : '';
    return `${voyant}${voyant ? '<br>' : ''}${e(date(x.vu_le))}${aussi}${j30 !== null ? `<br><span class="note">${pl(j30, 'jour actif', 'jours actifs')} sur 30</span>` : ''}`;
  }
  // « Derniers hauts faits » de la classe : qui, quoi, quand (les 30 plus récents). Rien n'est montré aux élèves.
  function derniersHautsFaits(eleves) {
    const l = [];
    eleves.forEach((x) => { const r = x.resume || {}; (Array.isArray(r.hf_recents) ? r.hf_recents : []).forEach((h) => { if (Array.isArray(h) && titreHf(h[0]) && jourDe(h[1])) l.push({ x: x, id: h[0], le: jourDe(h[1]) }); }); });
    l.sort((a, b) => (a.le < b.le ? 1 : a.le > b.le ? -1 : String(a.x.pseudo).localeCompare(String(b.x.pseudo), 'fr')));
    return `<details class="carte" id="derniers-hf"><summary>Derniers hauts faits${l.length ? ' (' + Math.min(l.length, 30) + ')' : ''}</summary>
      ${l.length ? `<ul class="simples">${l.slice(0, 30).map((y) => `<li><span><b>${e(dateJour(y.le))}</b> · <a href="#/prof/eleve/${e(y.x.id)}/suivi">${e(y.x.pseudo)}</a> · ${e(titreHf(y.id))}</span></li>`).join('')}</ul>
      <p class="note">D’après le dernier enregistrement de chaque élève : un·e élève resté·e sur une version antérieure à la 1.5.0 n’y apparaît qu’après sa prochaine visite. Aucun classement, et rien n’est montré aux autres élèves.</p>`
      : '<p class="vide">Aucun haut fait daté pour le moment.</p>'}</details>`;
  }

  // ---------- Le dossier d'un·e élève : lecture, retours, outils ----------
  const NOMS = { commentaire: 'Commentaire', definir: 'Mot à définir', ressource: 'Ressource suggérée', question: 'Question pour l’échange', validation: 'Validation', evaluation: 'Évaluation' };
  function retoursDe(type, id) {
    return R.pour(P.eleve.retours, type, id).map(unRetour).join('');
  }
  function unRetour(x) {
    return `<div class="retour-prof"><p>${e(x.texte)}</p>${x.ia ? '<span class="mention-ia">Préparé avec l’aide d’une IA, relu par vous</span>' : ''}
      <button class="mini discret" data-pa="retirer" data-r="${e(x.id)}">Retirer</button></div>`;
  }
  const outil = (type, id, libelle) => `<button class="mini" data-pa="commenter" data-t="${type}" data-c="${e(id)}">${libelle || 'Commenter'}</button>`;
  function vueEleve(onglet) {
    const x = P.eleve;
    if (x.erreur) return `<p class="retour"><a href="#/prof">← Mon espace</a></p><p class="erreur">${e(x.erreur)}</p>`;
    const d = x.dossier, ret = `<p class="retour"><a href="#/prof/classe/${e(x.classe_id)}">← La classe</a></p>`;
    const ab = A.absence(x.vu_le, x.cree_le);
    const entete = `${ret}<h1>${e(x.pseudo)}</h1><p class="note">Dernière visite : ${e(date(x.vu_le))} · dossier modifié : ${e(date(x.dossier_modifie_le))}</p>
      ${ab.alerte || ab.jamaisRevenu ? `<p class="voyant"><span aria-hidden="true">⚠</span> ${ab.alerte ? (ab.jours === null ? 'Aucune visite' : 'Sans visite depuis ' + pl(ab.jours, 'jour', 'jours')) : ''}${ab.alerte && ab.jamaisRevenu ? ' · ' : ''}${ab.jamaisRevenu ? 'Jamais revenu·e depuis l’inscription' : ''}</p>` : ''}
      <nav class="onglets" aria-label="Dossier">${[['', 'Plan'], ['suivi', 'Suivi'], ['mots', 'Mots et sources'], ['oraux', 'Oraux'], ['pistes', 'Pistes'], ['retours', 'Mes retours (' + x.retours.items.length + ')'], ['ia', 'Avec une IA']]
        .map((o) => `<a href="#/prof/eleve/${e(x.id)}${o[0] ? '/' + o[0] : ''}"${(onglet || '') === o[0] ? ' aria-current="page"' : ''}>${o[1]}</a>`).join('')}</nav>`;
    if (!d) return entete + `<p class="vide">${x.illisible ? 'Ce dossier n’a pas une forme lisible par cette version de Hello GO.' : 'Aucun dossier enregistré pour le moment.'}</p>`;
    if (onglet === 'suivi') return entete + vueSuivi(d);
    if (onglet === 'mots') return entete + vueMotsSources(d);
    if (onglet === 'oraux') return entete + vueOraux(d);
    if (onglet === 'pistes') return entete + vuePistes(d);
    if (onglet === 'retours') return entete + vueRetours();
    if (onglet === 'ia') return entete + vueIA(d);
    return entete + vuePlan(d);
  }
  function vuePlan(d) {
    const R0 = R.reperes(d), etq = (v) => (D.ETIQUETTES.find((t) => t[0] === v && v) || [])[1];
    const motsDe = (ids) => (ids || []).map((i) => d.mots.find((m) => m.id === i)).filter(Boolean);
    const srcDe = (ids) => (ids || []).map((i) => d.sources.find((m) => m.id === i)).filter(Boolean);
    const bilan = R.pour(P.eleve.retours, 'bilan', '');
    return `<section class="carte"><h2>Bilan</h2>${bilan.map(unRetour).join('')}${outil('bilan', '', 'Écrire un bilan')}</section>
    ${blocQuiz(d)}
    ${d.questions.length ? '' : '<p class="vide">Pas encore de question.</p>'}
    ${d.questions.map((q) => { const v = R.validation(P.eleve.retours, q.id); return `<section class="carte question-prof">
      <p class="sur-titre">Question · ${q.statut === 'validee' ? 'validée' : q.statut === 'proposee' ? 'proposée' : 'brouillon'}${v ? ' · votre avis : ' + (v.etat === 'validee' ? 'validée' : 'à retravailler') : ''}</p>
      <p class="titre-question lecture">${e(q.titre || 'Question sans titre')}</p>
      <p><button class="mini" data-pa="valider" data-q="${e(q.id)}" data-v="validee">Valider</button> <button class="mini" data-pa="valider" data-q="${e(q.id)}" data-v="retravailler">À retravailler</button>
        ${outil('question', q.id)} <button class="mini" data-pa="corriger" data-k="q" data-i="${e(q.id)}">Corriger</button> <button class="mini" data-pa="pdf" data-q="${e(q.id)}">PDF</button></p>
      ${v && v.texte ? '<div class="retour-prof"><p>' + e(v.texte) + '</p></div>' : ''}${retoursDe('question', q.id)}
      ${q.parties.map((pa) => `<div class="partie"><div class="tete"><b class="titre-partie">${e(pa.titre)}</b><span class="note">${pa.minutes ? '≈ ' + pa.minutes + ' min' : ''}</span></div>
        <ul class="points lecture">${pa.points.map((pt) => `<li class="pt"><div class="corps"><p><span class="repere">${R0.de[pt.id]}</span> ${etq(pt.etiquette) ? '<b>' + e(etq(pt.etiquette)) + ' :</b> ' : ''}${e(pt.texte || '(point vide)')}</p>
          <div class="ligne">${motsDe(pt.mots).map((m) => `<span class="etq mot">${e(m.mot || 'mot')}</span>`).join('')}${srcDe(pt.sources).map((s) => `<span class="etq src">${e(s.titre || 'source')}</span>`).join('')}
          ${outil('point', pt.id)} <button class="mini" data-pa="corriger" data-k="pt" data-i="${e(pt.id)}">Corriger</button></div>${retoursDe('point', pt.id)}</div></li>`).join('') || '<li class="note">(aucun point)</li>'}</ul></div>`).join('')}
      <h3>Questions préparées pour l’échange</h3>
      ${(q.echange || []).length ? `<ul class="simples">${q.echange.map((x) => `<li><div><p><span class="repere">${R0.de[x.id]}</span> ${e(x.question)}</p>${x.reponse ? `<p class="note">${e(x.reponse)}</p>` : ''}${retoursDe('echange', x.id)}</div>${outil('echange', x.id)}</li>`).join('')}</ul>` : '<p class="note">Aucune.</p>'}
      <p><button class="mini" data-pa="suggerer-question" data-q="${e(q.id)}">Suggérer une question pour l’échange</button></p>
      ${P.eleve.retours.items.filter((x) => x.type === 'question' && (x.qid === q.id || !x.qid)).map((x) => `<div class="retour-prof"><p><b>Question suggérée :</b> ${e(x.texte)}</p><button class="mini discret" data-pa="retirer" data-r="${e(x.id)}">Retirer</button></div>`).join('')}
    </section>`; }).join('')}`;
  }
  // Les quiz « Vérifie que tu as compris » de l'élève (le dossier est déjà relu par dossierValide) : scores, date, essais,
  // et les questions ratées au dernier essai, avec leur texte (celui de la page, jamais celui du dossier).
  function blocQuiz(d) {
    return `<section class="carte"><h2>Quiz de compréhension</h2>${D.COMPRENDRE.map((z) => { const r = (d.comprendre || {})[z.id], t = A.surSalve(z);
      if (!r || !r.essais) return `<p><b>${e(z.titre)}</b> <span class="note">pas encore fait</span></p>`;
      const rates = (Array.isArray(r.rates_toutes) ? r.rates_toutes : r.rates || []).map((id) => z.questions.find((q) => q.id === id)).filter(Boolean);
      // (un score d'une version qui aurait plus de questions est ramené au total de cette page)
      return `<p><b>${e(z.titre)}</b> · meilleur score ${Math.min(r.meilleur, t)}/${t} · dernier ${Math.min(r.dernier, t)}/${t} · ${r.essais} essai${r.essais > 1 ? 's' : ''}${r.le ? ' · le ' + e(r.le) : ''} · ${A.suiviQuiz(d, z).nVues} questions différentes déjà vues sur ${z.questions.length}</p>
        ${rates.length ? `<p class="note">Ratées au dernier essai :</p><ul class="quiz-rates">${rates.map((q) => `<li>${e(q.q)}</li>`).join('')}</ul>` : ''}`; }).join('')}</section>`;
  }
  // Le suivi d'un·e élève : ses jours de visite (notés par sa page depuis la version 1.5.0), en chiffres et mois par mois,
  // et ses hauts faits dans l'ordre où ils ont été gagnés. Puis l'export de son dossier en Markdown.
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const enListe = (l) => (l.length > 1 ? l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1] : l.join(''));
  function frise(st, maintenant) {
    const auj = A.jourLocal(maintenant), fin = auj.slice(0, 7), vus = new Set(st.jours);
    let [an, mo] = st.depuis.slice(0, 7).split('-').map(Number); const [anF, moF] = fin.split('-').map(Number);
    if ((anF - an) * 12 + (moF - mo) > 12) { an = moF === 12 ? anF : anF - 1; mo = moF === 12 ? 1 : moF + 1; } // les 13 derniers mois au plus
    const mois = [];
    for (;;) { mois.push([an, mo]); if (an === anF && mo === moF) break; mo++; if (mo > 12) { mo = 1; an++; } }
    return mois.reverse().map(([a, m]) => {
      const nb = new Date(a, m, 0).getDate(), z = (k) => (k < 10 ? '0' : '') + k, cle = (j) => a + '-' + z(m) + '-' + z(j), jours = [];
      for (let j = 1; j <= nb; j++) if (vus.has(cle(j))) jours.push(j);
      return `<div class="mois"><h4>${MOIS[m - 1]} ${a} · ${pl(jours.length, 'jour', 'jours')}</h4>
        <ol class="frise" aria-hidden="true">${Array.from({ length: nb }, (_, i) => i + 1).map((j) => `<li class="${vus.has(cle(j)) ? 'vu' : ''}${cle(j) === auj ? ' auj' : ''}${cle(j) > auj ? ' futur' : ''}">${j}</li>`).join('')}</ol>
        <p class="note">${jours.length ? 'Jours de visite : ' + (jours.length === 1 ? 'le ' : 'les ') + enListe(jours.map(String)) + ' ' + MOIS[m - 1] + '.' : 'Aucune visite ce mois-ci.'}</p></div>`;
    }).join('');
  }
  function vueSuivi(d) {
    const x = P.eleve, maintenant = new Date(), st = A.statsVisites(d, maintenant), hf = A.hautsFaitsDates(d);
    const visites = st.total ? `<ul class="chiffres-suivi"><li><b>${st.j7}</b> sur les 7 derniers jours</li><li><b>${st.j30}</b> sur les 30 derniers jours</li><li><b>${st.total}</b> depuis le ${e(dateJour(st.depuis, true))}</li></ul>
        <p class="note">L’historique des visites commence le ${e(dateJour(st.depuis, true))}, avec la mise à jour de Hello GO (version 1.5.0) : les visites d’avant ne sont pas connues. Inscription : ${e(date(x.cree_le))}. Un jour compte dès que l’élève ouvre Hello GO, sur n’importe quel appareil.</p>
        ${frise(st, maintenant)}`
      : `<p class="vide">Aucun jour de visite noté pour le moment. L’historique commence avec la mise à jour de Hello GO (version 1.5.0), à la prochaine visite de l’élève. Inscription : ${e(date(x.cree_le))}.</p>`;
    return `<section class="carte"><h2>Jours actifs</h2>${visites}</section>
    <section class="carte"><h2>Hauts faits (${hf.length} sur ${A.HAUTS_FAITS.length})</h2>
      ${hf.length ? `<ol class="simples hf-chrono">${hf.map((h) => `<li><span><b>${h.le ? e(dateJour(h.le, true)) : 'Date inconnue'}</b> · ${e(h.titre)}</span></li>`).join('')}</ol>
        <p class="note">Dans l’ordre où ils ont été gagnés. Seul·e l’élève et vous les voyez : aucun classement.</p>` : '<p class="vide">Aucun haut fait pour le moment.</p>'}</section>
    <section class="carte"><h2>Télécharger son dossier</h2>
      <p><button data-pa="md-eleve">Son dossier en Markdown</button></p>
      <label class="coche"><input type="checkbox" id="md-eleve-retours"> Inclure mes retours</label>
      <label class="coche"><input type="checkbox" id="md-eleve-code"> Inclure son code</label>
      <p class="note">Le PDF de chaque question est dans l’onglet « Plan ».</p></section>`;
  }
  function vueMotsSources(d) {
    const R0 = R.reperes(d), demandes = P.eleve.retours.items.filter((x) => x.type === 'definir');
    return `<h2>Lexique</h2>
    <p><button class="mini" data-pa="definir">Demander une définition</button></p>
    ${demandes.map((x) => `<div class="retour-prof"><p><b>Mot demandé :</b> ${e(x.mot)}${x.texte ? ' · ' + e(x.texte) : ''}</p><button class="mini discret" data-pa="retirer" data-r="${e(x.id)}">Retirer</button></div>`).join('')}
    ${d.mots.length ? '' : '<p class="vide">Aucun mot.</p>'}
    ${d.mots.map((m) => `<section class="carte"><p><span class="repere">${R0.de[m.id]}</span> <b>${e(m.mot || '(sans nom)')}</b> <span class="badge ${A.motComplet(m) ? 'validee' : 'brouillon'}">${A.motComplet(m) ? 'Complet' : 'À compléter'}</span></p>
      <p><span class="note">Source :</span> ${e(m.defSource || '—')}${m.sourceTexte ? ' (' + e(m.sourceTexte) + ')' : ''}</p><p><span class="note">Avec ses mots :</span> ${e(m.defMoi || '—')}</p>
      ${m.analogie ? `<p><span class="note">Image :</span> ${e(m.analogie)}</p>` : ''}${retoursDe('mot', m.id)}
      <p>${outil('mot', m.id)} <button class="mini" data-pa="corriger" data-k="mot" data-i="${e(m.id)}">Corriger</button></p></section>`).join('')}
    <h2>Sources</h2>
    <p><button class="mini" data-pa="ressource">Suggérer une ressource</button></p>
    ${P.eleve.retours.items.filter((x) => x.type === 'ressource').map((x) => `<div class="retour-prof"><p><b>Ressource suggérée :</b> ${e(x.titre || x.url)} · ${e(x.url)}${x.verifier ? ' · <i>lien à vérifier</i>' : ''}</p>${x.texte ? '<p>' + e(x.texte) + '</p>' : ''}<button class="mini discret" data-pa="retirer" data-r="${e(x.id)}">Retirer</button></div>`).join('')}
    ${d.sources.length ? '' : '<p class="vide">Aucune source.</p>'}
    ${d.sources.map((s) => `<section class="carte"><p><span class="repere">${R0.de[s.id]}</span> ${e(A.reference(s) || '(source sans titre)')}</p>
      ${s.retiens ? `<p><span class="note">Ce qu’il ou elle en retient :</span> ${e(s.retiens)}</p>` : ''}${retoursDe('source', s.id)}
      <p>${outil('source', s.id)} <button class="mini" data-pa="corriger" data-k="src" data-i="${e(s.id)}">Corriger</button></p></section>`).join('')}`;
  }
  function vueOraux(d) {
    return d.oraux.map((o) => { const n = Object.keys(o.auto || {}).length, ev = R.evaluation(P.eleve.retours, o.id);
      return `<section class="carte"><h2>${e(o.nom)}</h2><p class="note">${o.date ? e(o.date) + ' · ' : ''}${o.video ? 'vidéo déposée' : 'pas de vidéo signalée'} · auto-évaluation ${n}/5</p>
        <form class="grille-prof" data-oral="${e(o.id)}">${D.GRILLE.map((c) => `<fieldset class="critere"><legend>${e(c.titre)} <span class="note">(élève : ${(o.auto || {})[c.id] || '–'})</span></legend>
          ${[1, 2, 3, 4].map((i) => `<label class="niveau"><input type="radio" name="${c.id}" value="${i}"${ev && ev.notes[c.id] === i ? ' checked' : ''}><span><b>${i}</b> ${e(c.niveaux[i - 1])}</span></label>`).join('')}</fieldset>`).join('')}
          <label>Votre commentaire<textarea name="texte" rows="3">${e(ev ? ev.texte : '')}</textarea></label>
          <button type="button" class="principal" data-pa="evaluer" data-o="${e(o.id)}">${ev ? 'Mettre à jour l’évaluation' : 'Enregistrer l’évaluation'}</button></form>
        ${o.objectifs ? `<p><span class="note">Ses objectifs :</span> ${e(o.objectifs)}</p>` : ''}${retoursDe('oral', o.id)}<p>${outil('oral', o.id)}</p></section>`; }).join('') || '<p class="vide">Aucun oral.</p>';
  }
  function vuePistes(d) {
    return d.pistes.map((p) => `<section class="carte"><p class="gros">${e(p.titre)}</p>${p.pourquoi ? `<p>${e(p.pourquoi)}</p>` : ''}
      ${(p.idees || []).filter((t) => t.trim()).length ? `<p class="note">Idées : ${(p.idees || []).filter((t) => t.trim()).map(e).join(' · ')}</p>` : ''}
      ${(p.candidates || []).filter((t) => t.trim()).length ? `<p class="note">Questions possibles : ${(p.candidates || []).filter((t) => t.trim()).map(e).join(' · ')}</p>` : ''}
      ${retoursDe('piste', p.id)}<p>${outil('piste', p.id)}</p></section>`).join('') || '<p class="vide">Aucune piste.</p>';
  }
  function vueRetours() {
    const l = P.eleve.retours.items;
    return l.length ? `<ul class="liste">${l.map((x) => `<li class="carte"><p class="sur-titre">${NOMS[x.type]}${x.type === 'commentaire' ? ' · ' + e(x.cible.type) : ''} · ${e(date(x.le))}</p>
      <p>${e(x.type === 'definir' ? x.mot + (x.texte ? ' : ' + x.texte : '') : x.type === 'ressource' ? (x.titre || x.url) + ' · ' + x.url : x.texte)}</p>${x.ia ? '<span class="mention-ia">Préparé avec l’aide d’une IA, relu par vous</span>' : ''}
      <button class="mini discret" data-pa="retirer" data-r="${e(x.id)}">Retirer</button></li>`).join('')}</ul>` : '<p class="vide">Aucun retour pour le moment.</p>';
  }
  // ---------- Avec une IA : un·e élève à la fois, sans prénom ni code ----------
  function vueIA(d) {
    const ia = P.ia && P.ia.eleve === P.eleve.id ? P.ia : null;
    return `<section class="carte"><h2>1. Le dossier, en texte simple</h2>
      <p>Le texte ne contient ni le prénom ni le code de l’élève. Chaque élément a un repère stable : P3 (point), M1 (mot), S2 (source), Q1 (question de l’échange). Les consignes sont au début, le format de réponse à la fin.</p>
      <p><button data-pa="copier-ia">Copier pour l’IA</button> <button data-pa="telecharger-ia">Télécharger le texte</button></p></section>
    <section class="carte"><h2>2. La réponse de l’IA</h2>
      <label>Collez ici la réponse<textarea id="prof-ia" rows="6" placeholder="@P3 …">${e(ia ? ia.brut : '')}</textarea></label>
      <p class="note">Seules les lignes qui commencent par @ comptent. Chaque ligne devient un brouillon, que vous relisez avant d’envoyer.</p>
      <button data-pa="lire-ia">Lire la réponse</button></section>
    ${ia ? `<section class="carte"><h2>3. Les brouillons (${ia.brouillons.length})</h2>
      ${ia.brouillons.map((x, i) => `<div class="brouillon"><p class="sur-titre">${e(NOMS[x.type])}${x.repere ? ' · ' + e(x.repere) : ''}${x.type === 'definir' ? ' · ' + e(x.mot) : ''}${x.type === 'ressource' ? ' · ' + e(x.url) + ' (lien à vérifier)' : ''}</p>
        <textarea data-brouillon="${i}" rows="2" aria-label="Brouillon ${i + 1}">${e(x.texte)}</textarea><button class="mini discret" data-pa="retirer-brouillon" data-i="${i}">Supprimer</button></div>`).join('')}
      ${ia.inconnues.length ? `<h3>Lignes non reconnues</h3><ul class="simples">${ia.inconnues.map((l) => `<li><code>${e(l)}</code></li>`).join('')}</ul>` : ''}
      ${ia.ignorees ? `<p class="note">${ia.ignorees} ligne${ia.ignorees > 1 ? 's' : ''} sans @ ignorée${ia.ignorees > 1 ? 's' : ''}.</p>` : ''}
      ${ia.brouillons.length ? `<p class="note">L’élève verra la mention « préparé avec l’aide d’une IA, relu par ton enseignant·e ».</p><button class="principal" data-pa="envoyer-ia">Envoyer ${ia.brouillons.length} retour${ia.brouillons.length > 1 ? 's' : ''}</button>` : ''}</section>` : ''}`;
  }

  // ---------- Les retours : enregistrés sur la version connue ; en cas de conflit, refaits sur la version reçue ----------
  function modifierRetours(changer, message) {
    const x = P.eleve, essai = (n) => {
      const r = JSON.parse(JSON.stringify(x.retours)); changer(r); const propre = R.nettoyer(r);
      return appel('go_prof_retours', { p_eleve: x.id, p_retours: propre, p_version_connue: x.retours_version }).then((res) => {
        if (res.ok) { x.retours = propre; x.retours_version = res.retours_version; rendre(); if (message) toast(message); return true; }
        if (res.conflit && n < 2) { x.retours = R.nettoyer(res.retours); x.retours_version = res.retours_version; return essai(n + 1); }
        toast(res.message || 'Les retours n’ont pas pu être enregistrés.'); return false;
      });
    };
    return essai(0);
  }
  const ajouter = (item, message) => modifierRetours((r) => { r.items.push(item); }, message || 'Retour envoyé.');

  // Une petite fenêtre de saisie (le dialogue de la page), qui rend les valeurs des champs.
  function demander(titre, champs, valider) {
    const dlg = $('#dialogue');
    dlg.innerHTML = `<form method="dialog"><h2 id="titre-dialogue">${e(titre)}</h2>
      ${champs.map((c, i) => `<label>${e(c.libelle)}${c.long ? `<textarea name="c${i}" rows="4">${e(c.valeur || '')}</textarea>` : `<input type="${c.type || 'text'}" name="c${i}" value="${e(c.valeur || '')}" autocomplete="off">`}</label>`).join('')}
      <p class="bas"><button type="button" data-a="fermer-dialogue">Annuler</button><button class="principal" value="ok">Envoyer</button></p></form>`;
    dlg.setAttribute('aria-labelledby', 'titre-dialogue'); dlg.returnValue = '';
    dlg.onclose = () => { if (dlg.returnValue === 'ok') valider(champs.map((c, i) => (dlg.querySelector('[name=c' + i + ']').value || '').trim())); };
    dlg.showModal();
  }
  function telecharger(nom, contenu, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([contenu], { type: type })); a.download = nom; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const jour = () => new Date().toISOString().slice(0, 10);
  function exporter(classe) {
    return appel('go_prof_export', classe ? { p_classe: classe } : {}).then((r) => {
      if (!r.ok) return toast(r.message);
      telecharger('hello-go-export-' + jour() + '.json', JSON.stringify(r, null, 1), 'application/json'); toast('Export téléchargé. Gardez-le hors de tout dépôt public : il contient les codes et les dossiers.');
    });
  }
  // Le QR code du lien de classe : la bibliothèque locale (vendor/qrcode.js) n'est chargée que sur cette page.
  function dessinerQR() {
    const z = $('#qr'); if (!z || !P.classe || !P.classe.classe) return;
    const faire = () => { const q = racine.qrcode(0, 'M'); q.addData(lien() + P.classe.classe.code); q.make(); z.innerHTML = q.createSvgTag({ scalable: true, margin: 2 }); };
    if (racine.qrcode) return faire();
    const s = document.createElement('script'); s.src = 'vendor/qrcode.js'; s.onload = faire; document.head.appendChild(s);
  }
  new MutationObserver(() => { const z = $('#qr'); if (z && !z.firstChild) dessinerQR(); }).observe(document.getElementById('vue'), { childList: true });

  // Corriger un texte de l'élève (rare) : directement dans son dossier, sans annonce.
  function corriger(k, id) {
    const d = P.eleve.dossier; let obj = null, champs = [];
    if (k === 'q') { obj = d.questions.find((q) => q.id === id); champs = [['titre', 'La question']]; }
    if (k === 'pt') { d.questions.forEach((q) => q.parties.forEach((pa) => pa.points.forEach((p) => { if (p.id === id) obj = p; }))); champs = [['texte', 'Le point']]; }
    if (k === 'mot') { obj = d.mots.find((m) => m.id === id); champs = [['mot', 'Le mot'], ['defSource', 'Définition d’une source'], ['defMoi', 'Avec ses mots'], ['analogie', 'Image']]; }
    if (k === 'src') { obj = d.sources.find((m) => m.id === id); champs = [['titre', 'Titre'], ['auteur', 'Auteur·e ou site'], ['lien', 'Lien'], ['date', 'Date']]; }
    if (!obj) return;
    demander('Corriger le texte de l’élève', champs.map((c) => ({ libelle: c[1], valeur: obj[c[0]], long: c[0] !== 'mot' && c[0] !== 'date' && c[0] !== 'lien' })), (v) => {
      const copie = JSON.parse(JSON.stringify(d)); let o2 = null;
      if (k === 'q') o2 = copie.questions.find((q) => q.id === id);
      if (k === 'pt') copie.questions.forEach((q) => q.parties.forEach((pa) => pa.points.forEach((p) => { if (p.id === id) o2 = p; })));
      if (k === 'mot') o2 = copie.mots.find((m) => m.id === id);
      if (k === 'src') o2 = copie.sources.find((m) => m.id === id);
      champs.forEach((c, i) => { o2[c[0]] = v[i]; });
      if (!A.dossierValide(copie)) return toast('Cette correction rendrait le dossier illisible.');
      appel('go_prof_corriger', { p_eleve: P.eleve.id, p_dossier: copie, p_version_connue: P.eleve.dossier_version, p_resume: R.resume(copie) }).then((r) => {
        if (r.ok) { P.eleve.dossier = copie; P.eleve.dossier_version = r.dossier_version; marquerVu(P.eleve.id, r.dossier_version); rendre(); return toast('Correction enregistrée.'); }
        if (r.conflit) { P.eleve.dossier = A.dossierValide(r.dossier) ? r.dossier : P.eleve.dossier; P.eleve.dossier_version = r.dossier_version; rendre(); return toast('L’élève vient de modifier son dossier : le voici à jour. Refaites la correction si elle est encore utile.'); }
        toast(r.message || 'La correction n’a pas pu être enregistrée.');
      });
    });
  }

  // ---------- Les actions ----------
  const actions = {
    ouvrir() {
      const code = R.lireCode($('#prof-code').value); if (code.replace(/-/g, '').length < 8) return toast('Écrivez votre code : 3 mots et 4 chiffres.');
      const rester = $('#prof-rester').checked; P.code = code; P.erreur = null;
      ouvrir().then(() => { if (P.ouvert) { garderCode(code, rester); } else { const m = P.erreur; oublierCode(); P.erreur = m; } rendre(); });
    },
    'creer-espace'(b) {
      const nom = ($('#prof-nom').value || '').trim(); if (nom.length < 2) return toast('Écrivez le nom que verront vos élèves (par exemple « M. Martin »).');
      b.disabled = true;
      EL.rpc('go_prof_creer_espace', { p_nom: nom }).then((r) => { b.disabled = false; if (!r.ok) return toast(r.message); P.nouveauCode = r.code_affiche; rendre(); },
        () => { b.disabled = false; toast('Pas de réseau : vérifiez votre connexion, puis réessayez.'); });
    },
    'code-note'() { const rester = $('#prof-rester') && $('#prof-rester').checked; garderCode(P.nouveauCode, rester); P.nouveauCode = null; P.ouvert = null; rendre(); },
    quitter() { oublierCode(); location.hash = '#/prof'; rendre(); },
    'creer-classe'() { const nom = ($('#prof-classe-nom').value || '').trim(); if (!nom) return toast('Donnez un nom à la classe.');
      appel('go_prof_creer_classe', { p_nom: nom }).then((r) => { if (!r.ok) return toast(r.message); P.ouvert = null; location.hash = '#/prof/classe/' + r.id; }); },
    exporter() { exporter(null); },
    'exporter-classe'() { exporter(P.classe.classe.id); },
    debloquer() { appel('go_prof_debloquer_reseau').then((r) => toast(r.ok ? 'Réseau débloqué pour Hello GO.' : r.message)); },
    'changer-code'() {
      if (!window.confirm('Votre code actuel ne marchera plus. Le nouveau ne sera montré qu’une fois. Continuer ?')) return;
      appel('go_prof_nouveau_code').then((r) => { if (!r.ok) return toast(r.message); oublierCode(); P.nouveauCode = r.code_affiche; location.hash = '#/prof'; rendre(); });
    },
    'supprimer-espace'() {
      if ($('#prof-supprimer').value.trim() !== 'SUPPRIMER') return toast('Écrivez SUPPRIMER pour confirmer.');
      appel('go_prof_supprimer_espace', { p_confirmation: 'SUPPRIMER' }).then((r) => { if (!r.ok) return toast(r.message); oublierCode(); location.hash = '#/prof'; rendre(); toast('Votre espace est supprimé.'); });
    },
    'copier-lien'() { const l = lien() + P.classe.classe.code; (navigator.clipboard ? navigator.clipboard.writeText(l) : Promise.reject()).then(() => toast('Lien copié.'), () => toast(l)); },
    inscriptions(b) { appel('go_prof_ouvrir_inscriptions', { p_classe: P.classe.classe.id, p_ouverte: b.dataset.v === '1' }).then((r) => { if (!r.ok) return toast(r.message); P.classe.classe.ouverte = r.ouverte; P.ouvert = null; charger('ouvrir', ouvrir); rendre(); }); },
    'renommer-classe'() { const nom = $('#prof-renommer-classe').value.trim(); appel('go_prof_renommer_classe', { p_classe: P.classe.classe.id, p_nom: nom }).then((r) => { if (!r.ok) return toast(r.message); P.classe.classe.nom = r.nom; P.ouvert = null; rendre(); toast('Classe renommée.'); }); },
    'supprimer-classe'() {
      const c = P.classe.classe; if (window.prompt('Pour supprimer la classe, ses élèves et leurs dossiers, écrivez son nom : ' + c.nom) !== c.nom) return toast('Rien n’est supprimé.');
      appel('go_prof_supprimer_classe', { p_classe: c.id }).then((r) => { if (!r.ok) return toast(r.message); P.ouvert = null; P.classe = null; location.hash = '#/prof'; toast('Classe supprimée.'); });
    },
    'voir-codes'() { P.codesVus = !P.codesVus; rendre(); },
    filtre(b) { P.filtre = b.dataset.v; rendre(); const t = $('[data-pa=filtre][data-v="' + b.dataset.v + '"]'); if (t) t.focus(); },
    tri(b) { P.tri = b.dataset.v; rendre(); const t = $('[data-pa=tri][data-v="' + b.dataset.v + '"]'); if (t) t.focus(); },
    'md-eleve'() { const x = P.eleve; if (!x || !x.dossier) return;
      const t = racine.HGExport.dossier(x.dossier, { titre: 'Dossier de Grand oral · ' + x.pseudo, retours: x.retours, avecRetours: $('#md-eleve-retours').checked, code: $('#md-eleve-code').checked ? x.code_affiche : null });
      telecharger('hello-go-' + O().nomDeFichier(x.pseudo || 'eleve') + '-' + jour() + '.md', t, 'text/markdown;charset=utf-8'); toast('Dossier téléchargé en Markdown.'); },
    'md-classe'(b) { const k = P.classe.classe, avecRetours = $('#md-classe-retours').checked, avecCodes = $('#md-classe-codes').checked; b.disabled = true;
      appel('go_prof_export', { p_classe: k.id }).then((r) => { b.disabled = false; if (!r.ok) return toast(r.message);
        const c = (r.classes || []).find((y) => y.id === k.id) || { eleves: [] };
        const eleves = (c.eleves || []).map((y) => ({ pseudo: y.pseudo, code: y.code_affiche, dossier: y.dossier && A.dossierValide(y.dossier) ? y.dossier : null, retours: R.nettoyer(y.retours) }));
        telecharger('hello-go-' + O().nomDeFichier(k.nom || 'classe') + '-' + jour() + '.md', racine.HGExport.classe(k.nom, eleves, { avecRetours: avecRetours, avecCodes: avecCodes }), 'text/markdown;charset=utf-8');
        toast(avecCodes ? 'Classe téléchargée en Markdown, avec les codes : gardez ce fichier pour vous.' : 'Classe téléchargée en Markdown.'); }); },
    'voir-code'(b) { const x = P.classe.eleves.find((y) => y.id === b.dataset.e), z = $('[data-code="' + b.dataset.e + '"]'); if (x && z) { z.textContent = x.code_affiche; b.remove(); } },
    'imprimer-codes'() { document.body.classList.add('impression-codes'); window.print(); setTimeout(() => document.body.classList.remove('impression-codes'), 500); },
    'renommer-eleve'(b) { const x = P.classe.eleves.find((y) => y.id === b.dataset.e);
      demander('Prénom et initiale du nom', [{ libelle: 'Jamais le nom complet', valeur: x.pseudo }], (v) => appel('go_prof_renommer_eleve', { p_eleve: x.id, p_pseudo: v[0] }).then((r) => { if (!r.ok) return toast(r.message); x.pseudo = r.pseudo; rendre(); })); },
    'code-eleve'(b) { const x = P.classe.eleves.find((y) => y.id === b.dataset.e);
      if (!window.confirm('Donner un nouveau code à ' + x.pseudo + ' ? L’ancien ne marchera plus, sur aucun appareil.')) return;
      appel('go_prof_nouveau_code_eleve', { p_eleve: x.id }).then((r) => { if (!r.ok) return toast(r.message); x.code_affiche = r.code_affiche; P.codesVus = false; rendre(); toast('Nouveau code de ' + x.pseudo + ' : ' + r.code_affiche); }); },
    'supprimer-eleve'(b) { const x = P.classe.eleves.find((y) => y.id === b.dataset.e);
      if (!window.confirm('Supprimer ' + x.pseudo + ' et son dossier ? C’est définitif.')) return;
      appel('go_prof_supprimer_eleve', { p_eleve: x.id }).then((r) => { if (!r.ok) return toast(r.message); P.classe.eleves = P.classe.eleves.filter((y) => y.id !== x.id); P.ouvert = null; rendre(); }); },
    commenter(b) { const t = b.dataset.t, id = b.dataset.c;
      demander(t === 'bilan' ? 'Un bilan pour l’élève' : 'Un commentaire', [{ libelle: 'Votre texte (l’élève le verra près de l’élément)', long: true }], (v) => { if (v[0]) ajouter(R.nouveau('commentaire', { cible: { type: t, id: t === 'bilan' ? '' : id }, texte: v[0] })); }); },
    definir() { demander('Demander une définition', [{ libelle: 'Le mot' }, { libelle: 'Pourquoi (facultatif)', long: true }], (v) => { if (v[0]) ajouter(R.nouveau('definir', { mot: v[0], texte: v[1] })); }); },
    ressource() { demander('Suggérer une ressource', [{ libelle: 'Le lien (https://…)', type: 'url' }, { libelle: 'Le titre' }, { libelle: 'Ce qu’elle apporte', long: true }], (v) => {
      if (!R.lienSur(v[0])) return toast('Le lien doit commencer par https:// ou http://.'); ajouter(R.nouveau('ressource', { url: v[0], titre: v[1], texte: v[2] })); }); },
    'suggerer-question'(b) { demander('Une question pour l’échange', [{ libelle: 'La question que le jury pourrait poser', long: true }], (v) => { if (v[0]) ajouter(R.nouveau('question', { texte: v[0], qid: b.dataset.q })); }); },
    valider(b) { const ok = b.dataset.v === 'validee';
      demander(ok ? 'Valider la question' : 'Demander de retravailler la question', [{ libelle: ok ? 'Un mot pour l’élève (facultatif)' : 'Ce qu’il faut retravailler', long: true }], (v) => ajouter(R.nouveau('validation', { qid: b.dataset.q, etat: b.dataset.v, texte: v[0] }))); },
    evaluer(b) { const f = $('form[data-oral="' + b.dataset.o + '"]'), notes = {};
      D.GRILLE.forEach((c) => { const x = f.querySelector('input[name="' + c.id + '"]:checked'); if (x) notes[c.id] = +x.value; });
      if (!Object.keys(notes).length) return toast('Choisissez au moins un niveau.');
      modifierRetours((r) => { r.items = r.items.filter((x) => !(x.type === 'evaluation' && x.oral === b.dataset.o)); r.items.push(R.nouveau('evaluation', { oral: b.dataset.o, notes: notes, texte: f.querySelector('[name=texte]').value.trim() })); }, 'Évaluation enregistrée.'); },
    retirer(b) { if (window.confirm('Retirer ce retour ? L’élève ne le verra plus.')) modifierRetours((r) => { r.items = r.items.filter((x) => x.id !== b.dataset.r); }, 'Retour retiré.'); },
    corriger(b) { corriger(b.dataset.k, b.dataset.i); },
    pdf(b) { const q = P.eleve.dossier.questions.find((x) => x.id === b.dataset.q); if (q) O().pdf(q, b, P.eleve.dossier); },
    'copier-ia'() { const t = R.texteIA(P.eleve.dossier); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Texte copié : collez-le dans l’IA de votre choix.'), () => toast('La copie n’a pas marché : téléchargez le texte.')); },
    'telecharger-ia'() { telecharger('hello-go-pour-ia-' + jour() + '.txt', R.texteIA(P.eleve.dossier), 'text/plain;charset=utf-8'); },
    'lire-ia'() { const brut = $('#prof-ia').value; P.ia = Object.assign({ eleve: P.eleve.id, brut: brut }, R.lireIA(brut, P.eleve.dossier)); rendre(); },
    'retirer-brouillon'(b) { garderBrouillons(); P.ia.brouillons.splice(+b.dataset.i, 1); rendre(); },
    'envoyer-ia'() { garderBrouillons(); const l = P.ia.brouillons.filter((x) => (x.texte || '').trim() || x.type === 'definir' || x.type === 'ressource');
      modifierRetours((r) => { l.forEach((x) => { const y = Object.assign({}, x); delete y.repere; r.items.push(y); }); }, l.length + ' retour' + (l.length > 1 ? 's' : '') + ' envoyé' + (l.length > 1 ? 's' : '') + '.')
        .then((ok) => { if (ok) { P.ia = null; location.hash = '#/prof/eleve/' + P.eleve.id + '/retours'; } }); },
  };
  function garderBrouillons() { document.querySelectorAll('[data-brouillon]').forEach((t) => { const x = P.ia.brouillons[+t.dataset.brouillon]; if (x) x.texte = t.value; }); }
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-pa]'); if (!b || b.disabled || !location.hash.startsWith('#/prof')) return;
    const f = actions[b.dataset.pa]; if (f) { ev.preventDefault(); f(b); }
  });
  // Revenir sur le tableau ou sur un dossier recharge ses données (le travail des élèves avance pendant ce temps).
  window.addEventListener('hashchange', () => {
    const h = location.hash;
    if (h === '#/prof') P.ouvert = null;
    if (/^#\/prof\/classe\//.test(h)) { P.classe = null; P.eleve = null; }
    if (/^#\/prof\/eleve\/[^/]+$/.test(h) && P.eleve && h.split('/')[3] !== P.eleve.id) P.eleve = null;
  }, true);

  racine.HGProf = { vue: vue, etat: P };
})(window);
