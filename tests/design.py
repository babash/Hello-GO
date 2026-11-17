"""Le rendu des écrans refaits en 1.7.0 : python3 tests/design.py (depuis la racine du dépôt).

À 320, 390, 768 et 1440 px, en clair et en obscur : bienvenue, accueil (« Par où commencer », « Ta dose du jour »),
Découvrir (la carte, puis le bilan et la révélation), « Mes goûts » (une question par écran), les sujets proposés.
Contrôles : aucun défilement horizontal ; texte à 4,5:1 au moins sur son fond ; contours des commandes et traits utiles
(tuiles, pastilles, cases du chemin, barre de série) à 3:1 au moins ; pictogrammes cachés aux lecteurs d'écran ;
mouvement réduit : aucune animation ni transition qui dure ; clavier : flèches de Découvrir, boutons de « Ta dose du
jour », Tab jusqu'aux tuiles ; glissement sur écran tactile (jamais le seul moyen) ; aucune requête vers un autre site."""
import functools, http.server, os, re, socketserver, sys, threading
sys.dont_write_bytecode = True
from playwright.sync_api import sync_playwright

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.environ.get('SORTIE', '/tmp/hello-go-essais'); os.makedirs(SORTIE, exist_ok=True)
class Muet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Muet, directory=RACINE)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = 'http://127.0.0.1:%d/index.html' % srv.server_address[1]
erreurs, n = [], [0]
def ok(nom, vrai, detail=''):
    n[0] += 1
    if not vrai: erreurs.append(nom + ' : ' + str(detail)[:400]); print('ÉCHEC  ' + nom, str(detail)[:400])

# Couleurs calculées : rgb(), rgba() ou color(srgb …) ; le fond est celui du premier ancêtre opaque.
OUTILS = r"""
  const rgb = (c) => { let m = /color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.]+))?\)/.exec(c);
    if (m) return [+m[1] * 255, +m[2] * 255, +m[3] * 255, m[4] === undefined ? 1 : +m[4]];
    m = (c.match(/[\d.]+/g) || [0, 0, 0, 0]).map(Number); return [m[0], m[1], m[2], m.length > 3 ? m[3] : 1]; };
  const lum = (c) => { const m = rgb(c), f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
  const fond = (el) => { for (let x = el; x; x = x.parentElement) { const b = getComputedStyle(x).backgroundColor; if (rgb(b)[3] > 0.5) return b; }
    return getComputedStyle(document.body).backgroundColor; };
  const rapport = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const visible = (el) => el.offsetParent && el.getBoundingClientRect().width > 0 && getComputedStyle(el).visibility !== 'hidden' && +getComputedStyle(el).opacity > 0.5;
"""
TEXTE = '() => {' + OUTILS + r"""
  let pire = 99, ou = '';
  document.querySelectorAll('#vue *').forEach((el) => {
    if (!visible(el) || el.closest('svg') || getComputedStyle(el).webkitBackgroundClip === 'text') return; // le logo : un dégradé, vérifié à part
    const t = [...el.childNodes].some((x) => x.nodeType === 3 && x.textContent.trim()); if (!t) return;
    const r = rapport(getComputedStyle(el).color, fond(el)); if (r < pire) { pire = r; ou = el.tagName + '.' + el.className + ' « ' + el.textContent.trim().slice(0, 30) + ' »'; } });
  return [pire, ou]; }"""
TRAITS = '(sel) => {' + OUTILS + r"""
  let pire = 99, ou = '';
  document.querySelectorAll(sel).forEach((el) => { if (!visible(el)) return; const s = getComputedStyle(el);
    const c = s.borderTopWidth !== '0px' && s.borderTopStyle !== 'none' ? s.borderTopColor : s.backgroundColor;
    const r = rapport(c, fond(el.parentElement)); if (r < pire) { pire = r; ou = el.tagName + '.' + el.className; } });
  return [pire, ou]; }"""
