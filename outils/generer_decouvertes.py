"""Fabrique js/decouvertes.js à partir des cartes de TimelineNSI (textes CC BY-SA 4.0, Babash - NSI Tani Malandi).
Usage : python3 -I outils/generer_decouvertes.py <dossier de TimelineNSI>
Le tableau CARTES choisit les cartes et leur donne des centres d'intérêt (i), des goûts en NSI (n) et la question qu'elles ouvrent (q)."""
import csv, json, sys, os

CARTES = {
    4: (['histoire', 'sciences'], ['secu'], 'Comment garde-t-on un secret depuis l’Antiquité ?'),
    7: (['histoire', 'sciences'], ['secu', 'donnees'], 'Peut-on casser un code secret en comptant les lettres ?'),
    10: (['art', 'histoire'], ['materiel', 'prog'], 'Comment un métier à tisser a-t-il inspiré l’ordinateur ?'),
    13: (['histoire', 'societe'], ['hist', 'prog'], 'Ada Lovelace, première programmeuse de l’histoire ?'),
    14: (['sciences'], ['prog', 'hist'], 'Existe-t-il des problèmes qu’aucun ordinateur ne peut résoudre ?'),
    15: (['sciences', 'histoire', 'transports'], ['prog'], 'Comment un logiciel a-t-il permis de marcher sur la Lune ?'),
    16: (['argent', 'societe'], ['donnees'], 'Pourquoi range-t-on tant de données dans des tables ?'),
    18: (['histoire', 'argent'], ['prog', 'hist'], 'Pourquoi un langage de 1959 fait-il encore tourner des banques ?'),
    22: (['sciences'], ['prog', 'hist'], 'Pourquoi Python a-t-il été inventé ?'),
    23: (['argent', 'sciences'], ['secu'], 'Comment des nombres premiers protègent-ils nos achats en ligne ?'),
    24: (['argent'], ['secu', 'donnees'], 'La blockchain : comment faire confiance sans banque ?'),
    39: (['sciences'], ['materiel'], 'La course à l’infiniment petit : jusqu’où ?'),
    40: (['jeux'], ['materiel', 'hist'], 'Comment les jeux vidéo ont-ils fait progresser l’informatique ?'),
    43: (['reseaux', 'societe'], ['materiel'], 'Le smartphone a-t-il changé notre façon de vivre ?'),
    44: (['musique', 'sciences'], ['donnees'], 'Comment fait-on tenir une chanson ou une image dans un petit fichier ?'),
    48: (['reseaux', 'societe'], ['web'], 'Le Web doit-il rester gratuit et ouvert à tout le monde ?'),
    50: (['climat', 'sante', 'transports'], ['materiel', 'web'], 'Objets connectés : pratiques ou indiscrets ?'),
    54: (['societe', 'argent'], ['prog', 'hist'], 'Le logiciel libre : pourquoi donner son code ?'),
    58: (['jeux', 'sport'], ['ia'], 'Une machine peut-elle nous battre à tous les jeux ?'),
    60: (['societe', 'reseaux'], ['ia'], 'Une IA qui écrit comprend-elle ce qu’elle dit ?'),
    62: (['sante', 'argent'], ['secu'], 'Comment un rançongiciel peut-il paralyser des hôpitaux ?'),
    63: (['societe', 'reseaux'], ['donnees'], 'À qui appartiennent nos données personnelles ?'),
    64: (['reseaux'], ['donnees', 'web'], 'Comment un moteur de recherche choisit-il ses résultats ?'),
    65: (['societe', 'histoire'], ['web'], 'Peut-on faire confiance à une encyclopédie que tout le monde peut modifier ?'),
    67: (['cinema', 'reseaux'], ['donnees', 'ia'], 'Les algorithmes de recommandation décident-ils de ce qu’on regarde ?'),
    68: (['cinema', 'histoire'], ['web'], 'Comment une actrice de cinéma a-t-elle contribué aux communications sans fil ?'),
    71: (['histoire', 'sciences', 'societe'], ['prog', 'hist'], 'Quelle place pour les femmes dans l’histoire du calcul et de l’informatique ?'),
    75: (['societe'], ['ia', 'donnees'], 'Comment lutter contre les biais algorithmiques ?'),
    76: (['societe', 'reseaux'], ['donnees'], 'Les réseaux sociaux peuvent-ils influencer une élection ?'),
    77: (['societe'], ['secu', 'web'], 'Surveillance de masse : sécurité ou liberté ?'),
    78: (['societe', 'sciences'], ['prog'], 'Un algorithme peut-il répartir des personnes de façon juste ?'),
    79: (['societe', 'histoire'], ['secu'], 'Cyberguerre : la troisième guerre mondiale ?'),
    80: (['sciences', 'cinema'], ['ia'], 'Comment savoir si une machine pense ?'),
    85: (['transports', 'jeux'], ['prog'], 'Comment un GPS trouve-t-il le chemin le plus court ?'),
    86: (['transports', 'sciences', 'argent'], ['prog'], 'Comment une erreur de calcul peut-elle détruire une fusée ?'),
}

src = os.path.join(sys.argv[1], 'data', 'histoire_informatique_evenements.csv')
lignes = list(csv.DictReader(open(src, encoding='utf8')))
sortie = []
for num, (i, n, q) in sorted(CARTES.items()):
    x = lignes[num - 1]
    date = int(x['Date'])
    sortie.append({'num': num, 'titre': x['Titre'].strip(), 'date': ('%d av. J.-C.' % -date) if date < 0 else str(date), 'texte': x['Description courte'].strip(),
                   'note': x['Note'].strip(), 'cat': x['Catégorie'].strip(), 'i': i, 'n': n, 'q': q})
js = ('// Hello GO : les cartes à découvrir. Fichier fabriqué par outils/generer_decouvertes.py : ne pas le modifier à la main.\n'
      '// Textes des cartes : « Timeline – Histoire de l’informatique » (TimelineNSI), Babash - NSI Tani Malandi, CC BY-SA 4.0.\n'
      '(function (racine) {\n  const api = ' + json.dumps(sortie, ensure_ascii=False, indent=1) + ';\n'
      '  racine.HGDecouvertes = api;\n  if (typeof module !== \'undefined\') module.exports = api;\n})(typeof window !== \'undefined\' ? window : globalThis);\n')
open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'js', 'decouvertes.js'), 'w', encoding='utf8').write(js)
print(len(sortie), 'cartes')
for c in sortie: print(c['num'], c['date'], c['titre'])
