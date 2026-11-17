"""Non-régression des dossiers : python3 tests/dossiers.py (depuis la racine du dépôt, cloné avec son historique Git).

Règle de l'enseignant (17/11/2026, 09:18) : toute publication conserve les données des élèves déjà inscrit·e·s, sans
rupture d'expérience. À rejouer à chaque version, avant de publier. Dans un navigateur, sans base (dossier sur l'appareil) :

1. Les dossiers types des versions publiées (tests/dossiers/<version>.json, faits avec l'interface de chaque version)
   s'ouvrent avec cette version-ci : chaque page s'affiche, sans erreur JavaScript, sans message de panne, sans copie
   « illisible » ni défilement horizontal ; dossierValide les accepte (sinon la base ou un import les refuserait) ; un point
   et un mot ajoutés s'enregistrent, et rien de ce qu'il y avait n'est perdu.
2. Le dossier de cette version-ci (le plus récent des dossiers types, avec ce que cette version y ajoute) est accepté par
   chaque version publiée en ligne (tirée de l'historique Git, avec sa propre validation) et s'ouvre avec elle sans rien
   perdre : un onglet ou un appareil resté sur l'ancienne version ne refuse jamais, et n'abîme jamais, un dossier
   enregistré par la nouvelle.

À chaque publication (le Gardien) : ajouter la version publiée et son commit sur main à PUBLIEES ; si le dossier gagne un
champ, ajouter son dossier type (tests/dossiers/<version>.json, fait avec l'interface) et son usage à nouveautes().
"""
import functools, http.server, json, os, re, shutil, socketserver, subprocess, sys, tempfile, threading
sys.dont_write_bytecode = True  # pas de __pycache__ dans le dépôt
from playwright.sync_api import sync_playwright

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TYPES = os.path.join(RACINE, 'tests', 'dossiers')
# Les versions publiées sur main, de la plus ancienne à la plus récente ; en_ligne : la version peut recevoir un dossier
# de la base (un onglet resté ouvert le reprend), donc doit accepter celui des versions suivantes.
PUBLIEES = [('1.0.0', 'da25fa5', False), ('1.1.0', '6b45cf1', False), ('1.2.0', 'd654f95', False),
            ('1.3.0', 'ffdbd76', True), ('1.3.1', 'df87f84', True), ('1.3.2', 'ef8b049', True), ('1.4.0', '5c92a5d', True),
            # la 1.5.0, pas encore sur main : son dernier commit sur atelier/t79-suivi (à remplacer par celui de main à sa publication)
            ('1.5.0', 'b82d142', True)]
PAGES = ['#/', '#/explorer/decouvrir', '#/explorer/quiz', '#/explorer/sujets', '#/explorer/pistes', '#/questions', '#/question/{q}',
         '#/question/{q}/echange', '#/mots', '#/sources', '#/oraux', '#/hauts-faits', '#/plus', '#/aide', '#/aide/exemple',
         '#/comprendre', '#/comprendre/epreuve', '#/reglages', '#/a-part',
         '#/explorer/videos', '#/explorer/infox', '#/conseils']
CLE = 'hellogo:dossier:v1'
erreurs, n = [], [0]


def ok(nom, vrai, detail=''):
    n[0] += 1
    print(('ok     ' if vrai else 'ÉCHEC  ') + nom + ('' if vrai else ' : ' + str(detail)[:1200]), flush=True)
    if not vrai: erreurs.append(nom)


def version_cle(v): return tuple(int(x) for x in v.split('.'))


