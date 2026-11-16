# Hello GO : la base des dossiers et de l'espace enseignant·e

Ce dossier contient la migration de la base de Hello GO. Avec elle, Hello GO n'a plus qu'une version, **en ligne**, sur téléphone comme sur ordinateur : le dossier de Grand oral de chaque élève est gardé dans la base et se retrouve depuis n'importe quel appareil avec son code (règle 21). L'enseignant·e suit chaque dossier depuis son espace.

- **Le projet :** `cukahpyqkljiddmimpyi` (« Babash - applications »), la base unique des applications du site.
- **Le schéma :** `grand_oral`, que l'API n'expose pas. Les fonctions d'entrée sont dans `public`, avec le préfixe `go_`.
- **Les règles suivies :** `architecture/regles-supabase.md` (P1 à P10, M1 à M8) et la spécification des codes, `architecture/codes-acces.md` (§ 1).
- **Il faut d'abord le socle commun** (`supabase/0003-schema-commun.sql` du site, appliqué le 11/11) : le compteur d'essais `commun.essais` et le sel secret `commun.secret` servent ici aussi.
- **Le registre des tables** (`commun.registre`) range `grand_oral` après la migration `base_unique_0006_registre_grand_oral` du site (fichier `supabase/0006-registre-grand-oral.sql` du dépôt Babash-NSI-SNT), qui passe avant ou après celle-ci.

## Où en est la base

**Rien n'est appliqué.** La migration attend l'accord de l'enseignant sur le SQL exact (règle M4). Elle a seulement été essayée sur une reproduction locale, avec des données inventées (voir « L'essai local »). Tant qu'elle n'est pas appliquée, la page reste dans sa version actuelle, qui garde le dossier sur l'appareil (règle M7 : la page n'appelle que des fonctions qui existent).

## Les fichiers

| Fichier | Nom de migration (`apply_migration`) | Ce qu'il fait |
|---|---|---|
| `0001-dossiers.sql` | `grand_oral_0001_dossiers` | Crée le schéma `grand_oral`, ses 5 tables, 10 fonctions internes et 24 fonctions d'entrée. Ne modifie rien d'existant. |
| `0001-dossiers-inverse.sql` | `grand_oral_0001_dossiers_inverse` | Retire tout. **Efface les espaces, les classes, les comptes et les dossiers des élèves.** |
| `schema.sql` | — | Le script complet, pour la copie d'un·e collègue (après le socle commun du site). |
| `verifier_liste.py` | — | Prouve les règles de la liste des 64 mots (voir plus bas). |
| `essais_locaux.py` | — | Rejoue tous les essais sur un PostgreSQL local neuf. |

Chaque fichier SQL commence par `begin;` et finit par `commit;`, chacun sur sa ligne : il se colle d'un bloc dans l'éditeur SQL. Par `apply_migration`, on retire seulement ces deux lignes.

## Ce que la base garde, et combien de temps

