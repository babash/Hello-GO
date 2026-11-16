#!/usr/bin/env python3
"""Hello GO : contrôle de la liste des 64 mots des codes (thème « la scène et la parole »).

Ce que le script prouve (spécification des codes, § 1.3, et consigne de la tâche T73) :
  1. 64 mots, tous différents, de 4 à 8 lettres majuscules sans accent (A à Z) ;
  2. aucun mot ne commence par PROF ni par GB ;
  3. aucun mot n'est le début d'un autre, dans la liste comme avec les listes des autres applications ;
  4. une distance d'édition (Levenshtein) d'au moins 3 entre deux mots de la liste,
     et d'au moins 2 avec chaque mot des autres listes ;
  5. aucune suite de lettres gênante, ni dans un mot, ni à la jonction de deux mots d'un code ;
  6. la liste de 0001-dossiers.sql et celle de schema.sql sont exactement celle de ce script, dans le même ordre.

Les listes des autres applications : celle de Court-circuit (l'atelier) est recopiée ici, depuis
snt/fichiers/court-circuit/supabase/0001-codes-eleves.sql du site. Celles de Gombessa (la mer),
de Lagon Arena (l'île) et d'Alien Python (l'espace) sont dans l'annexe A de architecture/codes-acces.md :
on les donne dans un fichier texte (une ligne par application : « nom : MOT MOT MOT… ») avec
--autres FICHIER. Sans elles, le contrôle est déclaré incomplet (code de sortie 2).

Usage : python3 -I supabase/verifier_liste.py [--autres listes.txt]
Code de sortie : 0 tout est bon ; 1 une règle n'est pas tenue ; 2 bon, mais des listes manquent.
"""
import pathlib
import re
import sys

LISTE = [
    'MICRO', 'RIDEAU', 'ESTRADE', 'PUPITRE', 'PODIUM', 'COULISSE', 'GRADIN', 'FAUTEUIL',
    'BILLET', 'AFFICHE', 'SPOT', 'TAPIS', 'CARNET', 'CAHIER', 'STYLO', 'FEUILLE',
    'LIVRE', 'ALBUM', 'DISQUE', 'VINYLE', 'COSTUME', 'CRAVATE', 'CHAPEAU', 'BOUQUET',
    'RUBAN', 'BADGE', 'SIFFLET', 'TAMBOUR', 'GUITARE', 'PIANO', 'VIOLON', 'SAXO',
    'CYMBALE', 'BANJO', 'UKULELE', 'CLAIRON', 'HAUTBOIS', 'CHANSON', 'REFRAIN', 'COUPLET',
    'JOURNAL', 'DIALOGUE', 'SCRIPT', 'LETTRE', 'PODCAST', 'CLIP', 'FILM', 'TICKET',
    'PANTIN', 'AGENDA', 'LANTERNE', 'BOUGIE', 'CHRONO', 'HORLOGE', 'TABLEAU', 'ARDOISE',
    'PLUME', 'GONG', 'CLOCHE', 'MIROIR', 'TRIANGLE', 'FANFARE', 'BAGUETTE', 'TROMBONE',
]

AUTRES = {
    'court_circuit (l\'atelier)': [
        'MARTEAU', 'PINCE', 'SCIE', 'ENCLUME', 'PERCEUSE', 'BOULON', 'ECROU', 'RIVET',
        'CHEVILLE', 'RESSORT', 'LEVIER', 'TREUIL', 'ROUAGE', 'PISTON', 'MOTEUR', 'DYNAMO',
        'FUSIBLE', 'BOBINE', 'AIMANT', 'DIODE', 'PRISE', 'AMPOULE', 'LAMPE', 'TORCHE',
        'SOUDURE', 'CUIVRE', 'NICKEL', 'BRONZE', 'CHROME', 'VOLT', 'WATT', 'AMPERE',
        'TENSION', 'COURANT', 'CIRCUIT', 'BATTERIE', 'RELAIS', 'FICHE', 'NEON', 'CAPTEUR',
        'TENAILLE', 'SPATULE', 'EQUERRE', 'NIVEAU', 'REGLE', 'CRAYON', 'GOMME', 'ROULEAU',
        'COLLE', 'AGRAFE', 'PUNAISE', 'VERNIS', 'MASTIC', 'TRUELLE', 'BROUETTE', 'ECHELLE',
        'ETABLI', 'SOURIS', 'PIXEL', 'TURBINE', 'HELICE', 'TABLIER', 'COPEAU', 'PLANCHE',
    ],
}
ATTENDUES = ['gombessa', 'lagon', 'alien']

# Suites gênantes cherchées dans chaque mot et à la jonction de deux mots (MOT1 + MOT2, MOT2 + MOT1).
GENANTES = ['CON', 'CUL', 'PUTE', 'PUTIN', 'BITE', 'NAZI', 'SEXE', 'MERDE', 'ZOB', 'NIQUE', 'FION',
            'PENIS', 'SALOP', 'CHIER', 'PORNO', 'GOUINE', 'NEGRE', 'BATARD', 'KKK', 'HITLER', 'VIOL']
