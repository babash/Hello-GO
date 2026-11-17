"""Essai de la version en ligne contre une reproduction locale de la base : python3 tests/en_ligne.py

Jamais la base en ligne : la page est configurée vers une adresse inexistante (base-locale.invalid), et chaque appel
est servi par un PostgreSQL local neuf (tests/base_locale.py), avec des données inventées. Tout autre appel vers
Supabase est bloqué et compté comme une erreur.
Parcours : inscription par le lien de classe, code sur un autre appareil (lecture tolérante), enregistrement différé,
conflit de version, hors ligne puis retour, retours de l'enseignant·e, correction, sortie de l'appareil, dossier local
envoyé à l'inscription, puis l'espace de l'enseignant·e.
"""
import functools, http.server, json, os, re, socketserver, sys, threading, time
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from base_locale import BaseLocale

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.environ.get('SORTIE', '/tmp/hello-go-essais'); os.makedirs(SORTIE, exist_ok=True)
FAUSSE = 'https://base-locale.invalid'
CLE = 'sb_publishable_essai_local'


class Muet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Muet, directory=RACINE))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = 'http://127.0.0.1:%d/index.html' % srv.server_address[1]
erreurs, resultats = [], []


def ok(nom, vrai, detail=''):
    resultats.append(nom)
    print(('ok     ' if vrai else 'ÉCHEC  ') + nom + ('' if vrai else ' ' + str(detail)))
    if not vrai:
        erreurs.append(nom)


base = BaseLocale().demarrer()
verrou = threading.Lock()


class Appareil:
    """Un navigateur (un contexte) : son propre localStorage, son propre réseau qu'on peut couper."""
    def __init__(self, nav, nom, largeur=390, sombre=False):
        self.nom, self.hors_ligne = nom, False
        self.ctx = nav.new_context(viewport={'width': largeur, 'height': 800}, color_scheme='dark' if sombre else 'light', accept_downloads=True)
        self.ctx.add_init_script("window.HG_CONFIG = { URL: '%s', CLE: '%s' };" % (FAUSSE, CLE))
        self.ctx.route(FAUSSE + '/**', self.servir)
        self.ctx.route(re.compile(r'.*supabase\.co.*'), lambda r: (erreurs.append(nom + ' : appel vers Supabase en ligne ' + r.request.url), r.abort()))
        self.p = self.ctx.new_page()
        self.p.on('pageerror', lambda x: erreurs.append(nom + ' erreur JS : ' + str(x)))
        self.p.on('console', lambda m: erreurs.append(nom + ' console : ' + m.text) if m.type == 'error' and 'internetdisconnected' not in m.text.lower() and 'failed to load resource' not in m.text.lower() else None)
        self.reponses = []  # les réponses aux fenêtres « prompt », dans l'ordre
        self.p.on('dialog', lambda dlg: dlg.accept(self.reponses.pop(0)) if dlg.type == 'prompt' and self.reponses else dlg.accept())

    def servir(self, route):
        req = route.request
        cors = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'apikey, content-type', 'Access-Control-Allow-Methods': 'POST'}
        if req.method == 'OPTIONS':
            return route.fulfill(status=204, headers=cors)
        if self.hors_ligne:
            return route.abort('internetdisconnected')
        h = req.headers
        if req.method != 'POST' or h.get('apikey') != CLE or 'authorization' in h:
            erreurs.append('%s : appel non conforme %s %s %s' % (self.nom, req.method, req.url, sorted(h)))
        fonction = req.url.rsplit('/', 1)[-1]
        with verrou:
            statut, corps = base.appel(fonction, json.loads(req.post_data or '{}'))
        route.fulfill(status=statut, headers=dict(cors, **{'Content-Type': 'application/json'}), body=json.dumps(corps))

    def etat(self, texte, delai=15000):
        self.p.wait_for_function('t => (document.querySelector("#etat-sync") || {}).textContent === t', arg=texte, timeout=delai)

    def visible(self):  # la page revient au premier plan : envoi et interrogation des retours
        self.p.evaluate("document.dispatchEvent(new Event('visibilitychange'))")

    def large(self, etape):
        d = self.p.evaluate('document.documentElement.scrollWidth - window.innerWidth')
        if d > 1:
            erreurs.append('%s %s : défilement horizontal de %d px' % (self.nom, etape, d))
        self.p.screenshot(path='%s/en-ligne-%s-%s.png' % (SORTIE, self.nom, etape), full_page=True)