# ---------- Ce qui compte comme une perte ----------
# Peuvent changer sans perte : les compteurs et, pour chaque quiz, le meilleur score et le nombre d'essais (qui ne font que
# monter), le dernier essai (score, date, questions ratées), « vus » (le jour, l'à-savoir montré), le prénom et profil.vu
# (le pseudo de la classe remplace le prénom en ligne). Les hauts faits ne font que s'ajouter.
def pertes(avant, apres, chemin=''):
    if chemin in ('vus', 'profil.prenom', 'profil.vu') or re.match(r'^comprendre\.[^.]+\.(dernier|le|rates)$', chemin): return []
    if chemin.startswith('compteurs.') or re.match(r'^comprendre\.[^.]+\.(meilleur|essais)$', chemin):
        return [] if isinstance(apres, int) and apres >= avant else ['%s : %r devenu %r' % (chemin, avant, apres)]
    if isinstance(avant, dict):
        if not isinstance(apres, dict): return ['%s : n’est plus un objet' % chemin]
        out = []
        for k, v in avant.items():
            c = (chemin + '.' if chemin else '') + k
            out += ['%s : disparu' % c] if k not in apres else pertes(v, apres[k], c)
        return out
    if isinstance(avant, list):
        if not isinstance(apres, list): return ['%s : n’est plus une liste' % chemin]
        if avant and all(isinstance(x, dict) and 'id' in x for x in avant):  # liste à identifiants : élément par élément
            par_id, out = {x.get('id'): x for x in apres if isinstance(x, dict)}, []
            for x in avant:
                out += ['%s[%s] : disparu' % (chemin, x['id'])] if x['id'] not in par_id else pertes(x, par_id[x['id']], '%s[%s]' % (chemin, x['id']))
            return out
    return [] if avant == apres else ['%s : %r devenu %r' % (chemin, avant, apres)]


# ---------- Le serveur : la version de travail sous /neuf/, les versions publiées sous /<version>/ ----------
class Muet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

    def translate_path(self, path):
        m = re.match(r'^/([^/]+)/(.*)$', path.split('?', 1)[0].split('#', 1)[0])
        racine = DOSSIERS.get(m.group(1)) if m else None
        if not racine: return '/inexistant'
        self.directory = racine
        return super().translate_path('/' + m.group(2))


def extraire(commit, vers):
    """La version publiée, tirée de l'historique Git (git archive), dans un dossier temporaire."""
    if subprocess.run(['git', '-C', RACINE, 'cat-file', '-e', commit + '^{commit}'], capture_output=True).returncode:
        raise SystemExit('Historique Git incomplet (commit %s absent) : lancer « git fetch --unshallow », ou cloner le dépôt en entier.' % commit)
    os.makedirs(vers)
    archive = subprocess.run(['git', '-C', RACINE, 'archive', commit], capture_output=True, check=True).stdout
    subprocess.run(['tar', '-x', '-C', vers], input=archive, check=True)


tmp = tempfile.mkdtemp(prefix='hello-go-dossiers-')
DOSSIERS = {'neuf': RACINE}
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), Muet); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
HOTE = 'http://127.0.0.1:%d/' % srv.server_address[1]


def externe(route):  # aucune requête ne sort : ni la base en ligne, ni un autre site
    erreurs.append('requête externe : ' + route.request.url); print('ÉCHEC  requête externe : ' + route.request.url); route.abort()


def contexte(nav, largeur=1440, sombre=False):
    ctx = nav.new_context(viewport={'width': largeur, 'height': 900}, color_scheme='dark' if sombre else 'light', service_workers='block')
    ctx.route(re.compile(r'^https?://(?!127\.0\.0\.1:%d/)' % srv.server_address[1]), externe)
    p = ctx.new_page(); p.journal = []
    p.on('pageerror', lambda x: p.journal.append('erreur JS : ' + str(x)))
    p.on('console', lambda m: p.journal.append('console : ' + m.text) if m.type == 'error' else None)
    p.on('dialog', lambda dlg: dlg.accept())
    return ctx, p


def ouvrir(p, ou, dossier):
    """Le dossier est écrit depuis une autre adresse du même site (l'application n'y tourne pas), puis l'application s'ouvre."""
    p.goto(HOTE + ou + '/icone.svg')
    p.evaluate("([c, t]) => { localStorage.clear(); localStorage.setItem(c, t); }", [CLE, json.dumps(dossier, ensure_ascii=False)])
    p.goto(HOTE + ou + '/index.html#/'); p.wait_for_selector('#vue h1', timeout=10000)


def lire(p):
    t = p.evaluate('(c) => localStorage.getItem(c)', CLE)
    return json.loads(t) if t else None


ETAT = """() => { const v = document.querySelector('#vue'); return { panne: !!document.querySelector('#vue [role=alert]'),
  texte: v ? v.innerText.trim().length : 0, large: document.documentElement.scrollWidth - window.innerWidth,
  illisible: localStorage.getItem('hellogo:dossier:v1:illisible') !== null }; }"""