# VIOL est cherché à la jonction seulement : VIOLON, instrument, le contient.
DANS_LE_MOT_PERMIS = {('VIOLON', 'VIOL')}


def distance(a, b):
    ligne = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        prec, ligne[0] = ligne[0], i
        for j, y in enumerate(b, 1):
            prec, ligne[j] = ligne[j], min(ligne[j] + 1, ligne[j - 1] + 1, prec + (x != y))
    return ligne[-1]


def liste_du_sql(chemin):
    texte = chemin.read_text(encoding='utf-8')
    m = re.search(r"insert into grand_oral\.mots \(rang, mot\)\s*select .*? from unnest\(array\[(.*?)\]\)", texte, re.S)
    return re.findall(r"'([A-Z]+)'", m.group(1)) if m else None


def lire_autres(chemin):
    autres = {}
    for n, ligne in enumerate(pathlib.Path(chemin).read_text(encoding='utf-8').splitlines(), 1):
        if not ligne.strip() or ligne.lstrip().startswith('#'):
            continue
        nom, _, mots = ligne.partition(':')
        mots = re.findall(r'[A-Z]+', mots.upper())
        if not mots:
            sys.exit(f'{chemin}, ligne {n} : aucune liste lue.')
        autres[nom.strip()] = mots
    return autres


def main(args):
    autres = dict(AUTRES)
    if '--autres' in args:
        autres.update(lire_autres(args[args.index('--autres') + 1]))
    fautes, controles = [], 0

    def regle(vrai, message):
        nonlocal controles
        controles += 1
        if not vrai:
            fautes.append(message)

    regle(len(LISTE) == 64, f'{len(LISTE)} mots au lieu de 64')
    regle(len(set(LISTE)) == len(LISTE), 'un mot est en double')
    for m in LISTE:
        regle(re.fullmatch(r'[A-Z]{4,8}', m) is not None, f'{m} : pas 4 à 8 lettres de A à Z')
        regle(not m.startswith(('PROF', 'GB')), f'{m} : commence par PROF ou GB')
        for g in GENANTES:
            regle(g not in m or (m, g) in DANS_LE_MOT_PERMIS, f'{m} contient {g}')
    for i, a in enumerate(LISTE):
        for b in LISTE[i + 1:]:
            regle(not a.startswith(b) and not b.startswith(a), f'{a} / {b} : l\'un est le début de l\'autre')
            regle(distance(a, b) >= 3, f'{a} / {b} : distance {distance(a, b)} (il faut 3 au moins)')
    for a in LISTE:
        for b in LISTE:
            if a != b:
                jonction = a[-6:] + b[:6]
                for g in GENANTES:
                    regle(g not in jonction or g in a[-6:] or g in b[:6], f'{a}-{b} : {g} à la jonction')
    tous_autres = set()
    for nom, mots in autres.items():
        tous_autres |= set(mots)
        for a in LISTE:
            for b in mots:
                regle(a != b, f'{a} est aussi dans la liste {nom}')
                regle(not a.startswith(b) and not b.startswith(a), f'{a} / {b} ({nom}) : l\'un est le début de l\'autre')
                regle(distance(a, b) >= 2, f'{a} / {b} ({nom}) : distance {distance(a, b)} (il faut 2 au moins)')
    ici = pathlib.Path(__file__).resolve().parent
    for f in ('0001-dossiers.sql', 'schema.sql'):
        if (ici / f).exists():
            regle(liste_du_sql(ici / f) == LISTE, f'{f} : la liste du SQL n\'est pas celle du script')
        else:
            regle(False, f'{f} manque')

    proches = sorted((distance(a, b), a, b, nom) for nom, mots in autres.items() for a in LISTE for b in mots if distance(a, b) <= 2)
    print(f'Liste « la scène et la parole » : {len(LISTE)} mots, {controles} contrôles, {len(fautes)} faute(s).')
    print('Distance minimale dans la liste :', min(distance(a, b) for i, a in enumerate(LISTE) for b in LISTE[i + 1:]))
    if proches:
        print('Paires à distance 2 avec une autre liste (permis, à connaître) :', ', '.join(f'{a}/{b}' for _, a, b, _ in proches))
    for f in fautes:
        print('  FAUTE :', f)
    manquantes = [a for a in ATTENDUES if not any(n.startswith(a) for n in autres)]
    if fautes:
        return 1
    if manquantes:
        print('INCOMPLET : listes non comparées (annexe A de architecture/codes-acces.md, à donner avec --autres) :', ', '.join(manquantes))
        return 2
    print('Tout est bon, toutes listes comparées.')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
