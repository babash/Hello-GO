# 🎤 Hello GO

**Préparer le Grand oral de NSI, pas à pas.** Pour la terminale NSI.

> Tes élèves trouvent un sujet qui leur plaît, en font une question, puis construisent leur plan point par point, avec leur lexique et leurs sources. Un coach leur rappelle les bonnes pratiques sans jamais les bloquer.

## 👉 [Essayer maintenant : babash.github.io/Hello-GO](https://babash.github.io/Hello-GO/)

**Gratuit · rien à installer · sur téléphone et sur ordinateur · le dossier en ligne, retrouvé partout avec un code · l'enseignant·e suit sa classe et fait ses retours**

Hello GO fait partie des [Ressources NSI et SNT](https://babash.github.io/Babash-NSI-SNT/).

---

## Ce que font les élèves

1. **Explorer** : 35 cartes tirées de la [Timeline de l'histoire de l'informatique](https://babash.github.io/TimelineNSI/) à découvrir une par une (« Ça m'intrigue » ou « Pas pour moi »), qui font ressortir des goûts auxquels l'élève n'avait pas pensé ; un questionnaire riche (goûts par domaine, ce qui tient à cœur, ce qu'on préfère dans sa deuxième spécialité, la NSI, l'après-bac) ; 5 sujets proposés, avec la raison ; une banque de 61 sujets, par thème du programme ; des pistes, avec leurs idées et leurs questions possibles.
2. **Construire** : un plan fait de points de 1 à 3 lignes, à ajouter, à réordonner (en glissant, ou avec les flèches) et à relier à des mots et à des sources.
3. **Définir** : chaque mot important a deux définitions, celle d'une source et celle de l'élève, et une image pour le membre du jury non spécialiste.
4. **Préparer l'échange** : les questions que le jury pourrait poser, dont certaines proposées d'après le plan.
5. **S'évaluer** après chaque oral blanc, sur les 5 critères de la grille nationale.
6. **Télécharger son dossier en PDF** : le plan, puis le lexique, puis les sources.
7. **Vérifier qu'il ou elle a compris** : deux quiz de 10 questions, « Ai-je compris l'épreuve ? » (les règles de la session 2027) et « Ai-je compris la méthode du plan ? » (des mises en situation). Une question par écran, une explication après chaque réponse, le score et les points à revoir à la fin, avec un lien vers la fiche concernée ; à refaire à volonté, sans note sanction. La page « Comprendre l'épreuve » donne aussi le lien vers la vidéo du ministère (2021), avec ce qui a changé pour 2027.

## Ce qui guide les élèves

- **Une prochaine étape**, une seule, sur l'accueil.
- **Un « à savoir » chaque jour** : une règle de l'épreuve ou un conseil, selon l'avancement.
- **Un coach** dans le plan : nombre de points et durée estimée, équilibre des parties, chiffre sans source, mot technique à définir, définition recopiée.
- **Un exemple** complet (les biais algorithmiques) et des fiches de méthode.
- **54 hauts faits**, qui récompensent les bonnes habitudes, pas la quantité.

## Pour les enseignant·e·s

Une seule version, **en ligne**, sur téléphone comme sur ordinateur.

1. **Créez votre espace** sur [babash.github.io/Hello-GO/#/prof](https://babash.github.io/Hello-GO/#/prof) : un code de 3 mots et 4 chiffres, montré une seule fois (aucun courriel, aucun mot de passe). Il n'est gardé que le temps de la séance, dans l'onglet, sauf si vous cochez « Rester connecté·e sur cet appareil », à réserver à un appareil personnel ; « Fermer mon espace sur cet appareil » l'efface.
2. **Créez une classe** : vous obtenez son lien et son QR code. Chaque élève s'inscrit avec son prénom et l'initiale de son nom, et reçoit un code de 2 mots et 3 chiffres (comme `MICRO-DECOR-123`) qui suffit pour retrouver son dossier depuis n'importe quel appareil. Aucun plafond du nombre d'élèves.
3. **Le tableau de la classe** : une ligne par élève (question, points, mots, sources, oraux évalués, meilleur score à chaque quiz, dernière visite, nouveau travail depuis votre dernière visite) et tous les codes, masqués par défaut, à révéler ou à imprimer.
4. **Le dossier d'un·e élève** : son plan, ses mots, ses sources, ses pistes, ses oraux et ses quiz (scores, essais, questions ratées au dernier essai), avec vos outils : commenter un point, un mot, une source, une piste ou une question ; demander une définition ; suggérer une ressource ou une question pour l'échange ; valider une question ou demander de la retravailler ; évaluer un oral blanc ou une vidéo sur la grille ; corriger un texte (rare, sans annonce) ; télécharger son PDF.
5. **Avec une IA de votre choix** (facultatif) : « Copier pour l'IA » donne le dossier en texte simple, sans prénom ni code, avec des repères stables (`P3` un point, `M1` un mot, `S2` une source, `Q1` une question de l'échange), des consignes au début et le format de réponse à la fin. Collez sa réponse : chaque ligne `@…` devient un brouillon que vous relisez avant de l'envoyer ; l'élève voit « préparé avec l'aide d'une IA, relu par ton enseignant·e ».

Sans code ni lien de classe, l'application reste utilisable en **mode découverte** : le dossier reste sur l'appareil, et part dans la base quand l'élève rejoint sa classe.

En fin d'année : exportez votre espace (JSON), puis supprimez vos classes. Rien n'est effacé automatiquement.

## Où en est le projet

Version 1.4.0 : les deux quiz « Vérifie que tu as compris » (l'épreuve, la méthode du plan), proposés sur l'accueil, dans l'aide et par la prochaine étape, leurs résultats dans le dossier, le résumé et l'espace de l'enseignant·e, deux hauts faits, et le lien vers la vidéo du ministère avec sa mise en garde. Avant elle : la version en ligne (élève et enseignant·e), sur la base appliquée le 17/11/2026 (dossier [`supabase/`](supabase/LISEZMOI.md)) ; depuis la 1.3.1, l'interface dit « ton enseignant·e » partout où elle disait « ton prof » ; la 1.3.2 répare le démarrage : `js/analyse.js` devient `js/coach.js` (les bloqueurs de contenu, avec la liste EasyPrivacy, bloquaient tout fichier nommé `analyse.js`), une page et ses fichiers sont toujours de la même version (`?v=`, un cache par version), et un message clair, avec les détails techniques, remplace la page vide si un fichier manque.

À venir : un correcteur de grammaire sans serveur (Grammalecte).

## Données

**Données d'élèves : prénom et initiale du nom, code, dossier, retours.** Elles sont gardées dans la base Supabase partagée des applications du site (projet « Babash - applications », schéma `grand_oral`), et sur l'appareil de l'élève (copie de travail, pour continuer hors ligne).

- **Le compte** : le prénom et l'initiale du nom (jamais le nom complet), le code, la classe. Sur l'appareil, un jeton (un par appareil, 5 au plus, valable 30 jours sans usage) et le code, pour « Voir mon code » dans les réglages ; « Quitter cet appareil » efface l'un et l'autre, avec la copie du dossier. Sur un ordinateur partagé du lycée, l'élève quitte l'appareil en partant.
- **Le dossier** : avis sur les cartes, réponses au questionnaire « Mes goûts » (dont la deuxième spécialité et l'après-bac), pistes, plans, mots, sources, oraux et auto-évaluations, hauts faits **et leurs compteurs** (jours de travail, annulations, déplacements…), résultats des quiz (meilleur et dernier score, date, essais, questions ratées au dernier essai), qui partent dans la base avec le dossier ; et un **résumé** chiffré pour le tableau de la classe.
- **Les retours** de l'enseignant·e (forme ci-dessous).
- L'élève n'a pas de bouton d'effacement de son compte : seul·e l'enseignant·e supprime un·e élève, une classe ou son espace. Aucun effacement automatique.
- Le code de l'enseignant·e n'est jamais gardé en clair dans la base (empreinte seulement).
- En mode découverte (sans compte), rien n'est envoyé : « Plus », puis « Réglages » permet de télécharger son dossier, de l'importer ou de tout effacer.
- La page n'appelle que les fonctions `go_…` de la base, en POST, avec la clé publique (« publishable ») du projet, dans l'en-tête `apikey`. Tout ce qui vient de la base est relu avant d'être affiché : la forme du dossier (`dossierValide`, chez l'élève comme chez l'enseignant·e), celle des retours (`HGRetours.nettoyer`), les nombres du résumé, et chaque texte est échappé ; un lien suggéré ne s'ouvre que s'il commence par `http://` ou `https://`, dans un nouvel onglet, sans transmettre l'adresse de la page.
- Le code de l'enseignant·e n'est jamais dans une adresse, un cookie ou le cache hors ligne de l'application ; l'export pour une IA ne contient ni prénom ni code.

### Les retours (`retours`, en JSON)

```json
{ "v": 1, "items": [
  { "id": "k3x9a1b2", "type": "commentaire", "cible": { "type": "point", "id": "p8f2…" }, "texte": "Ajoute la date.", "le": "2026-11-17T08:00:00.000Z" },
  { "id": "…", "type": "definir", "mot": "Apprentissage automatique", "texte": "pourquoi" },
  { "id": "…", "type": "ressource", "url": "https://…", "titre": "…", "texte": "ce qu'elle apporte", "verifier": true, "ia": true },
  { "id": "…", "type": "question", "texte": "Une question pour l'échange", "qid": "id de la question" },
  { "id": "…", "type": "validation", "qid": "id de la question", "etat": "validee", "texte": "" },
  { "id": "…", "type": "evaluation", "oral": "id de l'oral", "notes": { "oral": 3, "continu": 2 }, "texte": "" }
] }
```

- `id` : 1 à 40 caractères `A-Z a-z 0-9 _ -`. `le` : la date. `ia: true` : préparé avec l'aide d'une IA, relu par l'enseignant·e. `verifier: true` : lien proposé par une IA, à vérifier.
- `cible.type` : `point`, `mot`, `source`, `piste`, `question`, `echange` (une question préparée pour l'échange), `oral` ou `bilan` (sans `id`).
- `validation.etat` : `validee` ou `retravailler` ; la plus récente compte. `evaluation.notes` : les critères de `GRILLE` (`js/donnees.js`), de 1 à 4 ; une évaluation par oral.
- Tout retour qui n'a pas cette forme est écarté par la page (`HGRetours.nettoyer`).
- Les identifiants des points, mots, sources, questions, pistes et oraux sont ceux du dossier : ils existent depuis la version 1.0.0 et `dossierValide` les exige, donc aucun dossier n'est à migrer. Ce que l'élève fait des retours (lus, mots créés, ressources gardées ou « plus tard », validations appliquées) est noté dans le dossier, sous `suivi`.

### L'enregistrement

Le dossier part dans la base 3 secondes après la dernière frappe, quand la page passe en arrière-plan, à la fermeture et au retour du réseau, avec sa version connue. Si la base a changé entre-temps (un autre appareil, ou une correction de l'enseignant·e), la page fusionne : ce qui n'a changé que d'un côté est gardé ; un même texte changé des deux côtés prend la version de la base, et la saisie de l'appareil est gardée à part (« Ma saisie mise de côté »), jamais perdue en silence. Les retours sont relus à l'ouverture, puis toutes les 20 secondes quand la page est visible.

## Pour vérifier

```
node tests/analyse.test.js     # les analyses de js/coach.js (coach, questionnaire, hauts faits, fichiers importés)
node tests/versions.test.js    # une seule version partout (index.html, js/app.js, sw.js, ?v=), et aucun nom de fichier que bloquent les bloqueurs de contenu
python3 tests/parcours.py      # le parcours complet dans un navigateur, à 4 largeurs d'écran
python3 tests/comprendre.py    # les deux quiz « Vérifie que tu as compris » : retours, score, points à revoir, refaire, haut fait, vidéo en lien simple
python3 tests/robustesse.py    # deux onglets, fichiers abîmés ou piégés, clavier, longues adresses à 320 px, dossier de la version 1.0.0
node tests/retours.test.js     # retours, résumé, fusion à trois, format pour l'IA et lecture tolérante de sa réponse, code
python3 tests/en_ligne.py      # élève et enseignant·e en ligne, contre une reproduction locale de la base (PostgreSQL 16)
```

`tests/en_ligne.py` n'appelle jamais la base en ligne : la page y est configurée vers une adresse inexistante, servie par un PostgreSQL local neuf (`tests/base_locale.py`, qui applique le socle commun du site, `HG_SOCLE`, puis `supabase/0001-dossiers.sql`), avec des données inventées.

## Sources

- Les règles de l'épreuve : note de service du 10 septembre 2026, Bulletin officiel spécial n° 4 du 17 septembre 2026, et la foire aux questions d'Éduscol (septembre 2026).
- Les cartes à découvrir : « Timeline – Histoire de l'informatique » (TimelineNSI), Babash - NSI Tani Malandi, CC BY-SA 4.0 ; `outils/generer_decouvertes.py` en reprend les textes tels quels et y ajoute, pour chaque carte, la question qu'elle ouvre.
- Les sujets : exemples du ministère de l'Éducation nationale et sujets du dossier « Grand oral » de l'enseignant ; d'autres sujets, le questionnaire et les questions des cartes ont été écrits avec l'aide de l'IA.

## Contact

Une question, une idée, un bug ? Les [issues GitHub](https://github.com/babash/Hello-GO/issues) du dépôt. Toutes les ressources sont sur le site [Ressources NSI et SNT](https://babash.github.io/Babash-NSI-SNT/).

## Licence

Conçu par **Babash - NSI Tani Malandi**, avec l'aide de l'IA.

- Le code est sous licence [MIT](LICENSE).
- Les textes (sujets, questionnaire, questions des cartes, conseils, fiches de méthode, exemple) sont sous licence [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr).
- Bibliothèques incluses : SortableJS, pdfmake et qrcode-generator (MIT), voir `vendor/LICENCES-BIBLIOTHEQUES.txt` ; polices sous licence SIL OFL, voir `css/LICENCE-POLICES.txt`.

Tu peux réutiliser et adapter Hello GO en mentionnant Babash - NSI Tani Malandi et la licence. Merci de préciser si tu utilises l'IA pour le modifier.