ANIMATIONS = r"""() => { let pire = 0, ou = '';
  document.querySelectorAll('#vue *, #vue *::before').forEach((el) => { const s = getComputedStyle(el);
    const t = (v) => Math.max(...v.split(',').map((x) => parseFloat(x) * (x.trim().endsWith('ms') ? 1 : 1000)));
    const d = Math.max(s.animationName !== 'none' ? t(s.animationDuration) + t(s.animationDelay) : 0, t(s.transitionDuration));
    if (d > pire) { pire = d; ou = el.tagName + '.' + el.className; } });
  return [pire, ou]; }"""
PICTOS = "() => [...document.querySelectorAll('#vue svg.picto, #vue svg.motif, #vue .coche-anim')].filter((s) => s.getAttribute('aria-hidden') !== 'true' && !s.closest('[aria-hidden=true]')).length"
COMMANDES = '.tuiles .puce span, .point-etape, .dose-onglets button, .deux button, input[type=text], .serie li'

def controler(p, nom, etape):
    p.wait_for_timeout(350)  # la fin des transitions
    d = p.evaluate('document.documentElement.scrollWidth - window.innerWidth'); ok('%s %s : pas de défilement horizontal' % (nom, etape), d <= 1, d)
    t = p.evaluate(TEXTE); ok('%s %s : texte %.2f:1' % (nom, etape, t[0]), t[0] >= 4.5, t)
    c = p.evaluate(TRAITS, COMMANDES); ok('%s %s : contours des commandes %.2f:1' % (nom, etape, c[0]), c[0] >= 3, c)
    ok('%s %s : pictogrammes cachés aux lecteurs d’écran' % (nom, etape), p.evaluate(PICTOS) == 0)
    p.screenshot(path='%s/design-%s-%s.png' % (SORTIE, nom, etape), full_page=True)

