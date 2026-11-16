"""Essais de robustesse : python3 tests/robustesse.py (depuis la racine du dépôt).

Ce que le parcours (tests/parcours.py) ne couvre pas : deux onglets ouverts, un fichier importé
abîmé ou piégé, le dialogue des liens au clavier, le lien d'évitement, la navigation au clavier,
la page à 320 px avec de longs mots, le texte piégé tapé par l'élève (toujours échappé), et « Découvrir »
et « Mes goûts » au clavier avec un dossier de la version 1.0.0.
Chaque essai dit « ok » ou « ÉCHEC » ; le code de sortie vaut 1 s'il y a un échec."""
import functools, http.server, json, os, socketserver, sys, tempfile, threading
from playwright.sync_api import sync_playwright

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLE = 'hellogo:dossier:v1'
PIEGE = '"><img src=x onerror="window.__xss=1">'
LONG = 'https://www.exemple.org/un/chemin/tres/long/sans/aucune/espace/pour/voir/si/la/page/deborde'


class Muet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Muet, directory=RACINE))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:%d/' % srv.server_address[1]
URL = BASE + 'index.html'
echecs, erreurs = [], []


def essai(nom, ok, detail=''):
    print(('ok     ' if ok else 'ÉCHEC  ') + nom + ('' if ok else ' : ' + detail))
    if not ok: echecs.append(nom)


def point(i, texte='', etiquette=''):
    return {'id': 'p%d' % i, 'texte': texte, 'etiquette': etiquette, 'mots': [], 'sources': []}


def dossier(**champs):
    d = {'v': 1, 'profil': {'prenom': 'Essai', 'vu': True}, 'quiz': {'reponses': {}, 'fait': False}, 'interets': ['', '', ''], 'ponts': [''],
         'pistes': [], 'questions': [{'id': 'q1', 'titre': 'Ma question ?', 'statut': 'brouillon', 'echange': [], 'parties': [
             {'id': 'a1', 'titre': 'Introduction', 'minutes': 2, 'points': [point(1, 'Une accroche', 'accroche')]},
             {'id': 'a2', 'titre': 'Axe 1', 'minutes': 3, 'points': []}, {'id': 'a3', 'titre': 'Axe 2', 'minutes': 3, 'points': []},
             {'id': 'a4', 'titre': 'Conclusion', 'minutes': 2, 'points': []}]}],
         'mots': [], 'sources': [], 'oraux': [{'id': 'o1', 'nom': 'Oral blanc 1', 'auto': {}}], 'hf': {}, 'compteurs': {}, 'vus': {}}
    d.update(champs)
    return d


def ouvrir(ctx, d=None, largeur=None):
    """Une page de l'application ; le dossier d est posé depuis une autre page du site, avant le chargement."""
    p = ctx.new_page()
    p.on('pageerror', lambda x: erreurs.append(str(x)))
    if largeur: p.set_viewport_size({'width': largeur, 'height': 700})
    if d is not None:
        p.goto(BASE + 'icone.svg')
        p.evaluate('([c, d]) => localStorage.setItem(c, JSON.stringify(d))', [CLE, d])
    p.goto(URL)
    p.wait_for_selector('#vue > *')
    return p


def stocke(p):
    return p.evaluate('(c) => JSON.parse(localStorage.getItem(c))', CLE)


def importer(p, contenu):
    p.goto(URL + '#/reglages'); p.wait_for_selector('#import', state='attached')
    f = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf8')
    f.write(contenu if isinstance(contenu, str) else json.dumps(contenu)); f.close()
    p.set_input_files('#import', f.name); p.wait_for_timeout(400)
    os.unlink(f.name)


