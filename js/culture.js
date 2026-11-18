// Hello GO : la culture (vidéos conseillées, chaînes à découvrir, « Info ou infox ? », conseils fondés sur des résultats
// observés). Fichier fabriqué par outils/generer_culture.py à partir de outils/culture/*.json : ne pas le modifier à la main.
// Vérifié le 2026-11-17 (oEmbed de YouTube pour les vidéos, pages ouvertes pour les faits et les conseils).
// Relu le 2026-11-18 (outils/culture/relecture-gardien.json) : 3 affirmations retirées de la banque, 49 textes reformulés.
// Textes CC BY-SA 4.0, Babash - NSI Tani Malandi, écrits avec l’aide de l’IA ; les titres des vidéos et des sources sont ceux de leurs auteur·e·s.
(function (racine) {
  const api = {
 "VERIFIE": {
  "videos": "2026-11-17",
  "infox": "2026-11-17",
  "conseils": "2026-11-17"
 },
 "ENTREE": [
  "histoire-info-condense",
  "craquer-wordle",
  "chatgpt-baratin",
  "fake-news-coupables",
  "youtube-money",
  "terres-rares"
 ],
 "VIDEOS": [
  {
   "id": "histoire-info-condense",
   "origine": "enseignant",
   "titre": "Un condensé d'histoire de l'informatique (1er ep/5)",
   "chaine": "Inria - Médiation Scientifique",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=xQHk4zQf_aY",
   "langue": "fr",
   "accroche": "De la machine à calculer au smartphone : toute l'histoire de l'informatique en accéléré.",
   "interets": [
    "histoire",
    "sciences"
   ],
   "notions": [
    "hist",
    "materiel"
   ],
   "question": "En quoi l'histoire de l'informatique éclaire-t-elle les machines que nous utilisons aujourd'hui ?"
  },
  {
   "id": "notion-information-berry",
   "origine": "enseignant",
   "titre": "La notion d'information (Gérard Berry)",
   "chaine": "Inria - Médiation Scientifique",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=Cgw2j4bENr4",
   "langue": "fr",
   "accroche": "Un texte, une photo, un son : et si tout cela n'était qu'une seule et même chose pour une machine ?",
   "interets": [
    "sciences"
   ],
   "notions": [
    "donnees",
    "hist"
   ],
   "question": "En quoi la notion d'information a-t-elle changé notre façon de voir le monde ?"
  },
  {
   "id": "traders-lumiere-1",
   "origine": "enseignant",
   "titre": "Traders à la vitesse de la lumière - Heu?reka #9",
   "chaine": "Heu?reka",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=O-SH-QPAicY",
   "langue": "fr",
   "accroche": "En bourse, des programmes achètent et vendent plus vite que tu ne clignes des yeux.",
   "interets": [
    "argent",
    "societe"
   ],
   "notions": [
    "prog",
    "materiel"
   ],
   "question": "Faut-il laisser des algorithmes acheter et vendre à notre place ?"
  },
  {
   "id": "traders-lumiere-2",
   "origine": "enseignant",
   "titre": "Trader à la vitesse de la lumière (le retour!) - Heu?reka #12",
   "chaine": "Heu?reka",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=BuEyrskPUws",
   "langue": "fr",
   "accroche": "Quand gagner quelques millisecondes vaut des millions, on est prêt à tirer des câbles en ligne droite.",
   "interets": [
    "argent",
    "societe"
   ],
   "notions": [
    "materiel",
    "prog"
   ],
   "question": "Dans quelle mesure la vitesse des réseaux est-elle devenue un enjeu économique ?"
  },
  {
   "id": "crypto-pieges",
   "origine": "enseignant",
   "titre": "[PARTENARIAT] Crypto-investissements : éviter les pièges - Heu?reka & AMF",
   "chaine": "Heu?reka",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=vCjPbij3gmw",
   "langue": "fr",
   "accroche": "Avant de mettre un euro dans une cryptomonnaie, apprends à reconnaître une arnaque.",
   "interets": [
    "argent",
    "societe"
   ],
   "notions": [
    "secu",
    "donnees"
   ],
   "question": "Faut-il se méfier des cryptomonnaies ?"
  },
  {
   "id": "democratie-theorie-jeux",
   "origine": "enseignant",
   "titre": "La main invisible d'un mathématicien malveillant | Démocratie 1",
   "chaine": "Science4All",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=fBYCoPAmpr4",
   "langue": "fr",
   "accroche": "Et si la façon de compter les voix décidait du gagnant autant que les voix elles-mêmes ?",
   "interets": [
    "societe",
    "sciences"
   ],
   "notions": [
    "prog",
    "donnees"
   ],
   "question": "Dans quelle mesure un algorithme de vote peut-il être juste ?"
  },
  {
   "id": "terres-rares",
   "origine": "enseignant",
   "titre": "Les terres rares.",
   "chaine": "Le Réveilleur",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=OAyYSlMhgI4",
   "langue": "fr",
   "accroche": "Ton téléphone contient des métaux dont tu n'as jamais entendu le nom.",
   "interets": [
    "climat",
    "societe"
   ],
   "notions": [
    "materiel"
   ],
   "question": "Le numérique peut-il se passer des terres rares ?"
  },
  {
   "id": "predire-crimes",
   "origine": "enseignant",
   "titre": "Peut-on prédire les futurs crimes ?",
   "chaine": "Fouloscopie",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=HHCiNPtR1NI",
   "langue": "fr",
   "accroche": "Des logiciels prétendent dire où aura lieu le prochain délit : science ou science-fiction ?",
   "interets": [
    "societe",
    "cinema"
   ],
   "notions": [
    "ia",
    "donnees"
   ],
   "question": "Faut-il confier la prévention des crimes à des algorithmes ?"
  },
  {
   "id": "amour-en-ligne",
   "origine": "enseignant",
   "titre": "L'amour en ligne – Avides de Recherche #23",
   "chaine": "Avides de recherche",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=CbXGTo4Fob4",
   "langue": "fr",
   "accroche": "Derrière chaque « match », il y a des choix de conception et des chercheur·e·s qui les étudient.",
   "interets": [
    "reseaux",
    "societe"
   ],
   "notions": [
    "donnees",
    "web"
   ],
   "question": "En quoi les applications de rencontre transforment-elles nos relations ?"
  },
  {
   "id": "fourmi-langton",
   "origine": "enseignant",
   "titre": "La fourmi de Langton",
   "chaine": "ScienceEtonnante",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=qZRYGxF6D3w",
   "langue": "fr",
   "accroche": "Deux règles toutes simples, une fourmi, et personne ne sait prédire ce qu'elle va faire.",
   "interets": [
    "sciences",
    "jeux"
   ],
   "notions": [
    "prog"
   ],
   "question": "En quoi des règles très simples peuvent-elles produire un comportement imprévisible ?"
  },
  {
   "id": "ia-images",
   "origine": "enseignant",
   "titre": "Comment ces IA inventent-elles des images ?",
   "chaine": "ScienceEtonnante",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=tdelUss-5hY",
   "langue": "fr",
   "accroche": "Une IA qui dessine part d'une image de pur bruit et la nettoie peu à peu.",
   "interets": [
    "art",
    "cinema",
    "sciences"
   ],
   "notions": [
    "ia",
    "donnees"
   ],
   "question": "Une IA qui génère des images est-elle créative ?"
  },
  {
   "id": "ia-langue",
   "origine": "enseignant",
   "titre": "Comment les I.A. font-elles pour comprendre notre langue ?",
   "chaine": "ScienceEtonnante",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=CsQNF9s78Nc",
   "langue": "fr",
   "accroche": "Pour une machine, un mot est une liste de nombres : et pourtant ça marche.",
   "interets": [
    "sciences",
    "societe"
   ],
   "notions": [
    "ia",
    "donnees"
   ],
   "question": "Dans quelle mesure une machine comprend-elle ce qu'on lui dit ?"
  },
  {
   "id": "codes-secrets",
   "origine": "enseignant",
   "titre": "Les codes secrets",
   "chaine": "ScienceEtonnante",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=8BM9LPDjOw0",
   "langue": "fr",
   "accroche": "De César à ta messagerie, la même course entre qui cache et qui casse.",
   "interets": [
    "histoire",
    "sciences"
   ],
   "notions": [
    "secu",
    "hist"
   ],
   "question": "En quoi la cryptographie protège-t-elle notre vie privée ?"
  },
  {
   "id": "craquer-wordle",
   "origine": "enseignant",
   "titre": "JE CRAQUE WORDLE ! 🟩⬛🟨⬛🟨 (grâce aux maths)",
   "chaine": "ScienceEtonnante",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=iw4_7ioHWF4",
   "langue": "fr",
   "accroche": "Le meilleur premier mot à Wordle se calcule, et le calcul s'appelle l'entropie.",
   "interets": [
    "jeux",
    "sciences"
   ],
   "notions": [
    "prog",
    "donnees"
   ],
   "question": "En quoi la théorie de l'information permet-elle de mieux jouer ?"
  },
  {
   "id": "jeu-de-la-vie",
   "origine": "enseignant",
   "titre": "Le Jeu de la Vie",
   "chaine": "ScienceEtonnante",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=S-W0NX97DB0",
   "langue": "fr",
   "accroche": "Des cases qui s'allument et s'éteignent, et soudain des « créatures » qui se déplacent toutes seules.",
   "interets": [
    "jeux",
    "sciences"
   ],
   "notions": [
    "prog"
   ],
   "question": "Le jeu de la vie est-il vraiment un jeu ?"
  },
  {
   "id": "bug-google-map",
   "origine": "enseignant",
   "titre": "Un bug géométrique dans Google Map ? - Micmaths",
   "chaine": "Mickaël Launay (Micmaths)",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=ysx1888Y2Fo",
   "langue": "fr",
   "accroche": "Sur une carte, le chemin le plus court n'est pas toujours une ligne droite.",
   "interets": [
    "transports",
    "sciences"
   ],
   "notions": [
    "donnees",
    "prog"
   ],
   "question": "Peut-on représenter fidèlement la Terre sur un écran ?"
  },
  {
   "id": "p-vs-np",
   "origine": "enseignant",
   "titre": "P vs. NP and the Computational Complexity Zoo",
   "chaine": "hackerdashery",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=YX40hbAHx3s",
   "langue": "en",
   "accroche": "Un million de dollars attend la personne qui résoudra cette question d'informatique.",
   "interets": [
    "sciences",
    "argent"
   ],
   "notions": [
    "prog",
    "secu"
   ],
   "question": "Existe-t-il des problèmes qu'un ordinateur ne pourra jamais résoudre vite ?"
  },
  {
   "id": "blockchain-comment",
   "origine": "enseignant",
   "titre": "La blockchain, comment ca marche?",
   "chaine": "Radio-Canada Info",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=i6XQllJmKlk",
   "langue": "fr",
   "accroche": "Un grand cahier de comptes que tout le monde peut lire et que personne ne peut raturer.",
   "interets": [
    "argent",
    "societe"
   ],
   "notions": [
    "secu",
    "donnees"
   ],
   "question": "La blockchain peut-elle remplacer la confiance ?"
  },
  {
   "id": "fake-news-coupables",
   "origine": "enseignant",
   "titre": "Fake news, tous coupables ? | Angle Droit | Le Vortex#44",
   "chaine": "Le Vortex - ARTE",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=17cNUsu7coU",
   "langue": "fr",
   "accroche": "Partager une fausse information, est-ce déjà en être responsable ?",
   "interets": [
    "reseaux",
    "societe"
   ],
   "notions": [
    "web",
    "donnees"
   ],
   "question": "Sommes-nous responsables de ce que nous partageons en ligne ?"
  },
  {
   "id": "reseaux-deuil",
   "origine": "enseignant",
   "titre": "Réseaux sociaux, une nouvelle façon de faire son deuil ? | Le Vortex S06E11 | ARTE",
   "chaine": "Le Vortex - ARTE",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=Db2Y4xyOm3w",
   "langue": "fr",
   "accroche": "Que devient ton compte quand tu n'es plus là ?",
   "interets": [
    "reseaux",
    "societe"
   ],
   "notions": [
    "donnees",
    "web"
   ],
   "question": "Nos données doivent-elles nous survivre ?"
  },
  {
   "id": "corps-a-corps-robots",
   "origine": "enseignant",
   "titre": "Au corps à core avec les robots | Va Savoir #03",
   "chaine": "Zeste de science, les séries originales du CNRS",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=TSt9F0w0jN8",
   "langue": "fr",
   "accroche": "Des chercheur·e·s apprennent aux robots à ne pas nous faire mal.",
   "interets": [
    "sante",
    "sciences",
    "sport"
   ],
   "notions": [
    "materiel",
    "ia"
   ],
   "question": "Dans quelle mesure peut-on faire confiance à un robot qui nous touche ?"
  },
  {
   "id": "youtube-money",
   "origine": "enseignant",
   "titre": "NOTRE ARGENT : La YouTube Money",
   "chaine": "Stupid Economics",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=KIGOIfIXVjU",
   "langue": "fr",
   "accroche": "D'où vient l'argent d'une vidéo gratuite ?",
   "interets": [
    "argent",
    "reseaux"
   ],
   "notions": [
    "web",
    "donnees"
   ],
   "question": "En quoi la publicité façonne-t-elle ce que nous regardons ?"
  },
  {
   "id": "le-hack",
   "origine": "enseignant",
   "titre": "PAUSE PROCESS #48 Le Hack",
   "chaine": "PAUSE PROCESS",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=qQcHkMvsQwA",
   "langue": "fr",
   "accroche": "Au cinéma, pirater prend dix secondes : et en vrai ?",
   "interets": [
    "jeux",
    "cinema",
    "societe"
   ],
   "notions": [
    "secu"
   ],
   "question": "Le pirate informatique est-il forcément un·e délinquant·e ?"
  },
  {
   "id": "erreur-excel",
   "origine": "enseignant",
   "titre": "L'erreur Excel qui a coûté la vie à 1500 personnes 💀",
   "chaine": "Chat Sceptique",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=VubMw46DK0U",
   "langue": "fr",
   "accroche": "Un tableur mal utilisé, et des milliers de malades disparaissent des comptes.",
   "interets": [
    "sante",
    "societe"
   ],
   "notions": [
    "donnees",
    "prog"
   ],
   "question": "Une erreur de format de données peut-elle coûter des vies ?"
  },
  {
   "id": "algos-evolutionnaires",
   "origine": "enseignant",
   "titre": "Les algorithmes évolutionnaires expliqués à mon chat 🐈",
   "chaine": "Chat Sceptique",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=7DMibr0J0c4",
   "langue": "fr",
   "accroche": "Faire évoluer des programmes comme des espèces : garder les meilleurs, les mélanger, recommencer.",
   "interets": [
    "sciences",
    "jeux"
   ],
   "notions": [
    "ia",
    "prog"
   ],
   "question": "En quoi la nature inspire-t-elle les algorithmes ?"
  },
  {
   "id": "alan-turing",
   "origine": "enseignant",
   "titre": "Alan Turing - Enigma, ordinateur et pomme empoisonnée - LPPV.05 - e-penser",
   "chaine": "e-penser 2.0",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=7dpFeXV_hqs",
   "langue": "fr",
   "accroche": "Il a aidé à gagner une guerre, imaginé l'ordinateur, et son pays l'a condamné.",
   "interets": [
    "histoire",
    "societe"
   ],
   "notions": [
    "hist",
    "secu"
   ],
   "question": "En quoi Alan Turing a-t-il changé le cours de l'histoire ?"
  },
  {
   "id": "reseaux-neurones",
   "origine": "enseignant",
   "titre": "Les réseaux de neurones | Intelligence artificielle 41",
   "chaine": "Science4All",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=8qL2lSQd9L8",
   "langue": "fr",
   "accroche": "Un « neurone » artificiel n'est qu'une addition et un seuil : c'est leur nombre qui fait tout.",
   "interets": [
    "sciences"
   ],
   "notions": [
    "ia"
   ],
   "question": "Un réseau de neurones artificiels imite-t-il vraiment le cerveau ?"
  },
  {
   "id": "bibliotheque-babel",
   "origine": "enseignant",
   "titre": "Trouver la DATE DE VOTRE MORT ? Bibliothèque de BABEL / Paradoxe du singe savant",
   "chaine": "Balade Mentale",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=RoN8kHQvSX8",
   "langue": "fr",
   "accroche": "Une bibliothèque qui contient tous les textes possibles contient aussi ta biographie… et toutes ses versions fausses.",
   "interets": [
    "sciences",
    "art"
   ],
   "notions": [
    "donnees",
    "prog"
   ],
   "question": "Avoir toute l'information, est-ce savoir quelque chose ?"
  },
  {
   "id": "ada-lovelace-balade",
   "origine": "enseignant",
   "titre": "Ada lovelace & l'ORDINATEUR MÉCANIQUE / ft Florence Porcel",
   "chaine": "Balade Mentale",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=-2604CHuIyk",
   "langue": "fr",
   "accroche": "Un siècle avant l'ordinateur, une femme écrit un programme pour une machine qui n'existe pas.",
   "interets": [
    "histoire",
    "sciences"
   ],
   "notions": [
    "hist",
    "prog"
   ],
   "question": "Ada Lovelace est-elle la première programmeuse de l'histoire ?"
  },
  {
   "id": "chatgpt-baratin",
   "origine": "enseignant",
   "titre": "ChatGPT : la philosophie du baratin",
   "chaine": "Monsieur Phi",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=JcFRbecX6bk",
   "langue": "fr",
   "accroche": "Un texte peut sonner juste sans que son auteur se soucie du vrai : ça s'appelle du baratin.",
   "interets": [
    "societe",
    "sciences"
   ],
   "notions": [
    "ia"
   ],
   "question": "Peut-on faire confiance à ce que dit une IA ?"
  },
  {
   "id": "chatgpt-comprend-rien",
   "origine": "enseignant",
   "titre": "La preuve définitive que ChatGPT ne comprend rien",
   "chaine": "Monsieur Phi",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=_XJsAQsT0Bo",
   "langue": "fr",
   "accroche": "Comment prouver qu'une machine comprend, ou qu'elle ne comprend pas ?",
   "interets": [
    "societe",
    "sciences"
   ],
   "notions": [
    "ia"
   ],
   "question": "Dans quelle mesure une IA comprend-elle ce qu'elle écrit ?"
  },
  {
   "id": "chatgpt-dissertations",
   "origine": "enseignant",
   "titre": "De l'art superflu d'écrire des dissertations à l'heure de ChatGPT",
   "chaine": "Monsieur Phi",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=tzO_uqP1QKk",
   "langue": "fr",
   "accroche": "Si une machine écrit ta dissertation, qu'est-ce que tu as appris ?",
   "interets": [
    "societe"
   ],
   "notions": [
    "ia"
   ],
   "question": "Faut-il encore apprendre à écrire à l'heure des IA ?"
  },
  {
   "id": "secret-ia-explicabilite",
   "origine": "enseignant",
   "titre": "Dans le secret du fonctionnement des IA - Science En Questions",
   "chaine": "Vasco",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=bsUeCRMFiH8",
   "langue": "fr",
   "accroche": "Une IA donne une réponse ; savoir pourquoi elle la donne est une autre affaire.",
   "interets": [
    "sciences",
    "societe"
   ],
   "notions": [
    "ia"
   ],
   "question": "Faut-il pouvoir expliquer les décisions d'une IA ?"
  },
  {
   "id": "parcoursup-mariage-stable",
   "origine": "proposee",
   "titre": "PARCOURSUP 👩🏽‍🎓🏫 et les algorithmes de mariage stable ❤️",
   "chaine": "ScienceEtonnante",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=dO1pLi2Dedw",
   "langue": "fr",
   "accroche": "L'algorithme qui décide de ton année prochaine vient d'un problème de mariages.",
   "interets": [
    "societe",
    "sciences"
   ],
   "notions": [
    "prog",
    "donnees"
   ],
   "question": "L'algorithme de Parcoursup est-il juste ?"
  },
  {
   "id": "ia-image-5-litres",
   "origine": "proposee",
   "titre": "Créer une image IA c'est gaspiller 5 litres d'eau, vrai ou faux?",
   "chaine": "RTS Info",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=QkYMPyavfjs",
   "langue": "fr",
   "accroche": "Un chiffre qui circule partout, repris et vérifié par une rédaction.",
   "interets": [
    "climat",
    "societe"
   ],
   "notions": [
    "ia",
    "materiel"
   ],
   "question": "Dans quelle mesure l'intelligence artificielle pèse-t-elle sur l'eau et l'électricité ?"
  },
  {
   "id": "dopamine-tiktok",
   "origine": "proposee",
   "titre": "TikTok | Dopamine | ARTE.tv Culture",
   "chaine": "ARTE.tv Culture",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=oqYOTm7tOpA",
   "langue": "fr",
   "accroche": "Si tu n'arrives pas à poser ton téléphone, ce n'est pas un hasard : c'est conçu pour.",
   "interets": [
    "reseaux",
    "sante",
    "societe"
   ],
   "notions": [
    "web",
    "donnees",
    "ia"
   ],
   "question": "Les réseaux sociaux sont-ils conçus pour nous rendre dépendant·e·s ?"
  },
  {
   "id": "datagueule-flux",
   "origine": "proposee",
   "titre": "Réseaux sociaux : flux à lier - #DATAGUEULE 95",
   "chaine": "Data Gueule",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=yWONYnuPfKY",
   "langue": "fr",
   "accroche": "En quelques minutes et beaucoup de chiffres : ce que les réseaux font de ton temps.",
   "interets": [
    "reseaux",
    "societe",
    "argent"
   ],
   "notions": [
    "web",
    "donnees"
   ],
   "question": "Dans quelle mesure notre attention est-elle devenue une marchandise ?"
  },
  {
   "id": "theorie-information-s4a",
   "origine": "proposee",
   "titre": "La théorie de l'information",
   "chaine": "Science4All",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=hoUCWa2gkTw",
   "langue": "fr",
   "accroche": "Combien « pèse » une information ? Claude Shannon a trouvé comment la mesurer.",
   "interets": [
    "sciences"
   ],
   "notions": [
    "donnees",
    "hist"
   ],
   "question": "En quoi la théorie de l'information de Shannon a-t-elle rendu le numérique possible ?"
  },
  {
   "id": "quest-ce-qu-une-information",
   "origine": "proposee",
   "titre": "Qu'est-ce qu'une information?",
   "chaine": "Palais de la découverte",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=4YsB_8eRe80",
   "langue": "fr",
   "accroche": "Avant de stocker ou d'envoyer une information, il faut savoir ce que c'est.",
   "interets": [
    "sciences"
   ],
   "notions": [
    "donnees"
   ],
   "question": "Peut-on mesurer une information ?"
  },
  {
   "id": "jeu-de-go-ia",
   "origine": "proposee",
   "titre": "Jeu de go et intelligence artificielle — À chaud ! #2",
   "chaine": "ScienceEtonnante",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=P6eBraOUBLw",
   "langue": "fr",
   "accroche": "Le go a longtemps été le jeu où les machines perdaient.",
   "interets": [
    "jeux",
    "sciences"
   ],
   "notions": [
    "ia",
    "hist"
   ],
   "question": "En quoi la victoire d'une machine au jeu de go a-t-elle marqué l'histoire de l'IA ?"
  },
  {
   "id": "tas-cest-quoi",
   "origine": "proposee",
   "titre": "Le TAS, c'est quoi ?",
   "chaine": "Laupok",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=uAbkEgriPKI",
   "langue": "fr",
   "accroche": "Finir un jeu en appuyant sur les touches image par image, mieux qu'aucune main humaine.",
   "interets": [
    "jeux"
   ],
   "notions": [
    "prog",
    "materiel"
   ],
   "question": "Le speedrun assisté par ordinateur est-il de la triche ou de l'informatique ?"
  },
  {
   "id": "autotune-cest-quoi",
   "origine": "proposee",
   "titre": "L'Auto-tune, c'est quoi ? - Muzicologik",
   "chaine": "Muzicologik",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=3XMMdx1anso",
   "langue": "fr",
   "accroche": "La voix de tes artistes préféré·e·s passe par un algorithme avant d'arriver à tes oreilles.",
   "interets": [
    "musique",
    "art"
   ],
   "notions": [
    "donnees",
    "prog"
   ],
   "question": "L'Auto-Tune dénature-t-il la musique ?"
  },
  {
   "id": "supprimer-ses-mails",
   "origine": "proposee",
   "titre": "Faut-il supprimer ses mails pour la planète? avec @lereveilleur",
   "chaine": "La Biologie fait des vidéos",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/watch?v=UyGkxWA72tk",
   "langue": "fr",
   "accroche": "On te dit de vider ta boîte de réception pour sauver la planète : est-ce que ça change vraiment quelque chose ?",
   "interets": [
    "climat",
    "societe"
   ],
   "notions": [
    "materiel",
    "web",
    "donnees"
   ],
   "question": "Faut-il supprimer ses courriels pour réduire son empreinte numérique ?"
  }
 ],
 "CHAINES": [
  {
   "nom": "ScienceEtonnante",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/@ScienceEtonnante",
   "phrase": "Des questions de sciences prises au sérieux et expliquées pas à pas, avec beaucoup d'informatique et d'IA.",
   "nouvelle": false
  },
  {
   "nom": "Science4All",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/@le_science4all",
   "phrase": "Maths et informatique qui touchent à la société : votes, IA, information.",
   "nouvelle": false
  },
  {
   "nom": "Monsieur Phi",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/@MonsieurPhi",
   "phrase": "De la philosophie qui argumente : un modèle pour discuter de ce qu'une IA « comprend ».",
   "nouvelle": false
  },
  {
   "nom": "Inria - Médiation Scientifique",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/@Inria-MediationScientifique",
   "phrase": "Les chercheur·e·s en informatique expliquent leur discipline (ancienne chaîne Pixees).",
   "nouvelle": false
  },
  {
   "nom": "Data Gueule",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/@datagueule",
   "phrase": "Un sujet de société, des chiffres sourcés, quelques minutes : l'art de l'accroche par la donnée.",
   "nouvelle": true
  },
  {
   "nom": "ARTE.tv Culture",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/@artetvculture",
   "phrase": "La chaîne où Arte publie la série « Dopamine », sur les mécanismes des applications.",
   "nouvelle": true
  },
  {
   "nom": "RTS Info",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/@RTSinfo",
   "phrase": "L'information de la télévision publique suisse, avec des formats de vérification de chiffres.",
   "nouvelle": true
  },
  {
   "nom": "Palais de la découverte",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/@palaisdeladecouverte",
   "phrase": "Les médiateurs et médiatrices d'un musée de sciences expliquent une notion à la fois.",
   "nouvelle": true
  },
  {
   "nom": "Wandida, EPFL",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/@Wandida",
   "phrase": "De courts cours d'informatique et de maths d'une école d'ingénieur·e·s, pour aller plus loin (par exemple « L'entropie en théorie de l'information | Olivier Levêque », nAA7UyiCIOE, vérifiée).",
   "nouvelle": true
  },
  {
   "nom": "Passe-Science",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/@PasseScience",
   "phrase": "Des maths et de l'informatique théorique en images : automates cellulaires, graphes, complexité.",
   "nouvelle": false
  },
  {
   "nom": "La Biologie fait des vidéos",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/@labiologiefaitdesvideos",
   "phrase": "Une chaîne de biologie qui vérifie aussi les idées reçues sur l'environnement, ici avec Le Réveilleur.",
   "nouvelle": true
  },
  {
   "nom": "Laupok",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/@Laupok",
   "phrase": "Le speedrun et ses techniques expliqués en français.",
   "nouvelle": true
  },
  {
   "nom": "Muzicologik",
   "plateforme": "YouTube",
   "url": "https://www.youtube.com/@muzicologik1227",
   "phrase": "La musique expliquée, y compris ses outils numériques.",
   "nouvelle": true
  },
  {
   "nom": "Interstices",
   "plateforme": "site web",
   "url": "https://interstices.info/",
   "phrase": "La revue en ligne pilotée par Inria pour comprendre la recherche en informatique : articles, animations, quiz (page ouverte ce jour).",
   "nouvelle": true
  }
 ],
 "INFOX": [
  {
   "id": "internet-web",
   "affirmation": "Internet et le Web, c'est la même chose.",
   "vrai": false,
   "explication": "Internet est le réseau : son ancêtre, ARPANET, transmet son premier message en 1969. Le Web est un service qui circule sur ce réseau : Tim Berners-Lee l'invente au CERN en 1989, vingt ans plus tard. Le courriel, par exemple, utilise Internet sans passer par le Web.",
   "accroche": "« L'ancêtre d'Internet avait déjà vingt ans quand le Web est né. »",
   "source": {
    "titre": "CERN, « A short history of the Web »",
    "url": "https://home.cern/science/computing/birth-web/short-history-web"
   },
   "autres": [
    {
     "titre": "Wikipedia (en), « ARPANET »",
     "url": "https://en.wikipedia.org/wiki/ARPANET"
    }
   ],
   "interets": [
    "histoire",
    "reseaux"
   ],
   "notions": [
    "web",
    "hist"
   ],
   "sujets": [
    "Internet",
    "Web",
    "réseau",
    "Tim Berners-Lee"
   ]
  },
  {
   "id": "mode-prive",
   "affirmation": "La navigation privée te rend anonyme sur Internet.",
   "vrai": false,
   "explication": "Une fenêtre privée évite seulement de garder l'historique et les cookies sur ton appareil. Mozilla l'écrit noir sur blanc : elle ne cache ni ton adresse IP ni ta position, et ton activité reste visible des sites, des moteurs de recherche, de ton fournisseur d'accès ou du réseau de ton lycée.",
   "accroche": "« La navigation privée cache ton historique à ta famille, pas à ton fournisseur d'accès. »",
   "source": {
    "titre": "Mozilla, Firefox Help, « How Private Windows protect you »",
    "url": "https://support.mozilla.org/en-US/kb/common-myths-about-private-browsing"
   },
   "autres": [],
   "interets": [
    "reseaux",
    "societe"
   ],
   "notions": [
    "web",
    "secu",
    "donnees"
   ],
   "sujets": [
    "vie privée",
    "navigation privée",
    "traces numériques",
    "adresse IP"
   ]
  },
  {
   "id": "ada-notes",
   "affirmation": "En 1843, Ada Lovelace explique par écrit comment une machine pourrait calculer une suite de nombres, les nombres de Bernoulli.",
   "vrai": true,
   "explication": "En traduisant et en annotant un article sur la machine analytique de Charles Babbage, elle décrit comment la programmer pour ce calcul. C'est pourquoi on la présente souvent comme la première programmeuse.",
   "accroche": "« Dès 1843, Ada Lovelace, 27 ans, décrit comment programmer une machine à calculer. »",
   "source": {
    "titre": "Encyclopædia Britannica, « Ada Lovelace »",
    "url": "https://www.britannica.com/biography/Ada-Lovelace"
   },
   "autres": [],
   "interets": [
    "histoire",
    "sciences"
   ],
   "notions": [
    "hist",
    "prog"
   ],
   "sujets": [
    "Ada Lovelace",
    "premier programme",
    "femmes en informatique",
    "algorithme"
   ]
  },
  {
   "id": "machine-analytique",
   "affirmation": "La machine analytique de Babbage, pour laquelle Ada Lovelace a écrit son programme, a fonctionné de son vivant.",
   "vrai": false,
   "explication": "Babbage n'en a construit qu'une petite partie. Le programme d'Ada Lovelace a donc été écrit pour une machine qui n'existait que sur le papier.",
   "accroche": "« Ada Lovelace a programmé une machine qui n'a jamais été construite. »",
   "source": {
    "titre": "Encyclopædia Britannica, « Ada Lovelace »",
    "url": "https://www.britannica.com/biography/Ada-Lovelace"
   },
   "autres": [],
   "interets": [
    "histoire"
   ],
   "notions": [
    "hist",
    "materiel"
   ],
   "sujets": [
    "Ada Lovelace",
    "Charles Babbage",
    "machine analytique"
   ]
  },
  {
   "id": "hedy-lamarr",
   "affirmation": "Une actrice d'Hollywood a obtenu en 1942 un brevet de communication radio par « saut de fréquence ».",
   "vrai": true,
   "explication": "Hedy Lamarr l'a déposé avec le compositeur George Antheil (brevet américain n° 2 292 387). Le saut de fréquence est aujourd'hui considéré comme une étape importante des communications sans fil.",
   "accroche": "« Une star de cinéma des années 1940 figure au panthéon américain des inventeurs et inventrices. »",
   "source": {
    "titre": "National Inventors Hall of Fame, « Hedy Lamarr »",
    "url": "https://www.invent.org/inductees/hedy-lamarr"
   },
   "autres": [],
   "interets": [
    "cinema",
    "histoire",
    "sciences"
   ],
   "notions": [
    "hist",
    "materiel",
    "secu"
   ],
   "sujets": [
    "Hedy Lamarr",
    "communications sans fil",
    "femmes en informatique",
    "brevet"
   ]
  },
  {
   "id": "katherine-johnson",
   "affirmation": "En 1962, l'astronaute John Glenn a demandé qu'une mathématicienne refasse à la main les calculs de l'ordinateur avant de décoller.",
   "vrai": true,
   "explication": "La NASA le raconte : Glenn a demandé qu'on aille chercher Katherine Johnson pour qu'elle repasse les mêmes nombres dans les mêmes équations, sur sa machine à calculer de bureau. Il faisait plus confiance à elle qu'à l'ordinateur tout neuf.",
   "accroche": "« En 1962, on a vérifié l'ordinateur avec une humaine, et non l'inverse. »",
   "source": {
    "titre": "NASA, « Katherine Johnson Biography »",
    "url": "https://www.nasa.gov/centers-and-facilities/langley/katherine-johnson-biography/"
   },
   "autres": [],
   "interets": [
    "histoire",
    "sciences",
    "transports"
   ],
   "notions": [
    "hist",
    "prog"
   ],
   "sujets": [
    "Katherine Johnson",
    "confiance dans les machines",
    "NASA",
    "femmes en informatique"
   ]
  },
  {
   "id": "hopper-compilateur",
   "affirmation": "Grace Hopper, qui a conçu l'un des premiers compilateurs, a fini sa carrière avec le grade de contre-amirale.",
   "vrai": true,
   "explication": "Un compilateur traduit les instructions d'un·e programmeur·euse en code pour la machine. Grace Hopper en a conçu un des tout premiers, a défendu le langage COBOL, et a terminé sa carrière dans la marine américaine au grade de contre-amirale (rear admiral).",
   "accroche": "« Une pionnière des compilateurs a fini sa carrière contre-amirale dans la marine américaine. »",
   "source": {
    "titre": "Encyclopædia Britannica, « Grace Hopper »",
    "url": "https://www.britannica.com/biography/Grace-Hopper"
   },
   "autres": [],
   "interets": [
    "histoire",
    "sciences"
   ],
   "notions": [
    "hist",
    "prog"
   ],
   "sujets": [
    "Grace Hopper",
    "compilateur",
    "langages de programmation",
    "femmes en informatique"
   ]
  },
  {
   "id": "enigma-polonais",
   "affirmation": "Alan Turing a été le premier à casser le code de la machine Enigma.",
   "vrai": false,
   "explication": "Enigma a d'abord été cassée par des Polonais au début des années 1930. En 1939, ils transmettent leurs résultats aux Britanniques, dont l'équipe de cryptanalyse compte notamment le mathématicien Alan Turing.",
   "accroche": "« Avant Turing, il y a eu les mathématiciens polonais : la cryptanalyse d'Enigma est une course de relais. »",
   "source": {
    "titre": "Encyclopædia Britannica, « Enigma »",
    "url": "https://www.britannica.com/topic/Enigma-German-code-device"
   },
   "autres": [],
   "interets": [
    "histoire",
    "societe"
   ],
   "notions": [
    "hist",
    "secu"
   ],
   "sujets": [
    "Alan Turing",
    "Enigma",
    "cryptographie",
    "Seconde Guerre mondiale"
   ]
  },
  {
   "id": "eniac-programmeuses",
   "affirmation": "Les premières personnes chargées de programmer l'ENIAC, un des premiers ordinateurs électroniques, étaient six femmes.",
   "vrai": true,
   "explication": "Betty Holberton, Kay McNulty, Marlyn Wescoff, Ruth Lichterman, Betty Jean Jennings et Fran Bilas ont programmé l'ENIAC. Leur rôle a longtemps été oublié.",
   "accroche": "« L'ENIAC, un des premiers ordinateurs électroniques, a eu six femmes pour premières programmeuses. »",
   "source": {
    "titre": "Wikipedia (en), « ENIAC »",
    "url": "https://en.wikipedia.org/wiki/ENIAC"
   },
   "autres": [],
   "interets": [
    "histoire",
    "societe"
   ],
   "notions": [
    "hist",
    "prog"
   ],
   "sujets": [
    "ENIAC",
    "femmes en informatique",
    "histoire de la programmation"
   ]
  },
  {
   "id": "eniac-bureau",
   "affirmation": "L'ENIAC, présenté au public en 1946, tenait sur un bureau.",
   "vrai": false,
   "explication": "Il pesait plus de 27 tonnes, comptait plus de 17 000 tubes à vide et consommait 150 kW. Il occupait une salle entière.",
   "accroche": "« Le grand-père de ton téléphone pesait 27 tonnes. »",
   "source": {
    "titre": "Wikipedia (en), « ENIAC »",
    "url": "https://en.wikipedia.org/wiki/ENIAC"
   },
   "autres": [],
   "interets": [
    "histoire",
    "sciences"
   ],
   "notions": [
    "hist",
    "materiel"
   ],
   "sujets": [
    "ENIAC",
    "miniaturisation",
    "histoire du matériel"
   ]
  },
  {
   "id": "webcam-cafetiere",
   "affirmation": "La première webcam filmait une cafetière.",
   "vrai": true,
   "explication": "En 1991, à l'université de Cambridge, deux chercheurs pointent une caméra sur la cafetière du laboratoire d'informatique pour savoir si elle est pleine sans se déplacer. L'image est mise sur le Web en 1993 et la caméra est éteinte en 2001.",
   "accroche": "« La première webcam du monde a été inventée par des informaticiens qui ne voulaient pas se lever pour rien. »",
   "source": {
    "titre": "Wikipedia (en), « Trojan Room coffee pot »",
    "url": "https://en.wikipedia.org/wiki/Trojan_Room_coffee_pot"
   },
   "autres": [],
   "interets": [
    "histoire",
    "sciences"
   ],
   "notions": [
    "web",
    "hist",
    "materiel"
   ],
   "sujets": [
    "webcam",
    "Web",
    "invention",
    "objets connectés"
   ]
  },
  {
   "id": "arpanet-lo",
   "affirmation": "Le premier message envoyé sur l'ancêtre d'Internet a fait planter le système au bout de deux lettres.",
   "vrai": true,
   "explication": "En 1969, la première liaison d'ARPANET relie l'université UCLA au Stanford Research Institute. Seules les lettres « lo » arrivent avant la panne ; le message complet passe environ une heure plus tard.",
   "accroche": "« Le premier mot envoyé sur l'ancêtre d'Internet, c'est \"lo\" : un plantage. »",
   "source": {
    "titre": "Wikipedia (en), « ARPANET »",
    "url": "https://en.wikipedia.org/wiki/ARPANET"
   },
   "autres": [],
   "interets": [
    "histoire",
    "reseaux"
   ],
   "notions": [
    "web",
    "hist"
   ],
   "sujets": [
    "ARPANET",
    "Internet",
    "réseau",
    "panne"
   ]
  },
  {
   "id": "arobase",
   "affirmation": "L'arobase des adresses de courriel a été choisie en 1971 parce que ce signe n'apparaissait dans aucun nom.",
   "vrai": true,
   "explication": "Ray Tomlinson met au point en 1971 l'envoi de messages d'un ordinateur à un autre. Il sépare le nom de la personne et celui de la machine par @, un symbole absent des noms et du langage des ordinateurs de l'époque.",
   "accroche": "« Le @ de ton adresse a plus de cinquante ans, et il a été choisi parce qu'aucun nom ne l'utilisait. »",
   "source": {
    "titre": "Encyclopædia Britannica, « Ray Tomlinson »",
    "url": "https://www.britannica.com/biography/Ray-Tomlinson"
   },
   "autres": [],
   "interets": [
    "histoire",
    "reseaux"
   ],
   "notions": [
    "web",
    "hist"
   ],
   "sujets": [
    "courriel",
    "arobase",
    "Ray Tomlinson",
    "adresses"
   ]
  },
  {
   "id": "satellites",
   "affirmation": "L'essentiel des échanges Internet entre continents passe par des satellites.",
   "vrai": false,
   "explication": "Ils passent par des câbles posés au fond des mers. D'après les données du régulateur américain citées par TeleGeography, les satellites ne représentent que 0,37 % de la capacité internationale des États-Unis.",
   "accroche": "« Internet ne tombe pas du ciel : il passe sous la mer. »",
   "source": {
    "titre": "TeleGeography, « Submarine Cable FAQs »",
    "url": "https://www2.telegeography.com/submarine-cable-faqs-frequently-asked-questions"
   },
   "autres": [],
   "interets": [
    "societe",
    "transports",
    "histoire"
   ],
   "notions": [
    "web",
    "materiel"
   ],
   "sujets": [
    "câbles sous-marins",
    "infrastructure d'Internet",
    "satellites",
    "géopolitique"
   ]
  },
  {
   "id": "cable-tuyau",
   "affirmation": "Un câble sous-marin d'Internet a, sur l'essentiel de son trajet, le diamètre d'un tuyau d'arrosage.",
   "vrai": true,
   "explication": "Les fibres de verre qui transportent la lumière y sont fines comme un cheveu. Début 2026, TeleGeography comptait plus de 1,5 million de kilomètres de câbles sous-marins en service.",
   "accroche": "« Tes vidéos traversent l'océan dans un câble pas plus gros qu'un tuyau d'arrosage. »",
   "source": {
    "titre": "TeleGeography, « Submarine Cable FAQs »",
    "url": "https://www2.telegeography.com/submarine-cable-faqs-frequently-asked-questions"
   },
   "autres": [],
   "interets": [
    "sciences",
    "transports"
   ],
   "notions": [
    "web",
    "materiel"
   ],
   "sujets": [
    "câbles sous-marins",
    "fibre optique",
    "infrastructure d'Internet"
   ]
  },
  {
   "id": "mayotte-satellite",
   "affirmation": "Mayotte n'est reliée à Internet que par satellite.",
   "vrai": false,
   "explication": "Depuis 2012, le câble sous-marin LION2 dessert Mayotte : il prolonge le câble LION depuis Madagascar jusqu'à Mombasa, au Kenya.",
   "accroche": "« Internet arrive à Mayotte par le fond du canal du Mozambique. »",
   "source": {
    "titre": "Wikipédia (fr), « Lower Indian Ocean Network »",
    "url": "https://fr.wikipedia.org/wiki/Lower_Indian_Ocean_Network"
   },
   "autres": [],
   "interets": [
    "societe",
    "histoire"
   ],
   "notions": [
    "web",
    "materiel"
   ],
   "sujets": [
    "Mayotte",
    "océan Indien",
    "câbles sous-marins",
    "fracture numérique"
   ]
  },
  {
   "id": "deux-africa",
   "affirmation": "Un câble sous-marin de 45 000 kilomètres fait le tour de l'Afrique.",
   "vrai": true,
   "explication": "Le câble 2Africa relie 33 pays ; il est financé par un consortium de huit entreprises, dont Meta, Orange et Vodafone. Le cœur du système a été achevé en 2025 ; il touche notamment le Kenya, le Mozambique et Madagascar.",
   "accroche": "« Le plus long câble sous-marin du monde fait le tour de l'Afrique. »",
   "source": {
    "titre": "Wikipedia (en), « 2Africa »",
    "url": "https://en.wikipedia.org/wiki/2Africa"
   },
   "autres": [],
   "interets": [
    "societe",
    "argent"
   ],
   "notions": [
    "web",
    "materiel"
   ],
   "sujets": [
    "Afrique",
    "câbles sous-marins",
    "GAFAM",
    "infrastructure d'Internet"
   ]
  },
  {
   "id": "m-pesa",
   "affirmation": "Un service qui permet d'envoyer de l'argent avec un simple téléphone a été lancé au Kenya dès 2007.",
   "vrai": true,
   "explication": "M-Pesa, lancé par Vodafone et Safaricom, permet de transférer de l'argent et de payer par téléphone mobile. Fin 2011, il comptait déjà 17 millions d'abonné·e·s au Kenya.",
   "accroche": "« Au Kenya, on envoie de l'argent avec un simple téléphone depuis 2007. »",
   "source": {
    "titre": "Wikipedia (en), « M-Pesa »",
    "url": "https://en.wikipedia.org/wiki/M-Pesa"
   },
   "autres": [],
   "interets": [
    "argent",
    "societe"
   ],
   "notions": [
    "web",
    "donnees"
   ],
   "sujets": [
    "Afrique",
    "paiement mobile",
    "M-Pesa",
    "innovation"
   ]
  },
  {
   "id": "apollo-memoire",
   "affirmation": "L'ordinateur de bord des missions Apollo avait environ 2 000 mots de mémoire vive.",
   "vrai": true,
   "explication": "L'Apollo Guidance Computer disposait de 2 048 mots de mémoire vive et de 36 864 mots de mémoire morte, des mots de 16 bits (dont 15 de données), et il pesait 32 kg. C'est infiniment moins que le moindre téléphone actuel.",
   "accroche": "« L'ordinateur de bord d'Apollo avait moins de mémoire qu'il n'en faut pour une seule photo d'aujourd'hui. »",
   "source": {
    "titre": "Wikipedia (en), « Apollo Guidance Computer »",
    "url": "https://en.wikipedia.org/wiki/Apollo_Guidance_Computer"
   },
   "autres": [],
   "interets": [
    "histoire",
    "sciences",
    "transports"
   ],
   "notions": [
    "hist",
    "materiel"
   ],
   "sujets": [
    "Apollo",
    "mémoire",
    "miniaturisation",
    "matériel"
   ]
  },
  {
   "id": "disque-dur-tonne",
   "affirmation": "Le premier disque dur vendu, en 1956, pesait plus d'une tonne pour moins de 4 mégaoctets.",
   "vrai": true,
   "explication": "L'unité de disques du système IBM 305 RAMAC empilait cinquante disques de 61 cm (24 pouces) et stockait l'équivalent de 3,75 Mo, soit à peu près une photo d'aujourd'hui.",
   "accroche": "« En 1956, stocker une seule photo aurait demandé une machine d'une tonne. »",
   "source": {
    "titre": "Computer History Museum, « 1956: First commercial hard disk drive shipped »",
    "url": "https://www.computerhistory.org/storageengine/first-commercial-hard-disk-drive-shipped/"
   },
   "autres": [],
   "interets": [
    "histoire",
    "sciences"
   ],
   "notions": [
    "hist",
    "materiel",
    "donnees"
   ],
   "sujets": [
    "stockage",
    "disque dur",
    "miniaturisation",
    "IBM"
   ]
  },
  {
   "id": "moore",
   "affirmation": "La loi de Moore est une loi de la physique.",
   "vrai": false,
   "explication": "C'est une prédiction faite en 1965 par l'ingénieur Gordon Moore sur le nombre de transistors par puce, révisée en 1975 (doublement tous les deux ans). Elle a longtemps été vérifiée, ce qui l'a fait prendre pour une loi inévitable, mais elle décrit un rythme industriel, pas la nature.",
   "accroche": "« La loi de Moore n'est pas une loi de la nature : c'est une prédiction d'ingénieur, qui s'est longtemps vérifiée. »",
   "source": {
    "titre": "Encyclopædia Britannica, « Moore's law »",
    "url": "https://www.britannica.com/technology/Moores-law"
   },
   "autres": [],
   "interets": [
    "histoire",
    "sciences",
    "argent"
   ],
   "notions": [
    "hist",
    "materiel"
   ],
   "sujets": [
    "loi de Moore",
    "transistor",
    "miniaturisation",
    "limites physiques"
   ]
  },
  {
   "id": "bluetooth",
   "affirmation": "Le Bluetooth porte le surnom d'un roi viking du Xe siècle.",
   "vrai": true,
   "explication": "Le roi Harald « à la dent bleue » a uni le Danemark et la Norvège ; en 1996, un ingénieur d'Intel propose son surnom comme nom de code provisoire pour une technologie censée unir les appareils. Le logo assemble les deux runes de ses initiales.",
   "accroche": "« Chaque fois que tu connectes des écouteurs en Bluetooth, tu prononces le surnom d'un roi viking. »",
   "source": {
    "titre": "Bluetooth SIG, « Origin of the name »",
    "url": "https://www.bluetooth.com/about-us/bluetooth-origin/"
   },
   "autres": [],
   "interets": [
    "histoire",
    "musique"
   ],
   "notions": [
    "materiel",
    "hist"
   ],
   "sujets": [
    "Bluetooth",
    "communications sans fil",
    "normes",
    "histoire des techniques"
   ]
  },
  {
   "id": "souris-bois",
   "affirmation": "La première souris d'ordinateur était en bois.",
   "vrai": true,
   "explication": "Douglas Engelbart imagine la souris au début des années 1960 ; l'ingénieur Bill English en construit le premier prototype, en bois.",
   "accroche": "« La première souris était un bloc de bois, bien avant Apple et Microsoft. »",
   "source": {
    "titre": "Computer History Museum, « The Mouse »",
    "url": "https://www.computerhistory.org/revolution/input-output/14/350"
   },
   "autres": [],
   "interets": [
    "histoire",
    "sciences"
   ],
   "notions": [
    "hist",
    "materiel"
   ],
   "sujets": [
    "souris",
    "interface humain-machine",
    "Douglas Engelbart"
   ]
  },
  {
   "id": "pong-premier",
   "affirmation": "Pong est le premier jeu vidéo de l'histoire.",
   "vrai": false,
   "explication": "Dès le 18 octobre 1958, le physicien William Higinbotham présente « Tennis for Two » au laboratoire de Brookhaven : un jeu de tennis sur un écran d'oscilloscope, relié à un calculateur analogique. Pong n'arrive qu'après.",
   "accroche": "« Dès 1958, un physicien a bricolé un jeu de tennis sur écran pour une journée portes ouvertes. »",
   "source": {
    "titre": "Brookhaven National Laboratory, « The First Video Game? »",
    "url": "https://www.bnl.gov/about/history/firstvideo.php"
   },
   "autres": [],
   "interets": [
    "jeux",
    "histoire"
   ],
   "notions": [
    "hist",
    "materiel"
   ],
   "sujets": [
    "jeux vidéo",
    "histoire des jeux vidéo",
    "Pong"
   ]
  },
  {
   "id": "tetris-nintendo",
   "affirmation": "Tetris a été créé au Japon par Nintendo.",
   "vrai": false,
   "explication": "Tetris a été créé au milieu des années 1980 par Alexey Pajitnov, un ingénieur soviétique du centre de calcul de l'Académie des sciences. Son nom mêle « tetra » (quatre) et le tennis, son sport préféré.",
   "accroche": "« Tetris n'est pas né chez Nintendo, mais dans un centre de calcul soviétique. »",
   "source": {
    "titre": "Wikipedia (en), « Tetris »",
    "url": "https://en.wikipedia.org/wiki/Tetris"
   },
   "autres": [],
   "interets": [
    "jeux",
    "histoire"
   ],
   "notions": [
    "hist",
    "prog"
   ],
   "sujets": [
    "Tetris",
    "jeux vidéo",
    "URSS"
   ]
  },
  {
   "id": "pacman-256",
   "affirmation": "Le niveau 256 de Pac-Man est impossible à finir à cause d'un dépassement d'entier.",
   "vrai": true,
   "explication": "Dans le jeu de 1980, un dépassement de capacité fait charger le 256e niveau de travers : c'est l'« écran de la mort ». Avec 8 bits, on ne compte que jusqu'à 255.",
   "accroche": "« Pac-Man a une fin : le jeu se casse au niveau 256, parce qu'un octet ne sait pas compter plus loin. »",
   "source": {
    "titre": "Wikipedia (en), « Pac-Man »",
    "url": "https://en.wikipedia.org/wiki/Pac-Man"
   },
   "autres": [],
   "interets": [
    "jeux",
    "histoire"
   ],
   "notions": [
    "donnees",
    "prog",
    "hist"
   ],
   "sujets": [
    "Pac-Man",
    "dépassement d'entier",
    "représentation des nombres",
    "bugs"
   ]
  },
  {
   "id": "gandhi-nucleaire",
   "affirmation": "Dans le premier Civilization, un bug de dépassement d'entier rendait Gandhi fou de bombes nucléaires.",
   "vrai": false,
   "explication": "C'est une légende : elle n'apparaît qu'en 2012, sur un wiki, 21 ans après la sortie du jeu, et le créateur du jeu, Sid Meier, a confirmé en 2020 que ce bug était inventé. L'histoire est belle parce que ce genre de bug existe vraiment ailleurs.",
   "accroche": "« Le célèbre bug du Gandhi nucléaire n'a jamais existé. »",
   "source": {
    "titre": "Wikipedia (en), « Nuclear Gandhi »",
    "url": "https://en.wikipedia.org/wiki/Nuclear_Gandhi"
   },
   "autres": [],
   "interets": [
    "jeux",
    "societe"
   ],
   "notions": [
    "prog",
    "donnees"
   ],
   "sujets": [
    "légende urbaine",
    "désinformation",
    "dépassement d'entier",
    "jeux vidéo"
   ]
  },
  {
   "id": "deep-blue",
   "affirmation": "En 1997, un ordinateur a battu le champion du monde d'échecs en match.",
   "vrai": true,
   "explication": "Deep Blue, conçu par IBM, a battu Garry Kasparov 3,5 à 2,5 : deux victoires et trois nulles pour la machine.",
   "accroche": "« En 1997, le champion du monde d'échecs a perdu un match contre une machine. »",
   "source": {
    "titre": "Encyclopædia Britannica, « Deep Blue »",
    "url": "https://www.britannica.com/topic/Deep-Blue"
   },
   "autres": [],
   "interets": [
    "jeux",
    "sport",
    "histoire"
   ],
   "notions": [
    "ia",
    "hist"
   ],
   "sujets": [
    "Deep Blue",
    "échecs",
    "IA et jeux",
    "Kasparov"
   ]
  },
  {
   "id": "alphago-toutes",
   "affirmation": "En 2016, le programme AlphaGo a gagné toutes ses parties contre le champion de go Lee Sedol.",
   "vrai": false,
   "explication": "AlphaGo a gagné le match 4 à 1, à Séoul, du 9 au 15 mars 2016 : Lee Sedol a remporté la quatrième partie.",
   "accroche": "« Contre AlphaGo, l'humain a sauvé l'honneur : une partie sur cinq. »",
   "source": {
    "titre": "Wikipedia (en), « AlphaGo versus Lee Sedol »",
    "url": "https://en.wikipedia.org/wiki/AlphaGo_versus_Lee_Sedol"
   },
   "autres": [],
   "interets": [
    "jeux",
    "sport",
    "histoire"
   ],
   "notions": [
    "ia",
    "hist"
   ],
   "sujets": [
    "AlphaGo",
    "jeu de go",
    "IA et jeux",
    "apprentissage automatique"
   ]
  },
  {
   "id": "ia-recent",
   "affirmation": "L'expression « intelligence artificielle » date des années 2010.",
   "vrai": false,
   "explication": "Elle remonte aux années 1950 : à l'été 1956, un atelier de recherche organisé par John McCarthy à l'université de Dartmouth porte déjà ce nom.",
   "accroche": "« L'intelligence artificielle a l'âge de nos grands-parents : son nom date des années 1950. »",
   "source": {
    "titre": "Dartmouth College, « Artificial Intelligence (AI) Coined at Dartmouth »",
    "url": "https://home.dartmouth.edu/about/artificial-intelligence-ai-coined-dartmouth"
   },
   "autres": [],
   "interets": [
    "histoire",
    "sciences"
   ],
   "notions": [
    "ia",
    "hist"
   ],
   "sujets": [
    "intelligence artificielle",
    "histoire de l'IA",
    "Dartmouth"
   ]
  },
  {
   "id": "eliza-chatbot",
   "affirmation": "Les premiers programmes capables de converser avec un humain datent des années 2010.",
   "vrai": false,
   "explication": "ELIZA, créé au MIT par Joseph Weizenbaum, date de 1966 : il imitait un psychothérapeute. Son auteur a été surpris de voir des personnes, dont sa secrétaire, prêter des sentiments au programme.",
   "accroche": "« Dès 1966, des gens se confiaient à un programme. »",
   "source": {
    "titre": "Wikipedia (en), « ELIZA »",
    "url": "https://en.wikipedia.org/wiki/ELIZA"
   },
   "autres": [],
   "interets": [
    "histoire",
    "sante",
    "societe"
   ],
   "notions": [
    "ia",
    "hist"
   ],
   "sujets": [
    "agent conversationnel",
    "ELIZA",
    "test de Turing",
    "anthropomorphisme"
   ]
  },
  {
   "id": "recaptcha",
   "affirmation": "En recopiant des mots tordus pour prouver que tu n'es pas un robot, des internautes ont aidé à numériser les archives d'un journal.",
   "vrai": true,
   "explication": "Le système reCAPTCHA, conçu à l'université Carnegie Mellon pour la numérisation de livres, a aidé à numériser les archives du New York Times ; Google l'a ensuite utilisé pour ses livres.",
   "accroche": "« Pendant des années, prouver qu'on était humain, c'était travailler gratuitement à numériser des livres. »",
   "source": {
    "titre": "Wikipedia (en), « reCAPTCHA »",
    "url": "https://en.wikipedia.org/wiki/ReCAPTCHA"
   },
   "autres": [],
   "interets": [
    "reseaux",
    "societe",
    "art"
   ],
   "notions": [
    "web",
    "secu",
    "ia"
   ],
   "sujets": [
    "CAPTCHA",
    "travail du clic",
    "numérisation",
    "robots"
   ]
  },
  {
   "id": "python-serpent",
   "affirmation": "Le langage Python doit son nom au serpent.",
   "vrai": false,
   "explication": "Guido van Rossum lisait les scénarios de la série comique britannique « Monty Python's Flying Circus » quand il a commencé le langage, fin 1989 : il voulait un nom court, unique et un peu mystérieux.",
   "accroche": "« Python ne vient pas du serpent, mais d'une troupe de comiques anglais. »",
   "source": {
    "titre": "Python Software Foundation, « General Python FAQ »",
    "url": "https://docs.python.org/3/faq/general.html"
   },
   "autres": [],
   "interets": [
    "histoire",
    "cinema"
   ],
   "notions": [
    "prog",
    "hist"
   ],
   "sujets": [
    "Python",
    "langages de programmation",
    "Guido van Rossum"
   ]
  },
  {
   "id": "java-javascript",
   "affirmation": "JavaScript est une version simplifiée de Java.",
   "vrai": false,
   "explication": "Ce sont deux langages différents : la documentation de Mozilla précise qu'ils se ressemblent par certains côtés mais sont fondamentalement différents par d'autres, par exemple dans leur modèle d'objets.",
   "accroche": "« Java est à JavaScript ce que le chat est au chat-huant : le même début de mot. »",
   "source": {
    "titre": "MDN Web Docs (Mozilla), « JavaScript Guide: Introduction »",
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Introduction"
   },
   "autres": [],
   "interets": [
    "sciences"
   ],
   "notions": [
    "prog",
    "web"
   ],
   "sujets": [
    "JavaScript",
    "Java",
    "langages de programmation",
    "Web"
   ]
  },
  {
   "id": "supercalculateurs",
   "affirmation": "Les plus puissants supercalculateurs du monde fonctionnent sous Windows.",
   "vrai": false,
   "explication": "Depuis novembre 2017, les 500 supercalculateurs du classement TOP500 utilisent tous un système fondé sur le noyau Linux, un logiciel libre.",
   "accroche": "« Les 500 machines les plus puissantes du monde tournent toutes sous Linux. »",
   "source": {
    "titre": "Wikipedia (en), « TOP500 »",
    "url": "https://en.wikipedia.org/wiki/TOP500"
   },
   "autres": [],
   "interets": [
    "sciences",
    "societe"
   ],
   "notions": [
    "materiel",
    "prog"
   ],
   "sujets": [
    "Linux",
    "logiciel libre",
    "supercalculateur",
    "systèmes d'exploitation"
   ]
  },
  {
   "id": "an-2038",
   "affirmation": "Le 19 janvier 2038, certains ordinateurs risquent de se croire en 1901.",
   "vrai": true,
   "explication": "Beaucoup de systèmes comptent le temps en secondes depuis le 1er janvier 1970 dans un entier signé de 32 bits. Ce compteur atteint sa valeur maximale le 19 janvier 2038 à 03 h 14 min 07 s (UTC) : à la seconde suivante, il déborde, et la date repasse au 13 décembre 1901.",
   "accroche": "« Il existe un bug dont on connaît déjà la date à la seconde près : le 19 janvier 2038. »",
   "source": {
    "titre": "Wikipedia (en), « Year 2038 problem »",
    "url": "https://en.wikipedia.org/wiki/Year_2038_problem"
   },
   "autres": [],
   "interets": [
    "sciences",
    "societe"
   ],
   "notions": [
    "donnees",
    "prog",
    "materiel"
   ],
   "sujets": [
    "représentation des entiers",
    "dépassement de capacité",
    "bug de l'an 2038",
    "temps Unix"
   ]
  },
  {
   "id": "ariane-5",
   "affirmation": "En 1996, la première Ariane 5 a été détruite à cause d'une conversion de nombre dans son logiciel.",
   "vrai": true,
   "explication": "Le 4 juin 1996, la fusée dévie 37 secondes après le décollage. Un logiciel repris d'Ariane 4 convertissait un nombre flottant de 64 bits en entier signé de 16 bits : la valeur était devenue trop grande. La perte dépasse 370 millions de dollars.",
   "accroche": "« Une fusée a été détruite parce qu'un nombre ne tenait pas dans 16 bits. »",
   "source": {
    "titre": "Wikipedia (en), « Ariane flight V88 »",
    "url": "https://en.wikipedia.org/wiki/Ariane_flight_V88"
   },
   "autres": [],
   "interets": [
    "transports",
    "sciences",
    "argent"
   ],
   "notions": [
    "donnees",
    "prog"
   ],
   "sujets": [
    "Ariane 5",
    "représentation des nombres",
    "bugs célèbres",
    "logiciel embarqué"
   ]
  },
  {
   "id": "mars-orbiter",
   "affirmation": "La NASA a perdu une sonde martienne parce que deux logiciels n'utilisaient pas les mêmes unités de mesure.",
   "vrai": true,
   "explication": "La sonde Mars Climate Orbiter est perdue le 23 septembre 1999 : le logiciel au sol calculait en unités anglo-saxonnes, celui de la sonde en unités métriques. La trajectoire l'a amenée trop près de Mars.",
   "accroche": "« Une sonde spatiale a été perdue pour une histoire de conversion d'unités. »",
   "source": {
    "titre": "NASA Science, « Mars Climate Orbiter »",
    "url": "https://science.nasa.gov/mission/mars-climate-orbiter/"
   },
   "autres": [],
   "interets": [
    "transports",
    "sciences"
   ],
   "notions": [
    "donnees",
    "prog"
   ],
   "sujets": [
    "Mars Climate Orbiter",
    "bugs célèbres",
    "unités",
    "spécification"
   ]
  },
  {
   "id": "therac",
   "affirmation": "Dans les années 1980, des erreurs de programmation dans un appareil de radiothérapie ont causé la mort de patient·e·s.",
   "vrai": true,
   "explication": "Entre 1985 et 1987, le Therac-25, piloté par ordinateur, a délivré au moins six surdoses de rayons ; trois personnes en sont mortes. En cause : des erreurs de programmation concurrente.",
   "accroche": "« Un bug peut tuer : c'est arrivé en radiothérapie dans les années 1980. »",
   "source": {
    "titre": "Wikipedia (en), « Therac-25 »",
    "url": "https://en.wikipedia.org/wiki/Therac-25"
   },
   "autres": [],
   "interets": [
    "sante",
    "societe"
   ],
   "notions": [
    "prog",
    "secu"
   ],
   "sujets": [
    "Therac-25",
    "sûreté logicielle",
    "bugs célèbres",
    "santé"
   ]
  },
  {
   "id": "bitcoin-createur",
   "affirmation": "On connaît l'identité de la personne qui a créé le Bitcoin.",
   "vrai": false,
   "explication": "Le texte fondateur a été publié en 2008 sous le pseudonyme de Satoshi Nakamoto, et l'identité de son auteur·e reste inconnue.",
   "accroche": "« Le bitcoin a été inventé sous un pseudonyme, et l'on ne sait toujours pas par qui. »",
   "source": {
    "titre": "Wikipedia (en), « Bitcoin »",
    "url": "https://en.wikipedia.org/wiki/Bitcoin"
   },
   "autres": [],
   "interets": [
    "argent",
    "societe"
   ],
   "notions": [
    "secu",
    "donnees"
   ],
   "sujets": [
    "Bitcoin",
    "cryptomonnaie",
    "anonymat",
    "blockchain"
   ]
  },
  {
   "id": "bitcoin-pizzas",
   "affirmation": "En 2010, un programmeur a payé deux pizzas 10 000 bitcoins.",
   "vrai": true,
   "explication": "Le 22 mai 2010, Laszlo Hanyecz achète deux pizzas pour 10 000 bitcoins.",
   "accroche": "« Le premier achat connu payé en bitcoins : deux pizzas, pour 10 000 bitcoins, en 2010. »",
   "source": {
    "titre": "Wikipedia (en), « Bitcoin »",
    "url": "https://en.wikipedia.org/wiki/Bitcoin"
   },
   "autres": [],
   "interets": [
    "argent",
    "histoire"
   ],
   "notions": [
    "donnees",
    "secu"
   ],
   "sujets": [
    "Bitcoin",
    "cryptomonnaie",
    "valeur",
    "spéculation"
   ]
  },
  {
   "id": "youtube-google",
   "affirmation": "YouTube a été créé par Google.",
   "vrai": false,
   "explication": "YouTube a été enregistré le 14 février 2005 par Steve Chen, Chad Hurley et Jawed Karim. Google l'a racheté en novembre 2006 pour 1,65 milliard de dollars en actions.",
   "accroche": "« YouTube n'est pas né chez Google : Google l'a racheté en 2006, moins de deux ans après sa création. »",
   "source": {
    "titre": "Encyclopædia Britannica, « YouTube »",
    "url": "https://www.britannica.com/topic/YouTube"
   },
   "autres": [],
   "interets": [
    "reseaux",
    "argent",
    "histoire"
   ],
   "notions": [
    "web",
    "hist"
   ],
   "sujets": [
    "YouTube",
    "GAFAM",
    "rachat",
    "plateformes"
   ]
  },
  {
   "id": "premier-sms",
   "affirmation": "Le premier SMS de l'histoire disait « Merry Christmas ».",
   "vrai": true,
   "explication": "Il a été envoyé le 3 décembre 1992 sur le réseau de Vodafone, au Royaume-Uni, par l'ingénieur Neil Papworth. Un SMS est limité à 160 caractères.",
   "accroche": "« Le premier SMS souhaitait un joyeux Noël, avec trois semaines d'avance. »",
   "source": {
    "titre": "Wikipedia (en), « SMS »",
    "url": "https://en.wikipedia.org/wiki/SMS"
   },
   "autres": [],
   "interets": [
    "histoire",
    "reseaux"
   ],
   "notions": [
    "hist",
    "materiel"
   ],
   "sujets": [
    "SMS",
    "téléphonie mobile",
    "messagerie"
   ]
  },
  {
   "id": "premier-portable",
   "affirmation": "Le premier appel public passé avec un téléphone portable date des années 1990.",
   "vrai": false,
   "explication": "Il date de 1973 : Martin Cooper, ingénieur chez Motorola, appelle le responsable du projet concurrent avec un prototype de 1,1 kg, présenté à New York le 3 avril 1973. Le premier modèle vendu sort en 1983, à 3 995 dollars.",
   "accroche": "« Le premier téléphone portable pesait plus d'un kilo, et son premier appel a été pour le responsable du projet concurrent. »",
   "source": {
    "titre": "Encyclopædia Britannica, « Martin Cooper »",
    "url": "https://www.britannica.com/biography/Martin-Cooper"
   },
   "autres": [],
   "interets": [
    "histoire",
    "sciences"
   ],
   "notions": [
    "hist",
    "materiel"
   ],
   "sujets": [
    "téléphone portable",
    "téléphonie mobile",
    "miniaturisation"
   ]
  },
  {
   "id": "gps-emet",
   "affirmation": "Pour te localiser, ton téléphone envoie un signal aux satellites GPS.",
   "vrai": false,
   "explication": "C'est l'inverse : les satellites émettent, le récepteur écoute et calcule sa position. Le GPS ne demande à l'utilisateur ou l'utilisatrice de transmettre aucune donnée, et fonctionne sans réseau téléphonique ni Internet ; il faut voir au moins quatre satellites.",
   "accroche": "« Le GPS ne sait pas où tu es : c'est ton téléphone qui le calcule en écoutant au moins quatre satellites. »",
   "source": {
    "titre": "Wikipedia (en), « Global Positioning System »",
    "url": "https://en.wikipedia.org/wiki/Global_Positioning_System"
   },
   "autres": [],
   "interets": [
    "transports",
    "sciences"
   ],
   "notions": [
    "materiel",
    "donnees"
   ],
   "sujets": [
    "GPS",
    "géolocalisation",
    "vie privée",
    "satellites"
   ]
  },
  {
   "id": "emoji-apple",
   "affirmation": "Les émojis ont été inventés par Apple pour l'iPhone.",
   "vrai": false,
   "explication": "Les premiers jeux d'émojis viennent d'entreprises japonaises de téléphonie, à la fin des années 1990 ; le plus connu, 176 dessins créés par Shigetaka Kurita pour l'opérateur DoCoMo, date de 1999. Apple ne les ajoute à l'iPhone qu'en 2008, et Unicode les accepte en 2010.",
   "accroche": "« Les émojis sont nés au Japon dans les années 1990, presque dix ans avant l'iPhone. »",
   "source": {
    "titre": "Wikipedia (en), « Emoji »",
    "url": "https://en.wikipedia.org/wiki/Emoji"
   },
   "autres": [],
   "interets": [
    "reseaux",
    "art",
    "histoire"
   ],
   "notions": [
    "donnees",
    "hist"
   ],
   "sujets": [
    "émojis",
    "Unicode",
    "codage des caractères",
    "Japon"
   ]
  },
  {
   "id": "mp3-chanson",
   "affirmation": "Le format MP3 a été mis au point en testant notamment la compression sur une chanson de Suzanne Vega chantée sans instrument.",
   "vrai": true,
   "explication": "Le MP3 a été développé en grande partie par la société Fraunhofer, en Allemagne, sous la direction de Karlheinz Brandenburg. Il se servait de « Tom's Diner », a cappella, pour vérifier que la voix humaine supportait la compression ; l'extension .mp3 est choisie le 14 juillet 1995.",
   "accroche": "« Le MP3 a été réglé à l'oreille, entre autres sur « Tom's Diner », une chanson chantée sans instrument. »",
   "source": {
    "titre": "Wikipedia (en), « MP3 »",
    "url": "https://en.wikipedia.org/wiki/MP3"
   },
   "autres": [],
   "interets": [
    "musique",
    "histoire",
    "sciences"
   ],
   "notions": [
    "donnees",
    "hist"
   ],
   "sujets": [
    "MP3",
    "compression",
    "son numérique",
    "musique"
   ]
  },
  {
   "id": "toy-story",
   "affirmation": "Le premier long métrage entièrement réalisé en images de synthèse est sorti en 1995.",
   "vrai": true,
   "explication": "C'est « Toy Story », du studio Pixar, distribué par Disney.",
   "accroche": "« En 1995, pour la première fois, un long métrage entier est sorti d'un ordinateur. »",
   "source": {
    "titre": "Encyclopædia Britannica, « Toy Story »",
    "url": "https://www.britannica.com/topic/Toy-Story"
   },
   "autres": [],
   "interets": [
    "cinema",
    "art",
    "histoire"
   ],
   "notions": [
    "hist",
    "donnees"
   ],
   "sujets": [
    "cinéma d'animation",
    "images de synthèse",
    "Pixar"
   ]
  },
  {
   "id": "ver-morris",
   "affirmation": "Le premier grand ver informatique d'Internet, en 1988, a été écrit par un étudiant.",
   "vrai": true,
   "explication": "Robert Tappan Morris, étudiant à l'université Cornell, lance son ver le 2 novembre 1988. Il devient la première personne condamnée pour crime en vertu de la loi américaine de 1986 sur la fraude informatique.",
   "accroche": "« Le premier grand ver d'Internet a été écrit par un étudiant, et lui a valu une condamnation. »",
   "source": {
    "titre": "Wikipedia (en), « Morris worm »",
    "url": "https://en.wikipedia.org/wiki/Morris_worm"
   },
   "autres": [],
   "interets": [
    "histoire",
    "societe"
   ],
   "notions": [
    "secu",
    "hist"
   ],
   "sujets": [
    "ver informatique",
    "cybersécurité",
    "droit du numérique"
   ]
  },
  {
   "id": "wannacry",
   "affirmation": "En 2017, une attaque informatique a obligé des hôpitaux britanniques à refuser des urgences.",
   "vrai": true,
   "explication": "Le rançongiciel WannaCry se répand le 12 mai 2017 dans 150 pays. Une grande partie de sa diffusion vient d'organisations qui n'avaient pas installé les correctifs de sécurité disponibles.",
   "accroche": "« Des correctifs de sécurité non installés, et des hôpitaux doivent refuser des urgences : c'est WannaCry, en 2017. »",
   "source": {
    "titre": "Wikipedia (en), « WannaCry ransomware attack »",
    "url": "https://en.wikipedia.org/wiki/WannaCry_ransomware_attack"
   },
   "autres": [],
   "interets": [
    "sante",
    "societe"
   ],
   "notions": [
    "secu"
   ],
   "sujets": [
    "rançongiciel",
    "mises à jour",
    "cybersécurité",
    "hôpitaux"
   ]
  },
  {
   "id": "phrase-de-passe",
   "affirmation": "Pour la CNIL, une phrase de passe de sept mots vaut un mot de passe de douze caractères mêlant majuscules, minuscules, chiffres et symboles.",
   "vrai": true,
   "explication": "Dans sa recommandation du 14 octobre 2022, la CNIL raisonne en entropie (au moins 80 bits) et donne ces exemples comme équivalents, avec aussi 14 caractères sans symbole. Ce qui compte, c'est le nombre de combinaisons possibles, pas l'air compliqué.",
   "accroche": "« Pour la CNIL, une phrase de passe de sept mots protège aussi bien qu'un mot de passe de douze caractères compliqués. »",
   "source": {
    "titre": "CNIL, « Mots de passe : recommandations pour maîtriser sa sécurité » (14 octobre 2022)",
    "url": "https://www.cnil.fr/fr/mots-de-passe-une-nouvelle-recommandation-pour-maitriser-sa-securite"
   },
   "autres": [],
   "interets": [
    "societe",
    "reseaux"
   ],
   "notions": [
    "secu",
    "donnees"
   ],
   "sujets": [
    "mots de passe",
    "entropie",
    "cybersécurité",
    "CNIL"
   ]
  },
  {
   "id": "cookie-programme",
   "affirmation": "Un cookie est un petit programme espion installé sur ton appareil.",
   "vrai": false,
   "explication": "Pour la CNIL, un cookie est un petit fichier, stocké par un serveur dans le terminal de l'utilisateur ou de l'utilisatrice et associé à un domaine web. Ce n'est pas un programme : il ne s'exécute pas. Il peut en revanche servir à te reconnaître et à suivre ta navigation.",
   "accroche": "« Un cookie n'est pas un virus, c'est une étiquette : le problème, c'est qui la lit. »",
   "source": {
    "titre": "CNIL, « Cookie » (définition)",
    "url": "https://www.cnil.fr/fr/definition/cookie"
   },
   "autres": [],
   "interets": [
    "reseaux",
    "societe"
   ],
   "notions": [
    "web",
    "donnees",
    "secu"
   ],
   "sujets": [
    "cookies",
    "traceurs",
    "vie privée",
    "RGPD"
   ]
  },
  {
   "id": "google-premier",
   "affirmation": "Google a été le premier moteur de recherche d'Internet.",
   "vrai": false,
   "explication": "Archie, écrit en 1990 par Alan Emtage, est considéré comme le premier moteur de recherche d'Internet : il indexait des archives de fichiers (FTP) pour aider à retrouver un fichier précis.",
   "accroche": "« Dès 1990, bien avant Google, un moteur de recherche appelé Archie cherchait des fichiers, pas des pages. »",
   "source": {
    "titre": "Wikipedia (en), « Archie (search engine) »",
    "url": "https://en.wikipedia.org/wiki/Archie_(search_engine)"
   },
   "autres": [],
   "interets": [
    "histoire",
    "reseaux"
   ],
   "notions": [
    "web",
    "hist",
    "donnees"
   ],
   "sujets": [
    "moteur de recherche",
    "indexation",
    "histoire d'Internet"
   ]
  },
  {
   "id": "web-brevet",
   "affirmation": "L'inventeur du Web touche des droits sur chaque site créé.",
   "vrai": false,
   "explication": "Tim Berners-Lee invente le Web au CERN en 1989, et le 30 avril 1993 le CERN met le code source du logiciel à disposition sans redevance. C'est ce qui a permis à chacun·e de créer des sites librement.",
   "accroche": "« Personne ne paie de droits pour se servir du Web : en 1993, le CERN a mis son logiciel à disposition sans redevance. »",
   "source": {
    "titre": "CERN, « A short history of the Web »",
    "url": "https://home.cern/science/computing/birth-web/short-history-web"
   },
   "autres": [],
   "interets": [
    "histoire",
    "argent",
    "societe"
   ],
   "notions": [
    "web",
    "hist"
   ],
   "sujets": [
    "Web",
    "logiciel libre",
    "Tim Berners-Lee",
    "biens communs"
   ]
  },
  {
   "id": "binaire-ordinateurs",
   "affirmation": "Le système binaire a été inventé pour les ordinateurs.",
   "vrai": false,
   "explication": "Leibniz publie son « Explication de l'arithmétique binaire » en 1703, et des systèmes à deux symboles existaient bien avant, par exemple chez le savant indien Pingala (vers le IIe siècle avant notre ère). Les ordinateurs ont repris une idée vieille de plusieurs siècles.",
   "accroche": "« Le binaire est bien plus vieux que l'ordinateur : Leibniz l'expliquait dès 1703. »",
   "source": {
    "titre": "Wikipedia (en), « Binary number »",
    "url": "https://en.wikipedia.org/wiki/Binary_number"
   },
   "autres": [],
   "interets": [
    "histoire",
    "sciences"
   ],
   "notions": [
    "donnees",
    "hist"
   ],
   "sujets": [
    "binaire",
    "représentation des nombres",
    "Leibniz"
   ]
  },
  {
   "id": "robot-theatre",
   "affirmation": "Le mot « robot » vient d'une pièce de théâtre.",
   "vrai": true,
   "explication": "Il vient du tchèque « robota », travail forcé, employé dans la pièce « R.U.R. » de Karel Čapek, en 1920.",
   "accroche": "« Avant de désigner des machines, le mot robot a désigné des personnages de théâtre. »",
   "source": {
    "titre": "Encyclopædia Britannica, « Robot »",
    "url": "https://www.britannica.com/technology/robot-technology"
   },
   "autres": [],
   "interets": [
    "art",
    "histoire",
    "cinema"
   ],
   "notions": [
    "hist",
    "ia",
    "materiel"
   ],
   "sujets": [
    "robot",
    "science-fiction",
    "étymologie",
    "travail"
   ]
  },
  {
   "id": "mot-ordinateur",
   "affirmation": "Le mot « ordinateur » a été proposé en 1955 par un professeur de lettres.",
   "vrai": true,
   "explication": "IBM France cherchait un nom français pour ses machines : un responsable consulte son ancien professeur de lettres, Jacques Perret, qui propose un mot construit autour d'« ordonnateur ».",
   "accroche": "« Le mot ordinateur a été proposé sur commande, en 1955, par un professeur de lettres. »",
   "source": {
    "titre": "Wikipédia (fr), « Ordinateur »",
    "url": "https://fr.wikipedia.org/wiki/Ordinateur"
   },
   "autres": [],
   "interets": [
    "histoire",
    "art"
   ],
   "notions": [
    "hist"
   ],
   "sujets": [
    "ordinateur",
    "langue française",
    "étymologie",
    "IBM"
   ]
  }
 ],
 "CONSEILS": [
  {
   "id": "question-a-toi",
   "phase": 0,
   "titre": "Choisis une question à toi",
   "conseil": "Prends une question que tu as vraiment envie de défendre, pas celle qui « fait sérieux ». Demande-toi : est-ce que j'en parlerais dix minutes à un·e ami·e ?",
   "pourquoi": "La charte remise aux jurys de l'académie de Versailles demande d'évaluer la capacité à défendre des idées « de manière personnelle et convaincante » et l'engagement dans la parole.",
   "solidite": "consignes aux jurys",
   "source": {
    "annee": "2023",
    "url": "https://educamus.ac-versailles.fr/IMG/pdf/grand-oral_bac_charte_examinateurs_2023.pdf",
    "auteurs": "Inspection pédagogique régionale, académie de Versailles",
    "titre": "Grand Oral 2023 – Charte des examinateurs et des examinatrices"
   }
  },
  {
   "id": "relier-specialites",
   "phase": 0,
   "titre": "Relie tes deux spécialités",
   "conseil": "Vérifie dès le début que ta question te permet d'utiliser des connaissances précises de NSI. Note trois notions du programme que tu pourras expliquer.",
   "pourquoi": "La page officielle du Grand oral indique que le jury valorise la « solidité des connaissances » et la « capacité à argumenter et à relier les savoirs ».",
   "solidite": "consignes aux jurys",
   "source": {
    "annee": "2024",
    "url": "https://eduscol.education.fr/729/presentation-du-grand-oral",
    "auteurs": "Ministère de l'Éducation nationale (éduscol)",
    "titre": "Présentation du Grand oral (mise à jour d'avril 2024)"
   }
  },
  {
   "id": "commence-tot",
   "phase": 0,
   "titre": "Commence plus tôt que prévu",
   "conseil": "Fixe ta date de fin, puis avance-la franchement : tu mettras sans doute plus de temps que tu ne le crois. Décide aujourd'hui de la première petite étape.",
   "pourquoi": "Dans une étude sur 37 étudiant·e·s, le mémoire devait prendre 33,9 jours en moyenne selon leurs prévisions ; il en a pris 55,5, et environ 30 % ont tenu leur délai.",
   "solidite": "une étude",
   "source": {
    "annee": "1994",
    "url": "https://en.wikipedia.org/wiki/Planning_fallacy",
    "auteurs": "Buehler, R., Griffin, D. et Ross, M.",
    "titre": "Exploring the \"planning fallacy\": why people underestimate their task completion times",
    "lien": "page Wikipédia qui résume ce travail"
   }
  },
  {
   "id": "si-alors",
   "phase": 0,
   "titre": "Planifie en « si… alors »",
   "conseil": "Écris une phrase du type : « Si c'est mercredi 14 h, alors je cherche deux sources pour mon sujet. » Un moment précis et une action précise.",
   "pourquoi": "Cette forme de plan, étudiée par le psychologue Peter Gollwitzer depuis 1999, sert à passer de l'intention à l'action ; la page consultée ne donne pas la taille de l'effet.",
   "solidite": "plusieurs études",
   "source": {
    "annee": "1999",
    "url": "https://en.wikipedia.org/wiki/Implementation_intention",
    "auteurs": "Gollwitzer, P. M.",
    "titre": "Implementation intentions: strong effects of simple plans",
    "lien": "page Wikipédia qui résume ce travail"
   }
  },
  {
   "id": "pourquoi-pourquoi",
   "phase": 0,
   "titre": "Demande-toi « pourquoi ? »",
   "conseil": "Pour chaque fait que tu trouves, écris pourquoi il est vrai et pourquoi il compte pour ta question. Si tu ne sais pas répondre, tu as trouvé ce qu'il te reste à chercher.",
   "pourquoi": "Se demander pourquoi un fait est vrai aide à le relier à ce qu'on sait déjà et à le retenir, d'après les travaux résumés sous le nom d'« interrogation élaborative ».",
   "solidite": "plusieurs études",
   "source": {
    "annee": "consulté en 2026",
    "url": "https://en.wikipedia.org/wiki/Elaborative_interrogation",
    "auteurs": "Wikipédia (en)",
    "titre": "Elaborative interrogation"
   }
  },
  {
   "id": "explique-a-quelquun",
   "phase": 0,
   "titre": "Prépare-toi à l'expliquer",
   "conseil": "Lis tes sources comme si tu devais les expliquer demain à un·e camarade. Puis fais-le vraiment, en deux minutes.",
   "pourquoi": "Dans une étude, les personnes qui s'attendaient à enseigner un texte en ont restitué un rappel plus complet et mieux organisé que celles qui s'attendaient à un contrôle, surtout sur les idées principales.",
   "solidite": "une étude",
   "source": {
    "annee": "2014",
    "url": "https://pubmed.ncbi.nlm.nih.gov/24845756/",
    "auteurs": "Nestojko, J. F., Bui, D. C., Kornell, N. et Bjork, E. L.",
    "titre": "Expecting to teach enhances learning and organization of knowledge in free recall of text passages. Memory & Cognition, 42(7), 1038-1048. doi:10.3758/s13421-014-0416-z",
    "lien": "résumé de l’article"
   }
  },
  {
   "id": "styles-apprentissage",
   "phase": 0,
   "titre": "Oublie ton « profil d'apprentissage »",
   "conseil": "Ne choisis pas ta méthode parce que tu serais « visuel·le » ou « auditif·ve ». Choisis celle qui te fait retrouver les idées sans tes notes.",
   "pourquoi": "Une revue de 2008 n'a trouvé pratiquement aucune preuve qu'enseigner selon le « style » de chacun·e améliore l'apprentissage.",
   "solidite": "plusieurs études",
   "source": {
    "annee": "2008",
    "url": "https://pubmed.ncbi.nlm.nih.gov/26162104/",
    "auteurs": "Pashler, H., McDaniel, M., Rohrer, D. et Bjork, R.",
    "titre": "Learning styles: concepts and evidence. Psychological Science in the Public Interest, 9(3), 105-119",
    "lien": "résumé de l’article"
   }
  },
  {
   "id": "premiere-phrase",
   "phase": 1,
   "titre": "Soigne ta première phrase",
   "conseil": "Écris ta première phrase mot à mot et apprends-la : c'est la seule partie à savoir par cœur. Elle doit donner envie d'entendre la suite.",
   "pourquoi": "Dans une étude sur des visages, un dixième de seconde suffisait pour se former une première impression, et ces impressions ont tendance à rester stables. C'est un résultat sur les visages, pas sur les exposés.",
   "solidite": "une étude",
   "source": {
    "annee": "2006",
    "url": "https://en.wikipedia.org/wiki/First_impression_(psychology)",
    "auteurs": "Willis, J. et Todorov, A.",
    "titre": "First impressions: making up your mind after a 100-ms exposure to a face",
    "lien": "page Wikipédia qui résume ce travail"
   },
   "fiches": [
    "plan"
   ],
   "quiz": "plan"
  },
  {
   "id": "debut-et-fin",
   "phase": 1,
   "titre": "Mets l'essentiel aux extrémités",
   "conseil": "Place ta problématique au début et ta réponse à la fin, pas au milieu. Le milieu sert aux explications.",
   "pourquoi": "Quand on écoute une suite d'éléments, on retient mieux les premiers et les derniers que ceux du milieu : c'est l'effet de position sérielle, observé sur des listes de mots depuis les années 1960.",
   "solidite": "bien établi",
   "source": {
    "annee": "1962",
    "url": "https://en.wikipedia.org/wiki/Serial-position_effect",
    "auteurs": "Murdock, B. B.",
    "titre": "The serial position effect of free recall. Journal of Experimental Psychology, 64(5), 482-488",
    "lien": "page Wikipédia qui résume ce travail"
   },
   "fiches": [
    "plan"
   ],
   "quiz": "plan"
  },
  {
   "id": "derniere-phrase",
   "phase": 1,
   "titre": "Écris ta dernière phrase",
   "conseil": "Prépare une phrase de fin nette, qui répond à ta question, et annonce-la : « pour conclure… ». Ne finis jamais par « voilà ».",
   "pourquoi": "Dans l'étude de Fredrickson et Kahneman (1993), le souvenir d'un film dépendait surtout de certains moments, très peu de sa durée ; ces travaux ont donné la règle de l'apogée et de la fin.",
   "solidite": "plusieurs études",
   "source": {
    "annee": "1993",
    "url": "https://psycnet.apa.org/doiLanding?doi=10.1037%2F0022-3514.65.1.45",
    "auteurs": "Fredrickson, B. L. et Kahneman, D.",
    "titre": "Duration neglect in retrospective evaluations of affective episodes. Journal of Personality and Social Psychology, 65(1), 45-55. doi:10.1037/0022-3514.65.1.45",
    "lien": "résumé de l’article"
   },
   "fiches": [
    "plan"
   ],
   "quiz": "plan"
  },
  {
   "id": "un-temps-fort",
   "phase": 1,
   "titre": "Prévois un temps fort",
   "conseil": "Choisis le moment le plus marquant de ton exposé (un exemple, un chiffre sourcé, une démonstration) et ne le place pas trop tôt. Ralentis quand tu y arrives.",
   "pourquoi": "Dans une expérience de 1993, la plupart des personnes préféraient refaire l'essai le plus long, parce qu'il finissait moins mal : on juge une expérience à son pic et à sa fin. La règle ne prédit pas tout, et elle a été établie sur des sensations, pas sur des exposés.",
   "solidite": "plusieurs études",
   "source": {
    "annee": "1993",
    "url": "https://en.wikipedia.org/wiki/Peak%E2%80%93end_rule",
    "auteurs": "Kahneman, D., Fredrickson, B. L., Schreiber, C. A. et Redelmeier, D. A.",
    "titre": "When more pain is preferred to less: adding a better end",
    "lien": "page Wikipédia qui résume ce travail"
   },
   "fiches": [
    "plan"
   ],
   "quiz": "plan"
  },
  {
   "id": "trois-axes",
   "phase": 1,
   "titre": "Deux ou trois axes",
   "conseil": "Limite-toi à deux ou trois grandes parties, et à trois ou quatre idées par partie. Si tu en as plus, regroupe.",
   "pourquoi": "Une synthèse de 2001 estime qu'on garde en tête environ quatre éléments à la fois, et que le célèbre « sept » n'était qu'une approximation.",
   "solidite": "plusieurs études",
   "source": {
    "annee": "2001",
    "url": "https://pubmed.ncbi.nlm.nih.gov/11515286/",
    "auteurs": "Cowan, N.",
    "titre": "The magical number 4 in short-term memory: a reconsideration of mental storage capacity. Behavioral and Brain Sciences, 24(1), 87-114",
    "lien": "résumé de l’article"
   },
   "fiches": [
    "plan"
   ],
   "quiz": "plan"
  },
  {
   "id": "tes-propres-mots",
   "phase": 1,
   "titre": "Écris avec tes mots",
   "conseil": "Rédige chaque point du plan toi-même, sans copier une phrase d'une source. Si tu n'y arrives pas, c'est que le point n'est pas encore compris.",
   "pourquoi": "On retient en général mieux ce qu'on a produit soi-même que ce qu'on a seulement lu (effet de génération), même si l'effet est plus faible sur un contenu tout nouveau.",
   "solidite": "plusieurs études",
   "source": {
    "annee": "consulté en 2026",
    "url": "https://en.wikipedia.org/wiki/Generation_effect",
    "auteurs": "Wikipédia (en)",
    "titre": "Generation effect"
   }
  },
  {
   "id": "mots-techniques",
   "phase": 1,
   "titre": "Explique chaque mot technique",
   "conseil": "Fais lire ton plan à quelqu'un qui ne fait pas NSI et souligne chaque mot qu'il ou elle ne comprend pas. Prévois une définition d'une phrase pour chacun.",
   "pourquoi": "Dans une expérience, des personnes tapotaient le rythme d'une chanson connue : elles surestimaient toujours le nombre de chansons que les autres reconnaîtraient. Quand on sait, on oublie ce que c'est de ne pas savoir.",
   "solidite": "une étude",
   "source": {
    "annee": "1990",
    "url": "https://en.wikipedia.org/wiki/Curse_of_knowledge",
    "auteurs": "Newton, E. L.",
    "titre": "The rocky road from actions to intentions (expérience des chansons tapotées)",
    "lien": "page Wikipédia qui résume ce travail"
   },
   "fiches": [
    "non-specialiste",
    "definition"
   ]
  },
  {
   "id": "compte-tes-mots",
   "phase": 1,
   "titre": "Compte tes mots",
   "conseil": "Vise 100 à 125 mots par minute, soit environ 1 000 à 1 250 mots pour dix minutes. Si ton texte en fait le double, coupe au lieu d'accélérer.",
   "pourquoi": "C'est le débit confortable indiqué par le manuel de Linda Wong (2014) pour une présentation ; c'est un repère de manuel, pas le résultat d'une expérience.",
   "solidite": "repère de manuel",
   "source": {
    "annee": "2014",
    "url": "https://books.google.fr/books?id=yL2iAgAAQBAJ&q=conversation+words+per+minute&pg=PA348&redir_esc=y",
    "auteurs": "Wong, L.",
    "titre": "Essential Study Skills. Cengage Learning. ISBN 978-1285965628, p. 348",
    "lien": "le livre sur Google Livres"
   }
  },
  {
   "id": "plan-pas-texte",
   "phase": 1,
   "titre": "Un plan, pas un texte",
   "conseil": "Prépare des mots-clés et des points courts, pas des phrases à lire. Entraîne-toi à refaire ce support en vingt minutes.",
   "pourquoi": "D'après la page officielle, tu disposes de vingt minutes de préparation et tu peux t'appuyer sur un support papier (notes, plan, mots-clés) ; le jury attend une parole personnelle, pas une lecture.",
   "solidite": "consignes aux jurys",
   "source": {
    "annee": "2024",
    "url": "https://eduscol.education.fr/729/presentation-du-grand-oral",
    "auteurs": "Ministère de l'Éducation nationale (éduscol)",
    "titre": "Présentation du Grand oral (mise à jour d'avril 2024)"
   },
   "fiches": [
    "point"
   ],
   "quiz": "epreuve"
  },
  {
   "id": "arguments-sources",
   "phase": 1,
   "titre": "Donne tes sources",
   "conseil": "Pour chaque argument, note d'où il vient : une étude, une loi, un fait daté. Dis-le en une demi-phrase à l'oral.",
   "pourquoi": "La grille indicative des jurys décrit une argumentation satisfaisante comme une démonstration construite, appuyée sur des arguments précis et pertinents.",
   "solidite": "consignes aux jurys",
   "source": {
    "annee": "2023",
    "url": "https://educamus.ac-versailles.fr/IMG/pdf/grand-oral_bac_charte_examinateurs_2023.pdf",
    "auteurs": "Inspection pédagogique régionale, académie de Versailles",
    "titre": "Grand Oral 2023 – Charte des examinateurs et des examinatrices"
   },
   "fiches": [
    "source",
    "arguments"
   ]
  },
  {
   "id": "reponds-a-la-question",
   "phase": 1,
   "titre": "Réponds à ta question",
   "conseil": "Vérifie que ta conclusion contient une réponse claire à la question posée, avec ses mots. Quelqu'un qui n'aurait entendu que ta conclusion doit connaître ta position.",
   "pourquoi": "La définition officielle de l'épreuve est simple : pendant dix minutes, la ou le candidat « présente la question choisie et y répond ».",
   "solidite": "consignes aux jurys",
   "source": {
    "annee": "2024",
    "url": "https://eduscol.education.fr/729/presentation-du-grand-oral",
    "auteurs": "Ministère de l'Éducation nationale (éduscol)",
    "titre": "Présentation du Grand oral (mise à jour d'avril 2024)"
   },
   "fiches": [
    "plan"
   ],
   "quiz": "plan"
  },
  {
   "id": "teste-toi",
   "phase": 2,
   "titre": "Teste-toi au lieu de relire",
   "conseil": "Ferme tes notes et récite ton exposé de mémoire, puis vérifie ce que tu as oublié. Fais-le même si c'est inconfortable.",
   "pourquoi": "Dans l'étude de Roediger et Karpicke (2006), relire donnait un meilleur résultat cinq minutes après, mais se tester donnait un bien meilleur souvenir aux tests différés.",
   "solidite": "bien établi",
   "source": {
    "annee": "2006",
    "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/",
    "auteurs": "Roediger, H. L. et Karpicke, J. D.",
    "titre": "Test-enhanced learning: taking memory tests improves long-term retention. Psychological Science, 17(3), 249-255",
    "lien": "résumé de l’article"
   }
  },
  {
   "id": "range-le-surligneur",
   "phase": 2,
   "titre": "Range le surligneur",
   "conseil": "Remplace une séance de relecture surlignée par une séance de questions sans notes. Garde le surligneur pour repérer, pas pour apprendre.",
   "pourquoi": "Une grande revue de 2013 classe la relecture et le surlignage parmi les techniques peu utiles, et le test et la pratique étalée parmi les plus utiles.",
   "solidite": "bien établi",
   "source": {
    "annee": "2013",
    "url": "https://pubmed.ncbi.nlm.nih.gov/26173288/",
    "auteurs": "Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J. et Willingham, D. T.",
    "titre": "Improving students' learning with effective learning techniques. Psychological Science in the Public Interest, 14(1), 4-58",
    "lien": "résumé de l’article"
   }
  },
  {
   "id": "etale-tes-repetitions",
   "phase": 2,
   "titre": "Étale tes répétitions",
   "conseil": "Répète un peu, plusieurs jours de suite, plutôt que tout la veille. Plus l'oral est loin, plus tu peux espacer les séances.",
   "pourquoi": "Une synthèse de 317 expériences montre que l'espacement des séances améliore la mémorisation, et que le bon intervalle grandit avec le délai avant l'épreuve.",
   "solidite": "bien établi",
   "source": {
    "annee": "2006",
    "url": "https://pubmed.ncbi.nlm.nih.gov/16719566/",
    "auteurs": "Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T. et Rohrer, D.",
    "titre": "Distributed practice in verbal recall tasks: a review and quantitative synthesis. Psychological Bulletin, 132(3), 354-380",
    "lien": "résumé de l’article"
   }
  },
  {
   "id": "court-mais-souvent",
   "phase": 2,
   "titre": "Fais court, mais souvent",
   "conseil": "Préfère quatre séances de quinze minutes à une séance d'une heure. Arrête-toi avant d'être lassé·e.",
   "pourquoi": "Dans une étude de 1978, des postiers qui apprenaient à taper au clavier en séances courtes, réparties sur plus de jours, apprenaient mieux que ceux qui avaient de longues séances.",
   "solidite": "une étude",
   "source": {
    "annee": "1978",
    "url": "https://en.wikipedia.org/wiki/Distributed_practice",
    "auteurs": "Baddeley, A. D. et Longman, D. J. A.",
    "titre": "The influence of length and frequency of training session on the rate of learning to type",
    "lien": "page Wikipédia qui résume ce travail"
   }
  },
  {
   "id": "a-voix-haute",
   "phase": 2,
   "titre": "Répète à voix haute",
   "conseil": "Dis ton exposé pour de vrai, à voix haute, au lieu de le repasser dans ta tête. Commence par les passages que tu maîtrises le moins.",
   "pourquoi": "Dans une série d'expériences, des mots lus à voix haute étaient mieux retenus que des mots lus en silence dans la même liste ; l'effet a été montré sur des listes de mots, pas sur des exposés.",
   "solidite": "plusieurs études",
   "source": {
    "annee": "2010",
    "url": "https://pubmed.ncbi.nlm.nih.gov/20438265/",
    "auteurs": "MacLeod, C. M., Gopie, N., Hourihan, K. L., Neary, K. R. et Ozubko, J. D.",
    "titre": "The production effect: delineation of a phenomenon. Journal of Experimental Psychology: Learning, Memory, and Cognition, 36(3), 671-685",
    "lien": "résumé de l’article"
   }
  },
  {
   "id": "refais-ton-plan",
   "phase": 2,
   "titre": "Refais ton plan de mémoire",
   "conseil": "Prends une feuille blanche, un minuteur de vingt minutes, et réécris ton plan sans modèle. Compare ensuite avec l'original.",
   "pourquoi": "Retrouver une information de mémoire la consolide mieux que la revoir, et c'est exactement ce que tu feras pendant les vingt minutes de préparation de l'épreuve.",
   "solidite": "bien établi",
   "source": {
    "annee": "2006",
    "url": "https://pubmed.ncbi.nlm.nih.gov/16507066/",
    "auteurs": "Roediger, H. L. et Karpicke, J. D.",
    "titre": "Test-enhanced learning: taking memory tests improves long-term retention. Psychological Science, 17(3), 249-255",
    "lien": "résumé de l’article"
   }
  },
  {
   "id": "demande-un-retour",
   "phase": 2,
   "titre": "Demande un retour",
   "conseil": "Après chaque essai devant quelqu'un, demande une chose réussie et une chose à changer. Note-les avant l'essai suivant.",
   "pourquoi": "Se tester est plus efficace quand on reçoit ensuite un retour sur ses réponses, d'après les travaux sur l'effet de test.",
   "solidite": "plusieurs études",
   "source": {
    "annee": "consulté en 2026",
    "url": "https://en.wikipedia.org/wiki/Testing_effect",
    "auteurs": "Wikipédia (en)",
    "titre": "Testing effect"
   }
  },
  {
   "id": "grille-du-jury",
   "phase": 2,
   "titre": "Évalue-toi avec la grille",
   "conseil": "Filme-toi ou fais-toi écouter, puis note-toi sur les cinq critères du jury au lieu de te fier à ton impression. Fais remplir la même grille par quelqu'un d'autre.",
   "pourquoi": "Dans l'étude de Kruger et Dunning (1999), les personnes les moins bonnes à un test se situaient en moyenne au 62e centile alors qu'elles étaient au 12e ; s'entraîner les aidait à mieux se juger. La grille indicative des jurys a cinq critères : qualité orale, prise de parole en continu, connaissances, interaction, argumentation.",
   "solidite": "une étude",
   "source": {
    "annee": "1999",
    "url": "https://pubmed.ncbi.nlm.nih.gov/10626367/",
    "auteurs": "Kruger, J. et Dunning, D.",
    "titre": "Unskilled and unaware of it. Journal of Personality and Social Psychology, 77(6), 1121-1134",
    "lien": "résumé de l’article"
   }
  },
  {
   "id": "conditions-reelles",
   "phase": 2,
   "titre": "Répète debout, comme le jour J",
   "conseil": "Entraîne-toi debout, sans écran, avec seulement ta feuille, et si possible dans une salle de classe. Chronomètre-toi.",
   "pourquoi": "Le jour de l'épreuve, tu seras debout pendant ton exposé, avec ta seule feuille : t'entraîner dans ces conditions t'évite les surprises. Une expérience célèbre de 1975 va dans ce sens (des plongeurs retenaient mieux sous l'eau les mots appris sous l'eau, et sur terre ceux appris sur terre), mais une réplication de 2021 n'a pas retrouvé cet effet.",
   "solidite": "une étude",
   "source": {
    "annee": "1975",
    "url": "https://en.wikipedia.org/wiki/Context-dependent_memory",
    "auteurs": "Godden, D. R. et Baddeley, A. D.",
    "titre": "Context-dependent memory in two natural environments: on land and underwater",
    "lien": "page Wikipédia qui résume ce travail"
   }
  },
  {
   "id": "chronometre",
   "phase": 2,
   "titre": "Chronomètre chaque essai",
   "conseil": "Lance un minuteur de dix minutes à chaque répétition et note où tu en es à cinq minutes. Ajuste le plan, pas ta vitesse.",
   "pourquoi": "L'épreuve est cadrée à la minute : dix minutes d'exposé, puis dix minutes d'échange, après vingt minutes de préparation.",
   "solidite": "consignes aux jurys",
   "source": {
    "annee": "2024",
    "url": "https://eduscol.education.fr/729/presentation-du-grand-oral",
    "auteurs": "Ministère de l'Éducation nationale (éduscol)",
    "titre": "Présentation du Grand oral (mise à jour d'avril 2024)"
   },
   "quiz": "epreuve"
  },
  {
   "id": "trac-invisible",
   "phase": 2,
   "titre": "Ton trac se voit peu",
   "conseil": "Quand tu sens ton cœur battre, rappelle-toi que le jury le voit bien moins que tu ne le crois. Continue ta phrase.",
   "pourquoi": "Dans plusieurs expériences, les personnes surestimaient à quel point les autres devinaient ce qu'elles ressentaient : nos états intérieurs « fuient » moins qu'on ne le croit.",
   "solidite": "plusieurs études",
   "source": {
    "annee": "1998",
    "url": "https://pubmed.ncbi.nlm.nih.gov/9731312/",
    "auteurs": "Gilovich, T., Savitsky, K. et Medvec, V. H.",
    "titre": "The illusion of transparency: biased assessments of others' ability to read one's emotional states. Journal of Personality and Social Psychology, 75(2), 332-346",
    "lien": "résumé de l’article"
   }
  },
  {
   "id": "le-savoir-aide",
   "phase": 2,
   "titre": "Le savoir aide déjà",
   "conseil": "Relis ce conseil juste avant d'entrer : ta nervosité est moins visible que tu ne le penses. Dis-le aussi à tes camarades.",
   "pourquoi": "Dans une étude de 2003, les orateurs et oratrices croyaient leur nervosité plus visible qu'elle ne l'était, et le simple fait de connaître cette illusion pouvait améliorer la qualité de leur prestation.",
   "solidite": "une étude",
   "source": {
    "annee": "2003",
    "url": "https://www.sciencedirect.com/science/article/abs/pii/S0022103103000568",
    "auteurs": "Savitsky, K. et Gilovich, T.",
    "titre": "The illusion of transparency and the alleviation of speech anxiety. Journal of Experimental Social Psychology, 39(6), 618-625",
    "lien": "résumé de l’article"
   }
  },
  {
   "id": "jai-hate",
   "phase": 2,
   "titre": "Dis « j'ai hâte »",
   "conseil": "Avant d'entrer, dis-toi à voix basse « j'ai hâte » plutôt que « calme-toi ». Ton cœur bat vite : appelle ça de l'énergie.",
   "pourquoi": "Dans l'étude d'Alison Brooks (2014), les personnes qui requalifiaient leur anxiété en excitation, par une simple phrase, se sentaient plus enthousiastes et réussissaient mieux que celles qui cherchaient à se calmer.",
   "solidite": "une étude",
   "source": {
    "annee": "2014",
    "url": "https://pubmed.ncbi.nlm.nih.gov/24364682/",
    "auteurs": "Brooks, A. W.",
    "titre": "Get excited: reappraising pre-performance anxiety as excitement. Journal of Experimental Psychology: General, 143(3), 1144-1158",
    "lien": "résumé de l’article"
   }
  },
  {
   "id": "projecteur",
   "phase": 2,
   "titre": "On remarque moins tes ratés",
   "conseil": "Si tu te trompes d'un mot, corrige en une seconde et avance. Ne t'excuse pas trois fois.",
   "pourquoi": "Dans des expériences de 2000, les participant·e·s surestimaient le nombre de personnes qui remarquaient leur apparence ou leurs interventions : c'est l'effet projecteur.",
   "solidite": "plusieurs études",
   "source": {
    "annee": "2000",
    "url": "https://pubmed.ncbi.nlm.nih.gov/10707330/",
    "auteurs": "Gilovich, T., Medvec, V. H. et Savitsky, K.",
    "titre": "The spotlight effect in social judgment. Journal of Personality and Social Psychology, 78(2), 211-222",
    "lien": "résumé de l’article"
   }
  },
  {
   "id": "ecris-tes-inquietudes",
   "phase": 2,
   "titre": "Écris tes inquiétudes",
   "conseil": "Dix minutes avant, écris sur un papier ce qui t'inquiète pour cet oral, puis range-le. Ne le relis pas.",
   "pourquoi": "Dans une étude publiée dans Science en 2011, des élèves qui écrivaient brièvement leurs inquiétudes juste avant un examen important obtenaient de meilleures notes, surtout les plus anxieux·ses.",
   "solidite": "une étude",
   "source": {
    "annee": "2011",
    "url": "https://pubmed.ncbi.nlm.nih.gov/21233387/",
    "auteurs": "Ramirez, G. et Beilock, S. L.",
    "titre": "Writing about testing worries boosts exam performance in the classroom. Science, 331(6014), 211-213",
    "lien": "résumé de l’article"
   }
  },
  {
   "id": "trac-normal",
   "phase": 2,
   "titre": "Le trac est fréquent",
   "conseil": "Ne lis pas ton trac comme le signe que tu n'es pas prêt·e : la plupart des gens l'ont. Parle-en avec tes camarades.",
   "pourquoi": "Dans une étude de 2017 sur 1 135 étudiant·e·s, 64 % disaient avoir peur de parler en public.",
   "solidite": "une étude",
   "source": {
    "annee": "2017",
    "url": "https://en.wikipedia.org/wiki/Glossophobia",
    "auteurs": "Ferreira Marinho, A. C. et coll.",
    "titre": "Fear of public speaking: perception of college students and correlates. Journal of Voice",
    "lien": "page Wikipédia qui résume ce travail"
   }
  },
  {
   "id": "mythe-7-pourcent",
   "phase": 2,
   "titre": "Oublie le « 7 % des mots »",
   "conseil": "Travaille d'abord ce que tu dis : le fond compte. La voix et les gestes servent tes idées, ils ne les remplacent pas.",
   "pourquoi": "La règle « 7 % les mots, 38 % la voix, 55 % le corps » vient d'expériences sur des mots isolés exprimant un sentiment ; Mehrabian lui-même précise que ces chiffres ne s'appliquent pas hors de la communication de sentiments ou d'attitudes.",
   "solidite": "bien établi",
   "source": {
    "annee": "1967",
    "url": "https://en.wikipedia.org/wiki/Albert_Mehrabian",
    "auteurs": "Mehrabian, A.",
    "titre": "Travaux sur la communication des sentiments et des attitudes (règle dite « 7-38-55 »)",
    "lien": "page Wikipédia qui résume ce travail"
   }
  },
  {
   "id": "pose-de-pouvoir",
   "phase": 2,
   "titre": "Pas de pose magique",
   "conseil": "Inutile de te tenir « en super-héros » deux minutes avant d'entrer. Utilise ce temps pour redire ta première phrase.",
   "pourquoi": "Une réplication de 2015 sur un grand échantillon n'a trouvé aucun effet des « poses de pouvoir » sur les hormones ni sur la prise de risque, et l'une des autrices de l'étude d'origine a déclaré en 2016 ne plus croire à ces effets.",
   "solidite": "plusieurs études",
   "source": {
    "annee": "2015",
    "url": "https://en.wikipedia.org/wiki/Power_posing",
    "auteurs": "Ranehill, E., Dreber, A., Johannesson, M., Leiberg, S., Sul, S. et Weber, R. A.",
    "titre": "Assessing the robustness of power posing: no effect on hormones and risk tolerance in a large sample of men and women. Psychological Science, 26(5), 653-656. doi:10.1177/0956797614553946",
    "lien": "page Wikipédia qui résume ce travail"
   }
  },
  {
   "id": "quelques-euh",
   "phase": 2,
   "titre": "Ne panique pas pour un « euh »",
   "conseil": "Ne cherche pas à supprimer tous tes « euh » : cherche à finir tes phrases. Si tu as besoin de réfléchir, dis-le (« je reformule… ») plutôt que de te taire longtemps.",
   "pourquoi": "Les hésitations sont normales : elles représentent parfois plus de 20 % des « mots » d'une conversation, et peuvent même signaler à l'auditoire qu'une idée nouvelle ou complexe arrive.",
   "solidite": "plusieurs études",
   "source": {
    "annee": "consulté en 2026",
    "url": "https://en.wikipedia.org/wiki/Speech_disfluency",
    "auteurs": "Wikipédia (en)",
    "titre": "Speech disfluency"
   }
  },
  {
   "id": "dors",
   "phase": 2,
   "titre": "Dors la veille",
   "conseil": "La veille, arrête de réviser à une heure fixe et dors une nuit complète. Une dernière répétition le matin suffit.",
   "pourquoi": "Le sommeil stabilise et renforce les souvenirs, et le manque de sommeil peut dégrader la mémoire de travail, d'après les travaux résumés sur le sommeil et la mémoire.",
   "solidite": "bien établi",
   "source": {
    "annee": "consulté en 2026",
    "url": "https://en.wikipedia.org/wiki/Sleep_and_memory",
    "auteurs": "Wikipédia (en)",
    "titre": "Sleep and memory"
   }
  },
  {
   "id": "echange-pas-interro",
   "phase": 2,
   "titre": "L'échange n'est pas une interro",
   "conseil": "Écoute la question jusqu'au bout, prends deux secondes, puis réponds en partant de ce que tu as dit. Tu as le droit de préciser ou de nuancer ta pensée.",
   "pourquoi": "La charte des jurys demande des questions brèves, ancrées dans ton propos, à un rythme qui te laisse « le temps de réfléchir » ; l'entretien évalue ta capacité à écouter et à préciser ta pensée. Ce n'est pas un contrôle de connaissances, même si le jury peut s'appuyer sur le programme.",
   "solidite": "consignes aux jurys",
   "source": {
    "annee": "2023",
    "url": "https://educamus.ac-versailles.fr/IMG/pdf/grand-oral_bac_charte_examinateurs_2023.pdf",
    "auteurs": "Inspection pédagogique régionale, académie de Versailles",
    "titre": "Grand Oral 2023 – Charte des examinateurs et des examinatrices"
   },
   "fiches": [
    "jury"
   ],
   "quiz": "epreuve"
  },
  {
   "id": "prepare-les-questions",
   "phase": 2,
   "titre": "Prépare dix questions",
   "conseil": "Écris dix questions que ton exposé peut provoquer et réponds à chacune à voix haute en trente secondes. Demande à un·e camarade d'en inventer d'autres.",
   "pourquoi": "Les questions du jury doivent partir de ce que tu as dit : en relisant ton plan, tu peux donc en deviner une bonne partie. Et s'entraîner à répondre de mémoire est plus efficace que relire.",
   "solidite": "consignes aux jurys",
   "source": {
    "annee": "2023",
    "url": "https://educamus.ac-versailles.fr/IMG/pdf/grand-oral_bac_charte_examinateurs_2023.pdf",
    "auteurs": "Inspection pédagogique régionale, académie de Versailles",
    "titre": "Grand Oral 2023 – Charte des examinateurs et des examinatrices"
   },
   "fiches": [
    "jury"
   ]
  }
 ]
};
  racine.HGCulture = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
