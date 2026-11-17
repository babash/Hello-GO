"""Essai des quiz « Vérifie que tu as compris » dans un navigateur : python3 tests/comprendre.py (depuis la racine du dépôt).

Faire un quiz avec des erreurs (au clavier), le retour après chaque réponse, le score et les points à revoir, le résultat
gardé dans le dossier, « Revoir » qui ouvre la fiche, refaire sans faute, le haut fait ; la vidéo du ministère (lien simple,
jamais chargée) ; téléphone et ordinateur, clair et obscur, sans défilement horizontal.
"""
import functools, http.server, json, os, socketserver, sys, threading
from playwright.sync_api import sync_playwright

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.environ.get('SORTIE', '/tmp/hello-go-essais'); os.makedirs(SORTIE, exist_ok=True)


class Muet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Muet, directory=RACINE))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = 'http://127.0.0.1:%d/index.html' % srv.server_address[1]
erreurs, n = [], [0]


def ok(nom, vrai, detail=''):
    n[0] += 1
    if not vrai: erreurs.append(nom + (' : ' + str(detail) if detail else ''))


def dossier(p): return json.loads(p.evaluate("localStorage.getItem('hellogo:dossier:v1')"))


def parcours(nav, largeur, sombre):
    nom = '%d-%s' % (largeur, 'obscur' if sombre else 'clair')
    ctx = nav.new_context(viewport={'width': largeur, 'height': 800}, color_scheme='dark' if sombre else 'light')
    p = ctx.new_page()
    p.on('pageerror', lambda x: erreurs.append(nom + ' erreur : ' + str(x)))
    p.on('console', lambda m: erreurs.append(nom + ' console : ' + m.text) if m.type == 'error' else None)
    p.on('request', lambda r: erreurs.append(nom + ' requête externe : ' + r.url) if not r.url.startswith('http://127.0.0.1') and not r.url.startswith('data:') else None)

    def large(etape):
        dx = p.evaluate('document.documentElement.scrollWidth - window.innerWidth')
        if dx > 1: erreurs.append('%s %s : défilement horizontal de %d px' % (nom, etape, dx))
        p.screenshot(path='%s/quiz-%s-%s.png' % (SORTIE, nom, etape), full_page=True)

    p.goto(URL); p.fill('#prenom', 'Essai'); p.click('[data-a=demarrer]'); p.wait_for_selector('.action')
    ok(nom + ' accueil : carte « Vérifie que tu as compris »', p.locator('a[href="#/comprendre/epreuve"]').count() == 1 and p.locator('a[href="#/comprendre/plan"]').count() == 1)
    # la page « Comprendre l'épreuve » : la vidéo, en lien simple, et sa mise en garde
    p.goto(URL + '#/aide/epreuve'); p.wait_for_selector('#epreuve')
    v = p.locator('#epreuve .video-lien a[href^="https://www.youtube.com/"]')
    ok(nom + ' vidéo : lien simple, nouvel onglet, noopener noreferrer', v.count() == 1 and v.get_attribute('target') == '_blank' and v.get_attribute('rel') == 'noopener noreferrer'
       and v.get_attribute('href') == 'https://www.youtube.com/watch?v=3mN9w6rpXgE')
    g = p.inner_text('#epreuve .mise-en-garde')
    ok(nom + ' mise en garde 2027', 'coefficient 8' in g and '10 minutes d’exposé, puis 10 minutes d’échange' in g and 'même spécialité' in g and 'cette page' in g, g)
    ok(nom + ' aucun lecteur intégré', p.locator('iframe, video, img[src*="youtube"], img[src*="ytimg"]').count() == 0)
    large('0-aide')
    # le quiz sur l'épreuve : l'intro, la vidéo en tête
    p.click('#epreuve a[href="#/comprendre/epreuve"]'); p.wait_for_selector('[data-a=quiz-commencer]')
    ok(nom + ' quiz : la vidéo en tête, avec sa mise en garde', p.locator('.video-lien a[href*="youtube"]').count() == 1 and 'cette page' not in p.inner_text('.mise-en-garde'))
    large('1-intro')
    p.click('[data-a=quiz-commencer]'); p.wait_for_selector('#quiz-question')
    ok(nom + ' le focus va à la question', p.evaluate("document.activeElement.id") == 'quiz-question')
    Z = p.evaluate("HGDonnees.COMPRENDRE.find((z) => z.id === 'epreuve')")
    ordres = []
    for i, q in enumerate(Z['questions']):
        ok(nom + ' question %d sur 10' % (i + 1), ('Question %d sur 10' % (i + 1)) in p.inner_text('#vue'))
        ordres.append([int(x) for x in p.eval_on_selector_all('[name=quiz-rep]', 'l => l.map((x) => x.value)')])
        if i == 0:
            p.click('[data-a=quiz-valider]')
            ok(nom + ' valider sans réponse : un message, rien ne change', 'Choisis d’abord une réponse' in p.inner_text('#toasts') and p.locator('#quiz-retour').count() == 0)
        faux = i in (2, 5)  # deux erreurs volontaires
        k = (q['b'] + 1) % 4 if faux else q['b']
        if i == 1:  # au clavier : Tab jusqu'aux options, flèches, puis Valider
            p.focus('[name=quiz-rep] >> nth=0'); pos = ordres[-1].index(k)
            p.keyboard.press('Space')
            for _ in range(pos): p.keyboard.press('ArrowDown')
            ok(nom + ' clavier : la flèche choisit l’option', p.locator('[name=quiz-rep][value="%d"]' % k).is_checked())
            ok(nom + ' clavier : focus visible sur l’option', p.evaluate("getComputedStyle(document.activeElement.closest('label')).outlineStyle") != 'none')
        else:
            p.locator('label.option:has([value="%d"])' % k).click()
        p.click('[data-a=quiz-valider]'); p.wait_for_selector('#quiz-retour')
        r = p.inner_text('#quiz-retour')
        ok(nom + ' retour immédiat de l’option choisie (q%d)' % (i + 1), q['o'][k][1] in r and ('Bien vu' in r) == (not faux), r)
        if faux:
            ok(nom + ' erreur : la bonne réponse et le lien « Revoir »', 'La bonne réponse' in r and q['o'][q['b']][0] in r and p.locator('#quiz-retour a[href="#/aide/epreuve"]').count() == 1)
            ok(nom + ' erreur : marques en texte, pas seulement en couleur', 'Ta réponse' in p.inner_text('.option.faux') and 'Bonne réponse' in p.inner_text('.option.juste'))
            if i == 2: large('2-erreur')
        ok(nom + ' options figées après la réponse', p.locator('[name=quiz-rep]:disabled').count() == 4)
        p.click('[data-a=quiz-suivant]')
    p.wait_for_selector('.score')
    ok(nom + ' score final : 8 sur 10, sans note sanction', '8 sur 10' in p.inner_text('.score') and 'Revois' in p.inner_text('#quiz-fin'))
    ok(nom + ' points à revoir : les deux questions ratées', p.locator('#vue .liste li').count() == 2 and Z['questions'][2]['q'] in p.inner_text('#vue') and Z['questions'][5]['q'] in p.inner_text('#vue'))
    large('3-resultat')
    ok(nom + ' options mélangées à l’affichage', any(o != [0, 1, 2, 3] for o in ordres), ordres)
    r = dossier(p)['comprendre']['epreuve']
    ok(nom + ' résultat gardé : meilleur, dernier, date, essais, ratées', r['meilleur'] == 8 and r['dernier'] == 8 and r['essais'] == 1 and r['rates'] == ['e3', 'e6'] and len(r['le']) == 10, r)
    ok(nom + ' pas encore de haut fait', 'regles' not in dossier(p)['hf'])
    # « Revoir » ouvre la section ; le retour au quiz garde le résultat
    p.locator('#vue .liste a[href="#/aide/epreuve"]').first.click(); p.wait_for_selector('#epreuve[data-cible]')
    ok(nom + ' « Revoir » : la section est montrée', p.evaluate("document.querySelector('#epreuve').getBoundingClientRect().top") < 200)
    # refaire, sans faute
    p.goto(URL + '#/comprendre/epreuve'); p.wait_for_selector('[data-a=quiz-commencer]')
    p.click('[data-a=quiz-commencer]')
    for q in Z['questions']:
        p.locator('label.option:has([value="%d"])' % q['b']).click(); p.click('[data-a=quiz-valider]'); p.click('[data-a=quiz-suivant]')
    p.wait_for_selector('.score')
    ok(nom + ' refaire : sans faute', '10 sur 10' in p.inner_text('.score') and p.locator('#vue .liste li').count() == 0)
    d = dossier(p); r = d['comprendre']['epreuve']
    ok(nom + ' refaire : meilleur 10, deux essais, plus de ratées', r['meilleur'] == 10 and r['dernier'] == 10 and r['essais'] == 2 and r['rates'] == [], r)
    ok(nom + ' haut fait « Maître·sse du jeu »', 'regles' in d['hf'] and 'Maître·sse du jeu' in p.inner_text('#toasts'))
    # le quiz du plan : une erreur, puis « Revoir » ouvre la fiche
    p.goto(URL + '#/comprendre/plan'); p.click('[data-a=quiz-commencer]')
    P = p.evaluate("HGDonnees.COMPRENDRE.find((z) => z.id === 'plan')")
    for i, q in enumerate(P['questions']):
        k = (q['b'] + 2) % 4 if i == 0 else q['b']
        p.locator('label.option:has([value="%d"])' % k).click(); p.click('[data-a=quiz-valider]')
        if i == 0:
            large('4-plan-erreur')
            p.click('#quiz-retour a[href="#/aide/point"]'); p.wait_for_selector('#fiche-point[open]')
            ok(nom + ' « Revoir » ouvre la fiche « Un bon point »', p.evaluate("document.activeElement.closest('#fiche-point') !== null"))
            p.go_back(); p.wait_for_selector('#quiz-retour')
            ok(nom + ' retour au quiz : la question et la réponse sont gardées', 'Question 1 sur 10' in p.inner_text('#vue'))
        p.click('[data-a=quiz-suivant]')
    p.wait_for_selector('.score')
    ok(nom + ' quiz du plan : 9 sur 10', '9 sur 10' in p.inner_text('.score'))
    p.goto(URL + '#/')
    ok(nom + ' accueil : la carte disparaît quand les deux quiz sont faits', p.locator('a[href="#/comprendre/plan"]').count() == 0)
    p.goto(URL + '#/comprendre'); large('5-liste')
    ok(nom + ' liste des quiz : les résultats', 'Meilleur score : 10 sur 10' in p.inner_text('#vue') and 'Meilleur score : 9 sur 10' in p.inner_text('#vue'))
    p.reload(); p.goto(URL + '#/hauts-faits')
    ok(nom + ' hauts faits : « Comprendre »', 'Maître·sse du jeu' in p.inner_text('#vue') and p.locator('.hf .gagne', has_text='Maître·sse du jeu').count() == 1)
    ctx.close()


with sync_playwright() as pw:
    nav = pw.chromium.launch()
    for (l, s) in [(320, False), (320, True), (768, False), (1440, True)]:
        parcours(nav, l, s); print('quiz %d px %s : fait' % (l, 'obscur' if s else 'clair'))
    nav.close()
srv.shutdown()
for x in erreurs: print('  ', x)
print('quiz : %d contrôles, %s' % (n[0], 'aucun problème' if not erreurs else '%d problème(s)' % len(erreurs)))
sys.exit(1 if erreurs else 0)
