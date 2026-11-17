"""Fabrique js/culture.js (vidéos conseillées, chaînes, « Info ou infox ? », conseils fondés sur des résultats observés)
à partir des trois fichiers de la recherche du 17/11/2026, gardés dans outils/culture/ :
  videos.json, info-ou-infox.json, conseils.json
Usage : python3 -I outils/generer_culture.py [dossier des trois fichiers]   (par défaut : outils/culture)

Méthode de vérification (voir la note « La culture » du README) : chaque vidéo a été contrôlée le 17/11/2026 par l'oEmbed de
YouTube (titre et chaîne) ; chaque affirmation et chaque conseil reposent sur une page ouverte ce jour-là. Ce script ne
change aucun texte ni aucun lien : il choisit les champs affichés et applique les décisions de l'enseignant (17/11, 10:48) :
- une vidéo au statut « non_verifie » n'est pas reprise (Le Dessous des cartes ; Scilabus n'est pas dans la liste) ;
- les correspondances incertaines (verifie_titre_different, verifie_chaine_differente, substitution) sont acceptées ;
- Wikipédia est acceptée comme source affichée ;
- un conseil dont le champ « lu_par » signale un détail « à contrôler » est affiché sans ses auteur·e·s ni son titre ;
- la solidité « retour de jurys » s'affiche « consignes aux jurys » (ce sont des consignes, pas des bilans de session).
Il vérifie : identifiants uniques et sûrs, liens https, étiquettes connues, sources présentes, champs requis."""
import json, os, re, sys

ICI = os.path.dirname(os.path.abspath(__file__))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ICI, 'culture')
SORTIE = os.path.join(os.path.dirname(ICI), 'js', 'culture.js')
lire = lambda f: json.load(open(os.path.join(SRC, f), encoding='utf8'))
V, X, C = lire('videos.json'), lire('info-ou-infox.json'), lire('conseils.json')

# Les étiquettes de js/donnees.js (TAGS) : relues dans le fichier, pour ne jamais en inventer.
donnees = open(os.path.join(os.path.dirname(ICI), 'js', 'donnees.js'), encoding='utf8').read()
bloc = re.search(r'const TAGS = \{(.*?)\n  \};', donnees, re.S).group(1)
I_TAGS = set(re.findall(r'(\w+): \'', re.search(r'i: \{(.*?)\}', bloc, re.S).group(1)))
N_TAGS = set(re.findall(r'(\w+): \'', re.search(r'n: \{(.*?)\}', bloc, re.S).group(1)))

problemes = []
def verifier(cond, msg):
    if not cond: problemes.append(msg)
ID = re.compile(r'^[a-z0-9-]{1,40}$')
HTTPS = re.compile(r'^https://[^\s<>"\\]+$')

# Les vidéos d'entrée (sans réponse au questionnaire) : variées, chaînes et thèmes différents, toutes de la liste de l'enseignant.
ENTREE = ['histoire-info-condense', 'craquer-wordle', 'chatgpt-baratin', 'fake-news-coupables', 'youtube-money', 'terres-rares']
# Les conseils sur l'introduction et la conclusion, reliés aux fiches de méthode et au quiz de la méthode du plan.
LIENS = {'premiere-phrase': ['plan'], 'debut-et-fin': ['plan'], 'derniere-phrase': ['plan'], 'un-temps-fort': ['plan'],
         'reponds-a-la-question': ['plan'], 'trois-axes': ['plan'], 'plan-pas-texte': ['point'], 'arguments-sources': ['source', 'arguments'],
         'mots-techniques': ['non-specialiste', 'definition'], 'echange-pas-interro': ['jury'], 'prepare-les-questions': ['jury']}
QUIZ = {'premiere-phrase': 'plan', 'debut-et-fin': 'plan', 'derniere-phrase': 'plan', 'un-temps-fort': 'plan', 'reponds-a-la-question': 'plan',
        'trois-axes': 'plan', 'plan-pas-texte': 'epreuve', 'chronometre': 'epreuve', 'echange-pas-interro': 'epreuve'}
SOLIDITE = {'bien établi': 'bien établi', 'plusieurs études': 'plusieurs études', 'une étude': 'une étude', 'repère de manuel': 'repère de manuel', 'retour de jurys': 'consignes aux jurys'}

videos = []
for v in V['videos']:
    if v['statut'] == 'non_verifie': continue
    verifier(v['statut'] in ('verifie', 'verifie_titre_different', 'verifie_chaine_differente', 'substitution'), v['id'] + ' : statut ' + v['statut'])
    verifier(ID.match(v['id']), v['id'] + ' : identifiant'); verifier(HTTPS.match(v['url']), v['id'] + ' : lien')
    verifier(v['interets'] and set(v['interets']) <= I_TAGS, v['id'] + ' : intérêts inconnus ' + str(v['interets']))
    verifier(v['notions'] and set(v['notions']) <= N_TAGS, v['id'] + ' : notions inconnues ' + str(v['notions']))
    for k in ('titre', 'chaine', 'accroche', 'question'): verifier(v.get(k), v['id'] + ' : ' + k + ' absent')
    videos.append({'id': v['id'], 'origine': v['origine'], 'titre': v['titre'], 'chaine': v['chaine'], 'plateforme': v['plateforme'], 'url': v['url'],
                   'langue': v['langue'], 'accroche': v['accroche'], 'interets': v['interets'], 'notions': v['notions'], 'question': v['question']})