| Table | Ce qu'elle garde | Données d'élèves | Durée |
|---|---|---|---|
| `grand_oral.mots` | Les 64 mots des codes, thème « la scène et la parole » : MICRO, DECOR, PUPITRE, CHANSON… | non | — |
| `grand_oral.enseignants` | Un espace par enseignant·e : le nom affiché aux élèves (« M. Martin »), l'**empreinte** de son code (le code n'est gardé nulle part), les dates de création et de dernière ouverture. | non | jusqu'à ce que l'enseignant·e supprime son espace |
| `grand_oral.classes` | Les classes : nom, code de classe public (4 lettres sans I ni O), inscriptions ouvertes ou fermées. NSI seulement ; une classe par élève ; aucun plafond du nombre d'élèves (40 classes au plus par espace). | non | jusqu'à ce que l'enseignant·e la supprime |
| `grand_oral.eleves` | Un compte par élève : **prénom et initiale du nom** (2 à 24 caractères, jamais le nom complet), code (2 mots et 3 chiffres), le **dossier** de Grand oral tel que la page le tient (pistes, questions, plans, mots, sources, auto-évaluations ; 300 000 caractères au plus), un **résumé** chiffré pour le tableau de la classe (4 000 au plus), les **retours** de l'enseignant·e (150 000 au plus), les numéros de version et les dates (inscription, dernière visite à 10 minutes près, dernières modifications). | **oui** | jusqu'à ce que l'enseignant·e supprime l'élève, sa classe ou son espace |
| `grand_oral.sessions` | Un jeton tiré au hasard par appareil où l'élève est entré·e (5 au plus), avec deux dates. | oui (lié au compte) | 30 jours sans usage ; tous effacés quand l'élève reçoit un nouveau code |
| `commun.essais` (socle) | Les échecs de code par réseau et par heure, en empreinte du jour (jamais l'adresse). | non | 24 heures |

**Aucun effacement automatique des dossiers.** C'est une différence voulue avec les jeux : Court-circuit efface un compte 12 mois après la dernière visite, et l'élève y a un bouton « Effacer mes données ». Ici, l'élève n'a pas de bouton d'effacement de son compte, parce que l'enseignant·e suit le travail : seul·e l'enseignant·e supprime un·e élève, une classe ou tout son espace. Un compte dont personne ne s'occupe reste donc en base : à la fin de l'année, l'enseignant·e exporte puis supprime ses classes (à rappeler dans la page et dans le guide).

**L'export** (`go_prof_export`) donne tout l'espace de l'enseignant·e, ou une seule classe, en un seul objet JSON : classes, élèves avec leur code, dossiers, résumés, retours. La page le propose au téléchargement, et juste avant chaque suppression.

**Ce qui ne se voit pas d'un compte à l'autre.** Un·e élève n'atteint que son propre compte, par son jeton : jamais rien d'un·e autre élève (pas de relecture entre élèves). Un·e enseignant·e n'atteint que ses classes et ses élèves : pour tout le reste, la réponse est « introuvable », sans dire si l'objet existe ailleurs.

## Ce que crée 0001

Toutes les tables ont la RLS, sans règle et sans aucun droit pour `anon` ni `authenticated`. Les fonctions internes ne sont appelables par personne.

| Fonction interne | Rôle |
|---|---|
| `grand_oral.normaliser_code(text)` | La forme canonique d'un code (majuscules, sans accent ni séparateur). |
| `grand_oral.nettoyer_nom(text, min, max)` | Un prénom, un nom de classe ou un nom affiché : espaces resserrés, longueur bornée, sans caractère de contrôle ni invisible. |
| `grand_oral.empreinte(text)` | L'empreinte SHA-256 d'un code d'enseignant·e, avec le sel secret du projet (`commun.secret`). |
| `grand_oral.nouveau_code_eleve()` | Tire un code d'élève neuf (2 mots, 3 chiffres), sans biais, jamais un code déjà pris. |
| `grand_oral.nouveau_code_enseignant()` | Tire un code d'enseignant·e neuf (3 mots, 4 chiffres), sans biais, d'empreinte libre. |
| `grand_oral.nouveau_code_classe()` | Tire un code de classe neuf (4 lettres sans I ni O), sans biais ni suite gênante. |
| `grand_oral.eleve_par_jeton(uuid)` | Le compte d'un jeton encore valable, et la visite (écrite au plus toutes les 10 minutes). |
| `grand_oral.ouvrir_session(uuid)` | Un jeton de plus pour un·e élève (5 appareils au plus), et le ménage des jetons de plus de 30 jours. |
| `grand_oral.verifier_enseignant(text)` | Vérifie un code d'enseignant·e (10 échecs au plus par heure et par réseau, 0,3 s d'attente après un échec). |
| `grand_oral.refus_json(json, quoi, max)` | Contrôle la forme et la taille d'un dossier, d'un résumé ou de retours. |

