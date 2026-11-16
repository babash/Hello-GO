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

  // Les étiquettes communes aux sujets, aux cartes et au questionnaire.
  const TAGS = {
    i: { jeux: 'les jeux', musique: 'la musique', sport: 'le sport', cinema: 'le cinéma et les séries', reseaux: 'les réseaux sociaux', art: 'l’art et la création',
      sante: 'la santé', climat: 'l’environnement', societe: 'la société', argent: 'l’argent et l’économie', histoire: 'l’histoire', sciences: 'les sciences', transports: 'les transports et la ville' },
    n: { prog: 'programmer', donnees: 'les données', web: 'Internet et les réseaux', secu: 'la sécurité et les codes secrets', ia: 'l’intelligence artificielle', hist: 'l’histoire de l’informatique', materiel: 'les machines et le matériel' },
  };
  // Une réponse : [identifiant, texte, { i: [...], n: [...], k: 'mots cherchés dans les titres des sujets' }]
  const c = (id, texte, i, n, k) => [id, texte, { i: i || [], n: n || [], k: k || '' }];
  const QUIZ = [
    { id: 'gouts', titre: 'Ce qui te plaît en dehors des cours', aide: 'Coche tout ce qui te parle, même un peu.', multi: true, groupes: [
      ['Arts et culture', [c('dessin', 'Dessin, peinture, graphisme', ['art'], [], '\\bart\\b|dessin'), c('musique', 'Écouter ou faire de la musique', ['musique'], [], 'music'), c('films', 'Films et séries', ['cinema'], [], 'image|cinéma'),
        c('anime', 'Animation, mangas, BD', ['cinema', 'art'], [], 'dessin animé'), c('photo', 'Photo et vidéo', ['art', 'reseaux'], [], 'image'), c('lire', 'Lire, écrire des histoires', ['art', 'histoire'], ['ia']), c('mode', 'Mode et style', ['art', 'reseaux']), c('scene', 'Danse, théâtre, scène', ['art'])]],
      ['Jeux et sport', [c('jv', 'Jeux vidéo', ['jeux'], ['ia', 'prog'], '\\bjeux?\\b'), c('esport', 'E-sport et streaming', ['jeux', 'reseaux']), c('foot', 'Football et sports d’équipe', ['sport'], ['donnees'], 'match'),
        c('sportseul', 'Course, natation, sports de combat…', ['sport', 'sante']), c('plateau', 'Échecs, cartes, jeux de société', ['jeux', 'sciences'], ['ia', 'prog'], '\\bjeux?\\b|hanoï')]],
      ['Société', [c('actu', 'Suivre l’actualité', ['societe'], [], 'politique|infox|journalisme'), c('justice', 'La justice et les droits', ['societe'], ['donnees'], 'biais|surveillance|vie privée'),
        c('egalite', 'L’égalité entre filles et garçons', ['societe', 'histoire'], ['hist'], 'femmes|lovelace'), c('planete', 'La planète et le climat', ['climat'], [], 'carbone|climat'),
        c('soin', 'La santé, prendre soin des autres', ['sante'], [], 'médecine'), c('business', 'L’argent, le commerce, entreprendre', ['argent'], [], 'blockchain|million')]],
      ['Sciences et techniques', [c('enigmes', 'Les énigmes et la logique', ['sciences'], ['prog', 'secu'], 'hanoï|np|récursivité'), c('espace', 'L’espace et l’astronomie', ['sciences', 'transports']), c('vivant', 'Le vivant et la nature', ['sciences', 'sante'], [], 'vivant|nature'),
        c('bricoler', 'Bricoler, démonter, réparer', ['sciences'], ['materiel']), c('vehicules', 'Voitures, bateaux, avions', ['transports'], ['materiel'], 'voiture|métro'), c('robots', 'Les robots', ['sciences'], ['materiel', 'ia'], 'machine')]],
      ['Le numérique au quotidien', [c('rs', 'Les réseaux sociaux', ['reseaux'], ['donnees'], 'réseaux sociaux'), c('contenu', 'Créer du contenu (vidéos, montages)', ['reseaux', 'art'], [], 'deepfake'), c('tel', 'Mon téléphone et mes applis', ['reseaux'], ['materiel']),
        c('ianum', 'Utiliser des IA', [], ['ia'], 'intelligen'), c('protec', 'Protéger mes comptes et ma vie privée', ['reseaux'], ['secu'], 'protéger|chiffrer|vie privée')]],
      ['Histoire et monde', [c('hist', 'L’histoire', ['histoire'], ['hist'], 'histoire|guerre'), c('langues', 'Les langues et les voyages', ['histoire', 'societe'], ['web']), c('ile', 'La vie de mon île et de ma région', ['societe', 'transports'], ['web'], 'câbles|smart')]] ] },
    { id: 'coeur', titre: 'Ce qui te tient à cœur', aide: 'Ce qui te révolte, ou ce que tu voudrais défendre.', multi: true, choix: [
      c('juste', 'Que personne ne subisse d’injustice', ['societe'], ['ia', 'donnees'], 'biais|fracture'), c('prive', 'Que ma vie privée reste privée', ['societe', 'reseaux'], ['secu', 'donnees'], 'vie privée|surveillance|personnelles|protéger ses données'),
      c('vrai', 'Démêler le vrai du faux', ['societe', 'reseaux'], ['ia'], 'infox|deepfake|preuve'), c('libre', 'Partager le savoir librement', ['societe'], ['hist', 'web'], 'libre|wikip'),
      c('terre', 'Protéger la planète', ['climat'], ['materiel'], 'carbone|climat'), c('creer', 'Créer, inventer du nouveau', ['art'], ['prog', 'ia'], '\\bart\\b|composition'),
      c('comprendre', 'Comprendre comment les choses marchent', ['sciences'], ['materiel', 'prog'], 'comment'), c('proteger', 'Protéger les gens des attaques', ['societe'], ['secu'], 'sûre|sécuriser|cyber')] },
    { id: 'spe', titre: 'Ta deuxième spécialité', aide: 'Pour une question transversale, qui relie tes deux spécialités.', multi: false, choix: [
      c('maths', 'Mathématiques'), c('pc', 'Physique-chimie'), c('svt', 'SVT'), c('ses', 'SES'), c('hggsp', 'HGGSP'), c('hlp', 'HLP'), c('llce', 'Langues (LLCER, AMC)'), c('arts', 'Arts'),
      c('si', 'Sciences de l’ingénieur'), c('eppcs', 'Éducation physique, pratiques et culture sportives'), c('autre', 'Une autre')] },
    { id: 'dansspe', titre: 'Ce que tu préfères dans cette spécialité', aide: 'C’est là que se cachent les ponts avec la NSI.', multi: true, selon: 'spe', choixSelon: {
      maths: [c('probas', 'Probabilités et statistiques', ['sciences'], ['donnees', 'ia']), c('arith', 'Arithmétique, nombres premiers', ['sciences'], ['secu'], 'chiffrer|sécuriser'), c('suites', 'Suites et récurrence', ['sciences'], ['prog'], 'récur'), c('geom', 'Géométrie et courbes', ['art', 'sciences'], ['prog'], 'fractales'), c('logique', 'Logique et démonstration', ['sciences'], ['prog'], 'np')],
      pc: [c('ondes', 'Ondes et signaux', ['sciences', 'musique'], ['web', 'materiel'], 'musique|communications'), c('elec', 'Électricité et circuits', ['sciences'], ['materiel'], 'infiniment petit|quantique'), c('meca', 'Mouvement et mécanique', ['transports', 'sciences'], ['prog'], 'voiture'), c('energie', 'Énergie', ['climat'], ['materiel'], 'carbone')],
      svt: [c('genet', 'Génétique', ['sante', 'sciences'], ['donnees'], 'médecine'), c('cerveau', 'Cerveau et comportement', ['sante'], ['ia'], 'intelligente|vivant'), c('climatsvt', 'Climat et écosystèmes', ['climat'], ['donnees'], 'climat|carbone'), c('corps', 'Corps humain et santé', ['sante'], ['ia'], 'médecine')],
      ses: [c('marches', 'Marchés, monnaie, entreprises', ['argent'], ['donnees', 'secu'], 'blockchain|entreprise'), c('inegalites', 'Inégalités et mobilité sociale', ['societe'], ['donnees'], 'fracture|biais'), c('vote', 'Vote et opinion publique', ['societe', 'reseaux'], ['donnees'], 'politique'), c('travail', 'Travail et emploi', ['societe', 'argent'], ['ia'], 'entreprise')],
      hggsp: [c('puissances', 'Puissances et conflits', ['societe', 'histoire'], ['secu'], 'cyberguerre|guerre'), c('medias', 'S’informer : médias et opinion', ['societe', 'reseaux'], ['donnees'], 'infox|journalisme'), c('mers', 'Mers, frontières, câbles', ['transports', 'histoire'], ['web'], 'câbles|protocoles'), c('patrimoine', 'Histoire et mémoire', ['histoire'], ['hist'], 'turing|lovelace|histoire')],
      hlp: [c('humain', 'L’humain et ses limites', ['societe', 'sciences'], ['ia'], 'machine intelligente|virtuelle'), c('parole', 'La parole et ses pouvoirs', ['societe'], ['ia'], 'infox|politique'), c('creation', 'Création et représentation', ['art'], ['ia'], '\\bart\\b'), c('liberte', 'Liberté et responsabilité', ['societe'], ['donnees'], 'vie privée|surveillance|voiture autonome')],
      llce: [c('culture', 'Cinéma, séries, musique d’ailleurs', ['cinema', 'musique'], ['donnees']), c('traduire', 'Traduire et faire traduire', ['societe'], ['ia'], 'tradui'), c('monde', 'Le monde anglophone du numérique', ['histoire', 'argent'], ['hist', 'web'], 'web')],
      arts: [c('image', 'L’image', ['art', 'cinema'], ['ia'], 'image|dessin animé'), c('son', 'Le son', ['musique', 'art'], ['donnees'], 'music'), c('artnum', 'L’art numérique', ['art'], ['prog'], 'art algorithmique|fractales')],
      si: [c('robotsi', 'Robots et automatismes', ['sciences'], ['materiel', 'ia'], 'voiture autonome|machine'), c('capteurs', 'Capteurs et objets connectés', ['sciences', 'transports'], ['materiel', 'web'], 'smart'), c('concevoir', 'Concevoir et modéliser', ['sciences'], ['prog'], 'virtuelle')],
      eppcs: [c('perf', 'Mesurer la performance', ['sport'], ['donnees'], 'match'), c('santesport', 'Sport et santé', ['sport', 'sante'], ['donnees', 'materiel']), c('spectacle', 'Le sport spectacle', ['sport', 'argent'], ['ia', 'donnees'], 'match')] } },
    { id: 'nsi', titre: 'Ce qui t’attire en NSI', aide: 'Coche ce que tu as aimé faire ou découvrir.', multi: true, choix: [
      c('coder', 'Écrire un programme qui marche', [], ['prog']), c('algo', 'Trouver un algorithme malin', ['sciences'], ['prog'], 'complexité|récursivité'), c('bdd', 'Les bases de données et SQL', [], ['donnees'], 'données'),
      c('site', 'Faire un site web', [], ['web'], 'web'), c('reseau', 'Comprendre Internet et les réseaux', [], ['web'], 'protocoles|tor'), c('secret', 'La sécurité et les codes secrets', [], ['secu']),
      c('ia', 'L’intelligence artificielle', [], ['ia']), c('passe', 'L’histoire et les personnages de l’informatique', ['histoire'], ['hist']), c('machine', 'Ce qu’il y a dans la machine', [], ['materiel']), c('linux', 'Le terminal et les systèmes', [], ['materiel', 'hist'], 'libre')] },
    { id: 'angle', titre: 'L’angle qui te parle', aide: 'Un seul choix.', multi: false, choix: [
      c('recit', 'Raconter une histoire (une personne, une invention)'), c('comment', 'Expliquer comment ça marche'), c('debat', 'Débattre d’un problème de société'), c('avenir', 'Imaginer l’avenir')] },
    { id: 'apres', titre: 'Après le bac, tu te vois plutôt…', aide: 'Facultatif. Ton projet peut nourrir ta motivation devant le jury.', multi: true, choix: [
      c('info', 'Dans l’informatique', [], ['prog']), c('medical', 'Dans la santé', ['sante']), c('droit', 'Dans le droit ou la politique', ['societe'], ['donnees']), c('commerce', 'Dans le commerce ou la gestion', ['argent']),
      c('ingenieur', 'Dans l’ingénierie ou les sciences', ['sciences'], ['materiel']), c('prof', 'Dans l’enseignement', ['societe', 'histoire']), c('design', 'Dans l’art, le design, l’audiovisuel', ['art', 'cinema']),
      c('sportif', 'Dans le sport', ['sport']), c('sais', 'Je ne sais pas encore')] },
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
    { t: 'L’intelligence artificielle va-t-elle transformer le travail en entreprise ?', th: 'Impact sociétal et éthique', i: ['argent', 'societe'], n: ['ia'], a: ['avenir', 'debat'], s: ['ses'] },
    { t: 'Les centres de données : un numérique sobre est-il possible ?', th: 'Architectures, systèmes et réseaux', i: ['climat', 'argent'], n: ['materiel', 'web'], a: ['debat', 'avenir'], s: ['pc', 'svt', 'ses'] },
    { t: 'L’intelligence artificielle consomme-t-elle trop d’énergie ?', th: 'Algorithmique', i: ['climat', 'societe'], n: ['ia', 'materiel'], a: ['debat'], s: ['pc', 'svt'] },
    { t: 'Peut-on prévoir le climat avec des modèles informatiques ?', th: 'Langages et programmation', i: ['climat', 'sciences'], n: ['prog', 'donnees'], a: ['comment', 'avenir'], s: ['svt', 'maths', 'pc'] },
    { t: 'Les statistiques peuvent-elles améliorer l’entraînement d’un·e sportif·ve ?', th: 'Données structurées', i: ['sport', 'sante'], n: ['donnees'], a: ['comment'], s: ['eppcs', 'maths', 'svt'] },
    { t: 'L’arbitrage vidéo : la machine voit-elle mieux que l’arbitre ?', th: 'Interfaces et objets', i: ['sport'], n: ['ia', 'materiel'], a: ['debat', 'comment'], s: ['eppcs', 'pc'] },
    { t: 'Le logiciel libre : pourquoi donner son code ?', th: 'Impact sociétal et éthique', i: ['societe', 'argent'], n: ['hist', 'prog'], a: ['debat', 'recit'], s: ['ses', 'hlp'] },
    { t: 'Peut-on faire confiance à Wikipédia, une encyclopédie que tout le monde peut modifier ?', th: 'Impact sociétal et éthique', i: ['societe', 'histoire'], n: ['web'], a: ['debat'], s: ['hggsp', 'hlp'] },
    { t: 'Les algorithmes de recommandation décident-ils de ce qu’on regarde et de ce qu’on écoute ?', th: 'Données structurées', i: ['reseaux', 'cinema', 'musique'], n: ['donnees', 'ia'], a: ['debat', 'comment'], s: ['ses', 'maths', 'llce'] },
    { t: 'Comment un GPS trouve-t-il le chemin le plus court ?', th: 'Algorithmique', i: ['transports', 'jeux'], n: ['prog'], a: ['comment'], s: ['maths', 'si'] },
    { t: 'Comment fait-on tenir une chanson ou une image dans un petit fichier ?', th: 'Données structurées', i: ['musique', 'art'], n: ['donnees'], a: ['comment'], s: ['maths', 'pc', 'arts'] },
    { t: 'Les câbles sous-marins : par où passe vraiment Internet ?', th: 'Architectures, systèmes et réseaux', i: ['transports', 'histoire', 'societe'], n: ['web', 'materiel'], a: ['comment', 'debat'], s: ['hggsp', 'pc'] },
    { t: 'Objets connectés et montres de sport : pratiques ou indiscrets ?', th: 'Interfaces et objets', i: ['sport', 'sante'], n: ['materiel', 'donnees'], a: ['debat'], s: ['eppcs', 'svt', 'si'] },
    { t: 'Une IA peut-elle traduire sans comprendre ?', th: 'Algorithmique', i: ['societe', 'histoire'], n: ['ia'], a: ['comment', 'debat'], s: ['llce', 'hlp'] },
    { t: 'Comment un rançongiciel peut-il paralyser un hôpital ?', th: 'Architectures, systèmes et réseaux', i: ['sante', 'societe'], n: ['secu'], a: ['recit', 'comment'], s: ['svt'] },
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
        ['exemple', 'Un husky pris pour un loup à cause de la neige derrière lui : le modèle a appris le décor, pas l’animal.'],
        ['argument', 'Biais historique : les données sont le miroir des discriminations passées.'],
        ['argument', 'Biais de modélisation : on choisit ce que l’IA doit maximiser.'],
        ['exemple', 'Le robot Tay de Microsoft, devenu raciste en apprenant des internautes extrêmes.'],
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

  const api = { TAGS, ETIQUETTES, TYPES_SOURCE, QUIZ, SUJETS, DEBUTS_QUESTION, A_SAVOIR, GRILLE, TERMES, EXEMPLE };
  racine.HGDonnees = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
