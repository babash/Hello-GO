"""Essai du parcours complet dans un navigateur : python3 tests/parcours.py (depuis la racine du dépôt)."""
import http.server, socketserver, threading, functools, sys, os, json
from playwright.sync_api import sync_playwright

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.environ.get('SORTIE', '/tmp/hello-go-essais'); os.makedirs(SORTIE, exist_ok=True)

class Muet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Muet, directory=RACINE))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = 'http://127.0.0.1:%d/index.html' % srv.server_address[1]
erreurs = []

def parcours(nav, largeur, hauteur, sombre):
    ctx = nav.new_context(viewport={'width': largeur, 'height': hauteur}, color_scheme='dark' if sombre else 'light', accept_downloads=True)
    p = ctx.new_page(); nom = '%d-%s' % (largeur, 'obscur' if sombre else 'clair')
    p.on('console', lambda m: erreurs.append(nom + ' console: ' + m.text) if m.type == 'error' else None)
    p.on('pageerror', lambda x: erreurs.append(nom + ' erreur: ' + str(x)))
    p.on('request', lambda r: erreurs.append(nom + ' requête externe: ' + r.url) if not r.url.startswith('http://127.0.0.1') and not r.url.startswith('data:') and not r.url.startswith('blob:') else None)
    def large(etape):
        d = p.evaluate('document.documentElement.scrollWidth - window.innerWidth')
        if d > 1: erreurs.append('%s %s : défilement horizontal de %d px' % (nom, etape, d))
        p.screenshot(path='%s/%s-%s.png' % (SORTIE, nom, etape), full_page=True)
    p.goto(URL); assert p.locator('#nav').is_hidden(); large('0-bienvenue')
    p.fill('#prenom', 'Essai'); p.click('[data-a=demarrer]'); assert 'Salut Essai' in p.inner_text('h1'); large('1-accueil')
    p.click('.action a'); p.wait_for_selector('.decouverte'); assert '#/explorer/decouvrir' in p.url; large('1b-decouvrir')
    for k in range(10):
        assert ('Carte %d sur' % (k + 1)) in p.inner_text('.decouverte'); p.locator('[data-a=reagir][data-v="%d"]' % (1 if k % 2 == 0 else -1)).click()
    assert p.locator('.decouverte').count() == 0 and p.locator('[data-a=suite-cartes]').count() == 1; assert p.locator('.sujet').count() >= 5; large('1c-bilan')
    p.click('[data-a=suite-cartes]'); assert 'Carte 11 sur' in p.inner_text('.decouverte')
    p.goto(URL + '#/explorer/quiz'); p.wait_for_selector('.puce')
    p.locator('label.puce', has_text='faire de la musique').click(); p.locator('label.puce', has_text='Mathématiques').click(); p.wait_for_selector('[name=quiz-dansspe]')
    assert p.locator('label.puce', has_text='Suites et récurrence').count() == 1; p.locator('label.puce', has_text='Probabilités').click()
    p.locator('label.puce', has_text='Imaginer').click(); assert p.locator('label.puce', has_text='faire de la musique').locator('input').is_checked()
    p.click('[data-a=quiz-fini]'); assert p.locator('#resultats .sujet').count() == 5; assert 'usi' in p.locator('#resultats').inner_text(); large('2-quiz')
    p.locator('#resultats [data-a=garder]').first.click()
    p.goto(URL + '#/explorer/sujets'); p.fill('#recherche', 'tor'); assert p.locator('.sujet:visible').count() >= 1; large('3-sujets')
    p.goto(URL + '#/explorer/pistes'); assert p.locator('.piste').count() == 1
    p.locator('.piste input[data-f$="idees.0"]').fill('Les IA qui composent'); p.locator('.piste input[data-f$="candidates.0"]').fill('L’IA peut-elle composer une musique originale ?')
    large('4-pistes'); p.click('[data-a=choisir]'); p.wait_for_selector('.titre-question'); assert '#/question/' in p.url
    assert p.locator('.pt').count() == 1, p.locator('.pt').count()
    # le plan : ajouter des points, les typer, les relier
    p.locator('[data-a=plus-pt]').first.click(); p.keyboard.type('En 2023, 60 % des titres mis en ligne utilisent un algorithme'); p.keyboard.press('Enter'); p.keyboard.type('Peut-on parler de création ?')
    assert p.locator('.pt').count() == 3
    p.locator('.pt select').first.select_option('accroche')
    assert 'sans source' in p.inner_text('[data-zone=coach]'); assert 'algorithme' in p.inner_text('[data-zone=coach]')
    p.locator('.pt [data-t=mots]').first.click(); p.fill('#nouveau-lien', 'Algorithme'); p.click('dialog button[value=ok]'); p.wait_for_selector('.etq.mot'); assert p.locator('.etq.mot').count() == 1
    p.locator('.pt [data-t=sources]').first.click(); p.fill('#nouveau-lien', 'Rapport de la Sacem'); p.click('dialog button[value=ok]'); p.wait_for_selector('.etq.src'); assert p.locator('.etq.src').count() == 1
    assert 'sans source' not in p.inner_text('[data-zone=coach]')
    avant = p.locator('.partie').nth(0).locator('.pt').count()
    p.locator('.partie').nth(0).locator('[data-a=descendre]').last.click()
    assert p.locator('.partie').nth(0).locator('.pt').count() == avant - 1
    p.locator('[data-a=suppr-pt]').last.click(); n = p.locator('.pt').count(); p.locator('.toast button').last.click(); assert p.locator('.pt').count() == n + 1
    large('5-plan')
    # le PDF
    with p.expect_download(timeout=60000) as dl: p.click('[data-a=pdf]')
    f = '%s/%s.pdf' % (SORTIE, nom); dl.value.save_as(f); assert os.path.getsize(f) > 5000
    # l'échange
    p.locator('.onglets a', has_text='Échange').click(); p.wait_for_selector('#ech-libre'); p.locator('[data-a=garder-ech]').first.click(); assert p.locator('[data-a=suppr-ech]').count() == 1; large('6-echange')
    # les mots et les sources
    p.goto(URL + '#/mots'); p.locator('textarea[data-f$=defSource]').fill('Suite finie et non ambiguë d’opérations'); p.locator('textarea[data-f$=defMoi]').fill('Suite finie et non ambigue d operations'); p.locator('textarea[data-f$=defMoi]').blur()
    assert 'ressemble trop' in p.inner_text('[data-zone=mot]'); assert p.inner_text('[data-zone=etat-mot]') == 'Complet'; large('7-mots')
    p.goto(URL + '#/sources'); p.locator('select[data-f$=type]').select_option('experte'); large('8-sources')
    p.goto(URL + '#/oraux'); p.locator('.oral summary').first.click()
    for i in range(5): p.locator('.oral').first.locator('.critere').nth(i).locator('label.niveau').nth(2).click()
    assert '15 / 20' in p.locator('.oral').first.inner_text(); large('9-oraux')
    p.goto(URL + '#/aide'); p.locator('[data-fiche=canard] summary').click(); large('10-aide')
    p.goto(URL + '#/aide/exemple'); assert p.locator('.pt').count() > 15; large('11-exemple')
    p.goto(URL + '#/hauts-faits'); gagnes = p.locator('.hf .gagne').count(); assert gagnes >= 6, gagnes; large('12-hauts-faits')
    p.goto(URL + '#/reglages'); large('13-reglages')
    with p.expect_download() as dl: p.click('[data-a=exporter]')
    dossier = json.load(open(dl.value.path(), encoding='utf8')); assert dossier['questions'][0]['parties'][0]['points']
    # le dossier survit au rechargement
    p.reload(); p.goto(URL + '#/questions'); assert p.locator('.lien-carte').count() == 1
    p.goto(URL + '#/reglages'); p.fill('#confirmer', 'EFFACER'); p.click('[data-a=effacer]'); p.wait_for_selector('#prenom'); assert p.locator('#prenom').count() == 1
    ctx.close(); return gagnes

with sync_playwright() as pw:
    nav = pw.chromium.launch()
    for (l, h, s) in [(320, 640, False), (390, 800, True), (768, 1000, False), (1440, 900, True)]:
        g = parcours(nav, l, h, s); print('parcours %d px %s : fait (%d hauts faits gagnés)' % (l, 'obscur' if s else 'clair', g))
    nav.close()
srv.shutdown()
if erreurs:
    print('\n'.join(erreurs)); sys.exit(1)
print('parcours : aucun problème')
