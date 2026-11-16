// Hello GO : les cartes à découvrir. Fichier fabriqué par outils/generer_decouvertes.py : ne pas le modifier à la main.
// Textes des cartes : « Timeline – Histoire de l’informatique » (TimelineNSI), Babash - NSI Tani Malandi, CC BY-SA 4.0.
(function (racine) {
  const api = [
 {
  "num": 4,
  "titre": "Chiffre de César",
  "date": "50 av. J.-C.",
  "texte": "Un système de chiffrement par substitution, simple et efficace, attribué à Jules César pour ses correspondances militaires.",
  "note": "Malgré sa simplicité, le chiffre de César a été utilisé pendant des siècles. C’est un cas d’école pour comprendre les bases de la cryptographie et les limites des chiffrements par substitution.",
  "cat": "Cryptographie",
  "i": [
   "histoire",
   "sciences"
  ],
  "n": [
   "secu"
  ],
  "q": "Comment garde-t-on un secret depuis l’Antiquité ?"
 },
 {
  "num": 7,
  "titre": "Cryptanalyse par Al-Kindi",
  "date": "850",
  "texte": "Le philosophe Al-Kindi a introduit l’analyse des fréquences pour casser les chiffrements.",
  "note": "L’analyse des fréquences est une technique simple et efficace pour casser les chiffrements par substitution. Elle marque la naissance de la cryptanalyse en tant que science, qui s’appuie sur les statistiques et les mathématiques.",
  "cat": "Cryptographie",
  "i": [
   "histoire",
   "sciences"
  ],
  "n": [
   "secu",
   "donnees"
  ],
  "q": "Peut-on casser un code secret en comptant les lettres ?"
 },
 {
  "num": 10,
  "titre": "Métier à tisser Jacquard",
  "date": "1801",
  "texte": "Une innovation majeure qui utilise des cartes perforées pour automatiser le tissage de motifs complexes.",
  "note": "Jacquard perfectionne des idées plus anciennes : le ruban perforé de Basile Bouchon (1725) et les cartes perforées de Jean-Baptiste Falcon (1728). Son métier est le premier système mécanique programmable par cartes perforées. Il inspirera Charles Babbage.",
  "cat": "Hardware",
  "i": [
   "art",
   "histoire"
  ],
  "n": [
   "materiel",
   "prog"
  ],
  "q": "Comment un métier à tisser a-t-il inspiré l’ordinateur ?"
 },
 {
  "num": 13,
  "titre": "Algorithme d’Ada Lovelace",
  "date": "1843",
  "texte": "Le premier programme informatique publié, conçu pour la machine analytique de Babbage, mais jamais exécuté.",
  "note": "Ada Lovelace est considérée comme la première programmeuse de l’histoire. Elle a compris que la machine de Babbage ne se limitait pas à la seule arithmétique mais pouvait manipuler des symboles. Son travail a posé les bases de la programmation.",
  "cat": "Algorithmique",
  "i": [
   "histoire",
   "societe"
  ],
  "n": [
   "hist",
   "prog"
  ],
  "q": "Ada Lovelace, première programmeuse de l’histoire ?"
 },
 {
  "num": 14,
  "titre": "Machine de Turing",
  "date": "1936",
  "texte": "Un modèle théorique de machine qui définit les limites de ce qui peut être calculé par un algorithme.",
  "note": "Le modèle de la machine de Turing est le fondement de la théorie de la calculabilité. Il a montré que certains problèmes ne peuvent pas être résolus par un ordinateur. La notion d’universalité est au cœur de ce modèle.",
  "cat": "Algorithmique",
  "i": [
   "sciences"
  ],
  "n": [
   "prog",
   "hist"
  ],
  "q": "Existe-t-il des problèmes qu’aucun ordinateur ne peut résoudre ?"
 },
 {
  "num": 15,
  "titre": "Le logiciel du programme Apollo",
  "date": "1969",
  "texte": "Margaret Hamilton dirige l’équipe qui écrit le logiciel de vol des missions Apollo, essentiel pour l’alunissage.",
  "note": "On lui doit l’expression « génie logiciel » (software engineering). En 2016, elle reçoit la médaille présidentielle de la Liberté, la plus haute distinction civile des États-Unis.",
  "cat": "Algorithmique",
  "i": [
   "sciences",
   "histoire",
   "transports"
  ],
  "n": [
   "prog"
  ],
  "q": "Comment un logiciel a-t-il permis de marcher sur la Lune ?"
 },
 {
  "num": 16,
  "titre": "Base de données relationnelle",
  "date": "1970",
  "texte": "Un modèle de stockage de données qui a révolutionné la gestion de l’information.",
  "note": "Ce modèle a été le fondement des bases de données modernes. Il a permis de séparer la structure logique des données de leur implémentation physique, ce qui a conduit au développement du langage SQL (Structured Query Language).",
  "cat": "Algorithmique",
  "i": [
   "argent",
   "societe"
  ],
  "n": [
   "donnees"
  ],
  "q": "Pourquoi range-t-on tant de données dans des tables ?"
 },
 {
  "num": 18,
  "titre": "COBOL et Grace Hopper",
  "date": "1959",
  "texte": "Langage de programmation orienté vers la gestion, dont la conception a été fortement influencée par Grace Hopper.",
  "note": "Grace Hopper, surnommée « Grand-Mère COBOL », a été une figure majeure de sa conception et de sa standardisation. Elle croyait que les langages de programmation devaient être compréhensibles par tout le monde, pas seulement par les scientifiques.",
  "cat": "Langage de programmation",
  "i": [
   "histoire",
   "argent"
  ],
  "n": [
   "prog",
   "hist"
  ],
  "q": "Pourquoi un langage de 1959 fait-il encore tourner des banques ?"
 },
 {
  "num": 22,
  "titre": "Python",
  "date": "1991",
  "texte": "Un langage de programmation polyvalent, connu pour sa syntaxe simple et sa lisibilité, très utilisé en science des données.",
  "note": "Son nom ne vient pas du serpent : Guido van Rossum était fan de la série comique britannique Monty Python’s Flying Circus.",
  "cat": "Langage de programmation",
  "i": [
   "sciences"
  ],
  "n": [
   "prog",
   "hist"
  ],
  "q": "Pourquoi Python a-t-il été inventé ?"
 },
 {
  "num": 23,
  "titre": "Invention du RSA",
  "date": "1977",
  "texte": "Un des premiers algorithmes de chiffrement asymétrique, à la base de la sécurité des communications modernes.",
  "note": "RSA permet à deux personnes qui ne se sont jamais rencontrées de communiquer en sécurité. La cryptographie asymétrique est à la base de la sécurité d’Internet, des paiements en ligne aux connexions chiffrées.",
  "cat": "Cryptographie",
  "i": [
   "argent",
   "sciences"
  ],
  "n": [
   "secu"
  ],
  "q": "Comment des nombres premiers protègent-ils nos achats en ligne ?"
 },
 {
  "num": 24,
  "titre": "Invention de Bitcoin",
  "date": "2008",
  "texte": "La première application d’une monnaie numérique décentralisée, posant les bases de la technologie blockchain.",
  "note": "Bitcoin utilise une technologie nommée la blockchain, un registre distribué qui garantit la sécurité et l’intégrité des transactions. La création de Bitcoin a ouvert la voie à de nombreuses autres cryptomonnaies.",
  "cat": "Cryptographie",
  "i": [
   "argent"
  ],
  "n": [
   "secu",
   "donnees"
  ],
  "q": "La blockchain : comment faire confiance sans banque ?"
 },
 {
  "num": 39,
  "titre": "Loi de Moore",
  "date": "1965",
  "texte": "Une observation selon laquelle le nombre de transistors d’une puce double à intervalles réguliers.",
  "note": "En 1965, le circuit le plus complexe comptait 64 transistors. En 1971, l’Intel 4004 en compte 2 300. La loi de Moore a guidé l’industrie des semi-conducteurs pendant des décennies.",
  "cat": "Hardware",
  "i": [
   "sciences"
  ],
  "n": [
   "materiel"
  ],
  "q": "La course à l’infiniment petit : jusqu’où ?"
 },
 {
  "num": 40,
  "titre": "Console Atari 2600",
  "date": "1977",
  "texte": "Une console de jeu vidéo qui a popularisé les cartouches de jeu et marqué l’essor de l’industrie du jeu vidéo.",
  "note": "Selon les estimations, entre 25 et 40 millions de consoles Atari 2600 ont été vendues.",
  "cat": "Hardware",
  "i": [
   "jeux"
  ],
  "n": [
   "materiel",
   "hist"
  ],
  "q": "Comment les jeux vidéo ont-ils fait progresser l’informatique ?"
 },
 {
  "num": 43,
  "titre": "Le premier iPhone",
  "date": "2007",
  "texte": "Le téléphone qui a révolutionné l’industrie mobile avec son interface tactile et son écosystème d’applications.",
  "note": "Steve Jobs le présente comme trois appareils en un : un iPod à écran large, un téléphone mobile et un « communicateur Internet ».",
  "cat": "Hardware",
  "i": [
   "reseaux",
   "societe"
  ],
  "n": [
   "materiel"
  ],
  "q": "Le smartphone a-t-il changé notre façon de vivre ?"
 },
 {
  "num": 44,
  "titre": "La théorie de l’information",
  "date": "1948",
  "texte": "Le document fondateur de l’informatique, introduisant les concepts d’information, d’entropie et de bit.",
  "note": "La publication de cet article est souvent considérée comme l’acte de naissance de l’ère de l’information. Shannon y a formalisé la notion d’information en la détachant de la sémantique pour la traiter comme une entité purement statistique et probabiliste.",
  "cat": "Théorie de l’information",
  "i": [
   "musique",
   "sciences"
  ],
  "n": [
   "donnees"
  ],
  "q": "Comment fait-on tenir une chanson ou une image dans un petit fichier ?"
 },
 {
  "num": 48,
  "titre": "World Wide Web",
  "date": "1989",
  "texte": "Le concept d’un réseau mondial de documents liés entre eux, qui a ouvert Internet au grand public.",
  "note": "Le 30 avril 1993, le CERN renonce à ses droits d’auteur sur les logiciels du Web : tout le monde peut les utiliser librement.",
  "cat": "Internet",
  "i": [
   "reseaux",
   "societe"
  ],
  "n": [
   "web"
  ],
  "q": "Le Web doit-il rester gratuit et ouvert à tout le monde ?"
 },
 {
  "num": 50,
  "titre": "L’Internet des objets (IoT)",
  "date": "1999",
  "texte": "L’idée que tous les objets du quotidien peuvent être connectés à Internet pour collecter des données.",
  "note": "Kevin Ashton invente l’expression en 1999, quand il travaille chez Procter & Gamble. Il aurait préféré dire « Internet pour les objets ».",
  "cat": "Internet",
  "i": [
   "climat",
   "sante",
   "transports"
  ],
  "n": [
   "materiel",
   "web"
  ],
  "q": "Objets connectés : pratiques ou indiscrets ?"
 },
 {
  "num": 54,
  "titre": "Projet GNU et FSF",
  "date": "1983",
  "texte": "Le lancement d’un projet pour créer un système d’exploitation entièrement libre, compatible avec UNIX.",
  "note": "GNU signifie « GNU’s Not UNIX » : le système est compatible avec UNIX, mais réécrit entièrement en logiciel libre. Avec le noyau Linux, il forme un système d’exploitation complet.",
  "cat": "Logiciel libre",
  "i": [
   "societe",
   "argent"
  ],
  "n": [
   "prog",
   "hist"
  ],
  "q": "Le logiciel libre : pourquoi donner son code ?"
 },
 {
  "num": 58,
  "titre": "Deep Blue bat Kasparov",
  "date": "1997",
  "texte": "Le premier ordinateur à battre un champion du monde d’échecs en titre dans un match.",
  "note": "Deep Blue pouvait évaluer 200 millions de positions par seconde. Sa victoire montre la puissance du calcul « par force brute ».",
  "cat": "Intelligence Artificielle",
  "i": [
   "jeux",
   "sport"
  ],
  "n": [
   "ia"
  ],
  "q": "Une machine peut-elle nous battre à tous les jeux ?"
 },
 {
  "num": 60,
  "titre": "ChatGPT",
  "date": "2022",
  "texte": "Un modèle de langage conversationnel qui a démocratisé l’intelligence artificielle générative pour le grand public.",
  "note": "La démocratisation de l’IA générative a ouvert de nouvelles perspectives dans de nombreux domaines. Le succès de ChatGPT a accéléré l’adoption de l’intelligence artificielle par le grand public et a mis en lumière son potentiel et ses défis éthiques.",
  "cat": "Intelligence Artificielle",
  "i": [
   "societe",
   "reseaux"
  ],
  "n": [
   "ia"
  ],
  "q": "Une IA qui écrit comprend-elle ce qu’elle dit ?"
 },
 {
  "num": 62,
  "titre": "WannaCry",
  "date": "2017",
  "texte": "Une cyberattaque mondiale par rançongiciel, qui chiffre les données de ses victimes.",
  "note": "Il a touché plus de 300 000 ordinateurs dans plus de 150 pays, dont des hôpitaux et des entreprises. La faille exploitée, EternalBlue, avait été découverte par la NSA, puis divulguée par des pirates.",
  "cat": "Cybersécurité",
  "i": [
   "sante",
   "argent"
  ],
  "n": [
   "secu"
  ],
  "q": "Comment un rançongiciel peut-il paralyser des hôpitaux ?"
 },
 {
  "num": 63,
  "titre": "RGPD",
  "date": "2018",
  "texte": "Une réglementation européenne qui protège les données personnelles.",
  "note": "Le RGPD a eu un impact majeur sur le Web : les entreprises ont dû revoir leurs politiques de confidentialité. Il a aussi sensibilisé le public à la protection des données.",
  "cat": "Cybersécurité",
  "i": [
   "societe",
   "reseaux"
  ],
  "n": [
   "donnees"
  ],
  "q": "À qui appartiennent nos données personnelles ?"
 },
 {
  "num": 64,
  "titre": "Google",
  "date": "1998",
  "texte": "Un moteur de recherche qui a révolutionné la façon de trouver de l’information sur Internet.",
  "note": "Le PageRank, inventé par Larry Page, classe une page d’autant plus haut que des pages importantes pointent vers elle.",
  "cat": "Internet",
  "i": [
   "reseaux"
  ],
  "n": [
   "donnees",
   "web"
  ],
  "q": "Comment un moteur de recherche choisit-il ses résultats ?"
 },
 {
  "num": 65,
  "titre": "Wikipédia",
  "date": "2001",
  "texte": "Une encyclopédie collaborative en ligne, qui a démocratisé l’accès au savoir et à l’information.",
  "note": "Wikipédia est un exemple emblématique du Web 2.0 et du modèle collaboratif. Son succès a prouvé que des projets collectifs de grande envergure étaient possibles en ligne, et que le savoir peut être partagé librement.",
  "cat": "Internet",
  "i": [
   "societe",
   "histoire"
  ],
  "n": [
   "web"
  ],
  "q": "Peut-on faire confiance à une encyclopédie que tout le monde peut modifier ?"
 },
 {
  "num": 67,
  "titre": "YouTube",
  "date": "2005",
  "texte": "Une plateforme de partage de vidéos qui a transformé la consommation de contenu en ligne.",
  "note": "La première vidéo, « Me at the zoo », montre Jawed Karim, l’un des cofondateurs, devant les éléphants du zoo de San Diego. Elle dure moins de 20 secondes.",
  "cat": "Internet",
  "i": [
   "cinema",
   "reseaux"
  ],
  "n": [
   "donnees",
   "ia"
  ],
  "q": "Les algorithmes de recommandation décident-ils de ce qu’on regarde ?"
 },
 {
  "num": 68,
  "titre": "Hedy Lamarr et le saut de fréquence",
  "date": "1942",
  "texte": "Une actrice et un compositeur brevètent une technique radio difficile à brouiller : le saut de fréquence.",
  "note": "Ils s’inspirent des pianos mécaniques : une bande perforée fait sauter le signal entre 88 fréquences, comme les 88 touches d’un piano. Le Bluetooth utilise aujourd’hui le saut de fréquence.",
  "cat": "Réseau",
  "i": [
   "cinema",
   "histoire"
  ],
  "n": [
   "web"
  ],
  "q": "Comment une actrice de cinéma a-t-elle contribué aux communications sans fil ?"
 },
 {
  "num": 71,
  "titre": "Katherine Johnson et le vol de John Glenn",
  "date": "1962",
  "texte": "Une mathématicienne de la NASA vérifie à la main les calculs d’orbite faits par un ordinateur.",
  "note": "John Glenn, qui se méfie des ordinateurs, refuse de partir tant qu’elle n’a pas vérifié les calculs. En 2015, elle reçoit la médaille présidentielle de la Liberté.",
  "cat": "Algorithmique",
  "i": [
   "histoire",
   "sciences",
   "societe"
  ],
  "n": [
   "prog",
   "hist"
  ],
  "q": "Quelle place pour les femmes dans l’histoire du calcul et de l’informatique ?"
 },
 {
  "num": 75,
  "titre": "Gender Shades et les biais de l’IA",
  "date": "2018",
  "texte": "Une étude montre que des logiciels d’analyse faciale se trompent beaucoup plus sur les femmes à la peau foncée.",
  "note": "Le taux d’erreur atteint 34,7 % pour les femmes à la peau foncée, contre 0,8 % au plus pour les hommes à la peau claire.",
  "cat": "Intelligence Artificielle",
  "i": [
   "societe"
  ],
  "n": [
   "ia",
   "donnees"
  ],
  "q": "Comment lutter contre les biais algorithmiques ?"
 },
 {
  "num": 76,
  "titre": "L’affaire Cambridge Analytica",
  "date": "2018",
  "texte": "Les données de dizaines de millions de comptes Facebook sont récupérées pour envoyer des messages politiques ciblés.",
  "note": "Selon Facebook, jusqu’à 87 millions de comptes sont concernés. En 2019, une autorité américaine, la FTC, lui inflige une amende de 5 milliards de dollars. Et vous, que partagez-vous en faisant un test en ligne ?",
  "cat": "Internet",
  "i": [
   "societe",
   "reseaux"
  ],
  "n": [
   "donnees"
  ],
  "q": "Les réseaux sociaux peuvent-ils influencer une élection ?"
 },
 {
  "num": 77,
  "titre": "Les révélations de Snowden",
  "date": "2013",
  "texte": "Un informaticien révèle une surveillance de masse des communications sur Internet et par téléphone.",
  "note": "Les métadonnées décrivent une communication sans son contenu : qui appelle qui, quand, combien de temps. La NSA collectait celles de millions d’abonnés d’un opérateur. En 2015, une loi américaine (USA Freedom Act) met fin à cette collecte de masse.",
  "cat": "Cybersécurité",
  "i": [
   "societe"
  ],
  "n": [
   "secu",
   "web"
  ],
  "q": "Surveillance de masse : sécurité ou liberté ?"
 },
 {
  "num": 78,
  "titre": "Les mariages stables",
  "date": "1962",
  "texte": "Un algorithme forme des paires « stables », par exemple entre des élèves et des formations.",
  "note": "En France, APB (2009-2017) utilisait une variante de cet algorithme : les vœux étaient classés. Parcoursup, depuis 2018, fonctionne autrement : les vœux ne sont plus classés, ce sont les candidates et candidats qui acceptent ou refusent les propositions au fil des jours.",
  "cat": "Algorithmique",
  "i": [
   "societe",
   "sciences"
  ],
  "n": [
   "prog"
  ],
  "q": "Un algorithme peut-il répartir des personnes de façon juste ?"
 },
 {
  "num": 79,
  "titre": "Stuxnet",
  "date": "2010",
  "texte": "Un ver informatique conçu pour saboter des machines industrielles, souvent présenté comme la première cyberarme.",
  "note": "Selon des enquêtes de presse (New York Times, 2012), il aurait été conçu par les États-Unis et Israël, qui ne l’ont pas reconnu officiellement. Comment savoir qui a lancé une cyberattaque ?",
  "cat": "Cybersécurité",
  "i": [
   "societe",
   "histoire"
  ],
  "n": [
   "secu"
  ],
  "q": "Cyberguerre : la troisième guerre mondiale ?"
 },
 {
  "num": 80,
  "titre": "Le test de Turing",
  "date": "1950",
  "texte": "Alan Turing propose un jeu pour savoir si une machine peut se faire passer pour un être humain.",
  "note": "Turing prédit que vers l’an 2000, après cinq minutes de questions, une personne ordinaire n’aura pas plus de 70 % de chances de reconnaître la machine.",
  "cat": "Intelligence Artificielle",
  "i": [
   "sciences",
   "cinema"
  ],
  "n": [
   "ia"
  ],
  "q": "Comment savoir si une machine pense ?"
 },
 {
  "num": 85,
  "titre": "L’algorithme de Dijkstra",
  "date": "1959",
  "texte": "Un algorithme qui trouve le plus court chemin dans un graphe, utilisé aujourd’hui par des routeurs d’Internet.",
  "note": "Dijkstra l’a imaginé en 1956, en une vingtaine de minutes, à la terrasse d’un café d’Amsterdam. Il n’avait ni papier ni crayon : cela l’a obligé à chercher une solution simple.",
  "cat": "Algorithmique",
  "i": [
   "transports",
   "jeux"
  ],
  "n": [
   "prog"
  ],
  "q": "Comment un GPS trouve-t-il le chemin le plus court ?"
 },
 {
  "num": 86,
  "titre": "Le vol 501 d’Ariane 5",
  "date": "1996",
  "texte": "Une fusée est détruite moins de 40 secondes après son décollage, à cause d’un nombre trop grand pour sa variable.",
  "note": "Un entier signé sur 16 bits va de −32 768 à 32 767. Ce calcul ne servait plus après le décollage, et le logiciel n’avait pas été testé avec la trajectoire d’Ariane 5.",
  "cat": "Systèmes et logiciels",
  "i": [
   "transports",
   "sciences",
   "argent"
  ],
  "n": [
   "prog"
  ],
  "q": "Comment une erreur de calcul peut-elle détruire une fusée ?"
 }
];
  racine.HGDecouvertes = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