### Les fonctions d'entrée attendues (24)

Toutes : `public`, `security definer`, `search_path` vide, appelables par `anon` seulement. Chacune borne ses paramètres et répond `{ "ok": false, "message": … }` plutôt que de lever une exception, qui annulerait le compteur d'essais. Seul un jeton ou un identifiant mal formé (qui n'a pas la forme d'un uuid) est refusé par l'API elle-même (erreur 400).

**L'élève (7)** : le jeton remplace le code après l'entrée.

| Fonction | Rôle | Compteur |
|---|---|---|
| `go_classe_par_code(p_code_classe)` | Le lien d'inscription : nom de la classe et de l'enseignant·e, inscriptions ouvertes ou non. | 30 échecs/h (`classe`) |
| `go_inscription(p_code_classe, p_pseudo)` | S'inscrire dans une classe ouverte : renvoie `code_affiche` (à noter) et `jeton`. | 30 échecs/h (`classe`), 60 créations/h (`creation`) |
| `go_connexion(p_code)` | Entrer avec son code sur un appareil : un nouveau jeton (les autres appareils gardent le leur, 5 au plus). | 20 échecs/h (`eleve`) |
| `go_reprise(p_jeton)` | Pseudo, code, classe, enseignant·e, `dossier`, `dossier_version`, `retours`, `retours_version`, dates. | — |
| `go_sauvegarde(p_jeton, p_dossier, p_resume, p_version_connue)` | Enregistre le dossier (et le résumé, s'il n'est pas `null`) sur la version connue. Si la version a changé (autre appareil, ou correction de l'enseignant·e) : `ok: false, conflit: true`, avec le dossier en base et sa version. Sinon : la nouvelle version. | — |
| `go_retours(p_jeton, p_version_connue)` | L'appel léger, à l'ouverture ou toutes les quelques secondes (pas de temps réel, règle P10) : `change: false` et les versions, ou les retours s'ils ont changé. La version du dossier y est toujours, pour savoir s'il faut le recharger. | — |
| `go_deconnexion(p_jeton)` | Efface le jeton de cet appareil (poste partagé). | — |

**L'enseignant·e (17)** : toutes prennent le code (`p_code`) et le vérifient (10 échecs/h, type `enseignant`), puis vérifient que la classe ou l'élève est bien à lui ou à elle.

| Fonction | Rôle |
|---|---|
| `go_prof_creer_espace(p_nom)` | Crée l'espace ; renvoie `code_affiche`, **montré une seule fois** (60 créations/h). |
| `go_prof_ouvrir(p_code)` | Nom, classes (id, nom, code, ouverte, nombre d'élèves, dernière visite), `echecs_heure` et `alarme` (plus de 200 échecs dans l'heure, tous réseaux). |
| `go_prof_creer_classe(p_code, p_nom)` | Crée une classe et tire son code de classe. |
| `go_prof_renommer_classe(p_code, p_classe, p_nom)` | Renomme une classe. |
| `go_prof_ouvrir_inscriptions(p_code, p_classe, p_ouverte)` | Ouvre ou ferme les inscriptions. |
| `go_prof_supprimer_classe(p_code, p_classe)` | Supprime la classe, ses élèves et leurs dossiers. |
| `go_prof_classe(p_code, p_classe)` | Le tableau de la classe : pour chaque élève, id, pseudo, **code affiché**, inscription, dernière visite, résumé, versions et dates (sans les dossiers). |
| `go_prof_dossier(p_code, p_eleve)` | Le dossier complet d'un·e élève, avec ses retours et leurs versions. |
| `go_prof_retours(p_code, p_eleve, p_retours, p_version_connue)` | Enregistre les retours (commentaires sur un point, un mot, une source ; demandes de définition ; ressources et questions suggérées ; validations ; évaluations des oraux et des vidéos) sur la version connue, avec le même refus en cas de conflit. |
| `go_prof_corriger(p_code, p_eleve, p_dossier, p_version_connue, p_resume)` | Corrige directement le dossier (rare), sur la version connue. La correction n'est pas annoncée à l'élève : sa page reçoit simplement la nouvelle version. `p_resume` est facultatif. |
| `go_prof_nouveau_code_eleve(p_code, p_eleve)` | Un nouveau code pour l'élève ; l'ancien et tous ses jetons ne marchent plus. |
| `go_prof_renommer_eleve(p_code, p_eleve, p_pseudo)` | Corrige le prénom et l'initiale. |
| `go_prof_supprimer_eleve(p_code, p_eleve)` | Supprime l'élève et son dossier. |
| `go_prof_nouveau_code(p_code)` | Change son propre code (le nouveau est montré une seule fois). |
| `go_prof_debloquer_reseau(p_code)` | Remet à zéro les compteurs de Hello GO du réseau de l'appel (par exemple après les inscriptions de deux classes dans la même heure, depuis le même réseau du lycée). |
| `go_prof_export(p_code, p_classe)` | L'export complet (tout l'espace, ou la classe donnée). |
| `go_prof_supprimer_espace(p_code, p_confirmation)` | Supprime tout l'espace (classes, élèves, dossiers) ; `p_confirmation` doit valoir `SUPPRIMER`. |