def pages(p, ou, dossier, nom):
    qid = (dossier.get('questions') or [{}])[0].get('id')
    mauvaises = []
    for r in PAGES:
        if '{q}' in r and not qid: continue
        p.goto(HOTE + ou + '/index.html' + r.replace('{q}', str(qid))); p.wait_for_timeout(200)
        e = p.evaluate(ETAT)
        if e['panne'] or e['texte'] < 20 or e['large'] > 1 or e['illisible']: mauvaises.append((r, e))
    ok('%s : %d pages s’affichent (ni panne, ni page vide, ni débordement, ni copie illisible)' % (nom, len(PAGES)), not mauvaises, mauvaises)


def ajouter(p, ou, dossier, texte):
    """Un point dans la première question et un mot, avec l'interface : la page enregistre le dossier."""
    qid = (dossier.get('questions') or [{}])[0].get('id')
    if qid:
        p.goto(HOTE + ou + '/index.html#/question/' + qid); p.wait_for_selector('[data-a=plus-pt]')
        p.locator('[data-a=plus-pt]').first.click(); p.keyboard.type('Point : ' + texte); p.wait_for_timeout(600)
    p.goto(HOTE + ou + '/index.html#/mots'); p.wait_for_selector('[data-a=plus-mot]')
    p.click('[data-a=plus-mot]'); p.keyboard.type('Mot : ' + texte); p.wait_for_timeout(600)
    p.goto(HOTE + ou + '/index.html#/'); p.wait_for_timeout(300)


def nouveautes(p):
    """Ce que cette version ajoute au dossier, fait avec l'interface. À chaque version : y ajouter ses nouveautés.
    1.4.0 : les quiz « Vérifie que tu as compris » (l'un sans faute, l'autre avec deux erreurs), et leurs hauts faits.
    1.5.0 : les jours de visite (visites, notés à l'ouverture), et, par quiz, une salve de 10 questions tirées parmi 20
    (banque, rates_toutes) : deux salves pour le second quiz, pour que des questions 11 à 20 soient ratées.
    1.6.0 : la culture (culture) : une vidéo regardée et notée, une salve « Info ou infox ? », une accroche gardée."""
    if not p.evaluate("!!(window.HGDonnees && HGDonnees.COMPRENDRE)"): return
    for i, z in enumerate(p.evaluate("HGDonnees.COMPRENDRE.map((z) => ({ id: z.id, b: Object.fromEntries(z.questions.map((q) => [q.id, q.b])), n: Math.min(10, z.questions.length) }))")):
        for _ in range(2 if i and len(z['b']) > 10 else 1):
            p.goto(HOTE + 'neuf/index.html#/comprendre/' + z['id']); p.wait_for_selector('[data-a=quiz-commencer]'); p.click('[data-a=quiz-commencer]')
            for k in range(z['n']):
                qid = p.get_attribute('.quiz-q', 'data-qid'); b = z['b'][qid] if qid else list(z['b'].values())[k]
                p.locator('label.option:has([value="%d"])' % ((b + 1) % 4 if i and k in (2, 5) else b)).click(); p.click('[data-a=quiz-valider]'); p.click('[data-a=quiz-suivant]')
            p.wait_for_selector('.score')
    # 1.6.0 : la culture (d.culture) : une vidéo regardée et notée, une salve « Info ou infox ? », une accroche gardée.
    if not p.evaluate("!!window.HGCulture"): return
    p.goto(HOTE + 'neuf/index.html#/explorer/videos'); p.wait_for_selector('[data-a=video-vue]')
    vid = p.get_attribute('ul.liste .video [data-a=video-vue]', 'data-v'); p.click('ul.liste .video [data-a=video-vue]')
    p.locator('[data-f="cv.%s.retiens"]' % vid).first.type('Noté en 1.6.0'); p.wait_for_timeout(600)
    p.goto(HOTE + 'neuf/index.html#/explorer/infox'); p.click('[data-a=infox-commencer]')
    for k in range(7):
        p.wait_for_selector('.infox-carte'); p.keyboard.press('ArrowLeft'); p.wait_for_selector('#infox-retour')
        if k == 0: p.click('#infox-retour [data-a=infox-garder]')
        p.click('[data-a=infox-suivante]')
    p.wait_for_selector('#infox-fin')


def journal(p, nom):
    ok(nom + ' : aucune erreur JavaScript', not p.journal, p.journal)
    p.journal.clear()


