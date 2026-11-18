"""La culture (version 1.6.0) dans un navigateur : python3 tests/culture.py (depuis la racine du dépôt).

À 320 px en obscur et à 1440 px en clair : vidéo vue → note → piste et source ; « Pas pour moi » ; une salve
« Info ou infox ? » au clavier (et en glissant sur téléphone) → accroche gardée → point d'introduction avec sa source ;
« Piocher une accroche » dans l'éditeur ; le conseil du jour et « Pourquoi ? » ; la page des conseils ; les liens externes
(nouvel onglet, sans transmettre l'adresse, https seulement) ; aucune requête vers un autre site ; ni débordement ni erreur ;
contrastes du texte des nouvelles cartes (4,5:1 au moins)."""
import functools, http.server, json, os, re, socketserver, sys, threading
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

CONTRASTE = """(sel) => { const lum = (c) => { const m = c.match(/[\\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return [0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]), m.length > 3 ? m[3] : 1]; };
  const fond = (el) => { for (let x = el; x; x = x.parentElement) { const b = getComputedStyle(x).backgroundColor; if (lum(b)[1] > 0.5) return b; } return getComputedStyle(document.body).backgroundColor; };
  let pire = 99, ou = ''; document.querySelectorAll(sel).forEach((el) => { if (!el.offsetParent || !el.textContent.trim()) return;
    const a = lum(getComputedStyle(el).color)[0], b = lum(fond(el))[0], r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); if (r < pire) { pire = r; ou = el.tagName + ' ' + el.textContent.trim().slice(0, 30); } });
  return [pire, ou]; }"""
TEXTES = '.video p, .video a, .video span, .video button, .infox-jour p, .infox-jour button, .infox-carte p, .infox-carte button, .retour-quiz p, .retour-quiz a, .savoir p, .savoir summary, .savoir a, .conseil p, .conseil summary, .chaines p, .chaines a'