def essai(nav, largeur, sombre):
    nom = '%d-%s' % (largeur, 'obscur' if sombre else 'clair')
    ctx = nav.new_context(viewport={'width': largeur, 'height': 860}, color_scheme='dark' if sombre else 'light', service_workers='block', has_touch=largeur < 500)
    ctx.route(re.compile(r'^https?://(?!127\.0\.0\.1)'), lambda r: (erreurs.append(nom + ' requête externe : ' + r.request.url), r.abort()))
    p = ctx.new_page()
    p.on('pageerror', lambda x: erreurs.append(nom + ' erreur JS : ' + str(x)))
    p.on('console', lambda m: erreurs.append(nom + ' console : ' + m.text) if m.type == 'error' else None)
    p.goto(URL); p.wait_for_selector('#prenom'); controler(p, nom, '0-bienvenue')
    p.fill('#prenom', 'Essai'); p.click('[data-a=demarrer]'); p.wait_for_selector('.heros-etape')
    ok(nom + ' : la prochaine étape mène à Découvrir', p.get_attribute('.action a', 'href') == '#/explorer/decouvrir')
    ok(nom + ' : « Par où commencer » est dans la carte de la prochaine étape', p.locator('.heros-etape .chemin-etapes li').count() == 7)
    ok(nom + ' : « Ta dose du jour » : conseil, affirmation, vidéo, tous dans la page', p.locator('.dose-diapo').count() == 3 and p.locator('.dose .savoir').count() == 1 and p.locator('.dose .infox-jour').count() == 1 and p.locator('.dose .video-accueil').count() == 1)
    controler(p, nom, '1-accueil')
    # « Ta dose du jour » au clavier : le bouton montre la diapo et devient le bouton courant.
    p.locator('[data-a=dose][data-i="2"]').focus(); p.keyboard.press('Enter'); p.wait_for_timeout(900)
    ok(nom + ' : « Vidéo » montre la vidéo du jour', p.get_attribute('[data-a=dose][data-i="2"]', 'aria-current') == 'true' and p.evaluate("(() => { const a = document.querySelector('.dose-piste').getBoundingClientRect(), b = document.querySelector('.dose-diapo[data-i=\"2\"]').getBoundingClientRect(); return b.left >= a.left - 2 && b.left < a.right; })()"))
    p.locator('.dose .infox-jour [data-a=infox-jour]').first.click(); p.wait_for_selector('.dose .infox-jour .retour-quiz')
    ok(nom + ' : après la réponse du jour, la diapo de l’affirmation reste montrée', p.get_attribute('[data-a=dose][data-i="1"]', 'aria-current') == 'true')
    # Découvrir : boutons, flèches, glissement ; la série de 10 ; puis le bilan et la révélation.
    p.click('.action a'); p.wait_for_selector('.decouverte'); controler(p, nom, '2-decouvrir')
    ok(nom + ' : la série de 10 cartes se voit', p.locator('.serie li').count() == 10 and p.locator('.serie li.ici').count() == 1)
    p.click('[data-a=reagir][data-v="1"]'); ok(nom + ' : bouton « Ça m’intrigue »', 'Carte 2 sur' in p.inner_text('.decouverte'))
    p.keyboard.press('ArrowRight'); p.wait_for_timeout(100); ok(nom + ' : flèche droite', 'Carte 3 sur' in p.inner_text('.decouverte'))
    p.keyboard.press('ArrowLeft'); p.wait_for_timeout(100); ok(nom + ' : flèche gauche', 'Carte 4 sur' in p.inner_text('.decouverte'))
    ok(nom + ' : le focus va au titre de la nouvelle carte', p.evaluate('document.activeElement.matches(".decouverte h2")'))
    if largeur < 500:
        b = p.locator('.decouverte').bounding_box(); y = b['y'] + 30; x = b['x'] + 40
        t = lambda dx: [{'identifier': 1, 'clientX': x + dx, 'clientY': y}]
        p.locator('.decouverte h2').dispatch_event('touchstart', {'touches': t(0), 'changedTouches': t(0)})
        p.locator('.decouverte h2').dispatch_event('touchmove', {'touches': t(120), 'changedTouches': t(120)})
        ok(nom + ' : en glissant, la carte suit le doigt et le tampon apparaît', p.evaluate("getComputedStyle(document.querySelector('.tampon-oui')).opacity") == '1')
        p.locator('.decouverte h2').dispatch_event('touchend', {'touches': [], 'changedTouches': t(120)}); p.wait_for_timeout(100)
        ok(nom + ' : glisser à droite = « Ça m’intrigue »', 'Carte 5 sur' in p.inner_text('.decouverte'))
    while p.locator('.decouverte').count(): p.locator('[data-a=reagir][data-v="1"]').click()
    ok(nom + ' : au bilan, le compteur et la révélation', p.locator('.bilan .compteur b').count() == 1 and p.locator('.revelation .sujet').count() >= 5)
    ok(nom + ' : « parce que tu as choisi… » en pastilles', p.locator('.revelation .raison').count() >= 1)
    controler(p, nom, '3-bilan')
    # Mes goûts : une question par écran, la progression, Tab jusqu'aux tuiles.
    p.goto(URL + '#/explorer/quiz'); p.wait_for_selector('.etape-gouts')
    ok(nom + ' : une seule question à l’écran', p.locator('.etape-gouts:visible').count() == 1)
    p.locator('.point-etape[data-q=gouts]').focus()
    for _ in range(12):
        p.keyboard.press('Tab')
        if p.evaluate("document.activeElement.matches('input[data-quiz]')"): break
    ok(nom + ' : au clavier, Tab mène aux tuiles', p.evaluate("document.activeElement.matches('input[data-quiz=gouts]')"))
    p.keyboard.press('Space'); ok(nom + ' : Espace coche la tuile', p.locator('input[data-quiz=gouts]:checked').count() == 1)
    controler(p, nom, '4-gouts')
    p.click('.point-etape[data-q=angle]'); controler(p, nom, '5-gouts-angle')
    p.click('.point-etape[data-q=apres]'); p.click('.gouts-nav .principal'); ok(nom + ' : « Suivante » mène à la dernière étape', p.locator('.etape-gouts[data-etape]:visible #piste-libre').count() == 1)
    p.click('[data-a=quiz-fini]'); p.wait_for_selector('#resultats .sujet'); controler(p, nom, '6-propositions')
    ctx.close()

