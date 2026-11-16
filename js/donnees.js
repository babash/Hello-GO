// Hello GO : les contenus (questionnaire, banque de sujets, à savoir du jour, grille, dossier exemple).
// Textes en CC BY-SA 4.0, Babash - NSI Tani Malandi. Les sujets viennent du dossier « Grand oral » de l'enseignant
// (exemples du ministère de l'Éducation nationale, par thème du programme de NSI, et autres sujets possibles).
(function (racine) {
  'use strict';

  const ETIQUETTES = [
    ['', 'Type de point'], ['accroche', 'Accroche'], ['problematique', 'Problématique'], ['motivation', 'Motivation'],
    ['annonce', 'Annonce du plan'], ['argument', 'Argument'], ['exemple', 'Exemple'], ['chiffre', 'Chiffre'],
    ['transition', 'Transition'], ['synthese', 'Synthèse'], ['ouverture', 'Ouverture'], ['relance', 'Question de relance'],
  ];

  const TYPES_SOURCE = [
    ['', 'Type de source'], ['experte', 'Source experte (rapport, livre, publication)'], ['officielle', 'Site officiel ou institution'],
    ['presse', 'Article de presse'], ['vulgarisee', 'Vulgarisation (vidéo, podcast, blog reconnu)'], ['encyclopedie', 'Encyclopédie (Wikipédia…)'], ['autre', 'Autre'],
  ];

  const QUIZ = [
    { id: 'i', titre: 'Ce qui te plaît en dehors des cours', aide: 'Plusieurs choix possibles.', multi: true, choix: [
      ['jeux', 'Jeux vidéo'], ['musique', 'Musique'], ['sport', 'Sport'], ['cinema', 'Cinéma, séries, animation'], ['reseaux', 'Réseaux sociaux'],
      ['art', 'Dessin et art'], ['sante', 'Santé'], ['climat', 'Environnement et climat'], ['societe', 'Société et politique'],
      ['argent', 'Argent et économie'], ['histoire', 'Histoire'], ['sciences', 'Sciences et maths'], ['transports', 'Transports et ville'] ] },
    { id: 's', titre: 'Ta deuxième spécialité', aide: 'Pour une question transversale.', multi: false, choix: [
      ['maths', 'Mathématiques'], ['pc', 'Physique-chimie'], ['svt', 'SVT'], ['ses', 'SES'], ['hggsp', 'HGGSP'], ['hlp', 'HLP'], ['llce', 'Langues (LLCER)'], ['arts', 'Arts'], ['autre', 'Une autre'] ] },
    { id: 'n', titre: 'Ce qui t’attire en NSI', aide: 'Plusieurs choix possibles.', multi: true, choix: [
      ['prog', 'Programmer'], ['donnees', 'Les données'], ['web', 'Internet et les réseaux'], ['secu', 'La sécurité et les codes secrets'],
      ['ia', 'L’intelligence artificielle'], ['hist', 'L’histoire de l’informatique'], ['materiel', 'Les machines et le matériel'] ] },
    { id: 'a', titre: 'L’angle qui te parle', aide: 'Un seul choix.', multi: false, choix: [
      ['recit', 'Raconter une histoire (une personne, une invention)'], ['comment', 'Expliquer comment ça marche'],
      ['debat', 'Débattre d’un problème de société'], ['avenir', 'Imaginer l’avenir'] ] },
  ];

  // t : titre ; th : thème du programme ; i : intérêts ; n : goûts en NSI ; a : angles ; s : spécialités pour une question transversale
  const SUJETS = [
    { t: 'Femmes et numérique : quelle histoire ? quel avenir ?', th: 'Histoire de l’informatique', i: ['histoire', 'societe'], n: ['hist'], a: ['recit', 'debat'], s: ['hggsp', 'ses', 'hlp'] },
    { t: 'Ada Lovelace, pionnière du langage informatique', th: 'Histoire de l’informatique', i: ['histoire', 'sciences'], n: ['hist', 'prog'], a: ['recit'], s: ['maths', 'hlp'] },
    { t: 'Alan Turing, et l’informatique fut', th: 'Histoire de l’informatique', i: ['histoire', 'sciences'], n: ['hist', 'secu'], a: ['recit'], s: ['maths', 'hggsp'] },
    { t: 'Quelle est la différence entre le web 1.0 et le web 2.0 ?', th: 'Histoire de l’informatique', i: ['reseaux', 'histoire'], n: ['web', 'hist'], a: ['comment'], s: ['ses'] },
    { t: 'P = NP, un problème à un million de dollars ?', th: 'Langages et programmation', i: ['sciences', 'argent'], n: ['prog'], a: ['comment'], s: ['maths'] },
    { t: 'Tours de Hanoï : plus qu’un jeu d’enfants ?', th: 'Langages et programmation', i: ['jeux', 'sciences'], n: ['prog'], a: ['comment'], s: ['maths'] },
    { t: 'Les fractales : informatique et mathématiques imitent-elles la nature ?', th: 'Langages et programmation', i: ['art', 'sciences'], n: ['prog'], a: ['comment'], s: ['maths', 'svt', 'arts'] },
    { t: 'De la récurrence à la récursivité', th: 'Langages et programmation', i: ['sciences'], n: ['prog'], a: ['comment'], s: ['maths'] },
    { t: 'Les bugs : bête noire des développeurs et des développeuses ?', th: 'Langages et programmation', i: ['histoire', 'transports'], n: ['prog', 'hist'], a: ['recit', 'comment'], s: ['pc'] },
    { t: 'Comment rendre l’informatique plus sûre ?', th: 'Langages et programmation', i: ['societe'], n: ['secu', 'prog'], a: ['debat', 'comment'], s: ['maths'] },
    { t: 'L’informatisation des métros : progrès ou outil de surveillance ?', th: 'Données structurées', i: ['transports', 'societe'], n: ['donnees'], a: ['debat'], s: ['ses', 'hggsp'] },
    { t: 'Musique et informatique : une alliance possible de l’art et de la science ?', th: 'Données structurées', i: ['musique', 'art'], n: ['donnees', 'prog'], a: ['comment'], s: ['maths', 'pc', 'arts'] },
    { t: 'Comment créer une machine intelligente ?', th: 'Algorithmique', i: ['sciences', 'jeux'], n: ['ia'], a: ['comment', 'avenir'], s: ['maths'] },
    { t: 'Comment lutter contre les biais algorithmiques ?', th: 'Algorithmique', i: ['societe'], n: ['ia', 'donnees'], a: ['debat'], s: ['ses', 'maths', 'hlp'] },
    { t: 'Quels sont les enjeux de la reconnaissance faciale ?', th: 'Algorithmique', i: ['societe', 'reseaux'], n: ['ia'], a: ['debat'], s: ['ses', 'hggsp', 'hlp'] },
    { t: 'Deepfakes : la fin de la preuve par l’image ?', th: 'Algorithmique', i: ['cinema', 'reseaux', 'societe'], n: ['ia'], a: ['debat', 'avenir'], s: ['hggsp', 'hlp', 'arts'] },
    { t: 'Qu’apporte la récursivité dans un algorithme ?', th: 'Algorithmique', i: ['sciences'], n: ['prog'], a: ['comment'], s: ['maths'] },
    { t: 'Quel est l’impact de la complexité d’un algorithme sur son efficacité ?', th: 'Algorithmique', i: ['sciences'], n: ['prog'], a: ['comment'], s: ['maths'] },
    { t: 'Données personnelles : la vie privée en voie d’extinction ?', th: 'Bases de données', i: ['reseaux', 'societe'], n: ['donnees', 'secu'], a: ['debat'], s: ['ses', 'hggsp', 'hlp'] },
    { t: 'Nos informations personnelles sont-elles en sécurité dans les bases de données ?', th: 'Bases de données', i: ['societe', 'argent'], n: ['donnees', 'secu'], a: ['debat', 'comment'], s: ['ses'] },
    { t: 'L’ordinateur quantique : nouvelle révolution informatique ?', th: 'Architectures, systèmes et réseaux', i: ['sciences'], n: ['materiel'], a: ['avenir', 'comment'], s: ['pc', 'maths'] },
    { t: 'La course à l’infiniment petit : jusqu’où ?', th: 'Architectures, systèmes et réseaux', i: ['sciences'], n: ['materiel', 'hist'], a: ['avenir', 'recit'], s: ['pc'] },
    { t: 'Peut-on vraiment sécuriser les communications ?', th: 'Architectures, systèmes et réseaux', i: ['societe', 'reseaux'], n: ['secu', 'web'], a: ['comment', 'debat'], s: ['maths'] },
    { t: 'Quelle est l’utilité des protocoles pour l’internet ?', th: 'Architectures, systèmes et réseaux', i: ['reseaux'], n: ['web'], a: ['comment'], s: ['pc'] },
    { t: 'Cyberguerre : la troisième guerre mondiale ?', th: 'Architectures, systèmes et réseaux', i: ['societe', 'histoire'], n: ['secu', 'web'], a: ['debat', 'avenir'], s: ['hggsp'] },
    { t: 'Comment fonctionne Tor ?', th: 'Architectures, systèmes et réseaux', i: ['reseaux', 'societe'], n: ['web', 'secu'], a: ['comment'], s: ['maths'] },
    { t: 'Smart cities, smart control ?', th: 'Interfaces et objets', i: ['transports', 'societe', 'climat'], n: ['donnees', 'materiel'], a: ['debat', 'avenir'], s: ['ses', 'hggsp'] },
    { t: 'La réalité virtuelle : un nouveau monde ?', th: 'Interfaces et objets', i: ['jeux', 'cinema'], n: ['materiel'], a: ['avenir'], s: ['pc', 'arts'] },
    { t: 'La voiture autonome, quels enjeux ?', th: 'Interfaces et objets', i: ['transports', 'societe'], n: ['ia', 'materiel'], a: ['debat', 'avenir'], s: ['pc', 'ses', 'hlp'] },
    { t: 'Comment protéger ses données sur les réseaux sociaux ?', th: 'Impact sociétal et éthique', i: ['reseaux'], n: ['donnees', 'secu'], a: ['comment', 'debat'], s: ['ses'] },
    { t: 'Quelle est l’empreinte carbone du numérique ?', th: 'Impact sociétal et éthique', i: ['climat'], n: ['materiel', 'web'], a: ['debat'], s: ['svt', 'pc', 'ses'] },
    { t: 'Pourquoi chiffrer ses communications ?', th: 'Impact sociétal et éthique', i: ['reseaux', 'societe'], n: ['secu'], a: ['comment', 'debat'], s: ['maths'] },
    { t: 'Les réseaux sociaux sont-ils compatibles avec la politique ?', th: 'Impact sociétal et éthique', i: ['reseaux', 'societe'], n: ['donnees'], a: ['debat'], s: ['ses', 'hggsp'] },
    { t: 'Les réseaux sociaux permettent-ils de lutter contre les infox ?', th: 'Impact sociétal et éthique', i: ['reseaux', 'societe'], n: ['donnees', 'ia'], a: ['debat'], s: ['hggsp', 'ses'] },
    { t: 'L’informatique va-t-elle révolutionner le dessin animé ?', th: 'Impact sociétal et éthique', i: ['cinema', 'art'], n: ['prog', 'ia'], a: ['avenir', 'recit'], s: ['arts', 'maths'] },
    { t: 'L’informatique va-t-elle révolutionner la composition musicale ?', th: 'Impact sociétal et éthique', i: ['musique'], n: ['ia', 'prog'], a: ['avenir'], s: ['arts', 'maths'] },
    { t: 'L’art algorithmique est-il vraiment un art ?', th: 'Impact sociétal et éthique', i: ['art'], n: ['prog', 'ia'], a: ['debat'], s: ['arts', 'hlp'] },
    { t: 'L’informatique va-t-elle révolutionner la médecine ?', th: 'Impact sociétal et éthique', i: ['sante'], n: ['ia', 'donnees'], a: ['avenir', 'debat'], s: ['svt'] },
    { t: 'Le numérique : facteur de démocratisation ou de fractures sociales ?', th: 'Impact sociétal et éthique', i: ['societe', 'argent'], n: ['web'], a: ['debat'], s: ['ses', 'hggsp'] },
    { t: 'Pourquoi Python a-t-il été inventé ?', th: 'Langages et programmation', i: ['histoire'], n: ['prog', 'hist'], a: ['recit'], s: [] },
    { t: 'Comment l’informatique s’inspire-t-elle du vivant ?', th: 'Algorithmique', i: ['sciences', 'sante'], n: ['ia', 'prog'], a: ['comment'], s: ['svt'] },
    { t: 'En quoi la cryptologie a-t-elle raccourci la Seconde Guerre mondiale ?', th: 'Histoire de l’informatique', i: ['histoire'], n: ['secu', 'hist'], a: ['recit'], s: ['hggsp', 'maths'] },
    { t: 'Comment un automate cellulaire imite-t-il le vivant avec des règles simples ?', th: 'Algorithmique', i: ['sciences', 'jeux'], n: ['prog'], a: ['comment'], s: ['svt', 'maths'] },
    { t: 'Comment l’intelligence artificielle fait-elle vivre les personnages non-joueurs d’un jeu vidéo ?', th: 'Algorithmique', i: ['jeux'], n: ['ia', 'prog'], a: ['comment'], s: ['maths'] },
    { t: 'Les données peuvent-elles faire gagner un match ?', th: 'Données structurées', i: ['sport'], n: ['donnees', 'ia'], a: ['comment', 'debat'], s: ['maths', 'ses'] },
    { t: 'La blockchain : comment faire confiance sans banque ?', th: 'Bases de données', i: ['argent'], n: ['secu', 'donnees'], a: ['comment', 'debat'], s: ['ses', 'maths'] },
  ];

  const DEBUTS_QUESTION = ['En quoi… ?', 'Dans quelle mesure… ?', 'Comment… ?', 'Faut-il… ?', 'Peut-on… ?', '… : progrès ou danger ?'];

  // p : phase (0 choisir, 1 construire, 2 préparer l'échange et l'oral)
  const A_SAVOIR = [
    { p: 0, t: 'Le jour J, tu présentes deux questions. Le jury en choisit une : prépare les deux aussi bien.' },
    { p: 0, t: 'Tes deux questions ne peuvent pas porter sur la même spécialité. Une question peut être transversale.' },
    { p: 0, t: 'Un bon sujet, c’est d’abord un sujet qui te passionne : tu en parleras mieux.' },
    { p: 0, t: 'Une bonne question ouvre le débat. Si la réponse est dans la question, reformule.' },
    { p: 0, t: 'La question elle-même n’est pas notée. Ce qui compte : ton argumentation et ta façon de parler.' },
    { p: 0, t: 'Question trop large ? Pars du général, puis précise étape par étape.' },
    { p: 0, t: 'Ne choisis pas trop vite : garde deux ou trois pistes avant de te décider.' },
    { p: 0, t: 'Le Grand oral compte coefficient 8 au bac général à partir de la session 2027.' },
    { p: 0, t: 'Ta question doit venir de ta réflexion personnelle : c’est toi qui devras la défendre.' },
    { p: 0, t: 'Dans une question transversale, les deux spécialités se répondent. Les poser côte à côte ne suffit pas.' },
    { p: 1, t: 'L’exposé dure 10 minutes : environ 2 min d’introduction, 3 min par axe, 2 min de conclusion.' },
    { p: 1, t: 'Vise 30 à 50 points dans ton plan : chaque point te fait dire 3 à 5 phrases.' },
    { p: 1, t: 'Un point tient en 1 à 3 lignes : des mots-clés, pas un texte à lire.' },
    { p: 1, t: 'Quand tu donnes un chiffre, une définition ou une citation, dis d’où ça vient.' },
    { p: 1, t: 'Un des deux membres du jury n’est pas spécialiste : prépare une image simple pour chaque mot technique.' },
    { p: 1, t: 'Commence par une accroche : un fait concret, un chiffre, une question. Pas « Bonjour, je m’appelle… ».' },
    { p: 1, t: 'Apprends ta problématique par cœur : c’est ton sujet, tu ne peux pas la lire sur ta feuille.' },
    { p: 1, t: 'Varie tes arguments : un fait, une loi, un résultat scientifique, une expérience personnelle.' },
    { p: 1, t: 'Annonce ta conclusion : « Pour conclure… ». Le jury retient surtout le moment fort et la fin.' },
    { p: 1, t: 'Dans la conclusion, réponds à ta question. N’ajoute pas d’idée nouvelle.' },
    { p: 1, t: 'Termine par une question de relance : tu guides le jury vers ce que tu maîtrises.' },
    { p: 1, t: 'Deux sources valent mieux qu’une : une source experte et une source de vulgarisation.' },
    { p: 1, t: 'Wikipédia est un bon point de départ. Va ensuite lire les sources citées en bas de l’article.' },
    { p: 1, t: 'Écris tes transitions : elles montrent au jury que ton plan avance.' },
    { p: 1, t: 'Faire moins, mais mieux : un exemple précis vaut plus que trois généralités.' },
    { p: 1, t: 'Définis chaque mot important deux fois : avec une source, puis avec tes mots.' },
    { p: 1, t: 'Organise tes axes : avantages et limites, constat et solutions, hier et aujourd’hui…' },
    { p: 2, t: 'Tu as 20 minutes de préparation, avec du papier seulement. Entraîne-toi à refaire ton plan à la main.' },
    { p: 2, t: 'Aucun support numérique le jour J. Tu peux montrer ta feuille au jury, mais il ne la note pas.' },
    { p: 2, t: 'Tu présentes debout, sans lire tes notes. Regarde les deux membres du jury, chacun son tour.' },
    { p: 2, t: 'Vise 100 à 125 mots par minute. Trop vite, le jury perd le fil.' },
    { p: 2, t: 'L’échange dure 10 minutes, autant que l’exposé : prépare-le autant.' },
    { p: 2, t: 'Le jury peut t’interroger sur tout le programme de la spécialité : révise les chapitres liés à ton sujet.' },
    { p: 2, t: 'Écoute la question jusqu’au bout, puis prends quelques secondes avant de répondre.' },
    { p: 2, t: 'Tu ne sais pas ? Dis-le, puis propose un raisonnement : « Je n’ai pas la donnée exacte, mais… ».' },
    { p: 2, t: 'L’échange n’est pas un contrôle de connaissances : le jury veut voir comment tu argumentes.' },
    { p: 2, t: 'Prépare la question « Pourquoi as-tu choisi ce sujet ? » : elle ouvre souvent l’échange.' },
    { p: 2, t: 'Marque des pauses entre les parties. Un silence court aide le jury à suivre.' },
    { p: 2, t: 'Répète à voix haute, avec un chronomètre, et devant quelqu’un si tu peux.' },
    { p: 2, t: 'Garde la même énergie jusqu’à la dernière phrase : ne la laisse pas tomber.' },
    { p: 2, t: 'Ne récite pas un texte appris par cœur : parle à partir de tes points.' },
    { p: 2, t: 'Un exposé trop court fait perdre des points : entraîne-toi à tenir les 10 minutes.' },
  ];

  // Les 5 critères de la grille indicative nationale, en phrases courtes au « je »
  const GRILLE = [
    { id: 'oral', titre: 'Qualité orale', niveaux: [
      'On m’entend mal, et je n’arrive pas à capter l’attention.', 'Ma voix devient plus claire, mais reste monotone. Mon vocabulaire est limité.',
      'Je varie un peu ma voix, je parle avec assurance, mon vocabulaire est adapté.', 'Ma voix porte mon discours : débit, pauses, nuances. Mon vocabulaire est riche et précis.'] },
    { id: 'continu', titre: 'Prise de parole en continu', niveaux: [
      'Je fais des phrases très courtes, avec beaucoup d’arrêts, ou des phrases longues et confuses.', 'Mon discours est assez clair, mais mes phrases restent simples.',
      'Mon discours est articulé et pertinent, mes phrases sont bien construites.', 'Mon discours est fluide : j’utilise tout mon temps et je développe mes idées.'] },
    { id: 'connaissances', titre: 'Connaissances', niveaux: [
      'Mes connaissances sont imprécises, je ne peux pas répondre, même avec de l’aide.', 'J’ai des connaissances, mais j’ai du mal à les utiliser face aux questions.',
      'Mes connaissances sont précises, je les utilise pour répondre, parfois avec une relance.', 'Je maîtrise mes connaissances et je les expose clairement, au bon moment.'] },
    { id: 'interaction', titre: 'Interaction avec le jury', niveaux: [
      'Je réponds très peu : c’est le jury qui fait vivre l’échange.', 'L’échange démarre, mais reste limité.',
      'Je réponds, je réagis, je reformule en m’aidant des propositions du jury.', 'Je m’engage dans l’échange, je prends l’initiative et je rebondis.'] },
    { id: 'argumentation', titre: 'Construction de l’argumentation', niveaux: [
      'Je n’ai pas compris le sujet : mon discours n’est pas argumenté.', 'Je commence une démonstration, mais mon raisonnement a des trous.',
      'Ma démonstration est construite, avec des arguments précis.', 'Je maîtrise les enjeux du sujet et je mène une argumentation personnelle et raisonnée.'] },
  ];

  // Mots techniques courants : s'ils apparaissent dans le plan sans être dans le lexique, le coach le signale.
  const TERMES = ['algorithme', 'protocole', 'biais', 'latence', 'chiffrement', 'cryptographie', 'récursivité', 'complexité', 'réseau de neurones',
    'apprentissage automatique', 'machine learning', 'base de données', 'requête', 'serveur', 'routeur', 'adresse ip', 'paquet', 'pixel', 'binaire', 'bit', 'octet',
    'compilateur', 'interpréteur', 'variable', 'fonction', 'boucle', 'graphe', 'arbre', 'pile', 'file', 'processus', 'système d’exploitation', 'mémoire',
    'processeur', 'transistor', 'open source', 'logiciel libre', 'cloud', 'blockchain', 'hachage', 'clé publique', 'clé privée', 'données d’entraînement',
    'deepfake', 'cookie', 'métadonnées', 'rgpd', 'dns', 'http', 'tcp', 'sql', 'api', 'big data', 'modèle', 'automate', 'heuristique', 'dichotomie', 'tri', 'bug'];

  const EXEMPLE = {
    titre: 'Comment lutter contre les biais algorithmiques pour garantir l’équité des systèmes d’intelligence artificielle ?',
    parties: [
      { titre: 'Introduction', minutes: 2, points: [
        ['accroche', 'L’IA de recrutement d’Amazon abandonnée : elle pénalisait les CV de femmes.'],
        ['problematique', 'Comment lutter contre les biais algorithmiques pour garantir l’équité des IA ?'],
        ['exemple', 'Analogie : l’IA est une recette qui s’écrit toute seule à partir de ses ingrédients, les données.'],
        ['motivation', 'En NSI, j’ai compris que nos choix d’algorithmes ont un effet sur la société.'],
        ['annonce', 'D’abord les causes (données, modèle), puis les solutions (technique, loi).']] },
      { titre: 'Axe 1 · Les causes profondes des biais', minutes: 3, points: [
        ['argument', 'Biais d’échantillonnage : un groupe peu présent dans les données, et l’IA se trompe sur lui.'],
        ['exemple', 'Le husky reconnu grâce à la neige derrière lui : le modèle apprend le décor, pas l’animal.'],
        ['argument', 'Biais historique : les données sont le miroir des discriminations passées.'],
        ['argument', 'Biais de modélisation : on choisit ce que l’IA doit maximiser.'],
        ['exemple', 'Le robot Tay de Microsoft, devenu raciste en apprenant des utilisateurs extrêmes.'],
        ['transition', 'Les causes sont connues : que peut-on faire ?']] },
      { titre: 'Axe 2 · Les solutions : audits et réglementation', minutes: 3, points: [
        ['argument', 'Rééquilibrer les données avant l’apprentissage (sur-échantillonnage, sous-échantillonnage).'],
        ['exemple', 'Avec SQL : COUNT et GROUP BY pour voir la répartition des données.'],
        ['argument', 'Explicabilité : l’IA doit justifier ses décisions.'],
        ['exemple', 'Des autocollants sur un panneau Stop peuvent tromper une voiture autonome.'],
        ['argument', 'Le cadre légal : le RGPD demande de la transparence sur les décisions automatisées.']] },
      { titre: 'Conclusion', minutes: 2, points: [
        ['synthese', 'Lutter contre les biais : corriger les données et exiger des explications.'],
        ['motivation', 'Comme citoyen·ne, je peux exiger la transparence des algorithmes.'],
        ['ouverture', 'Une IA plus juste doit aussi être sûre : la cybersécurité.'],
        ['relance', 'Comment la cryptologie peut-elle protéger l’anonymat tout en gardant la trace des décisions ?']] },
    ],
    mots: [
      { mot: 'Biais', defSource: 'Erreur systématique et manque d’objectivité d’un algorithme.', defMoi: 'Quand le programme se trompe toujours dans le même sens.', analogie: 'Des lunettes teintées qui déforment la réalité.' },
      { mot: 'Algorithme', defSource: 'Suite finie et non ambiguë d’opérations ou d’instructions.', defMoi: 'Une liste d’étapes à suivre pour arriver à un résultat.', analogie: 'Une recette de cuisine.' },
      { mot: 'Sur-échantillonnage', defSource: 'Technique de réplication de données pour équilibrer la base.', defMoi: 'On recopie les données rares pour qu’elles comptent autant.', analogie: 'S’il manque un ingrédient, on en rajoute pour que la recette soit équilibrée.' },
    ],
  };

  const api = { ETIQUETTES, TYPES_SOURCE, QUIZ, SUJETS, DEBUTS_QUESTION, A_SAVOIR, GRILLE, TERMES, EXEMPLE };
  racine.HGDonnees = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