def essai(nav, largeur, sombre):
    nom = '%d-%s' % (largeur, 'obscur' if sombre else 'clair')
    ctx = nav.new_context(viewport={'width': largeur, 'height': 900}, color_scheme='dark' if sombre else 'light', service_workers='block', has_touch=largeur < 500)
    ctx.route(re.compile(r'^https?://(?!127\.0\.0\.1)'), lambda r: (erreurs.append(nom + ' requête externe : ' + r.request.url), r.abort()))
    p = ctx.new_page()
    p.on('pageerror', lambda x: erreurs.append(nom + ' erreur JS : ' + str(x)))
    p.on('console', lambda m: erreurs.append(nom + ' console : ' + m.text) if m.type == 'error' else None)
    def verifier(etape):
        d = p.evaluate('document.documentElement.scrollWidth - window.innerWidth'); ok('%s %s : pas de débordement' % (nom, etape), d <= 1, d)
        c = p.evaluate(CONTRASTE, TEXTES); ok('%s %s : contraste %.2f (%s)' % (nom, etape, c[0], c[1]), c[0] >= 4.5, c)
        p.screenshot(path='%s/culture-%s-%s.png' % (SORTIE, nom, etape), full_page=True)
    dossier = lambda: p.evaluate("JSON.parse(localStorage.getItem('hellogo:dossier:v1'))")
    p.goto(URL); p.fill('#prenom', 'Essai'); p.click('[data-a=demarrer]'); p.wait_for_selector('.infox-jour')

    # --- Accueil : conseil du jour et « Pourquoi ? », affirmation du jour, une vidéo pour toi ---
    for _ in range(4):
        if p.locator('.savoir details.pourquoi').count(): break
        p.click('[data-a=autre-savoir]')
    s = p.locator('.savoir'); ok(nom + ' : un conseil fondé sur un résultat, avec « Pourquoi ? »', s.locator('details.pourquoi').count() == 1)
    s.locator('summary').click(); t = s.inner_text()
    ok(nom + ' : « Pourquoi ? » donne la solidité et la source', re.search(r'Solidité : (bien établi|plusieurs études|une étude|repère de manuel|consignes aux jurys)', t) and s.locator('details a[target=_blank]').count() >= 1, t)
    liens = p.evaluate("[...document.querySelectorAll('#vue a[target=_blank]')].map((a) => [a.href, a.rel])")
    ok(nom + ' : liens externes https, sans transmettre l’adresse', liens and all(h.startswith('https://') and 'noopener' in r and 'noreferrer' in r for h, r in liens), liens)
    ok(nom + ' : aucun lecteur ni image d’un autre site', p.evaluate("!document.querySelector('iframe, video, img[src^=http], embed, object')"))
    j = p.inner_text('.infox-jour .gros'); p.locator('.infox-jour [data-a=infox-jour]').first.click()
    ok(nom + ' : affirmation du jour, puis la réponse et la source', p.locator('.infox-jour .retour-quiz').count() == 1 and 'Source' in p.inner_text('.infox-jour'))
    ok(nom + ' : l’affirmation du jour reste la même après la réponse', p.inner_text('.infox-jour .gros') == j)
    titre = p.inner_text('.video-accueil .gros a'); p.click('[data-a=video-autre]')
    ok(nom + ' : « Une autre » vidéo', p.inner_text('.video-accueil .gros a') != titre); verifier('accueil')

    # --- Mes goûts : des vidéos à la fin, avec le pourquoi ---
    p.goto(URL + '#/explorer/quiz'); p.wait_for_selector('.puce'); p.locator('label.puce', has_text='Jeux vidéo').click(); p.click('[data-a=quiz-fini]')
    ok(nom + ' : 3 vidéos à la fin du questionnaire', p.locator('#resultats .video').count() == 3)
    ok(nom + ' : chaque vidéo dit pourquoi', p.locator('#resultats .pourquoi-video', has_text='les jeux').count() >= 1, p.inner_text('#resultats'))

    # --- Vidéos : vue → notes → piste et source ; « Pas pour moi » ; filtre ; chaînes ---
    p.goto(URL + '#/explorer/videos'); p.wait_for_selector('.video')
    v = p.locator('ul.liste').first.locator('.video').first; vid = v.get_attribute('id')[6:]
    v.locator('[data-a=video-vue]').click(); z = p.locator('[data-f="cv.%s.retiens"]' % vid)
    ok(nom + ' : « Je l’ai regardée » ouvre la note', z.evaluate('(x) => x === document.activeElement'))
    z.type('Ce que je retiens <b>gras</b>'); p.locator('[data-f="cv.%s.intrigue"]' % vid).first.type('Ce qui m’intrigue'); p.wait_for_timeout(500)
    p.locator('#video-%s [data-a=video-piste]' % vid).first.click(); p.locator('#video-%s [data-a=video-source]' % vid).first.click()
    d = dossier(); cv = d['culture']['videos'][vid]
    pi = next(x for x in d['pistes'] if x['id'] == cv['piste']); so = next(x for x in d['sources'] if x['id'] == cv['source'])
    q = p.evaluate('(k) => HGCulture.VIDEOS.find((v) => v.id === k)', vid)
    ok(nom + ' : la piste reprend la question inspirée', pi['titre'] == q['question'] and q['question'] in pi['candidates'] and pi['pourquoi'] == 'Ce qui m’intrigue')
    ok(nom + ' : la source est remplie (vulgarisation, lien, titre, ce que j’en retiens)', so['type'] == 'vulgarisee' and so['lien'] == q['url'] and so['titre'] == q['titre'] and so['retiens'].startswith('Ce que je retiens'))
    ok(nom + ' : la note est affichée telle quelle, échappée', p.locator('#video-%s textarea' % vid).first.input_value().endswith('<b>gras</b>') and p.locator('#vue b', has_text='gras').count() == 0)
    autre = p.locator('ul.liste').first.locator('.video [data-a=video-non]').first; aid = autre.get_attribute('data-v'); autre.click()
    ok(nom + ' : « Pas pour moi »', dossier()['culture']['videos'][aid]['avis'] == -1 and p.locator('ul.liste').first.locator('#video-' + aid).count() == 0)
    p.select_option('#filtre-videos', 'i.musique'); ok(nom + ' : filtre par thème', p.locator('.liste .video').count() >= 1 and 'Auto-tune' in p.inner_text('#vue'))
    ok(nom + ' : chaînes à découvrir', p.locator('#chaines li').count() >= 14); verifier('videos')

    # --- Info ou infox ? : une salve au clavier (et en glissant sur téléphone), une accroche gardée ---
    p.goto(URL + '#/explorer/infox'); p.click('[data-a=infox-commencer]'); vues = []
    for k in range(7):
        p.wait_for_selector('.infox-carte'); vues.append(p.get_attribute('.infox-carte', 'data-infox'))
        if k == 1 and largeur < 500:
            b = p.locator('.infox-carte').bounding_box(); y = b['y'] + 20
            p.locator('.infox-carte').dispatch_event('touchstart', {'touches': [{'identifier': 1, 'clientX': b['x'] + 20, 'clientY': y}], 'changedTouches': [{'identifier': 1, 'clientX': b['x'] + 20, 'clientY': y}]})
            p.locator('.infox-carte').dispatch_event('touchend', {'touches': [], 'changedTouches': [{'identifier': 1, 'clientX': b['x'] + 200, 'clientY': y}]})
        else: p.keyboard.press('ArrowRight' if k % 2 else 'ArrowLeft')
        p.wait_for_selector('#infox-retour'); r = p.inner_text('#infox-retour')
        a = p.evaluate('(k) => HGCulture.INFOX.find((a) => a.id === k)', vues[-1])
        ok(nom + ' : réponse, explication, démenti et source juste après', a['explication'][:40] in r and 'Source' in r and ('infox' in r if not a['vrai'] else 'info' in r), r)
        if k == 0: p.click('#infox-retour [data-a=infox-garder]'); garde = a
        if k == 2: verifier('infox-reponse')
        p.click('[data-a=infox-suivante]')
    p.wait_for_selector('#infox-fin'); ok(nom + ' : score de la salve, sans sanction', re.search(r'\d sur 7', p.inner_text('#infox-fin')))
    d = dossier(); ok(nom + ' : 7 affirmations notées, une salve', len(d['culture']['infox']) >= 7 and d['culture']['salves'] == 1)
    ok(nom + ' : seule la formulation « accroche » est gardée', garde['affirmation'] not in p.inner_text('#mes-accroches') or garde['vrai'])
    verifier('infox-fin')
    # l'accroche devient le premier point de l'introduction, avec sa source
    p.goto(URL + '#/questions'); p.fill('#question-libre', 'Un bug peut-il coûter des vies ?'); p.click('[data-a=question-libre]'); p.wait_for_selector('.partie')
    qid = p.url.split('/')[-1]
    p.goto(URL + '#/explorer/infox'); p.click('#mes-accroches [data-a=accroche-ajouter]')
    d = dossier(); qq = next(x for x in d['questions'] if x['id'] == qid); pt = qq['parties'][0]['points'][0]
    acc = re.sub(r'^«\s*|\s*»$', '', garde['accroche'])
    ok(nom + ' : point « accroche » au début de l’introduction', pt['etiquette'] == 'accroche' and pt['texte'] == acc, pt)
    src = next(x for x in d['sources'] if x['id'] in pt['sources']); ok(nom + ' : sa source, reliée', src['lien'] == garde['source']['url'])
    ok(nom + ' : l’accroche est notée comme utilisée', d['culture']['accroches'][garde['id']]['p'] == pt['id'] and d['hf'].get('hamecon'))
    # « Piocher une accroche » : d'abord les faits liés au sujet
    p.goto(URL + '#/question/' + qid); p.click('[data-a=piocher]'); p.wait_for_selector('#dialogue[open]')
    t = p.inner_text('#dialogue'); ok(nom + ' : piocher, des faits liés au sujet', 'Liées à ton sujet' in t and p.locator('#dialogue [data-a=accroche-piocher]').count() >= 3, t[:300])
    p.locator('#dialogue [data-a=accroche-piocher]').first.click(); p.wait_for_timeout(200)
    ok(nom + ' : l’accroche piochée rejoint le plan', len(dossier()['questions'][0]['parties'][0]['points']) == 2 and not p.locator('#dialogue[open]').count()); verifier('plan')

    # --- Les conseils, par phase, reliés aux fiches ---
    p.goto(URL + '#/conseils/derniere-phrase'); p.wait_for_selector('#conseil-derniere-phrase')
    ok(nom + ' : la page des conseils, par phase', p.locator('.conseil').count() == 40 and p.locator('#conseil-derniere-phrase details[open]').count() == 1)
    ok(nom + ' : conseil relié à la fiche et au quiz', p.locator('#conseil-derniere-phrase a[href="#/aide/plan"]').count() == 1 and p.locator('#conseil-derniere-phrase a[href="#/comprendre/plan"]').count() == 1)
    verifier('conseils')
    p.goto(URL + '#/aide/plan'); ok(nom + ' : la fiche renvoie aux conseils', p.locator('#fiche-plan a[href^="#/conseils/"]').count() >= 4)
    # --- L'export Markdown de l'élève contient la culture ---
    md = p.evaluate("HGExport.dossier(JSON.parse(localStorage.getItem('hellogo:dossier:v1')))")
    # L'export neutralise les caractères qui ont un sens en Markdown (« @ » devient « \@ », « < » devient « &lt; ») : l'accroche
    # se cherche donc dans le texte débarrassé de ces marques (sinon l'essai échoue quand la salve commence par « arobase »).
    brut = md.replace('\\', '').replace('&lt;', '<')
    ok(nom + ' : export Markdown', 'Ma culture' in md and q['url'] in md and acc[:30] in brut, acc[:30])
    p.goto(URL + '#/hauts-faits'); ok(nom + ' : groupe « La culture » des hauts faits', 'La culture' in p.inner_text('#vue'))
    ctx.close()

with sync_playwright() as pw:
    nav = pw.chromium.launch()
    for largeur, sombre in ((320, True), (1440, False), (768, True), (320, False)):
        essai(nav, largeur, sombre)
    nav.close()
srv.shutdown()
print('culture (navigateur) : %d contrôles, %s' % (n[0], 'aucun problème' if not erreurs else '%d problème(s)' % len(erreurs)))
for x in erreurs: print(' -', x)
sys.exit(1 if erreurs else 0)
