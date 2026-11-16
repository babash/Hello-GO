# 🎤 Hello GO

**Préparer le Grand oral de NSI, pas à pas.** Pour la terminale NSI.

> Tes élèves trouvent un sujet qui leur plaît, en font une question, puis construisent leur plan point par point, avec leur lexique et leurs sources. Un coach leur rappelle les bonnes pratiques sans jamais les bloquer.

## 👉 [Essayer maintenant : babash.github.io/Hello-GO](https://babash.github.io/Hello-GO/)

**Gratuit · sans compte · rien à installer · sur téléphone et sur ordinateur · marche sans réseau · le dossier reste sur l'appareil de l'élève**

Hello GO fait partie des [Ressources NSI et SNT](https://babash.github.io/Babash-NSI-SNT/).

---

## Ce que font les élèves

1. **Explorer** : 35 cartes tirées de la [Timeline de l'histoire de l'informatique](https://babash.github.io/TimelineNSI/) à découvrir une par une (« Ça m'intrigue » ou « Pas pour moi »), qui font ressortir des goûts auxquels l'élève n'avait pas pensé ; un questionnaire riche (goûts par domaine, ce qui tient à cœur, ce qu'on préfère dans sa deuxième spécialité, la NSI, l'après-bac) ; 5 sujets proposés, avec la raison ; une banque de 61 sujets, par thème du programme ; des pistes, avec leurs idées et leurs questions possibles.
2. **Construire** : un plan fait de points de 1 à 3 lignes, à ajouter, à réordonner (en glissant, ou avec les flèches) et à relier à des mots et à des sources.
3. **Définir** : chaque mot important a deux définitions, celle d'une source et celle de l'élève, et une image pour le membre du jury non spécialiste.
4. **Préparer l'échange** : les questions que le jury pourrait poser, dont certaines proposées d'après le plan.
5. **S'évaluer** après chaque oral blanc, sur les 5 critères de la grille nationale.
6. **Télécharger son dossier en PDF** : le plan, puis le lexique, puis les sources.

## Ce qui guide les élèves

- **Une prochaine étape**, une seule, sur l'accueil.
- **Un « à savoir » chaque jour** : une règle de l'épreuve ou un conseil, selon l'avancement.
- **Un coach** dans le plan : nombre de points et durée estimée, équilibre des parties, chiffre sans source, mot technique à définir, définition recopiée.
- **Un exemple** complet (les biais algorithmiques) et des fiches de méthode.
- **52 hauts faits**, qui récompensent les bonnes habitudes, pas la quantité.

## Où en est le projet

Cette version (1.1.0) garde tout **sur l'appareil de l'élève** : aucun compte, rien n'est envoyé.

À venir, après accord de l'enseignant sur la base de données :
- le dossier en ligne, avec un code élève en mots et chiffres, pour reprendre sur un autre appareil ;
- l'espace de l'enseignant·e : suivre la classe, commenter un point, demander une définition, suggérer une ressource ou une question, valider les questions ;
- un export en texte simple, à coller dans une IA de son choix, et la lecture de son retour ;
- un correcteur de grammaire sans serveur (Grammalecte).

## Données

- Le dossier (prénom ou pseudo, avis sur les cartes, réponses au questionnaire « Mes goûts », dont la deuxième spécialité et l'après-bac, pistes, plans, mots, sources, auto-évaluations) est gardé dans le navigateur de l'élève, sur son appareil. Rien n'est envoyé, aucun service extérieur n'est appelé.
- « Plus », puis « Réglages » : télécharger son dossier, l'importer sur un autre appareil, ou tout effacer.

## Pour vérifier

```
node tests/analyse.test.js     # les analyses (coach, questionnaire, hauts faits, fichiers importés)
python3 tests/parcours.py      # le parcours complet dans un navigateur, à 4 largeurs d'écran
python3 tests/robustesse.py    # deux onglets, fichiers abîmés ou piégés, clavier, longues adresses à 320 px, dossier de la version 1.0.0
```

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
- Bibliothèques incluses : SortableJS et pdfmake (MIT), voir `vendor/LICENCES-BIBLIOTHEQUES.txt` ; polices sous licence SIL OFL, voir `css/LICENCE-POLICES.txt`.

Tu peux réutiliser et adapter Hello GO en mentionnant Babash - NSI Tani Malandi et la licence. Merci de préciser si tu utilises l'IA pour le modifier.