def mouvement(nav):
    """Mouvement réduit : aucune animation ni transition qui dure, sur les écrans refaits ; et rien n'est caché pour autant."""
    ctx = nav.new_context(viewport={'width': 390, 'height': 860}, reduced_motion='reduce', service_workers='block'); p = ctx.new_page()
    p.goto(URL); a = p.evaluate(ANIMATIONS); ok('mouvement réduit : bienvenue, %.0f ms' % a[0], a[0] <= 1, a)
    p.fill('#prenom', 'Essai'); p.click('[data-a=demarrer]'); p.wait_for_selector('.heros-etape'); a = p.evaluate(ANIMATIONS); ok('mouvement réduit : accueil, %.0f ms' % a[0], a[0] <= 1, a)
    p.goto(URL + '#/explorer/decouvrir'); p.wait_for_selector('.decouverte'); p.click('[data-a=reagir][data-v="1"]'); a = p.evaluate(ANIMATIONS); ok('mouvement réduit : Découvrir, %.0f ms' % a[0], a[0] <= 1, a)
    while p.locator('.decouverte').count(): p.locator('[data-a=reagir][data-v="1"]').click()
    ok('mouvement réduit : les propositions sont toutes visibles', p.evaluate("[...document.querySelectorAll('.revelation .sujet')].every((x) => getComputedStyle(x).opacity === '1')"))
    p.goto(URL + '#/explorer/quiz'); p.wait_for_selector('.etape-gouts'); p.locator('label.puce').first.click(); a = p.evaluate(ANIMATIONS); ok('mouvement réduit : Mes goûts, %.0f ms' % a[0], a[0] <= 1, a)
    p.goto(URL + '#/prof'); p.wait_for_timeout(300); ok('espace de l’enseignant·e : sobre (ni motif ni pictogramme de jeu)', p.locator('#vue .motif, #vue .tampon, #vue .dose').count() == 0)
    ctx.close()

def deja_commence(nav):
    """Un·e élève qui revient : aucun écran d'introduction, ses réponses à leur place, « Mes goûts » s'ouvre sur la première question."""
    ctx = nav.new_context(viewport={'width': 390, 'height': 860}, service_workers='block'); p = ctx.new_page(); p.goto(URL)
    p.evaluate("""localStorage.setItem('hellogo:dossier:v1', JSON.stringify({ v: 1, profil: { prenom: 'Lou', vu: true }, quiz: { reponses: { gouts: ['musique'], spe: 'maths', dansspe: ['probas'] }, fait: true },
      interets: ['', '', ''], ponts: [''], pistes: [], questions: [], decouverte: { reactions: { 4: 1, 5: -1 } }, comprendre: {}, mots: [], sources: [], oraux: [], hf: {}, compteurs: {}, vus: {} }))""")
    p.reload(); p.wait_for_selector('.heros-etape'); ok('qui revient : l’accueil directement', 'Salut Lou' in p.inner_text('h1') and p.locator('#prenom').count() == 0)
    p.goto(URL + '#/explorer/quiz'); p.wait_for_selector('.etape-gouts')
    ok('qui revient : ses réponses sont cochées', p.locator('input[data-quiz=gouts][value=musique]').is_checked() and p.locator('input[data-quiz=dansspe][value=probas]').is_checked())
    ok('qui revient : les questions déjà répondues sont marquées', p.locator('.point-etape.fait').count() == 3)
    ok('qui revient : ses sujets sont là', p.locator('#resultats .sujet').count() == 5)
    p.goto(URL + '#/explorer/decouvrir'); ok('qui revient : Découvrir reprend à la carte 3', 'Carte 3 sur' in p.inner_text('.decouverte'))
    ctx.close()

with sync_playwright() as pw:
    nav = pw.chromium.launch()
    for l in (320, 390, 768, 1440):
        for s in (False, True): essai(nav, l, s); print('design %d px %s : fait' % (l, 'obscur' if s else 'clair'))
    mouvement(nav); deja_commence(nav)
    nav.close()
print('design : %d contrôles, %s' % (n[0], 'aucun problème' if not erreurs else '%d problème(s)' % len(erreurs)))
for x in erreurs: print(' -', x)
sys.exit(1 if erreurs else 0)
