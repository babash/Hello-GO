// Hello GO : la liaison avec la base (Supabase, projet partagé des applications du site).
// Chaque appel est un POST vers une fonction go_… (jamais de GET : un code ne doit pas rester dans les journaux).
// La clé est la clé « publishable » du projet : publique par conception, envoyée dans l'en-tête apikey seulement.
// Pour installer ta copie : mets l'adresse et la clé publique de ton propre projet (voir supabase/LISEZMOI.md).
(function (racine) {
  'use strict';
  const CONFIG = racine.HG_CONFIG || {
    URL: 'https://cukahpyqkljiddmimpyi.supabase.co',
    CLE: 'sb_publishable_dYwCrwaqiDOm8knczJu3Kw_5InHwyPB',
  };
  const CLE_SESSION = 'hellogo:session:v1', CLE_RETOURS = 'hellogo:retours:v1';

  // Un appel : la réponse JSON de la fonction, ou une erreur (err.reseau quand le réseau manque).
  function rpc(nom, params, options) {
    if (!/^go_[a-z_]+$/.test(nom)) return Promise.reject(new Error('fonction inconnue'));
    const o = Object.assign({ method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CONFIG.CLE }, body: JSON.stringify(params || {}) }, options || {});
    return fetch(CONFIG.URL + '/rest/v1/rpc/' + nom, o).then((r) => {
      if (!r.ok) return r.text().then((t) => { const x = new Error('Réponse ' + r.status + ' : ' + t.slice(0, 200)); x.statut = r.status; throw x; });
      return r.json();
    }, (err) => { const x = new Error('hors ligne'); x.reseau = true; x.cause = err; throw x; });
  }
  // À la fermeture de la page : l'envoi part même si la page se ferme (réponse ignorée).
  function rpcFermeture(nom, params) {
    try { fetch(CONFIG.URL + '/rest/v1/rpc/' + nom, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', apikey: CONFIG.CLE }, body: JSON.stringify(params) }).catch(() => {}); return true; }
    catch (x) { return false; }
  }

  // La session de l'élève sur cet appareil : le jeton (pas le code), et ce qu'il faut pour travailler hors ligne.
  const lire = (cle) => { try { const t = localStorage.getItem(cle); return t ? JSON.parse(t) : null; } catch (x) { return null; } };
  const ecrire = (cle, v) => { try { if (v == null) localStorage.removeItem(cle); else localStorage.setItem(cle, JSON.stringify(v)); return true; } catch (x) { return false; } };
  const uuid = (x) => typeof x === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
  function session() { const s = lire(CLE_SESSION); return s && uuid(s.jeton) ? s : null; }
  function majSession(champs) { const s = session(); if (!s) return null; Object.assign(s, champs); ecrire(CLE_SESSION, s); return s; }
  function ouvrirSession(s) { ecrire(CLE_SESSION, s); }
  function fermerSession() { ecrire(CLE_SESSION, null); ecrire(CLE_RETOURS, null); }
  const retours = () => lire(CLE_RETOURS);
  const garderRetours = (r) => ecrire(CLE_RETOURS, r);

  racine.HGEnLigne = { CONFIG, rpc, rpcFermeture, session, majSession, ouvrirSession, fermerSession, retours, garderRetours, CLE_SESSION, CLE_RETOURS, uuid };
})(window);