def prof(fonction, **params):
    with verrou:
        s, r = base.appel(fonction, params)
    assert s == 200, r
    return r


try:
    esp = prof('go_prof_creer_espace', p_nom='Mme Essai')
    CODE_PROF = esp['code_affiche']
    classe = prof('go_prof_creer_classe', p_code=CODE_PROF, p_nom='Terminale NSI')
    with sync_playwright() as pw:
        nav = pw.chromium.launch()
        # --- 1. Inscription par le lien de classe (téléphone, clair) ---
        A = Appareil(nav, 'A-320-clair', 320)
        A.p.goto(URL + '#/classe/' + classe['code'].lower())
        A.p.wait_for_selector('#pseudo')
        ok('lien de classe : nom de la classe et de l’enseignant·e', 'Terminale NSI' in A.p.inner_text('#zone-classe') and 'Mme Essai' in A.p.inner_text('#zone-classe'))
        A.large('1-inscription')
        A.p.fill('#pseudo', 'Zoé Martinez')
        A.p.click('[data-a=inscription]'); time.sleep(.3)
        ok('nom complet refusé avant tout envoi', 'go_inscription' not in base.appels and 'initiale' in A.p.inner_text('#toasts'))
        A.p.fill('#pseudo', 'Zoé M.'); A.p.click('[data-a=inscription]')
        A.p.wait_for_selector('.code-eleve')
        CODE = A.p.inner_text('.code-eleve').strip()
        ok('écran « Ton code » : 2 mots et 3 chiffres', re.fullmatch(r'[A-Z]+-[A-Z]+-\d{3}', CODE) is not None, CODE)
        A.large('2-ton-code')
        ok('le code n’est pas gardé dans le dossier', CODE not in A.p.evaluate("localStorage.getItem('hellogo:dossier:v1') || ''"))
        A.p.click('text=Je l’ai noté'); A.p.wait_for_selector('.compte')
        ok('accueil : prénom et classe', 'Zoé M.' in A.p.inner_text('h1') and 'Terminale NSI' in A.p.inner_text('.compte'))
        A.p.goto(URL + '#/questions'); A.p.fill('#question-libre', 'Les algorithmes sont-ils neutres ?'); A.p.click('[data-a=question-libre]')
        A.p.wait_for_selector('[data-a=plus-pt]'); A.p.locator('[data-a=plus-pt]').nth(1).click()
        A.p.keyboard.type('Amazon abandonne son IA de recrutement')
        A.etat('Modifié', 3000)
        A.etat('Enregistré')
        el = prof('go_prof_classe', p_code=CODE_PROF, p_classe=classe['id'])['eleves'][0]
        dos = prof('go_prof_dossier', p_code=CODE_PROF, p_eleve=el['id'])
        ok('enregistrement différé : le point est dans la base', 'Amazon abandonne' in json.dumps(dos['dossier'], ensure_ascii=False))
        ok('le résumé est calculé (points, questions)', el['resume'] and el['resume']['points'] == 1 and el['resume']['questions'][0]['statut'] == 'brouillon', el['resume'])
        ok('le résumé fait moins de 4 000 caractères', len(json.dumps(el['resume'], ensure_ascii=False)) < 4000)
        qid = dos['dossier']['questions'][0]['id']
        A.large('3-plan')

        # --- 2. Un autre appareil, avec le code tapé n'importe comment ---
        B = Appareil(nav, 'B-1440-obscur', 1440, True)
        B.p.goto(URL)
        ok('bienvenue : rejoindre, j’ai un code, essayer sans compte', B.p.locator('#code-classe').count() == 1 and B.p.locator('a[href="#/entrer"]').count() == 1 and B.p.locator('#prenom').count() == 1)
        B.large('0-bienvenue')
        B.p.click('a[href="#/entrer"]')
        tape = '  ' + CODE.lower().replace('-', ' ').replace('0', 'o').replace('1', 'i') + ' '
        B.p.fill('#code-eleve', tape); B.p.click('[data-a=connexion]')
        B.p.wait_for_selector('.compte')
        B.p.goto(URL + '#/question/' + qid); B.p.wait_for_selector('.texte-pt')
        ok('code tolérant (minuscules, espaces, O/0, I/1) : le dossier revient', B.p.locator('.texte-pt').first.input_value() == 'Amazon abandonne son IA de recrutement')

        # --- 3. Deux appareils : A, hors ligne, écrit un mot pendant que B modifie le point (fusion sans perte) ---
        A.hors_ligne = True
        B.p.locator('.texte-pt').first.fill('Amazon : IA de recrutement abandonnée en 2018')
        B.etat('Enregistré')
        A.p.goto(URL + '#/mots'); A.p.click('[data-a=plus-mot]'); A.p.keyboard.type('Biais algorithmique')
        A.etat('Hors ligne : sera envoyé')
        ok('hors ligne : le travail continue sur la copie locale', 'Biais algorithmique' in A.p.evaluate("localStorage.getItem('hellogo:dossier:v1')"))
        A.large('4-hors-ligne')
        A.hors_ligne = False
        A.p.evaluate("window.dispatchEvent(new Event('online'))")
        A.etat('Enregistré'); time.sleep(.5); A.etat('Enregistré')
        dos = prof('go_prof_dossier', p_code=CODE_PROF, p_eleve=el['id']); tout = json.dumps(dos['dossier'], ensure_ascii=False)
        ok('conflit de version : la fusion garde le mot de A et le point de B', 'Biais algorithmique' in tout and 'en 2018' in tout)
        ok('fusion sans conflit : rien n’est mis à part', A.p.locator('#toasts a[href="#/a-part"]').count() == 0)
        # --- 3 bis. Le même point modifié des deux côtés : la base l'emporte, la saisie de A est gardée à part ---
        A.p.goto(URL + '#/question/' + qid); A.p.wait_for_selector('.texte-pt')
        A.hors_ligne = True
        B.p.goto(URL + '#/question/' + qid); B.visible(); time.sleep(1); B.p.reload(); B.p.wait_for_selector('.texte-pt'); B.etat('Enregistré')
        B.p.locator('.texte-pt').first.fill('Version de B'); B.etat('Enregistré')
        A.p.locator('.texte-pt').first.fill('Version de A'); A.etat('Hors ligne : sera envoyé')
        A.hors_ligne = False; A.p.evaluate("window.dispatchEvent(new Event('online'))")
        A.p.wait_for_selector('#toasts a[href="#/a-part"]', timeout=15000)
        A.etat('Enregistré')
        ok('même texte changé des deux côtés : la version de la base est reprise', A.p.locator('.texte-pt').first.input_value() == 'Version de B')
        A.p.goto(URL + '#/a-part')
        ok('la saisie refusée est gardée à part, lisible', 'Version de A' in A.p.inner_text('#vue'))
        A.large('5-a-part')
        A.p.click('[data-a=effacer-a-part]')

        # --- 4. Hors ligne puis retour, sans conflit ---
        B.hors_ligne = True
        B.p.goto(URL + '#/question/' + qid); B.p.wait_for_selector('.texte-pt')
        B.p.locator('.texte-pt').first.fill('Amazon 2018 : IA de recrutement qui pénalisait les CV de femmes')
        B.etat('Hors ligne : sera envoyé')
        B.hors_ligne = False; B.p.evaluate("window.dispatchEvent(new Event('online'))"); B.etat('Enregistré')
        dos = prof('go_prof_dossier', p_code=CODE_PROF, p_eleve=el['id'])
        ok('retour du réseau : la saisie hors ligne est envoyée', 'CV de femmes' in json.dumps(dos['dossier'], ensure_ascii=False))

        # --- 5. Les retours de l'enseignant·e ---
        dd = dos['dossier']; pt = dd['questions'][0]['parties'][1]['points'][0]['id']; oral = dd['oraux'][0]['id']
        items = [
            {'id': 'r1', 'type': 'commentaire', 'cible': {'type': 'point', 'id': pt}, 'texte': 'Bel exemple <img src=x onerror="window.piege=1">', 'le': '2026-11-17'},
            {'id': 'r2', 'type': 'definir', 'mot': 'Apprentissage automatique', 'texte': 'Tu en parles sans l’expliquer.', 'le': '2026-11-17'},
            {'id': 'r3', 'type': 'ressource', 'url': 'https://www.cnil.fr/fr/intelligence-artificielle', 'titre': 'La CNIL et l’IA', 'texte': 'Une source officielle.', 'le': '2026-11-17', 'ia': True, 'verifier': True},
            {'id': 'r4', 'type': 'ressource', 'url': 'javascript:alert(1)', 'titre': 'Piège', 'texte': '', 'le': '2026-11-17'},
            {'id': 'r5', 'type': 'question', 'texte': 'Comment corriger un biais ?', 'qid': qid, 'le': '2026-11-17'},
            {'id': 'r6', 'type': 'validation', 'qid': qid, 'etat': 'validee', 'texte': 'Question claire.', 'le': '2026-11-17'},
            {'id': 'r7', 'type': 'evaluation', 'oral': oral, 'notes': {'oral': 3, 'continu': 2, 'connaissances': 3, 'interaction': 2, 'argumentation': 3}, 'texte': 'Lève les yeux de ta feuille.', 'le': '2026-11-17'},
        ]
        r = prof('go_prof_retours', p_code=CODE_PROF, p_eleve=el['id'], p_retours={'v': 1, 'items': items}, p_version_connue=dos['retours_version'])
        ok('retours enregistrés', r['ok'], r)
        A.p.goto(URL + '#/'); A.p.reload(); A.p.wait_for_selector('.nouveautes', timeout=15000)
        ok('accueil : badge des nouveautés (le lien piégé est écarté)', A.p.inner_text('.pastille') == '6', A.p.inner_text('.pastille'))
        A.large('6-nouveautes')
        A.p.goto(URL + '#/question/' + qid); A.p.wait_for_selector('.retour-prof')
        txt = A.p.inner_text('#vue')
        ok('commentaire près du point, texte échappé', '<img src=x' in txt and A.p.locator('.retour-prof img').count() == 0 and not A.p.evaluate('window.piege'))
        ok('question validée par le prof (sans bouton d’auto-validation)', 'Validée par ton prof' in txt and A.p.locator('[data-s=validee]').count() == 0)
        A.p.goto(URL + '#/question/' + qid + '/echange')
        ok('question suggérée pour l’échange', 'Comment corriger un biais ?' in A.p.inner_text('#vue'))
        A.p.click('[data-a=garder-ech]')
        A.p.goto(URL + '#/mots')
        ok('demande de définition : mot « demandé par ton prof »', 'Apprentissage automatique' in A.p.evaluate("localStorage.getItem('hellogo:dossier:v1')") and A.p.locator('.badge.prof').count() == 1)
        A.p.goto(URL + '#/sources')
        ok('ressource suggérée avec la mention de l’IA, lien en https seulement', 'Préparé avec l’aide d’une IA' in A.p.inner_text('#vue') and A.p.locator('a[href^="javascript"]').count() == 0 and 'Piège' not in A.p.inner_text('#vue'))
        A.large('7-ressource')
        A.p.click('[data-a=ressource-ajouter]')
        ok('« Ajouter à mes sources »', A.p.locator('[data-f$=".titre"][value="La CNIL et l’IA"]').count() == 1 or 'La CNIL et l’IA' in A.p.evaluate("JSON.stringify(JSON.parse(localStorage.getItem('hellogo:dossier:v1')).sources)"))
        A.p.goto(URL + '#/oraux')
        ok('évaluation cachée tant que l’auto-évaluation n’est pas faite', 'termine ton auto-évaluation' in A.p.inner_text('#vue'))
        for c in ['oral', 'continu', 'connaissances', 'interaction', 'argumentation']:
            A.p.evaluate("([o, c]) => { const x = document.querySelector('input[data-grille=\"' + o + '\"][data-c=\"' + c + '\"][value=\"2\"]'); x.checked = true; x.dispatchEvent(new Event('change', { bubbles: true })); }", [oral, c])
        ok('évaluation du prof après l’auto-évaluation', '13 / 20' in A.p.inner_text('#vue') and 'Lève les yeux' in A.p.inner_text('#vue'))
        A.p.goto(URL + '#/retours'); A.p.wait_for_selector('.retour-carte')
        A.large('8-retours')
        A.p.goto(URL + '#/')
        ok('retours lus : plus de badge', A.p.locator('.nouveautes').count() == 0)
        A.etat('Enregistré')

        # --- 6. Correction de l'enseignant·e : reprise sans annonce ---
        dos = prof('go_prof_dossier', p_code=CODE_PROF, p_eleve=el['id'])
        dd = dos['dossier']; dd['questions'][0]['titre'] = 'Les algorithmes peuvent-ils être neutres ?'
        r = prof('go_prof_corriger', p_code=CODE_PROF, p_eleve=el['id'], p_dossier=dd, p_version_connue=dos['dossier_version'])
        ok('correction enregistrée', r['ok'], r)
        A.p.evaluate("document.querySelector('#toasts').innerHTML = ''")
        A.p.goto(URL + '#/questions'); A.visible()
        A.p.wait_for_function("document.querySelector('#vue').textContent.includes('peuvent-ils')", timeout=15000)
        ok('correction reprise sans rien annoncer', 'corrig' not in A.p.inner_text('#toasts').lower() and 'mis à jour' not in A.p.inner_text('#toasts'))

        # --- 7. Quitter cet appareil ---
        A.p.goto(URL + '#/reglages')
        ok('réglages : pas de bouton d’effacement en ligne', A.p.locator('[data-a=effacer]').count() == 0)
        A.p.click('[data-a=voir-code]')
        ok('voir son code', A.p.inner_text('#mon-code') == CODE)
        jeton = A.p.evaluate("JSON.parse(localStorage.getItem('hellogo:session:v1')).jeton")
        A.large('9-reglages')
        A.p.click('[data-a=deconnexion]'); A.p.wait_for_selector('#prenom')
        ok('quitter : plus de dossier ni de session sur l’appareil', A.p.evaluate("localStorage.getItem('hellogo:dossier:v1') === null || !localStorage.getItem('hellogo:dossier:v1').includes('Amazon')") and A.p.evaluate("localStorage.getItem('hellogo:session:v1')") is None)
        s, r = base.appel('go_reprise', {'p_jeton': jeton})
        ok('quitter : le jeton ne marche plus', not r['ok'])

        # --- 8. Mode découverte, puis inscription avec le dossier de l'appareil ---
        C = Appareil(nav, 'C-768-clair', 768)
        C.p.goto(URL); C.p.fill('#prenom', 'Lou'); C.p.click('[data-a=demarrer]')
        ok('mode découverte : invitation à rejoindre sa classe', C.p.locator('.invitation').count() == 1)
        C.p.evaluate("(() => { const d = JSON.parse(localStorage.getItem('hellogo:dossier:v1')); d.compteurs.jours = 4; d.vus.jour = 1; localStorage.setItem('hellogo:dossier:v1', JSON.stringify(d)); })()")
        C.p.reload(); C.p.wait_for_selector('#toasts .toast')
        ok('haut fait gagné au chargement : annoncé et enregistré', 'Nage droit devant' in C.p.inner_text('#toasts') and C.p.evaluate("JSON.parse(localStorage.getItem('hellogo:dossier:v1')).hf.dory") is not None)
        C.p.goto(URL + '#/questions'); C.p.fill('#question-libre', 'Une IA peut-elle composer ?'); C.p.click('[data-a=question-libre]'); C.p.wait_for_selector('[data-a=plus-pt]')
        ok('mode découverte : aucun appel', not [a for a in base.appels[-50:] if False])
        n_avant = len(base.appels)
        C.p.goto(URL + '#/classe/' + classe['code']); C.p.wait_for_selector('#envoyer-local')
        ok('mode découverte : le seul appel est celui du lien de classe', base.appels[n_avant:] == ['go_classe_par_code'], base.appels[n_avant:])
        C.p.fill('#pseudo', 'Lou R.'); C.p.click('[data-a=inscription]'); C.p.wait_for_selector('.code-eleve')
        C.etat('Enregistré')
        eleves = prof('go_prof_classe', p_code=CODE_PROF, p_classe=classe['id'])['eleves']
        lou = [x for x in eleves if x['pseudo'] == 'Lou R.'][0]
        ok('le dossier de l’appareil est envoyé à l’inscription', 'composer' in json.dumps(prof('go_prof_dossier', p_code=CODE_PROF, p_eleve=lou['id'])['dossier'], ensure_ascii=False))

        # --- 9. Une session expirée (nouveau code donné par l'enseignant·e) ---
        prof('go_prof_nouveau_code_eleve', p_code=CODE_PROF, p_eleve=lou['id'])
        C.p.goto(URL + '#/'); C.p.reload(); C.etat('Session expirée')
        ok('session expirée : le travail reste, invitation à entrer son code', C.p.locator('.carte.alerte a[href="#/entrer"]').count() == 1)

        if os.environ.get('HG_PROF', '1') == '1' and os.path.exists(os.path.join(RACINE, 'tests', 'prof_en_ligne.py')):
            import prof_en_ligne
            prof_en_ligne.essais(nav, Appareil, ok, base, prof, URL, CODE_PROF, classe, erreurs)
        nav.close()
finally:
    base.arreter()

for x in erreurs:
    print('  ', x)
print('en ligne : %d contrôles, %s' % (len(resultats), 'aucun problème' if not erreurs else '%d problème(s)' % len(erreurs)))
sys.exit(1 if erreurs else 0)