with sync_playwright() as pw:
    nav = pw.chromium.launch()

    # 1. Deux onglets : celui qui reste en arrière ne doit pas effacer le travail fait dans l'autre.
    ctx = nav.new_context()
    a = ouvrir(ctx, dossier())
    b = ouvrir(ctx)
    b.goto(URL + '#/mots'); b.click('[data-a=plus-mot]'); b.keyboard.type('Algorithme'); b.wait_for_timeout(700)
    a.goto('about:blank')  # l'ancien onglet se ferme (pagehide)
    temoin = ctx.new_page(); temoin.goto(BASE + 'icone.svg')  # une page du site qui n'est pas l'application
    essai('deux onglets : fermer l’ancien onglet garde le mot ajouté dans le nouveau',
          any(m.get('mot') == 'Algorithme' for m in stocke(temoin)['mots']), json.dumps(stocke(temoin)['mots'], ensure_ascii=False))
    a2 = ouvrir(ctx)
    b.goto(URL + '#/sources'); b.wait_for_timeout(200)
    b.click('[data-a=plus-source]'); b.keyboard.type('Ma source'); b.wait_for_timeout(700)
    a2.wait_for_timeout(200)
    a2.goto(URL + '#/sources'); a2.wait_for_timeout(200)
    essai('deux onglets : l’onglet resté ouvert voit la source ajoutée dans l’autre', a2.locator('[data-f$=".titre"]').count() == 1)
    ctx.close()

    # 2. Import d'un fichier piégé : refusé, rien ne s'exécute, le dossier reste.
    ctx = nav.new_context(); p = ouvrir(ctx, dossier())
    piege = dossier(); piege['questions'][0]['id'] = PIEGE; piege['questions'][0]['statut'] = PIEGE
    importer(p, piege)
    p.goto(URL + '#/questions'); p.wait_for_timeout(200); p.goto(URL + '#/'); p.wait_for_timeout(200)
    essai('import piégé (identifiant, statut) : rien ne s’exécute', not p.evaluate('() => window.__xss'))
    essai('import piégé : refusé, le dossier reste', stocke(p)['questions'][0]['id'] == 'q1', stocke(p)['questions'][0]['id'])
    piege = dossier(); piege['oraux'][0]['auto'] = {'oral': '<img src=x onerror="window.__xss=2">', 'continu': 1, 'connaissances': 1, 'interaction': 1, 'argumentation': 1}
    importer(p, piege); p.goto(URL + '#/oraux'); p.wait_for_timeout(200)
    essai('import piégé (grille) : rien ne s’exécute', not p.evaluate('() => window.__xss'))

    # 3. Import d'un fichier abîmé : refusé avec le bon message, le dossier d'avant reste.
    for nom, abime in [('hf vide', dict(dossier(), hf=None)), ('décalage en texte', dict(dossier(), vus={'decalage': 'x'})),
                       ('mots qui ne sont pas une liste', dict(dossier(), mots='abc')), ('JSON coupé', json.dumps(dossier())[:200])]:
        p.goto(URL + '#/')
        avant = stocke(p)
        importer(p, abime)
        essai('import abîmé (%s) : le dossier d’avant reste' % nom, stocke(p) == avant)
        essai('import abîmé (%s) : un message le dit' % nom, 'pas un dossier Hello GO' in p.inner_text('#toasts'))
        p.goto(URL + '#/'); p.wait_for_timeout(200)
        essai('import abîmé (%s) : l’accueil s’affiche' % nom, p.locator('#vue h1').count() == 1)
    bon = dossier(mots=[{'id': 'm1', 'mot': 'Biais', 'defSource': 'a', 'sourceTexte': '', 'defMoi': 'b', 'analogie': ''}])
    importer(p, bon)
    essai('import d’un vrai dossier : accepté', [m['mot'] for m in stocke(p)['mots']] == ['Biais'])
    ctx.close()

    # 3 bis. Aller-retour : un dossier rempli dans l'application, téléchargé, puis importé ailleurs, est accepté tel quel.
    ctx = nav.new_context(accept_downloads=True); p = ouvrir(ctx)
    p.fill('#prenom', 'Zoé'); p.click('[data-a=demarrer]'); p.goto(URL + '#/questions')
    p.fill('#question-libre', 'Ma question ?'); p.click('[data-a=question-libre]'); p.wait_for_selector('.pt, [data-a=plus-pt]')
    p.locator('[data-a=plus-pt]').first.click(); p.keyboard.type('80 % des données'); p.locator('.pt select').first.select_option('chiffre')
    p.locator('.pt [data-t=mots]').first.click(); p.fill('#nouveau-lien', 'Biais'); p.click('dialog button[value=ok]')
    p.locator('.pt [data-t=sources]').first.click(); p.fill('#nouveau-lien', 'Un rapport'); p.click('dialog button[value=ok]')
    p.goto(URL + '#/oraux'); p.locator('.oral summary').first.click(); p.locator('.oral').first.locator('label.niveau').first.click()
    p.locator('.oral').first.locator('input[data-coche]').check()
    p.goto(URL + '#/explorer/quiz'); p.locator('label.puce', has_text='Musique').click(); p.click('[data-a=quiz-fini]')
    p.goto(URL + '#/reglages'); p.wait_for_timeout(500)
    with p.expect_download() as dl: p.click('[data-a=exporter]')
    fichier = dl.value.path(); exporte = json.load(open(fichier, encoding='utf8'))
    essai('aller-retour : le nom du fichier n’a pas de tiret à la place des accents', dl.value.suggested_filename.startswith('hello-go-zoe-'), dl.value.suggested_filename)
    ctx.close()
    ctx = nav.new_context(); p = ouvrir(ctx, dossier())
    importer(p, json.dumps(exporte))
    essai('aller-retour : le dossier téléchargé s’importe tel quel', stocke(p)['questions'][0]['titre'] == 'Ma question ?' and stocke(p)['profil']['prenom'] == 'Zoé',
          json.dumps(stocke(p)['questions'][0]['titre'], ensure_ascii=False))
    ctx.close()

    # 4. Le dialogue des liens : Entrée valide, Échap annule (même après une validation).
    ctx = nav.new_context(); p = ouvrir(ctx, dossier())
    p.goto(URL + '#/question/q1'); p.wait_for_selector('.pt')
    p.locator('.pt [data-t=mots]').first.click(); p.fill('#nouveau-lien', 'Latence'); p.press('#nouveau-lien', 'Enter'); p.wait_for_timeout(300)
    essai('dialogue : Entrée dans « Un nouveau mot » ajoute le mot', [m['mot'] for m in stocke(p)['mots']] == ['Latence'], json.dumps(stocke(p)['mots'], ensure_ascii=False))
    p.locator('.pt [data-t=sources]').first.click(); p.fill('#nouveau-lien', 'Source gardée'); p.click('dialog button[value=ok]'); p.wait_for_timeout(300)
    p.locator('.pt [data-t=sources]').first.click(); p.fill('#nouveau-lien', 'Source à ne pas garder'); p.keyboard.press('Escape'); p.wait_for_timeout(300)
    essai('dialogue : Échap annule, même après une validation', [s['titre'] for s in stocke(p)['sources']] == ['Source gardée'], json.dumps(stocke(p)['sources'], ensure_ascii=False))
    ctx.close()

    # 5. Le clavier : lien d'évitement, import atteignable, focus et défilement après un changement de page.
    ctx = nav.new_context(); p = ouvrir(ctx, dossier())
    p.goto(URL + '#/mots'); p.reload(); p.wait_for_selector('#vue h1')  # page chargée : le premier Tab mène au lien d'évitement
    p.keyboard.press('Tab')
    essai('lien d’évitement : premier arrêt du clavier', p.evaluate('() => document.activeElement.className') == 'evitement')
    p.keyboard.press('Enter'); p.wait_for_timeout(300)
    essai('lien d’évitement : la page reste « Mes mots »', p.evaluate('() => document.querySelector("#vue").dataset.vue') == 'mots', p.evaluate('() => location.hash'))
    essai('lien d’évitement : le focus va au contenu', p.evaluate('() => document.activeElement && document.activeElement.id') == 'vue')
    p.goto(URL + '#/reglages'); p.wait_for_timeout(200)
    trouve = False
    for _ in range(40):
        p.keyboard.press('Tab')
        if p.evaluate('() => { const a = document.activeElement; return !!a && a !== document.body && (a.id === "import" || /Importer/.test(a.textContent)); }'): trouve = True; break
    essai('réglages : « Importer un dossier » s’atteint au clavier', trouve)
    p.set_viewport_size({'width': 390, 'height': 600})
    p.goto(URL + '#/explorer/sujets'); p.wait_for_timeout(200); p.mouse.wheel(0, 3000); p.wait_for_timeout(200)
    p.locator('#nav a', has_text='Explorer').focus(); p.keyboard.press('Enter'); p.wait_for_timeout(300)
    essai('changement de page : la nouvelle page commence en haut', p.evaluate('() => window.scrollY') == 0, str(p.evaluate('() => window.scrollY')))
    essai('changement de page : le focus va au contenu', p.evaluate('() => document.activeElement && document.activeElement.id') == 'vue',
          p.evaluate('() => document.activeElement && document.activeElement.tagName'))
    p.evaluate("() => document.dispatchEvent(new Event('keydown'))"); p.wait_for_timeout(100)
    essai('touche sans nom (saisie automatique) : aucune erreur', not any('toLowerCase' in x for x in erreurs), '; '.join(erreurs))
    ctx.close()

    # 6. À 320 px, une longue adresse sans espace ne fait pas défiler la page de côté ; le texte tapé reste du texte.
    ctx = nav.new_context()
    d = dossier(sources=[{'id': 's1', 'titre': LONG, 'auteur': PIEGE, 'lien': LONG, 'type': '', 'date': '', 'retiens': PIEGE}],
                mots=[{'id': 'm1', 'mot': PIEGE, 'defSource': PIEGE, 'sourceTexte': '', 'defMoi': '', 'analogie': ''}])
    d['questions'][0]['titre'] = LONG + ' ' + PIEGE
    d['questions'][0]['parties'][0]['points'][0].update({'texte': PIEGE + ' ' + LONG, 'mots': ['m1'], 'sources': ['s1']})
    p = ouvrir(ctx, d, 320)
    for h in ['#/', '#/questions', '#/question/q1', '#/question/q1/echange', '#/mots', '#/sources']:
        p.goto(URL + h); p.wait_for_timeout(250)
        essai('320 px, longue adresse : pas de défilement de côté sur %s' % h, p.evaluate('() => document.documentElement.scrollWidth - innerWidth') <= 1,
              '%d px' % p.evaluate('() => document.documentElement.scrollWidth - innerWidth'))
    essai('texte piégé tapé par l’élève : jamais exécuté', not p.evaluate('() => window.__xss'))
    ctx.close()

    # 7. Téléphone tourné (1440 px puis 320 px) : un long point reste lisible en entier.
    ctx = nav.new_context()
    d = dossier(); d['questions'][0]['parties'][0]['points'][0]['texte'] = 'Un point assez long pour tenir sur une ligne à 1440 px, mais sur plusieurs lignes à 320 px, sans rien cacher.'
    p = ouvrir(ctx, d, 1440); p.goto(URL + '#/question/q1'); p.wait_for_selector('.texte-pt')
    p.set_viewport_size({'width': 320, 'height': 700}); p.wait_for_timeout(500)
    cache = p.evaluate('() => { const t = document.querySelector(".texte-pt"); return t.scrollHeight - t.clientHeight; }')
    essai('zone de texte : après un changement de largeur, rien n’est caché', cache <= 2, '%d px cachés' % cache)
    ctx.close()

    # 8. Découvrir : la carte suivante prend le focus (clavier, lecteurs d'écran) ; pas de « surprise » sans goûts cochés.
    #    Mes goûts : la spécialité garde le focus, les flèches parcourent la liste. (Dossier de la version 1.0.0 : sans « decouverte »,
    #    avec les anciennes réponses i, n, a, s, qui sont ignorées.)
    ctx = nav.new_context(); p = ouvrir(ctx, dossier(quiz={'reponses': {'i': ['musique'], 'n': ['ia'], 'a': 'avenir', 's': 'maths'}, 'fait': True}))
    p.goto(URL + '#/explorer/decouvrir'); p.wait_for_selector('.decouverte')
    avant = p.inner_text('.decouverte h2')
    p.locator('[data-a=reagir][data-v="1"]').focus(); p.keyboard.press('Enter'); p.wait_for_timeout(200)
    titre = p.evaluate('() => { const a = document.activeElement; return a && a.matches(".decouverte h2") ? a.textContent : "focus : " + (a && a.tagName); }')
    essai('Découvrir : après un avis, le focus va au titre de la carte suivante', titre == p.inner_text('.decouverte h2') and titre != avant, titre)
    p.keyboard.press('Tab')
    essai('Découvrir : puis Tab mène aux boutons de cette carte', p.evaluate('() => document.activeElement.dataset.a') == 'reagir')
    for _ in range(9):
        p.locator('[data-a=reagir][data-v="1"]').focus(); p.keyboard.press('Enter'); p.wait_for_timeout(80)
    essai('Découvrir : au bilan, le focus va au texte du bilan', p.evaluate('() => document.activeElement.matches(".action .gros")'), p.evaluate('() => document.activeElement.tagName'))
    essai('Découvrir : anciennes réponses (1.0.0) et « Mes goûts » vide : pas de « surprise »', p.locator('text=Ta surprise').count() == 0)
    p.locator('[data-a=suite-cartes]').focus(); p.keyboard.press('Enter'); p.wait_for_timeout(200)
    essai('Découvrir : « Voir 10 autres cartes » met le focus sur la carte 11', p.evaluate('() => document.activeElement.matches(".decouverte h2")') and 'Carte 11 sur' in p.inner_text('.decouverte'))
    p.goto(URL + '#/explorer/quiz'); p.wait_for_selector('.puce')
    essai('Mes goûts : les anciennes réponses (1.0.0) ne cochent rien', p.locator('#vue input:checked').count() == 0)
    p.locator('input[name=quiz-spe][value=maths]').focus(); p.keyboard.press('Space'); p.wait_for_timeout(150)
    p.keyboard.press('ArrowDown'); p.wait_for_timeout(150); p.keyboard.press('ArrowDown'); p.wait_for_timeout(150)
    etat = p.evaluate('() => [document.activeElement.name, document.activeElement.value, (document.querySelector("input[name=quiz-spe]:checked") || {}).value]')
    essai('Mes goûts : les flèches parcourent les spécialités, le focus reste dans la liste', etat == ['quiz-spe', 'svt', 'svt'], str(etat))
    essai('Mes goûts : la question sur la spécialité choisie apparaît', p.locator('label.puce', has_text='Génétique').count() == 1)
    p.locator('label.puce', has_text='Jeux vidéo').click(); p.wait_for_timeout(500)
    p.goto(URL + '#/explorer/decouvrir'); p.wait_for_selector('.decouverte')
    essai('Découvrir : une fois « Mes goûts » rempli, la « surprise » peut apparaître', p.locator('text=Ta surprise').count() == 1)
    ctx.close()
    nav.close()
srv.shutdown()
autres = [x for x in erreurs if 'toLowerCase' not in x]
essai('aucune autre erreur JavaScript', not autres, '; '.join(autres))
print('robustesse : %s' % ('aucun problème' if not echecs else '%d échec(s)' % len(echecs)))
sys.exit(1 if echecs else 0)