ids = [v['id'] for v in videos]
verifier(len(ids) == len(set(ids)), 'vidéos : identifiants en double')
verifier(all(e in ids for e in ENTREE), 'vidéos d’entrée inconnues')

chaines = []
for c in V['chaines']:
    verifier(HTTPS.match(c['url']) and c['nom'] and c['phrase'], 'chaîne ' + c['nom'])
    chaines.append({'nom': c['nom'], 'plateforme': c['plateforme'], 'url': c['url'], 'phrase': c['phrase'], 'nouvelle': c['nouvelle']})

infox = []
for a in X['affirmations']:
    verifier(ID.match(a['id']), a['id'] + ' : identifiant'); verifier(isinstance(a['vrai'], bool), a['id'] + ' : vrai')
    verifier(a['source'].get('titre') and HTTPS.match(a['source'].get('url', '')), a['id'] + ' : source')
    verifier(set(a['interets']) <= I_TAGS and set(a['notions']) <= N_TAGS, a['id'] + ' : étiquettes inconnues')
    for k in ('affirmation', 'explication', 'accroche'): verifier(a.get(k), a['id'] + ' : ' + k + ' absent')
    verifier(a['sujets'], a['id'] + ' : sujets absents')
    sc = [s for s in a.get('sources_complementaires', []) if HTTPS.match(s.get('url', '')) and s.get('titre')]
    infox.append({'id': a['id'], 'affirmation': a['affirmation'], 'vrai': a['vrai'], 'explication': a['explication'], 'accroche': a['accroche'],
                  'source': {'titre': a['source']['titre'], 'url': a['source']['url']}, 'autres': sc, 'interets': a['interets'], 'notions': a['notions'], 'sujets': a['sujets']})
verifier(len({a['id'] for a in infox}) == len(infox), 'infox : identifiants en double')

conseils = []
for c in C['conseils']:
    s = c['source']; verifier(ID.match(c['id']) and c['phase'] in (0, 1, 2), c['id'] + ' : identifiant ou phase')
    verifier(HTTPS.match(s.get('url', '')), c['id'] + ' : lien'); verifier(c['solidite'] in SOLIDITE, c['id'] + ' : solidité ' + c['solidite'])
    for k in ('titre', 'conseil', 'pourquoi'): verifier(c.get(k), c['id'] + ' : ' + k + ' absent')
    douteux = 'contrôler' in s.get('lu_par', '')
    src = {'annee': s.get('annee', ''), 'url': s['url']}
    if not douteux: src.update({'auteurs': s.get('auteurs', ''), 'titre': s.get('titre', '')})
    lu = s.get('lu_par', '')
    # Ce que le lien ouvre, quand ce n'est pas l'article lui-même (dit en clair, d'après « lu_par »).
    if 'wikipedia.org' in s['url'] and not s.get('auteurs', '').startswith('Wikipédia'): src['lien'] = 'page Wikipédia qui résume ce travail'
    elif 'pubmed' in s['url'] or 'psycnet' in s['url'] or 'sciencedirect' in s['url']: src['lien'] = 'résumé de l’article'
    elif 'books.google' in s['url']: src['lien'] = 'le livre sur Google Livres'
    x = {'id': c['id'], 'phase': c['phase'], 'titre': c['titre'], 'conseil': c['conseil'], 'pourquoi': c['pourquoi'], 'solidite': SOLIDITE[c['solidite']], 'source': src}
    if c['id'] in LIENS: x['fiches'] = LIENS[c['id']]
    if c['id'] in QUIZ: x['quiz'] = QUIZ[c['id']]
    conseils.append(x)
for k in LIENS:
    for f in LIENS[k]: verifier(("id: '%s'" % f) in donnees, 'fiche inconnue : ' + f)

if problemes:
    print('\n'.join(problemes)); sys.exit(1)
api = {'VERIFIE': {'videos': V['genere_le'], 'infox': X['genere_le'], 'conseils': C['genere_le']}, 'ENTREE': ENTREE,
       'VIDEOS': videos, 'CHAINES': chaines, 'INFOX': infox, 'CONSEILS': conseils}
js = ('// Hello GO : la culture (vidéos conseillées, chaînes à découvrir, « Info ou infox ? », conseils fondés sur des résultats\n'
      '// observés). Fichier fabriqué par outils/generer_culture.py à partir de outils/culture/*.json : ne pas le modifier à la main.\n'
      '// Vérifié le ' + V['genere_le'] + ' (oEmbed de YouTube pour les vidéos, pages ouvertes pour les faits et les conseils).\n'
      '// Textes CC BY-SA 4.0, Babash - NSI Tani Malandi, écrits avec l’aide de l’IA ; les titres des vidéos et des sources sont ceux de leurs auteur·e·s.\n'
      '(function (racine) {\n  const api = ' + json.dumps(api, ensure_ascii=False, indent=1) + ';\n'
      '  racine.HGCulture = api;\n  if (typeof module !== \'undefined\') module.exports = api;\n})(typeof window !== \'undefined\' ? window : globalThis);\n')
open(SORTIE, 'w', encoding='utf8').write(js)
print('%d vidéos (%d écartées), %d chaînes, %d affirmations (%d vraies), %d conseils' % (len(videos), len(V['videos']) - len(videos), len(chaines), len(infox), sum(a['vrai'] for a in infox), len(conseils)))