try:
    with sync_playwright() as pw:
        nav = pw.chromium.launch()
        types = sorted((f[:-5] for f in os.listdir(TYPES) if f.endswith('.json')), key=version_cle)
        ok('dossiers types : un par format publié (%s)' % ', '.join(types), {'1.0.0', '1.1.0', '1.2.0', '1.3.2'} <= set(types), types)
        # Une version qui a son dossier type, et qui n'est pas celle de travail, a été publiée : elle doit être dans PUBLIEES
        # (sinon l'essai 2 oublierait les onglets restés sur elle).
        TRAVAIL = re.search(r"window\.HG_VERSION = '([0-9.]+)'", open(os.path.join(RACINE, 'index.html'), encoding='utf-8').read()).group(1)
        oubliees = [v for v in types if v != TRAVAIL and v not in [x[0] for x in PUBLIEES]]
        ok('version de travail %s : chaque version publiée avec un dossier type est dans PUBLIEES' % TRAVAIL, not oubliees,
           'ajouter %s à PUBLIEES, avec son commit sur main' % ', '.join(oubliees))
        # ---------- 1. Les dossiers des versions publiées, ouverts avec cette version ----------
        actuel = None
        for v in types:
            d = json.load(open(os.path.join(TYPES, v + '.json'), encoding='utf-8'))
            nom = 'dossier %s, version de travail' % v
            for largeur, sombre in ((1440, False), (320, True)):
                ctx, p = contexte(nav, largeur, sombre)
                ouvrir(p, 'neuf', d)
                ok('%s (%d px) : accepté par dossierValide (base, import)' % (nom, largeur), p.evaluate('(x) => HGAnalyse.dossierValide(x)', d))
                pages(p, 'neuf', d, '%s (%d px)' % (nom, largeur))
                ajouter(p, 'neuf', d, 'ajouté en %d px' % largeur)
                apres = lire(p)
                ok('%s (%d px) : modifié et enregistré, rien de perdu' % (nom, largeur), apres and not pertes(d, apres) and 'ajouté en %d px' % largeur in json.dumps(apres, ensure_ascii=False),
                   pertes(d, apres) if apres else 'pas de dossier enregistré')
                ok('%s (%d px) : le dossier enregistré reste valide' % (nom, largeur), p.evaluate('(x) => HGAnalyse.dossierValide(x)', apres))
                journal(p, '%s (%d px)' % (nom, largeur))
                if v == types[-1] and largeur == 1440:  # le dossier de cette version-ci, avec ses nouveautés
                    nouveautes(p); actuel = lire(p)
                    ok('dossier de cette version : valide, rien de perdu', p.evaluate('(x) => HGAnalyse.dossierValide(x)', actuel) and not pertes(d, actuel), pertes(d, actuel))
                    journal(p, 'nouveautés de cette version')
                ctx.close()
        # ---------- 2. Le dossier de cette version, reçu par les versions publiées en ligne ----------
        for v, commit, en_ligne in PUBLIEES:
            if not en_ligne: continue
            extraire(commit, os.path.join(tmp, v)); DOSSIERS[v] = os.path.join(tmp, v)
            ctx, p = contexte(nav, 1440)
            ouvrir(p, v, actuel)
            version = p.evaluate('window.HG_VERSION || null')
            ok('version publiée %s (%s) : servie depuis l’historique' % (v, commit), version in (v, None), version)
            ok('version publiée %s : sa validation accepte le dossier de cette version (base, autre onglet)' % v, p.evaluate('(x) => HGAnalyse.dossierValide(x)', actuel))
            pages(p, v, actuel, 'version publiée %s, dossier de cette version' % v)
            ajouter(p, v, actuel, 'ajouté avec la %s' % v)
            apres = lire(p)
            ok('version publiée %s : modifie et enregistre sans rien perdre de cette version' % v, apres and not pertes(actuel, apres) and ('ajouté avec la %s' % v) in json.dumps(apres, ensure_ascii=False),
               pertes(actuel, apres) if apres else 'pas de dossier enregistré')
            journal(p, 'version publiée %s' % v)
            ctx.close()
        nav.close()
finally:
    srv.shutdown(); shutil.rmtree(tmp, ignore_errors=True)
print('dossiers : %d contrôles, %s' % (n[0], 'aucun problème' if not erreurs else '%d problème(s)' % len(erreurs)))
sys.exit(1 if erreurs else 0)
