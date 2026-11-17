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

  // Les fiches de méthode (page « Aide et méthode ») : id (adresse #/aide/<id>), titre, contenu (HTML écrit ici, jamais
  // venu de l'élève ni de la base).
  const FICHES = [
    { id: 'point', titre: 'Un bon point', html: '<p>1 à 3 lignes, en mots-clés : de quoi dire 3 à 5 phrases.</p><p class="oui">Oui : « IA de recrutement d’Amazon abandonnée : pénalisait les CV de femmes. »</p><p class="non">Non : un paragraphe rédigé que tu serais tenté·e de lire.</p>' },
    { id: 'plan', titre: 'Un bon plan', html: '<p>Introduction (2 min), deux axes (3 min chacun), conclusion (2 min). 30 à 50 points en tout.</p>'
      + '<ul><li><b>L’introduction :</b> une accroche (un fait concret, un chiffre, une question), ta problématique, ta motivation, puis l’annonce du plan.</li>'
      + '<li><b>Entre les parties :</b> une transition, qui montre au jury que ton plan avance.</li>'
      + '<li><b>La conclusion :</b> une synthèse qui répond à ta question (sans idée nouvelle), une ouverture, puis une question de relance.</li></ul>'
      + '<p>Des plans possibles : avantages et limites ; constat et solutions ; hier, aujourd’hui, demain ; du général au particulier.</p>' },
    { id: 'definition', titre: 'Une bonne définition', html: '<p>Deux versions : celle d’une source sérieuse, recopiée et citée, puis la tienne.</p><p class="oui">Oui : « Algorithme : une liste d’étapes à suivre pour arriver à un résultat. »</p><p class="non">Non : la même phrase que la source avec deux mots changés.</p><p>Ajoute une image simple pour le membre du jury non spécialiste : « un algorithme, c’est comme une recette de cuisine ».</p>' },
    { id: 'non-specialiste', titre: 'Expliquer à un non-spécialiste', html: '<p>Un des deux membres du jury ne connaît pas la NSI. Pour chaque mot technique, prépare une image : « un algorithme, c’est comme une recette de cuisine ».</p><p>Astuce de programmeur et de programmeuse : explique ton sujet à voix haute à un canard en plastique. Si tu bloques, c’est que ce n’est pas encore clair pour toi.</p>' },
    { id: 'source', titre: 'Une bonne source', html: '<p>Demande-toi : qui parle ? Est-ce son métier ? De quand ça date ? Que disent les autres sites de cette source ?</p><p>Croise au moins deux types de sources : une source experte (rapport, livre, site officiel) et une source de vulgarisation (vidéo ou article de qualité). Wikipédia est un bon point de départ : va lire les sources citées en bas de l’article.</p><p>Quand tu donnes un chiffre, une définition ou une citation, dis d’où ça vient : relie le point à sa source.</p>' },
    { id: 'arguments', titre: 'Les types d’arguments', html: '<ul><li>de droit : une loi, un règlement ;</li><li>de fait : un événement, une étude ;</li><li>scientifique : un résultat reconnu ;</li><li>logique : un raisonnement ;</li><li>d’autorité : une personne ou une institution reconnue ;</li><li>d’expérience : ce que tu as vécu.</li></ul><p>Mélange-les, et dis toujours d’où ils viennent.</p>' },
    { id: 'jury', titre: 'Préparer l’échange et répondre au jury', html: '<p>L’échange dure 10 minutes, autant que l’exposé : prépare-le autant. Note les questions que le jury pourrait poser (« Pourquoi as-tu choisi ce sujet ? ») et tes idées de réponse en mots-clés, dans l’onglet « Échange » de ta question. Ne récite pas un texte appris par cœur.</p><p>Le jour J, écoute la question jusqu’au bout. Prends quelques secondes. Reformule si besoin : « Si je comprends bien, vous me demandez… ».</p><p>Tu ne sais pas ? « Je n’ai pas la donnée exacte, mais je peux expliquer le principe… »</p>' },
  ];

  // La vidéo du ministère (2021) : elle donne les anciennes règles ; la page « Comprendre l'épreuve » fait foi.
  const VIDEO_EPREUVE = { lien: 'https://www.youtube.com/watch?v=3mN9w6rpXgE', titre: 'Grand oral : comprendre l’épreuve en un clin d’œil', auteur: 'ministère de l’Éducation nationale', date: 'janvier 2021' };

  // Les quiz « Vérifie que tu as compris » (règle 22 : QCU à 4 options, un retour par option). Le fond est validé par
  // l'enseignant. q : la question ; o : les 4 options [texte, retour] ; b : la position de la bonne réponse (0 à 3), mélangée
  // à l'affichage ; r : la page à revoir [adresse, nom]. Quiz « épreuve » : session 2027 seulement (page « Comprendre
  // l'épreuve » et « à savoir », d'après le BO spécial n° 4 du 17/09/2026).
  const REVOIR_EPREUVE = ['#/aide/epreuve', 'Comprendre l’épreuve'];
  const revoir = (id) => ['#/aide/' + id, FICHES.find((f) => f.id === id).titre];
  const COMPRENDRE = [
    { id: 'epreuve', titre: 'Ai-je compris l’épreuve ?', court: 'Épreuve', chapo: '10 questions sur les règles du Grand oral, session 2027. Après chaque réponse, une explication. Ce n’est pas noté : c’est pour vérifier que tu as compris.', questions: [
      { id: 'e1', q: 'Tes spécialités sont la NSI et les maths. Quelles questions prépares-tu pour le jour J ?', b: 1, r: REVOIR_EPREUVE, o: [
        ['Deux questions de NSI seule.', 'Pas tout à fait : tes deux questions ne peuvent pas porter sur la même spécialité.'],
        ['Une question de NSI, et une question transversale qui relie la NSI et les maths.', 'Oui : deux questions qui ne portent pas sur la même spécialité, et une question peut être transversale.'],
        ['Une seule question, transversale : elle compte pour les deux spécialités.', 'Il en faut deux : le jour J, le jury choisit l’une des deux.'],
        ['Trois questions, et le jury en garde une.', 'Tu en présentes deux, pas trois : prépare-les aussi bien l’une que l’autre.']] },
      { id: 'e2', q: 'Le jour J, qui choisit la question sur laquelle tu passes ?', b: 2, r: REVOIR_EPREUVE, o: [
        ['Toi : tu prends celle que tu préfères.', 'C’est le jury qui choisit : prépare tes deux questions aussi bien.'],
        ['Un tirage au sort.', 'Tu peux tirer au sort pour t’entraîner, mais le jour J, c’est le jury qui choisit.'],
        ['Le jury, parmi tes deux questions.', 'Oui : le jury en choisit une. D’où l’intérêt de préparer les deux aussi bien.'],
        ['Ton enseignant·e de NSI, avant l’épreuve.', 'Tu prépares tes questions avec tes enseignant·e·s, mais le jour J, c’est le jury qui choisit.']] },
      { id: 'e3', q: 'Tu as 20 minutes de préparation. Avec quoi prépares-tu tes notes ?', b: 0, r: REVOIR_EPREUVE, o: [
        ['Du papier, pour refaire ton plan à la main.', 'Oui : du papier seulement. Entraîne-toi à refaire ton plan à la main en 20 minutes.'],
        ['Ton ordinateur, pour relire ton diaporama.', 'Aucun support numérique le jour J : ni ordinateur, ni diaporama.'],
        ['Ton téléphone, pour relire tes notes.', 'Pas de téléphone : aucun support numérique. Tes notes, tu les refais sur papier.'],
        ['Rien : tu dois tout garder en tête.', 'Tu as du papier pour préparer tes notes, et tu peux garder ta feuille pendant l’exposé.']] },
      { id: 'e4', q: 'Comment se passe ton exposé ?', b: 3, r: REVOIR_EPREUVE, o: [
        ['10 minutes, assis·e, en lisant ton texte.', 'Tu présentes debout, et sans lire : parle à partir de tes points.'],
        ['5 minutes, debout, sans notes.', 'L’exposé dure 10 minutes. Et tu peux garder ta feuille.'],
        ['20 minutes, debout : c’est la moitié de l’épreuve.', '20 minutes, c’est la préparation. L’exposé, lui, dure 10 minutes.'],
        ['10 minutes, debout, sans lire tes notes.', 'Oui : 10 minutes, debout, sans lire. Tu peux garder ta feuille et la montrer au jury.']] },
      { id: 'e5', q: 'Que se passe-t-il juste après ton exposé ?', b: 1, r: REVOIR_EPREUVE, o: [
        ['10 minutes d’échange, puis 5 minutes sur ton projet d’orientation.', 'C’est un ancien déroulé, comme dans la vidéo de 2021. En 2027 : 10 minutes d’exposé, puis 10 minutes d’échange.'],
        ['10 minutes d’échange avec le jury.', 'Oui : l’échange dure 10 minutes, autant que l’exposé. Prépare-le autant.'],
        ['5 minutes de questions sur ton exposé seulement.', 'L’échange dure 10 minutes, et il peut aller au-delà de ton exposé.'],
        ['Rien : l’épreuve s’arrête à la fin de ton exposé.', 'L’exposé n’est que la moitié : ensuite vient l’échange, 10 minutes.']] },
      { id: 'e6', q: 'Session 2027, voie générale : quel est le coefficient du Grand oral ?', b: 2, r: REVOIR_EPREUVE, o: [
        ['Coefficient 10.', 'C’était l’ancienne règle, celle de la vidéo de 2021. À partir de la session 2027 : coefficient 8.'],
        ['Coefficient 4.', 'Plus que ça : coefficient 8 à partir de la session 2027.'],
        ['Coefficient 8.', 'Oui : coefficient 8 au bac général, à partir de la session 2027.'],
        ['Aucun : c’est un entraînement.', 'Il compte bien pour le bac : coefficient 8 à partir de la session 2027.']] },
      { id: 'e7', q: 'Ta question est-elle notée ?', b: 0, r: REVOIR_EPREUVE, o: [
        ['Non : ce qui compte, c’est ton argumentation et ta façon de parler.', 'Exact : la question elle-même n’est pas notée. Choisis-la pour bien argumenter.'],
        ['Oui : une question originale rapporte des points.', 'La question elle-même n’est pas notée : c’est ce que tu en fais qui compte.'],
        ['Oui : c’est le premier critère de la grille.', 'Aucun des 5 critères ne note la question : ils portent sur ton oral, tes connaissances, l’échange et ton argumentation.'],
        ['Seulement si elle est transversale.', 'Transversale ou non, la question n’est pas notée : ton argumentation et ton oral, si.']] },
      { id: 'e8', q: 'Pendant l’échange, sur quoi le jury peut-il t’interroger ?', b: 3, r: REVOIR_EPREUVE, o: [
        ['Seulement sur ce que tu as dit dans ton exposé.', 'Plus large : le jury peut aussi t’interroger sur le programme de la spécialité. Révise les chapitres liés à ton sujet.'],
        ['Sur toutes les matières du bac.', 'Pas toutes : sur ton sujet, et sur le programme des spécialités concernées par ta question.'],
        ['Seulement sur tes sources.', 'Le jury peut parler de tes sources, mais il t’interroge sur ton sujet et sur le programme de la spécialité.'],
        ['Sur ton sujet, et sur tout le programme des spécialités concernées.', 'Oui : révise les chapitres liés à ton sujet, en NSI, et dans ton autre spécialité pour une question transversale.']] },
      { id: 'e9', q: 'Qui compose le jury ?', b: 1, r: REVOIR_EPREUVE, o: [
        ['Deux enseignant·e·s de NSI.', 'Un·e des deux n’est pas spécialiste de NSI : prépare une image simple pour chaque mot technique.'],
        ['Deux enseignant·e·s, dont un·e n’est pas spécialiste de NSI.', 'Oui : parle aussi pour le membre du jury non spécialiste, avec des images simples.'],
        ['Un·e seul·e enseignant·e de NSI.', 'Le jury compte deux enseignant·e·s, dont un·e n’est pas spécialiste de NSI.'],
        ['Trois personnes, dont une du monde du travail.', 'Le jury compte deux enseignant·e·s, dont un·e n’est pas spécialiste de NSI.']] },
      { id: 'e10', q: 'La grille d’évaluation indicative compte 5 critères. Lequel n’en fait pas partie ?', b: 2, r: REVOIR_EPREUVE, o: [
        ['La qualité orale.', 'Elle en fait partie : ta voix, ton débit, ton vocabulaire comptent.'],
        ['L’interaction avec le jury.', 'Elle en fait partie : pendant l’échange, réagis, reformule, rebondis.'],
        ['La présentation de ta feuille de notes.', 'Exact : tu peux montrer ta feuille au jury, mais il ne la note pas.'],
        ['La construction de l’argumentation.', 'Elle en fait partie : un raisonnement construit, avec des arguments précis.']] },
    ] },
    { id: 'plan', titre: 'Ai-je compris la méthode du plan ?', court: 'Plan', chapo: '10 situations, comme quand tu construis ton plan. Après chaque réponse, une explication. Ce n’est pas noté : c’est pour vérifier que tu as compris.', questions: [
      { id: 'p1', q: 'Lequel de ces points est bien écrit ?', b: 2, r: revoir('point'), o: [
        ['Il y a quelques années, l’entreprise Amazon a décidé d’abandonner l’intelligence artificielle qu’elle utilisait pour recruter, parce que ses équipes ont découvert qu’elle notait moins bien les CV des femmes.', 'C’est un paragraphe rédigé : tu serais tenté·e de le lire. Garde 1 à 3 lignes, en mots-clés.'],
        ['Amazon.', 'Trop court : un point doit te donner de quoi dire 3 à 5 phrases.'],
        ['IA de recrutement d’Amazon abandonnée : pénalisait les CV de femmes.', 'Oui : 1 à 3 lignes, en mots-clés, avec de quoi dire 3 à 5 phrases.'],
        ['Un exemple intéressant à développer.', 'Ce point ne dit rien : le jour J, tu ne sauras plus de quel exemple il s’agit.']] },
      { id: 'p2', q: 'Ton plan compte 18 points. Pour tenir 10 minutes, que fais-tu ?', b: 0, r: revoir('plan'), o: [
        ['Tu continues : vise 30 à 50 points.', 'Oui : 18 points font environ 5 minutes. Avec 30 à 50 points, tu tiens les 10 minutes.'],
        ['Rien : en parlant lentement, 18 points suffisent.', 'Parler plus lentement ne suffit pas : vise 100 à 125 mots par minute, et 30 à 50 points.'],
        ['Tu rédiges chaque point en paragraphe, pour qu’il dure plus longtemps.', 'Un paragraphe se lit au lieu de se dire : ajoute plutôt des points courts, jusqu’à 30 à 50.'],
        ['Tu en ajoutes 60 de plus, pour être sûr·e.', '78 points, c’est trop pour 10 minutes : vise 30 à 50 points.']] },
      { id: 'p3', q: 'Comment répartis-tu tes 10 minutes d’exposé ?', b: 3, r: revoir('plan'), o: [
        ['Introduction 1 min, axe 1 4 min, axe 2 4 min, conclusion 1 min.', 'L’introduction et la conclusion méritent plus : environ 2 minutes chacune.'],
        ['Introduction 4 min, axe 1 2 min, axe 2 2 min, conclusion 2 min.', 'L’introduction est trop longue : le cœur de l’exposé, ce sont tes deux axes, 3 minutes chacun.'],
        ['Un seul axe de 8 minutes, sans introduction ni conclusion.', 'Le jury a besoin d’une introduction et d’une conclusion pour suivre : 2, 3, 3 et 2 minutes.'],
        ['Introduction 2 min, axe 1 3 min, axe 2 3 min, conclusion 2 min.', 'Oui : 2, 3, 3 et 2 minutes. C’est l’équilibre que vérifie le coach.']] },
      { id: 'p4', q: 'Ton introduction : une accroche (« L’IA de recrutement d’Amazon pénalisait les CV de femmes »), ta problématique (« Comment lutter contre les biais algorithmiques ? »), ta motivation (« En NSI, j’ai compris que nos choix d’algorithmes ont un effet sur la société »). Que lui manque-t-il ?', b: 1, r: revoir('plan'), o: [
        ['Une accroche.', 'Elle y est déjà : le fait sur Amazon accroche le jury.'],
        ['L’annonce du plan.', 'Oui : annonce tes deux axes, par exemple « D’abord les causes, puis les solutions ».'],
        ['Ton nom et ta classe.', 'Inutile : commence par ton accroche, pas par « Bonjour, je m’appelle… ».'],
        ['Ta conclusion.', 'La conclusion vient à la fin. À cette introduction, il manque l’annonce du plan.']] },
      { id: 'p5', q: 'Ta conclusion a une synthèse et une ouverture. Que lui ajoutes-tu ?', b: 0, r: revoir('plan'), o: [
        ['Une question de relance, pour guider le jury vers ce que tu maîtrises.', 'Oui : synthèse, ouverture, relance. Ta relance ouvre l’échange sur un terrain que tu connais.'],
        ['Une idée nouvelle, que tu n’as pas eu le temps de dire.', 'Dans la conclusion, n’ajoute pas d’idée nouvelle : réponds à ta question.'],
        ['La liste de tes sources, lue à voix haute.', 'Tes sources, tu les cites au fil de l’exposé : la conclusion finit par une question de relance.'],
        ['Rien : la conclusion s’arrête après l’ouverture.', 'Il manque la question de relance : elle guide le jury vers ce que tu maîtrises.']] },
      { id: 'p6', q: 'Ton axe 1 explique les causes des biais, ton axe 2 les solutions. Qu’écris-tu entre les deux ?', b: 3, r: revoir('plan'), o: [
        ['Rien : le jury voit bien que tu changes de partie.', 'Sans transition, le jury peut perdre le fil : écris-la, elle montre que ton plan avance.'],
        ['Une nouvelle accroche.', 'L’accroche, c’est pour le début. Entre deux axes, on écrit une transition.'],
        ['Ta conclusion, pour gagner du temps.', 'La conclusion vient après le deuxième axe. Entre les deux axes : une transition.'],
        ['Une transition : « Les causes sont connues : que peut-on faire ? »', 'Oui : une transition relie tes parties et montre au jury que ton plan avance.']] },
      { id: 'p7', q: 'Un de tes points donne un pourcentage lu dans une étude. Que fais-tu ?', b: 1, r: revoir('source'), o: [
        ['Tu l’arrondis, pour qu’il soit plus facile à retenir.', 'Arrondir ne suffit pas : le jury voudra savoir d’où vient le chiffre. Donne sa source.'],
        ['Tu relies le point à sa source, et tu dis d’où vient le chiffre.', 'Oui : tout chiffre a une source. Le coach te le rappelle quand elle manque.'],
        ['Tu le gardes sans source : le jury te fera confiance.', 'Un chiffre sans source, c’est une rumeur : relie-le à sa source.'],
        ['Tu le retires : on ne donne jamais de chiffre à l’oral.', 'Un chiffre précis est un bon argument, à condition de dire d’où il vient.']] },
      { id: 'p8', q: 'Tes trois sources sont trois articles de Wikipédia. Que te conseille la méthode ?', b: 2, r: revoir('source'), o: [
        ['Rien : trois sources, c’est assez.', 'Le nombre ne fait pas tout : il te faut au moins deux types de sources différents.'],
        ['Les remplacer par trois vidéos.', 'Trois vidéos, c’est encore un seul type de source : croise des types différents.'],
        ['Ajouter une source d’un autre type, experte ou officielle, et lire les sources citées par Wikipédia.', 'Oui : au moins deux types de sources différents. Wikipédia est un bon point de départ, pas une arrivée.'],
        ['Ne pas dire au jury d’où viennent tes informations.', 'Au contraire : dis toujours d’où viennent tes informations.']] },
      { id: 'p9', q: 'Ton plan emploie le mot « algorithme ». Que prépares-tu dans « Mes mots » ?', b: 0, r: revoir('definition'), o: [
        ['Une définition d’une source, une avec tes mots, et une image simple pour le membre du jury non spécialiste.', 'Oui : deux définitions et une image, comme « un algorithme, c’est comme une recette de cuisine ».'],
        ['La définition d’une source, recopiée : elle suffit.', 'Ajoute ta propre définition : si tu sais le dire avec tes mots, tu l’as compris.'],
        ['Rien : tout le jury connaît ce mot.', 'Un des deux membres du jury n’est pas spécialiste de NSI : définis chaque mot technique.'],
        ['La phrase de la source, avec deux mots changés.', 'Ce ne sont pas encore tes mots : reformule vraiment, comme pour un·e camarade.']] },
      { id: 'p10', q: 'Ton plan est prêt. Comment prépares-tu l’échange avec le jury ?', b: 3, r: revoir('jury'), o: [
        ['Tu ne le prépares pas : on ne peut pas deviner les questions.', 'Beaucoup de questions se devinent, comme « Pourquoi as-tu choisi ce sujet ? » : prépare-les.'],
        ['Tu rédiges des réponses complètes, à apprendre par cœur.', 'Une réponse apprise par cœur sonne faux : note plutôt tes idées en mots-clés.'],
        ['Tu révises seulement ton exposé : l’échange ne porte que sur lui.', 'Le jury peut t’interroger sur tout le programme de la spécialité : révise aussi les chapitres liés à ton sujet.'],
        ['Tu notes les questions probables, comme « Pourquoi as-tu choisi ce sujet ? », et tes idées de réponse en mots-clés.', 'Oui : l’échange dure 10 minutes, autant que l’exposé. Prépare-le autant.']] },
    ] },
  ];

  const api = { TAGS, ETIQUETTES, TYPES_SOURCE, QUIZ, SUJETS, DEBUTS_QUESTION, A_SAVOIR, GRILLE, TERMES, EXEMPLE, FICHES, VIDEO_EPREUVE, COMPRENDRE };
  racine.HGDonnees = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