### Ce que la page doit faire (contrat)

- **Appeler en POST** (`supabase.rpc`, ou `fetch` en POST avec l'en-tête `apikey`), jamais en GET : un code dans l'adresse resterait dans les journaux.
- **Garder le jeton** de l'élève sur l'appareil (il expire après 30 jours sans usage), et proposer « Se déconnecter de cet appareil » (`go_deconnexion`) : sur un poste partagé du lycée, l'élève suivant·e ne doit pas reprendre le dossier d'un·e autre. À la reprise, la page affiche le pseudo (« Ce n'est pas toi ? »).
- **Le code enseignant·e** n'est gardé que le temps de la séance (mémoire de la page ou `sessionStorage`), jamais dans `localStorage`.
- **Enregistrer avec la version connue** et, en cas de conflit, reprendre le dossier renvoyé (en gardant une copie locale du texte refusé, que l'élève peut relire). Après une correction de l'enseignant·e, l'élève ne revient pas en arrière : la page ne propose pas de restaurer l'ancienne version.
- **Interroger au plus toutes les quelques secondes** (`go_retours`), ou à l'ouverture : jamais de canal temps réel.
- **Valider ce qu'elle reçoit** avant de l'afficher : `HGAnalyse.dossierValide` pour un dossier (côté élève comme côté enseignant·e), et tout texte échappé. La base ne vérifie que la forme générale (un objet de version `v: 1`) et la taille.
- **Calculer le résumé** à chaque enregistrement (étape, nombre de questions, de points, de mots, de sources, oraux faits…) : c'est lui que lit le tableau de la classe.
- **Les liens des retours** (ressources suggérées) ne s'ouvrent que s'ils commencent par `https://` ou `http://`.

## La liste des 64 mots

Thème nouveau, « la scène et la parole » : des noms communs concrets, de 4 à 8 lettres, sans accent, connus des élèves et faciles à épeler ; ni métier, ni insulte, ni partie du corps, ni religion, ni politique ; aucun ne commence par PROF ni GB.

`python3 -I supabase/verifier_liste.py` prouve : 64 mots différents ; aucun n'est le début d'un autre ; une distance d'édition d'au moins 3 entre deux mots de la liste ; aucune suite gênante, ni dans un mot, ni à la jonction de deux mots d'un code ; la liste du SQL est celle du script. Avec les autres listes, il demande : aucun mot commun, aucun début d'un autre, une distance d'au moins 2. La liste de Court-circuit (l'atelier) y est recopiée ; celles de Gombessa, de Lagon Arena et d'Alien Python (annexe A de `architecture/codes-acces.md`) se donnent dans un fichier texte, `--autres listes.txt` (une ligne par application : `gombessa : CORAIL MANTA …`). Sans elles, le script répond « incomplet » (code 2).

## Appliquer

1. L'enseignant lit `0001-dossiers.sql` (et `0006-registre-grand-oral.sql` du site) et donne son accord.
2. Le chef d'orchestre applique `0001-dossiers.sql` par `apply_migration`, sous le nom `grand_oral_0001_dossiers`, sans les lignes `begin;` et `commit;` ; puis `base_unique_0006_registre_grand_oral` (ordre indifférent).
3. Le Gardien vérifie par les métadonnées (ci-dessous) et l'inscrit au journal.
4. Ensuite seulement, la page passe à sa version en ligne, dans une branche publiée par le Gardien.

## Vérifier, sans lire aucune donnée

```sql
-- les tables : RLS, aucun droit pour anon ni authenticated (attendu : 5 lignes, rls vrai, droits faux)
select c.relname, c.relrowsecurity as rls,
  has_table_privilege('anon', c.oid, 'select, insert, update, delete, truncate, references, trigger, maintain') as droits_anon,
  has_table_privilege('authenticated', c.oid, 'select, insert, update, delete, truncate, references, trigger, maintain') as droits_authenticated
from pg_class c where c.relnamespace = 'grand_oral'::regnamespace and c.relkind = 'r';

-- le schéma fermé (attendu : false, false)
select has_schema_privilege('anon', 'grand_oral', 'usage'), has_schema_privilege('authenticated', 'grand_oral', 'usage');

-- les fonctions d'entrée (attendu : 24 lignes, toutes definer, anon vrai, authenticated faux)
select p.proname, p.prosecdef as definer, p.proconfig, has_function_privilege('anon', p.oid, 'execute') as anon,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated
from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname like 'go\_%' order by 1;

-- les fonctions internes (attendu : 10, appelables par personne)
select count(*), bool_or(has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))
from pg_proc p where p.pronamespace = 'grand_oral'::regnamespace;

-- les mots (attendu : 64) et les comptes (attendu : 0, 0, 0 juste après l'application)
select (select count(*) from grand_oral.mots) as mots, (select count(*) from grand_oral.enseignants) as espaces,
  (select count(*) from grand_oral.classes) as classes, (select count(*) from grand_oral.eleves) as eleves;
```

Puis les conseillers (`get_advisors`) : seuls « RLS sans règle » (0008) pour les 5 tables et « security definer appelable par anon » (0028) pour les 24 fonctions `go_` sont attendus.

## L'essai local

```
python3 -I supabase/essais_locaux.py --socle <dépôt du site>/supabase/schema.sql --registre <dossier>/0006-registre-grand-oral.sql
```

Le script lance un PostgreSQL 16 local neuf dans un dossier temporaire (rôles `anon`, `authenticated` et `service_role` comme Supabase, `pgcrypto` dans `extensions`, socle commun appliqué), joue tout avec des données inventées, puis l'efface. Jamais sur la base en ligne. **Résultat du 17/11/2026 : 156 contrôles, 156 réussis.** Ce qui est vérifié :
- les fichiers : `begin;` et `commit;`, aucun caractère invisible, `schema.sql` identique à 0001 à partir du garde-fou, la liste des mots ;
- les garde-fous : refus hors du rôle `postgres`, sans le socle, ou si un schéma `grand_oral` ou une fonction `go_` d'ailleurs existe (et rien n'est créé) ;
- l'application, puis la relance sans aucun effet (même schéma) ; les droits, la RLS sans règle, les commentaires sur chaque table, colonne et fonction ;
- en rôle `anon`, comme la page : le parcours de l'enseignant·e (espace, classes, tableau, dossier, retours, correction, nouveaux codes, renommages, inscriptions fermées puis ouvertes, suppressions, export, changement de son code) et de l'élève (lien de classe, inscription, deux appareils, sauvegardes, retours) ;
- les conflits de version : deux appareils d'un·e élève, deux onglets de l'enseignant·e, la correction que l'élève ne peut pas écraser ;
- les bornes : dossier de 300 000 caractères accepté et de 300 001 refusé, résumé, retours, pseudo et noms (trop courts, trop longs, avec un caractère invisible ou de contrôle de sens), forme du dossier ;
- le cloisonnement : 11 fonctions de l'enseignant·e A essayées sur la classe et l'élève de B, toutes « introuvable », rien de changé chez B ; l'export de A sans rien de B ; un·e élève qui ne voit rien d'un·e autre ; jetons inventés, mal formés, périmés (31 jours), 5 appareils au plus, déconnexion ;
- le compteur d'essais : 20 échecs d'élève, 10 d'enseignant·e, 30 de code de classe, 60 créations, puis refus sur ce réseau seulement ; 0,3 s d'attente ; déblocage par l'enseignant·e, sans effet sur les autres réseaux ni sur les autres applications ; aucune adresse en clair ;
- la charge : une classe de 60 élèves aux dossiers de 100 000 caractères, tableau et export en moins de 0,1 s (le délai d'`anon` sur Supabase est de 3 s) ;
- les tirages : 5 000 codes d'élèves tous différents (chaque mot tiré de 124 à 185 fois sur 10 000, chaque centaine de 466 à 532 fois), 1 000 codes d'enseignant·e·s, 2 000 codes de classe, sans doublon ;
- l'inverse : le schéma revient exactement à l'état de départ (comparaison de `pg_dump`), les compteurs de Hello GO sont effacés et ceux des autres applications restent ; relancé sans effet ; il s'arrête si un objet d'ailleurs se sert de `grand_oral` ; 0001 se rapplique ensuite à l'identique ;
- `schema.sql` sur une base neuve de collègue : le même schéma, relançable ;
- le fichier `0006` du socle : le registre range les 5 tables (`eleves` et `sessions` : données d'élèves), relance sans effet, inverse à l'identique.

**Ce qui peut différer sur la base en ligne (PostgreSQL 17, Supabase) :**
- PostgreSQL 16 n'a pas le droit `maintain` : les copies essayées n'avaient pas les mots `, maintain`, et le reste de leur texte était identique aux fichiers. En 17, le contrôle final le vérifie en plus.
- En local, `postgres` est superutilisateur ; sur Supabase, non. Rien dans le fichier ne demande plus que ce qu'ont demandé Court-circuit et le socle (créer un schéma, des tables, des fonctions `security definer`).
- L'adresse du réseau vient de l'en-tête `cf-connecting-ip` ou de `x-forwarded-for` (`commun.reseau()`) : les essais ont simulé `x-forwarded-for`.
- L'API refuse elle-même un uuid mal formé (erreur 400) et coupe un appel d'`anon` au-delà de 3 s.

## Revenir en arrière

1. Remettre la page dans sa version sans base, publiée : elle n'appelle plus les fonctions (règles M6 et M7 : on retire en deux temps, la page d'abord).
2. Chaque enseignant·e télécharge l'export de son espace, ou l'enseignant exporte les tables `grand_oral.*` (Table Editor, export ; règle M8). L'export reste hors du dépôt.
3. `0001-dossiers-inverse.sql`, par `apply_migration`, sous le nom `grand_oral_0001_dossiers_inverse`.

## Installer sa copie (un·e collègue)

1. Créer son projet Supabase (gratuit), y lancer `supabase/schema.sql` du site (le socle commun), puis `schema.sql` de ce dossier.
2. Mettre l'adresse de son projet et sa clé publique (`sb_publishable_…`) dans la configuration de la page.
3. Garder la même liste de mots, pour que les codes restent lisibles partout.
