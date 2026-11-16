#!/usr/bin/env python3
"""Hello GO : essais de la migration 0001 sur une reproduction locale de la base (jamais sur la base en ligne).

Ce que fait le script, de bout en bout, avec des données inventées :
  1. lance un PostgreSQL local neuf dans un dossier temporaire (initdb, pg_ctl), avec les rôles de Supabase
     (anon, authenticated, service_role ; postgres propriétaire), le schéma extensions avec pgcrypto, et le
     socle commun du site (supabase/schema.sql du dépôt Babash-NSI-SNT) ;
  2. applique 0001-dossiers.sql, le relance (sans effet), vérifie les droits et le registre ;
  3. joue en rôle anon, comme la page par l'API : le parcours de l'élève et de l'enseignant·e, les conflits
     de version, les bornes de taille, le cloisonnement, les jetons périmés, le compteur d'essais ;
  4. tire 5 000 codes d'élèves, 1 000 codes d'enseignant·e·s et 2 000 codes de classe (sans doublon, sans biais visible) ;
  5. applique l'inverse (l'état de départ revient à l'identique), puis 0001 de nouveau, et schema.sql sur une base neuve ;
  6. si on lui donne les fichiers 0006 du socle (--registre), les essaie aussi (application, relance, inverse).

PostgreSQL 16 ne connaît pas le droit MAINTAIN (nouveau dans PostgreSQL 17, la version de la base en ligne) :
les copies essayées n'ont pas les mots « , maintain », et le reste de leur texte est identique aux fichiers.

Usage (en root ou non : en root, le serveur tourne sous l'utilisateur postgres) :
  python3 -I supabase/essais_locaux.py --socle /chemin/Babash-NSI-SNT/supabase/schema.sql \\
      [--registre 0006-registre-grand-oral.sql] [--pg /usr/lib/postgresql/16/bin] [--garder]
Code de sortie : 0 si tous les contrôles passent.
"""
import argparse
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import time
import uuid
from collections import Counter

ICI = pathlib.Path(__file__).resolve().parent
# Les caractères de contrôle et invisibles, écrits par leur code (règle du dépôt du site, CLAUDE.md, § 4).
INVISIBLES = '[' + ''.join(chr(a) + '-' + chr(b) for a, b in ((0x00, 0x08), (0x0b, 0x1f), (0x7f, 0x9f), (0xad, 0xad), (0x200b, 0x200f), (0x2028, 0x202e), (0x2060, 0x206f), (0xfeff, 0xfeff))) + ']'
OK, KO = [], []


def controle(nom, vrai, detail=''):
    (OK if vrai else KO).append(nom)
    if not vrai:
        print(f'  ÉCHEC : {nom} {detail}')


class Base:
    def __init__(self, pg, dossier, port):
        self.pg, self.dossier, self.port = pathlib.Path(pg), pathlib.Path(dossier), port
        self.sock = self.dossier / 'sock'
        self.root = os.geteuid() == 0

    def _serveur(self, *cmd):
        cmd = [str(self.pg / cmd[0]), *cmd[1:]]
        if self.root:
            cmd = ['runuser', '-u', 'postgres', '--', *cmd]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    def demarrer(self):
        self.dossier.mkdir(parents=True, exist_ok=True)
        self.sock.mkdir(exist_ok=True)
        if self.root:
            shutil.chown(self.dossier, 'postgres')
            shutil.chown(self.sock, 'postgres')
        self._serveur('initdb', '-D', str(self.dossier / 'donnees'), '-U', 'postgres', '-A', 'trust', '-E', 'UTF8', '--locale=C.UTF-8')
        self._serveur('pg_ctl', '-D', str(self.dossier / 'donnees'), '-l', str(self.dossier / 'journal.txt'), '-w', 'start',
                      '-o', f"-p {self.port} -k {self.sock} -c listen_addresses=''")

    def arreter(self):
        self._serveur('pg_ctl', '-D', str(self.dossier / 'donnees'), '-m', 'fast', '-w', 'stop')

    def psql(self, sql=None, fichier=None, base='essais', erreur_permise=False):
        cmd = [str(self.pg / 'psql'), '-h', str(self.sock), '-p', str(self.port), '-U', 'postgres', '-d', base,
               '-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1']
        r = subprocess.run(cmd + (['-f', str(fichier)] if fichier else []), input=sql, capture_output=True, text=True)
        if r.returncode and not erreur_permise:
            raise RuntimeError(f'psql : {r.stderr.strip()}\n--- SQL ---\n{(sql or str(fichier))[:2000]}')
        return r

    def valeur(self, sql, base='essais'):
        return self.psql(sql, base=base).stdout.strip()

    def schema(self, base='essais'):
        r = subprocess.run([str(self.pg / 'pg_dump'), '-h', str(self.sock), '-p', str(self.port), '-U', 'postgres', '-s', base],
                           capture_output=True, text=True, check=True)
        return re.sub(r'^\\(un)?restrict .*$', '', r.stdout, flags=re.M)


def litteral(v):
    if v is None:
        return 'null'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, int):
        return str(v)
    if isinstance(v, (dict, list)):
        v = json.dumps(v, ensure_ascii=False, separators=(',', ':'))
    return "'" + str(v).replace("'", "''") + "'"


def sans_maintain(chemin, dossier, prefixe='pg16-'):
    copie = pathlib.Path(dossier) / (prefixe + pathlib.Path(chemin).name)
    texte = pathlib.Path(chemin).read_text(encoding='utf-8')
    copie.write_text(texte.replace(', maintain', ''), encoding='utf-8')
    return copie


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--socle', required=True, help='supabase/schema.sql du dépôt Babash-NSI-SNT')
    ap.add_argument('--registre', help='0006-registre-grand-oral.sql (son inverse est cherché à côté)')
    ap.add_argument('--pg', default='/usr/lib/postgresql/16/bin')
    ap.add_argument('--port', type=int, default=54373)
    ap.add_argument('--garder', action='store_true', help='ne pas effacer le dossier temporaire')
    a = ap.parse_args()

    tmp = pathlib.Path(tempfile.mkdtemp(prefix='hello-go-base-'))
    if os.geteuid() == 0:
        os.chmod(tmp, 0o755)
    b = Base(a.pg, tmp / 'pg', a.port)
    print('Reproduction locale :', tmp)
    b.demarrer()
    try:
        essais(b, a, tmp)
    finally:
        b.arreter()
        if not a.garder:
            shutil.rmtree(tmp, ignore_errors=True)
    print(f'\n{len(OK) + len(KO)} contrôles : {len(OK)} réussis, {len(KO)} échoués.')
    return 1 if KO else 0


PREPARATION = """
do $$ begin
  if to_regrole('anon') is null then
    create role anon nologin noinherit;
    create role authenticated nologin noinherit;
    create role service_role nologin noinherit bypassrls;
  end if;
end $$;
grant usage on schema public to anon, authenticated, service_role;
create schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;
create extension pgcrypto with schema extensions;
-- la table qui désigne le projet de l'enseignant (garde-fou des fichiers du socle) : vide, inventée
create table public.snt_responses (id integer);
"""


def preparer(b, base):
    b.psql(f'create database {base};', base='postgres')
    b.psql(PREPARATION, base=base)


def essais(b, a, tmp):
    f0001 = sans_maintain(ICI / '0001-dossiers.sql', tmp)
    finv = sans_maintain(ICI / '0001-dossiers-inverse.sql', tmp)
    fschema = sans_maintain(ICI / 'schema.sql', tmp)
    fsocle = sans_maintain(a.socle, tmp, 'pg16-socle-')

    # --- 0. Les fichiers eux-mêmes ---
    print('0. Les fichiers')
    t1 = (ICI / '0001-dossiers.sql').read_text(encoding='utf-8')
    ts = (ICI / 'schema.sql').read_text(encoding='utf-8')
    corps = lambda t: t[t.index('-- Garde-fou'):]
    controle('schema.sql reprend 0001 à l\'identique à partir du garde-fou', corps(t1) == corps(ts))
    for nom, t in (('0001', t1), ('inverse', (ICI / '0001-dossiers-inverse.sql').read_text(encoding='utf-8')), ('schema', ts)):
        lignes = t.rstrip('\n').split('\n')
        controle(f'{nom} : begin; en première ligne et commit; en dernière', lignes[0] == 'begin;' and lignes[-1] == 'commit;')
        controle(f'{nom} : aucun caractère invisible ni de contrôle', not re.search(INVISIBLES, t))
    r = subprocess.run([sys.executable, '-I', str(ICI / 'verifier_liste.py')], capture_output=True, text=True)
    controle('verifier_liste.py : aucune faute (0, ou 2 si des listes manquent)', r.returncode in (0, 2), r.stdout)

    # --- 1. La base de départ ---
    print('1. Préparation, socle commun, garde-fous')
    preparer(b, 'essais')
    b.psql(fichier=fsocle)
    depart = b.schema()
    # garde-fou : pas en postgres
    r = b.psql('set role service_role;\n\\i ' + str(f0001), erreur_permise=True)
    controle('garde-fou : refus hors du rôle postgres', r.returncode != 0 and 'À lancer en postgres' in r.stderr, r.stderr[-300:])
    # garde-fou : un schéma grand_oral venu d'ailleurs
    preparer(b, 'etranger')
    b.psql(fichier=fsocle, base='etranger')
    b.psql('create schema grand_oral;', base='etranger')
    r = b.psql(fichier=f0001, base='etranger', erreur_permise=True)
    controle('garde-fou : refus si un schéma grand_oral étranger existe', r.returncode != 0 and 'ne vient pas de cette migration' in r.stderr)
    b.psql('drop schema grand_oral; create function public.go_x() returns int language sql as $$ select 1 $$;', base='etranger')
    r = b.psql(fichier=f0001, base='etranger', erreur_permise=True)
    controle('garde-fou : refus si une fonction public.go_… étrangère existe', r.returncode != 0 and 'go_' in r.stderr)
    controle('garde-fou : rien n\'a été créé après un refus', b.valeur("select to_regnamespace('grand_oral') is null", base='etranger') == 't')
    preparer(b, 'sanscommun')
    r = b.psql(fichier=f0001, base='sanscommun', erreur_permise=True)
    controle('garde-fou : refus sans le schéma commun', r.returncode != 0 and 'Le schéma commun manque' in r.stderr)

    # --- 2. Application, relance ---
    print('2. Application et relance')
    b.psql(fichier=f0001)
    apres1 = b.schema()
    b.psql(fichier=f0001)
    controle('relance : le schéma reste identique', b.schema() == apres1)
    controle('relance : toujours 64 mots', b.valeur('select count(*) from grand_oral.mots') == '64')
    controle('les mots du SQL sont ceux de verifier_liste.py',
             b.valeur("select string_agg(mot, ',' order by rang) from grand_oral.mots") == ','.join(re.findall(r"'([A-Z]+)'", re.search(r'LISTE = \[(.*?)\]', (ICI / 'verifier_liste.py').read_text(), re.S).group(1))))
    v = b.valeur("""select count(*) filter (where c.relrowsecurity), count(*) from pg_class c where c.relnamespace = 'grand_oral'::regnamespace and c.relkind = 'r'""")
    controle('5 tables, toutes avec la RLS', v == '5|5', v)
    controle('aucune règle RLS', b.valeur("select count(*) from pg_policy p join pg_class c on c.oid = p.polrelid where c.relnamespace = 'grand_oral'::regnamespace") == '0')
    v = b.valeur("""select count(*) from pg_class c where c.relnamespace = 'grand_oral'::regnamespace and c.relkind = 'r'
      and (has_table_privilege('anon', c.oid, 'select, insert, update, delete, truncate, references, trigger')
        or has_table_privilege('authenticated', c.oid, 'select, insert, update, delete, truncate, references, trigger')
        or has_table_privilege('service_role', c.oid, 'select'))""")
    controle('aucun droit sur les tables pour anon, authenticated (ni service_role)', v == '0', v)
    controle('schéma fermé à anon et authenticated', b.valeur("select has_schema_privilege('anon','grand_oral','usage') or has_schema_privilege('authenticated','grand_oral','usage')") == 'f')
    v = b.valeur("""select count(*) from pg_proc p where p.pronamespace = 'grand_oral'::regnamespace
      and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))""")
    controle('10 fonctions internes, appelables par personne',
             v == '0' and b.valeur("select count(*) from pg_proc p where p.pronamespace = 'grand_oral'::regnamespace") == '10', v)
    v = b.valeur("""select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname like 'go\\_%'
      and p.prosecdef and p.proconfig = array['search_path=""'] and has_function_privilege('anon', p.oid, 'execute')
      and not has_function_privilege('authenticated', p.oid, 'execute') and not has_function_privilege('service_role', p.oid, 'execute')""")
    controle('24 fonctions d\'entrée go_ : security definer, search_path vide, anon seul', v == '24', v)
    v = b.valeur("""select count(*) from pg_proc p where p.pronamespace = 'grand_oral'::regnamespace and p.proconfig = array['search_path=""']""")
    controle('fonctions internes à search_path vide', v == '10', v)
    v = b.valeur("""select count(*) from pg_class c join pg_attribute t on t.attrelid = c.oid and t.attnum > 0 and not t.attisdropped
      where c.relnamespace = 'grand_oral'::regnamespace and c.relkind = 'r' and col_description(c.oid, t.attnum) is null""")
    controle('un commentaire sur chaque colonne', v == '0', v)
    v = b.valeur("""select count(*) from pg_class c where c.relnamespace = 'grand_oral'::regnamespace and c.relkind = 'r'
      and obj_description(c.oid, 'pg_class') !~ '^Hello GO\\..*Données d''élèves : (oui|non)'""")
    controle('un commentaire sur chaque table, avec « Données d\'élèves »', v == '0', v)
    v = b.valeur("""select count(*) from pg_proc p where (p.pronamespace = 'grand_oral'::regnamespace or (p.pronamespace = 'public'::regnamespace and p.proname like 'go\\_%'))
      and coalesce(obj_description(p.oid, 'pg_proc'), '') not like 'Hello GO%'""")
    controle('un commentaire sur chaque fonction', v == '0', v)
    controle('aucune ligne d\'élève ni d\'enseignant·e après l\'application',
             b.valeur('select (select count(*) from grand_oral.eleves) + (select count(*) from grand_oral.enseignants) + (select count(*) from grand_oral.classes)') == '0')

    # --- 3. En rôle anon, comme la page ---
    print('3. Parcours en rôle anon')
    def appel(fonction, reseau='10.0.0.1', **params):
        args = ', '.join(f'{k} => {litteral(v)}' + ('::json' if isinstance(v, (dict, list)) else '') + ('::uuid' if k in ('p_jeton', 'p_classe', 'p_eleve') and v is not None else '')
                         for k, v in params.items())
        entetes = json.dumps({'x-forwarded-for': reseau + ', 172.16.0.1'})
        sql = f"set role anon;\nset request.headers = {litteral(entetes)};\nselect public.{fonction}({args});"
        r = b.psql(sql, erreur_permise=True)
        if r.returncode:
            return {'erreur': r.stderr.strip()}
        return json.loads(r.stdout.strip())

    def en_anon(sql):
        return b.psql('set role anon;\n' + sql, erreur_permise=True)

    # lecture directe interdite
    for objet in ('grand_oral.eleves', 'grand_oral.mots', 'commun.essais', 'commun.secret'):
        r = en_anon(f'select count(*) from {objet};')
        controle(f'anon ne lit pas {objet}', r.returncode != 0 and 'permission denied' in r.stderr)
    r = en_anon("select grand_oral.normaliser_code('x');")
    controle('anon n\'appelle pas une fonction interne', r.returncode != 0 and 'permission denied' in r.stderr)
    r = en_anon("select commun.debloquer_reseau('grand_oral');")
    controle('anon n\'appelle pas commun directement', r.returncode != 0 and 'permission denied' in r.stderr)
    r = b.psql("set role authenticated;\nselect public.go_connexion('x');", erreur_permise=True)
    controle('authenticated n\'appelle pas les fonctions go_', r.returncode != 0 and 'permission denied' in r.stderr)

    # Enseignant·e A
    r = appel('go_prof_creer_espace', p_nom='  M.   Martin ')
    controle('créer un espace', r.get('ok') is True and r['nom'] == 'M. Martin' and re.fullmatch(r'[A-Z]{4,8}-[A-Z]{4,8}-[A-Z]{4,8}-\d{4}', r['code_affiche'] or ''), r)
    code_a = r['code_affiche']
    controle('le code enseignant·e n\'est gardé qu\'en empreinte',
             b.valeur(f"select count(*) from grand_oral.enseignants where code_empreinte = encode(sha256(convert_to('grand_oral|' || {litteral(code_a.replace('-', ''))} || '|' || (select sel from commun.secret), 'UTF8')), 'hex')") == '1'
             and b.valeur(f"select count(*) from grand_oral.enseignants e where e::text like '%{code_a.split('-')[0]}%'") == '0')
    r = appel('go_prof_creer_espace', p_nom='X')
    controle('nom affiché trop court refusé', r.get('ok') is False and 'message' in r, r)
    r = appel('go_prof_creer_espace', p_nom='Mme' + chr(0x200b) + 'Diallo')
    controle('nom affiché avec un caractère invisible refusé', r.get('ok') is False, r)
    r = appel('go_prof_ouvrir', p_code=code_a.lower().replace('-', ' '))
    controle('ouvrir son espace (code en minuscules, avec espaces)', r.get('ok') is True and r['nom'] == 'M. Martin' and r['classes'] == [] and r['alarme'] is False, r)
    r = appel('go_prof_creer_classe', p_code=code_a, p_nom='Terminale NSI 1')
    controle('créer une classe', r.get('ok') is True and re.fullmatch(r'[A-HJ-NP-Z]{4}', r.get('code') or '') and r['ouverte'] is True, r)
    classe_a, code_classe_a = r['id'], r['code']
    r = appel('go_prof_creer_classe', p_code=code_a, p_nom='')
    controle('nom de classe vide refusé', r.get('ok') is False, r)
    r = appel('go_prof_creer_classe', p_code=code_a, p_nom='Terminale NSI 2')
    classe_a2 = r['id']
    r = appel('go_prof_renommer_classe', p_code=code_a, p_classe=classe_a2, p_nom='Tle NSI groupe 2')
    controle('renommer une classe', r.get('ok') is True and r['nom'] == 'Tle NSI groupe 2', r)

    # Enseignant·e B
    r = appel('go_prof_creer_espace', p_nom='Mme Diallo', reseau='10.0.0.2')
    code_b = r['code_affiche']
    r = appel('go_prof_creer_classe', p_code=code_b, p_nom='Terminale NSI B', reseau='10.0.0.2')
    classe_b, code_classe_b = r['id'], r['code']

    # Élèves
    r = appel('go_classe_par_code', p_code_classe=code_classe_a.lower())
    controle('le lien de classe (code en minuscules)', r.get('ok') is True and r['classe'] == 'Terminale NSI 1' and r['enseignant'] == 'M. Martin' and r['ouverte'] is True, r)
    r = appel('go_inscription', p_code_classe=code_classe_a, p_pseudo='Inès B.')
    controle('inscription', r.get('ok') is True and re.fullmatch(r'[A-Z]{4,8}-[A-Z]{4,8}-\d{3}', r.get('code_affiche') or '') and r.get('jeton') and r['classe'] == 'Terminale NSI 1', r)
    ines_code, ines_j1 = r['code_affiche'], r['jeton']
    r = appel('go_inscription', p_code_classe=code_classe_a, p_pseudo='Inès Benali-Martinez de la Fontaine')
    controle('pseudo de plus de 24 caractères refusé', r.get('ok') is False, r)
    r = appel('go_inscription', p_code_classe=code_classe_a, p_pseudo='I')
    controle('pseudo d\'un caractère refusé', r.get('ok') is False, r)
    r = appel('go_inscription', p_code_classe=code_classe_a, p_pseudo='Té' + chr(0x202e) + 'o')
    controle('pseudo avec un caractère de contrôle de sens refusé', r.get('ok') is False, r)
    r = appel('go_inscription', p_code_classe=code_classe_a, p_pseudo='Noah K.')
    noah_code, noah_j = r['code_affiche'], r['jeton']
    r = appel('go_inscription', p_code_classe=code_classe_b, p_pseudo='Léa T.', reseau='10.0.0.2')
    lea_code, lea_j = r['code_affiche'], r['jeton']

    r = appel('go_reprise', p_jeton=ines_j1)
    controle('reprise d\'un compte neuf', r.get('ok') is True and r['pseudo'] == 'Inès B.' and r['code_affiche'] == ines_code
             and r['dossier'] is None and r['dossier_version'] == 0 and r['retours'] == {} and r['retours_version'] == 0, r)
    # deuxième appareil
    r = appel('go_connexion', p_code=ines_code.lower().replace('-', ' '))
    controle('connexion sur un 2e appareil (code tapé en minuscules)', r.get('ok') is True and r['jeton'] != ines_j1 and r['pseudo'] == 'Inès B.', r)
    ines_j2 = r['jeton']
    controle('le 1er appareil garde sa session', appel('go_reprise', p_jeton=ines_j1).get('ok') is True)

    dossier = {'v': 1, 'profil': {'prenom': 'Inès', 'vu': True}, 'questions': [{'id': 'q1', 'titre': 'Les algorithmes sont-ils neutres ?', 'statut': 'brouillon', 'echange': [], 'parties': []}],
               'mots': [], 'sources': [], 'oraux': []}
    resume = {'etape': 'construire', 'questions': 1, 'points': 0}
    r = appel('go_sauvegarde', p_jeton=ines_j1, p_dossier=dossier, p_resume=resume, p_version_connue=0)
    controle('sauvegarde v0 → v1', r.get('ok') is True and r['dossier_version'] == 1, r)
    dossier['questions'][0]['titre'] = 'Les algorithmes de recommandation sont-ils neutres ?'
    r = appel('go_sauvegarde', p_jeton=ines_j2, p_dossier=dossier, p_resume=resume, p_version_connue=0)
    controle('conflit : le 2e appareil sur une version ancienne est refusé, avec le dossier en base',
             r.get('ok') is False and r.get('conflit') is True and r['dossier_version'] == 1
             and r['dossier']['questions'][0]['titre'] == 'Les algorithmes sont-ils neutres ?', r)
    r = appel('go_sauvegarde', p_jeton=ines_j2, p_dossier=dossier, p_resume=None, p_version_connue=1)
    controle('sauvegarde sur la bonne version (résumé gardé)', r.get('ok') is True and r['dossier_version'] == 2, r)
    controle('résumé gardé quand il n\'est pas envoyé', b.valeur("select resume->>'etape' from grand_oral.eleves where pseudo = 'Inès B.'") == 'construire')
    # bornes de taille et forme
    gros = {'v': 1, 'texte': 'a' * (300000 - 20)}
    long = len(json.dumps(gros, ensure_ascii=False, separators=(',', ':')))
    t0 = time.time()
    r = appel('go_sauvegarde', p_jeton=ines_j1, p_dossier=gros, p_resume=resume, p_version_connue=2)
    duree = time.time() - t0
    controle(f'dossier de {long} caractères accepté (300 000 au plus)', r.get('ok') is True and r['dossier_version'] == 3, r)
    print(f'   sauvegarde d\'un dossier de {long} caractères : {duree:.2f} s (appel psql compris)')
    controle(f'sauvegarde de 300 000 caractères en moins de 3 s ({duree:.2f} s, délai d\'anon sur Supabase)', duree < 3)
    gros['texte'] += 'a' * 21
    r = appel('go_sauvegarde', p_jeton=ines_j1, p_dossier=gros, p_resume=resume, p_version_connue=3)
    controle('dossier de 300 001 caractères refusé', r.get('ok') is False and 'Trop long' in r.get('message', '') and '300 000' in r['message'], r)
    r = appel('go_sauvegarde', p_jeton=ines_j1, p_dossier={'v': 2}, p_resume=resume, p_version_connue=3)
    controle('dossier d\'une autre forme (v: 2) refusé', r.get('ok') is False and 'Hello GO' in r.get('message', ''), r)
    r = appel('go_sauvegarde', p_jeton=ines_j1, p_dossier=[1, 2], p_resume=resume, p_version_connue=3)
    controle('dossier qui n\'est pas un objet refusé', r.get('ok') is False, r)
    r = appel('go_sauvegarde', p_jeton=ines_j1, p_dossier=dossier, p_resume={'x': 'y' * 4000}, p_version_connue=3)
    controle('résumé de plus de 4 000 caractères refusé', r.get('ok') is False and 'résumé' in r.get('message', ''), r)
    r = appel('go_sauvegarde', p_jeton=ines_j1, p_dossier=dossier, p_resume=resume, p_version_connue=None)
    controle('version absente refusée', r.get('ok') is False, r)
    r = appel('go_sauvegarde', p_jeton=ines_j1, p_dossier=dossier, p_resume=resume, p_version_connue=3)
    controle('dossier normal de nouveau (v4)', r.get('ok') is True and r['dossier_version'] == 4, r)

    # retours (appel léger)
    r = appel('go_retours', p_jeton=ines_j1, p_version_connue=0)
    controle('retours : rien de neuf', r.get('ok') is True and r['change'] is False and 'retours' not in r and r['dossier_version'] == 4, r)

    # Enseignant·e A suit sa classe
    r = appel('go_prof_ouvrir', p_code=code_a)
    k = {c['id']: c for c in r['classes']}
    controle('ouvrir : ses 2 classes, avec le nombre d\'élèves', len(r['classes']) == 2 and k[classe_a]['eleves'] == 2 and k[classe_a2]['eleves'] == 0, r)
    r = appel('go_prof_classe', p_code=code_a, p_classe=classe_a)
    el = {e['pseudo']: e for e in r.get('eleves', [])}
    controle('tableau de classe : élèves, codes, résumé, versions, sans les dossiers',
             r.get('ok') is True and set(el) == {'Inès B.', 'Noah K.'} and el['Inès B.']['code_affiche'] == ines_code
             and el['Noah K.']['code_affiche'] == noah_code and el['Inès B.']['resume'] == resume and el['Inès B.']['dossier_version'] == 4
             and 'dossier' not in el['Inès B.'] and el['Inès B.']['vu_le'], r)
    ines_id = el['Inès B.']['id']
    r = appel('go_prof_dossier', p_code=code_a, p_eleve=ines_id)
    controle('lire le dossier d\'un·e élève', r.get('ok') is True and r['dossier'] == dossier and r['dossier_version'] == 4 and r['retours_version'] == 0, r)
    retours = {'points': {'q1': [{'texte': 'Précise « neutres » : pour qui ?', 'type': 'commentaire'}]},
               'definitions': ['algorithme de recommandation'], 'ressources': [{'titre': 'CNIL', 'lien': 'https://www.cnil.fr/'}],
               'validations': {'q1': 'validee'}, 'oraux': {}}
    r = appel('go_prof_retours', p_code=code_a, p_eleve=ines_id, p_retours=retours, p_version_connue=0)
    controle('écrire des retours (v1)', r.get('ok') is True and r['retours_version'] == 1, r)
    r = appel('go_prof_retours', p_code=code_a, p_eleve=ines_id, p_retours={'autre': 1}, p_version_connue=0)
    controle('retours : conflit entre deux onglets, avec les retours en base', r.get('ok') is False and r.get('conflit') is True and r['retours'] == retours, r)
    r = appel('go_prof_retours', p_code=code_a, p_eleve=ines_id, p_retours={'x': 'y' * 150000}, p_version_connue=1)
    controle('retours de plus de 150 000 caractères refusés', r.get('ok') is False and 'retours' in r.get('message', ''), r)
    r = appel('go_retours', p_jeton=ines_j2, p_version_connue=0)
    controle('l\'élève reçoit les retours changés', r.get('ok') is True and r['change'] is True and r['retours'] == retours and r['retours_version'] == 1, r)
    r = appel('go_retours', p_jeton=ines_j2, p_version_connue=1)
    controle('puis plus rien tant qu\'ils ne changent pas', r.get('change') is False, r)
    # correction directe
    corrige = json.loads(json.dumps(dossier))
    corrige['questions'][0]['titre'] = 'Les algorithmes de recommandation sont-ils neutres ?'
    r = appel('go_prof_corriger', p_code=code_a, p_eleve=ines_id, p_dossier=corrige, p_version_connue=3)
    controle('correction sur une version ancienne refusée', r.get('ok') is False and r.get('conflit') is True and r['dossier_version'] == 4, r)
    r = appel('go_prof_corriger', p_code=code_a, p_eleve=ines_id, p_dossier=corrige, p_version_connue=4)
    controle('correction directe (v5)', r.get('ok') is True and r['dossier_version'] == 5, r)
    r = appel('go_retours', p_jeton=ines_j1, p_version_connue=1)
    controle('l\'appel léger signale le nouveau dossier (version 5)', r.get('dossier_version') == 5, r)
    r = appel('go_sauvegarde', p_jeton=ines_j1, p_dossier=dossier, p_resume=resume, p_version_connue=4)
    controle('l\'élève ne peut pas écraser la correction : refus et dossier corrigé renvoyé',
             r.get('conflit') is True and r['dossier'] == corrige and r['dossier_version'] == 5
             and 'enseignant' not in r.get('message', ''), r)

    # Cloisonnement
    print('   cloisonnement')
    lea_id = b.valeur("select id from grand_oral.eleves where pseudo = 'Léa T.'")
    for f, p in (('go_prof_classe', {'p_classe': classe_b}), ('go_prof_dossier', {'p_eleve': lea_id}),
                 ('go_prof_retours', {'p_eleve': lea_id, 'p_retours': {'x': 1}, 'p_version_connue': 0}),
                 ('go_prof_corriger', {'p_eleve': lea_id, 'p_dossier': {'v': 1}, 'p_version_connue': 0}),
                 ('go_prof_nouveau_code_eleve', {'p_eleve': lea_id}), ('go_prof_renommer_eleve', {'p_eleve': lea_id, 'p_pseudo': 'Pirate'}),
                 ('go_prof_supprimer_eleve', {'p_eleve': lea_id}), ('go_prof_renommer_classe', {'p_classe': classe_b, 'p_nom': 'Pirate'}),
                 ('go_prof_ouvrir_inscriptions', {'p_classe': classe_b, 'p_ouverte': False}), ('go_prof_supprimer_classe', {'p_classe': classe_b}),
                 ('go_prof_export', {'p_classe': classe_b})):
        r = appel(f, p_code=code_a, **p)
        controle(f'{f} : A n\'atteint pas la classe ou l\'élève de B', r.get('ok') is False and 'introuvable' in r.get('message', ''), r)
    v = b.valeur("select pseudo || '|' || dossier_version || '|' || retours_version || '|' || (select ouverte::text || nom from grand_oral.classes where id = e.classe_id) from grand_oral.eleves e where pseudo = 'Léa T.'")
    controle('rien n\'a changé chez B', v == 'Léa T.|0|0|trueTerminale NSI B', v)
    r = appel('go_prof_ouvrir', p_code=code_b, reseau='10.0.0.2')
    controle('B ne voit que sa classe', [c['id'] for c in r['classes']] == [classe_b], r)
    r = appel('go_prof_export', p_code=code_a)
    texte = json.dumps(r, ensure_ascii=False)
    controle('l\'export de A ne contient rien de B', r.get('ok') is True and 'Léa' not in texte and lea_code not in texte and 'Diallo' not in texte)
    r = appel('go_reprise', p_jeton=lea_j)
    texte = json.dumps(r, ensure_ascii=False)
    controle('Léa ne voit que son propre dossier', r.get('pseudo') == 'Léa T.' and 'Inès' not in texte and 'Noah' not in texte and ines_code not in texte, r)
    r = appel('go_reprise', p_jeton=str(uuid.uuid4()))
    controle('un jeton inventé ne donne rien', r.get('ok') is False and 'expiré' in r.get('message', ''), r)
    r = appel('go_sauvegarde', p_jeton=str(uuid.uuid4()), p_dossier=dossier, p_resume=resume, p_version_connue=0)
    controle('un jeton inventé n\'enregistre rien', r.get('ok') is False, r)
    r = appel('go_reprise', p_jeton='pas-un-uuid')
    controle('un jeton mal formé est refusé (erreur, comme le 400 de l\'API)', 'erreur' in r, r)
    # jeton périmé (30 jours sans usage)
    b.psql(f"update grand_oral.sessions set vu_le = now() - interval '31 days' where jeton = {litteral(noah_j)};")
    r = appel('go_reprise', p_jeton=noah_j)
    controle('un jeton sans usage depuis 31 jours est périmé', r.get('ok') is False, r)
    r = appel('go_connexion', p_code=noah_code)
    controle('le code redonne un jeton, et le jeton périmé est effacé',
             r.get('ok') is True and b.valeur(f"select count(*) from grand_oral.sessions where jeton = {litteral(noah_j)}") == '0', r)
    noah_j = r['jeton']
    # 5 appareils au plus
    jetons = [appel('go_connexion', p_code=noah_code)['jeton'] for _ in range(6)]
    controle('5 sessions au plus par élève', b.valeur("select count(*) from grand_oral.sessions s join grand_oral.eleves e on e.id = s.eleve_id where e.pseudo = 'Noah K.'") == '5')
    controle('les plus anciennes partent, la plus récente marche', appel('go_reprise', p_jeton=noah_j).get('ok') is False and appel('go_reprise', p_jeton=jetons[-1]).get('ok') is True)
    r = appel('go_deconnexion', p_jeton=jetons[-1])
    controle('déconnexion : le jeton de cet appareil ne marche plus', r.get('ok') is True and appel('go_reprise', p_jeton=jetons[-1]).get('ok') is False
             and appel('go_reprise', p_jeton=jetons[-2]).get('ok') is True, r)
    # visite écrite au plus une fois par 10 minutes
    b.psql("update grand_oral.sessions set vu_le = now() - interval '5 minutes'; update grand_oral.eleves set vu_le = now() - interval '5 minutes';")
    appel('go_retours', p_jeton=ines_j1, p_version_connue=1)
    controle('appel léger : pas d\'écriture de la visite avant 10 minutes', b.valeur("select vu_le < now() - interval '4 minutes' from grand_oral.eleves where pseudo = 'Inès B.'") == 't')
    b.psql("update grand_oral.sessions set vu_le = now() - interval '11 minutes'; update grand_oral.eleves set vu_le = now() - interval '11 minutes';")
    appel('go_retours', p_jeton=ines_j1, p_version_connue=1)
    controle('appel léger : visite écrite après 10 minutes', b.valeur("select vu_le > now() - interval '1 minute' from grand_oral.eleves where pseudo = 'Inès B.'") == 't')

    # Gestion par l'enseignant·e
    print('   gestion par l\'enseignant·e')
    r = appel('go_prof_nouveau_code_eleve', p_code=code_a, p_eleve=ines_id)
    controle('nouveau code d\'élève', r.get('ok') is True and r['code_affiche'] != ines_code, r)
    nouveau_ines = r['code_affiche']
    controle('l\'ancien code ne marche plus', appel('go_connexion', p_code=ines_code, reseau='10.9.9.9').get('ok') is False)
    controle('les anciens jetons ne marchent plus', appel('go_reprise', p_jeton=ines_j1).get('ok') is False and appel('go_reprise', p_jeton=ines_j2).get('ok') is False)
    r = appel('go_connexion', p_code=nouveau_ines)
    controle('le nouveau code marche, le dossier est intact', r.get('ok') is True and appel('go_reprise', p_jeton=r['jeton'])['dossier'] == corrige, r)
    ines_j3 = r['jeton']
    r = appel('go_prof_renommer_eleve', p_code=code_a, p_eleve=ines_id, p_pseudo='Inès Bm.')
    controle('renommer un·e élève', r.get('ok') is True and appel('go_reprise', p_jeton=ines_j3)['pseudo'] == 'Inès Bm.', r)
    r = appel('go_prof_ouvrir_inscriptions', p_code=code_a, p_classe=classe_a, p_ouverte=False)
    controle('fermer les inscriptions', r.get('ok') is True and r['ouverte'] is False, r)
    r = appel('go_inscription', p_code_classe=code_classe_a, p_pseudo='Sami R.')
    controle('inscription refusée quand la classe est fermée', r.get('ok') is False and 'fermées' in r.get('message', ''), r)
    controle('le lien dit que la classe est fermée', appel('go_classe_par_code', p_code_classe=code_classe_a).get('ouverte') is False)
    controle('les élèves déjà inscrit·e·s continuent', appel('go_reprise', p_jeton=ines_j3).get('ok') is True)
    appel('go_prof_ouvrir_inscriptions', p_code=code_a, p_classe=classe_a, p_ouverte=True)
    r = appel('go_inscription', p_code_classe=code_classe_a, p_pseudo='Sami R.')
    sami_j = r['jeton']
    sami_id = b.valeur("select id from grand_oral.eleves where pseudo = 'Sami R.'")
    r = appel('go_prof_supprimer_eleve', p_code=code_a, p_eleve=sami_id)
    controle('supprimer un·e élève (et ses sessions)', r.get('ok') is True and appel('go_reprise', p_jeton=sami_j).get('ok') is False
             and b.valeur(f"select count(*) from grand_oral.sessions where eleve_id = {litteral(sami_id)}") == '0', r)
    # export
    r = appel('go_prof_export', p_code=code_a)
    cl = {c['nom']: c for c in r.get('classes', [])}
    controle('export complet : 2 classes, élèves, codes, dossiers, résumés, retours',
             r.get('ok') is True and set(cl) == {'Terminale NSI 1', 'Tle NSI groupe 2'} and r['enseignant']['nom'] == 'M. Martin'
             and {e['pseudo'] for e in cl['Terminale NSI 1']['eleves']} == {'Inès Bm.', 'Noah K.'}
             and [e for e in cl['Terminale NSI 1']['eleves'] if e['pseudo'] == 'Inès Bm.'][0]['retours'] == retours
             and [e for e in cl['Terminale NSI 1']['eleves'] if e['pseudo'] == 'Inès Bm.'][0]['dossier'] == corrige
             and [e for e in cl['Terminale NSI 1']['eleves'] if e['pseudo'] == 'Inès Bm.'][0]['code_affiche'] == nouveau_ines, r)
    controle('l\'export ne contient pas le code de l\'enseignant·e', code_a.split('-')[0] + '-' not in json.dumps(r) and 'empreinte' not in json.dumps(r))
    r = appel('go_prof_export', p_code=code_a, p_classe=classe_a2)
    controle('export d\'une seule classe', r.get('ok') is True and [c['nom'] for c in r['classes']] == ['Tle NSI groupe 2'], r)
    # suppression d'une classe
    r = appel('go_inscription', p_code_classe=b.valeur(f"select code from grand_oral.classes where id = {litteral(classe_a2)}"), p_pseudo='Yanis P.')
    yanis_j = r['jeton']
    r = appel('go_prof_supprimer_classe', p_code=code_a, p_classe=classe_a2)
    controle('supprimer une classe, avec ses élèves', r.get('ok') is True and r['eleves_supprimes'] == 1 and appel('go_reprise', p_jeton=yanis_j).get('ok') is False, r)
    # changer son propre code
    r = appel('go_prof_nouveau_code', p_code=code_a)
    controle('changer son propre code', r.get('ok') is True and r['code_affiche'] != code_a, r)
    ancien_a, code_a = code_a, r['code_affiche']
    controle('l\'ancien code enseignant·e ne marche plus', appel('go_prof_ouvrir', p_code=ancien_a, reseau='10.8.8.8').get('ok') is False)
    controle('le nouveau marche', appel('go_prof_ouvrir', p_code=code_a).get('ok') is True)
    r = appel('go_prof_supprimer_espace', p_code=code_a, p_confirmation='oui')
    controle('supprimer son espace demande SUPPRIMER', r.get('ok') is False and b.valeur("select count(*) from grand_oral.enseignants") == '2', r)

    # Compteur d'essais
    print('   compteur d\'essais')
    reseau = '10.1.1.1'
    for i in range(20):
        appel('go_connexion', p_code=f'FAUX-CODE-{i:03d}', reseau=reseau)
    r = appel('go_connexion', p_code=nouveau_ines, reseau=reseau)
    controle('élève : 20 échecs, puis refus, même avec un bon code', r.get('ok') is False and 'Trop d' in r.get('message', ''), r)
    controle('élève : un autre réseau n\'est pas bloqué', appel('go_connexion', p_code=nouveau_ines, reseau='10.1.1.2').get('ok') is True)
    controle('élève : les échecs sont comptés en base (20)', b.valeur("select echecs from commun.essais where application = 'grand_oral' and type = 'eleve' order by echecs desc limit 1") == '20')
    t0 = time.time(); appel('go_connexion', p_code='FAUX', reseau='10.1.1.3')
    controle('élève : 0,3 s d\'attente après un échec', 0.3 <= time.time() - t0 < 2)
    reseau = '10.2.2.2'
    for i in range(10):
        appel('go_prof_ouvrir', p_code=f'FAUX-FAUX-FAUX-{i:04d}', reseau=reseau)
    r = appel('go_prof_ouvrir', p_code=code_a, reseau=reseau)
    controle('enseignant·e : 10 échecs, puis refus, même avec le bon code', r.get('ok') is False and 'Trop d' in r.get('message', ''), r)
    r = appel('go_prof_debloquer_reseau', p_code=code_a, reseau=reseau)
    controle('débloquer depuis un réseau bloqué est refusé aussi (pas de contournement)', r.get('ok') is False, r)
    reseau = '10.3.3.3'
    for i in range(30):
        appel('go_classe_par_code', p_code_classe='ZZZZ' if code_classe_a != 'ZZZZ' else 'YYYY', reseau=reseau)
    r = appel('go_classe_par_code', p_code_classe=code_classe_a, reseau=reseau)
    controle('classe : 30 échecs, puis refus', r.get('ok') is False and 'Trop d' in r.get('message', ''), r)
    r = appel('go_inscription', p_code_classe=code_classe_a, p_pseudo='Tom V.', reseau=reseau)
    controle('classe : l\'inscription aussi est bloquée sur ce réseau', r.get('ok') is False and 'Trop d' in r.get('message', ''), r)
    reseau = '10.4.4.4'
    n_ok = sum(1 for i in range(60) if appel('go_inscription', p_code_classe=code_classe_a, p_pseudo=f'Élève {i}', reseau=reseau).get('ok'))
    r = appel('go_inscription', p_code_classe=code_classe_a, p_pseudo='Élève 60', reseau=reseau)
    controle('création : 60 inscriptions, puis refus (aucun plafond par classe : 60 de plus dans la même classe)', n_ok == 60 and r.get('ok') is False and 'débloquer' in r.get('message', ''), (n_ok, r))
    r = appel('go_prof_creer_espace', p_nom='Mme Hoarau', reseau=reseau)
    controle('création : la création d\'espace compte aussi', r.get('ok') is False, r)
    r = appel('go_prof_debloquer_reseau', p_code=code_a, reseau=reseau)
    controle('l\'enseignant·e débloque le réseau', r.get('ok') is True and r['compteurs_effaces'] >= 1, r)
    controle('après déblocage, l\'inscription repasse', appel('go_inscription', p_code_classe=code_classe_a, p_pseudo='Élève 60', reseau=reseau).get('ok') is True)
    controle('le déblocage ne touche pas les autres réseaux', appel('go_connexion', p_code=nouveau_ines, reseau='10.1.1.1').get('ok') is False)
    controle('le déblocage ne touche pas les autres applications',
             b.valeur("insert into commun.essais values ('court_circuit', repeat('a', 64), 'eleve', date_trunc('hour', now(), 'UTC'), 5); select count(*) from commun.essais where application = 'court_circuit'") == '1')
    r = appel('go_prof_ouvrir', p_code=code_a)
    controle('ouvrir : le nombre d\'échecs de l\'heure, et pas d\'alarme sous 200', r.get('echecs_heure', 0) >= 60 and r['alarme'] is False, r)
    controle('aucune adresse en clair dans le compteur', b.valeur("select count(*) from commun.essais where reseau like '10.%' or reseau like '%.%'") == '0')
    r = appel('go_prof_supprimer_espace', p_code=code_b, p_confirmation='SUPPRIMER', reseau='10.0.0.2')
    controle('supprimer tout son espace (B) : classes, élèves, sessions',
             r.get('ok') is True and r['eleves_supprimes'] == 1 and appel('go_reprise', p_jeton=lea_j).get('ok') is False
             and b.valeur(f"select count(*) from grand_oral.classes where id = {litteral(classe_b)}") == '0', r)
    controle('l\'espace de A est intact', appel('go_prof_ouvrir', p_code=code_a).get('ok') is True)

    # Charge : une grosse classe (60 élèves, dossiers de 100 000 caractères), sous le délai de 3 s d'anon
    print('   charge')
    b.psql(f"""insert into grand_oral.eleves (classe_id, pseudo, code, code_affiche, dossier, resume)
      select {litteral(classe_a)}, 'Charge ' || i, 'CHARGECHARGE' || lpad(i::text, 3, '0'), 'CHARGE-CHARGE-' || lpad(i::text, 3, '0'),
             jsonb_build_object('v', 1, 'texte', repeat('x', 100000)), jsonb_build_object('etape', 'plan', 'points', i)
      from generate_series(1, 60) i;""")
    for f, p in (('go_prof_classe', {'p_classe': classe_a}), ('go_prof_export', {'p_classe': classe_a}), ('go_prof_export', {})):
        t0 = time.time(); r = appel(f, p_code=code_a, **p); d = time.time() - t0
        taille = len(json.dumps(r))
        print(f'   {f}{" (une classe)" if p else ""} : {d:.2f} s, {taille // 1000} ko')
        controle(f'{f} {"(une classe) " if p else ""}sur 60 dossiers de 100 000 caractères en moins de 3 s', r.get('ok') is True and d < 3, d)
    b.psql("delete from grand_oral.eleves where pseudo like 'Charge %';")

    # --- 4. Les tirages ---
    print('4. Les tirages de codes')
    v = b.valeur(f"""
      begin;
      insert into grand_oral.classes (enseignant_id, nom, code) select id, 'Tirage', 'QQQQ' from grand_oral.enseignants limit 1;
      do $$ declare n record; i integer; begin
        for i in 1..5000 loop
          select * into n from grand_oral.nouveau_code_eleve();
          insert into grand_oral.eleves (classe_id, pseudo, code, code_affiche) select id, 'T' || i, n.code, n.code_affiche from grand_oral.classes where code = 'QQQQ';
        end loop; end $$;
      select json_build_object(
        'n', count(*), 'distincts', count(distinct code), 'forme', bool_and(code_affiche ~ '^[A-Z]{{4,8}}-[A-Z]{{4,8}}-[0-9]{{3}}$' and code = replace(code_affiche, '-', '')),
        'mots_min', (select min(c) from (select count(*) c from grand_oral.eleves e, lateral unnest(array[split_part(e.code_affiche, '-', 1), split_part(e.code_affiche, '-', 2)]) w where e.pseudo ~ '^T[0-9]+$' group by w) x),
        'mots_max', (select max(c) from (select count(*) c from grand_oral.eleves e, lateral unnest(array[split_part(e.code_affiche, '-', 1), split_part(e.code_affiche, '-', 2)]) w where e.pseudo ~ '^T[0-9]+$' group by w) x),
        'mots_vus', (select count(distinct w) from grand_oral.eleves e, lateral unnest(array[split_part(e.code_affiche, '-', 1), split_part(e.code_affiche, '-', 2)]) w where e.pseudo ~ '^T[0-9]+$'),
        'cent_min', (select min(c) from (select count(*) c from grand_oral.eleves e where e.pseudo ~ '^T[0-9]+$' group by left(split_part(e.code_affiche, '-', 3), 1)) x),
        'cent_max', (select max(c) from (select count(*) c from grand_oral.eleves e where e.pseudo ~ '^T[0-9]+$' group by left(split_part(e.code_affiche, '-', 3), 1)) x))
      from grand_oral.eleves where pseudo ~ '^T[0-9]+$';
      rollback;""")
    t = json.loads(v.splitlines()[-1])
    print('   5 000 codes d\'élèves :', t)
    controle(f"5 000 codes d'élèves tous différents et bien formés ({t})", t['n'] == 5000 and t['distincts'] == 5000 and t['forme'])
    # 10 000 mots tirés pour 64 mots : 156 en moyenne ; écart type ~12,4 ; on accepte de 100 à 215
    controle('chaque mot tiré, sans biais visible (de 100 à 215 fois sur 10 000)', t['mots_vus'] == 64 and 100 <= t['mots_min'] and t['mots_max'] <= 215)
    controle('chaque centaine de chiffres de 400 à 600 fois sur 5 000', 400 <= t['cent_min'] and t['cent_max'] <= 600)
    v = b.valeur("""
      begin;
      do $$ declare n record; i integer; begin
        for i in 1..1000 loop
          select * into n from grand_oral.nouveau_code_enseignant();
          insert into grand_oral.enseignants (code_empreinte, nom) values (grand_oral.empreinte(n.code), n.code_affiche);
        end loop; end $$;
      select count(*) || '|' || count(distinct code_empreinte) || '|' || bool_and(nom ~ '^[A-Z]{4,8}-[A-Z]{4,8}-[A-Z]{4,8}-[0-9]{4}$'
             and code_empreinte = grand_oral.empreinte(replace(nom, '-', '')))
      from grand_oral.enseignants where nom ~ '-';
      rollback;""")
    controle('1 000 codes d\'enseignant·e·s tous différents, 3 mots et 4 chiffres, empreinte retrouvée', v.splitlines()[-1] == '1000|1000|true', v)
    v = b.valeur("""
      begin;
      do $$ declare i integer; begin
        for i in 1..2000 loop
          insert into grand_oral.classes (enseignant_id, nom, code) select id, 'Tirage', grand_oral.nouveau_code_classe() from grand_oral.enseignants limit 1;
        end loop; end $$;
      select count(*) || '|' || count(distinct code) || '|' || bool_and(code ~ '^[A-HJ-NP-Z]{4}$') || '|' || count(distinct substr(code, 1, 1))
             || '|' || bool_or(code ~ '(CUL|PUTE|SEXE|KKK|PD|SS|FDP|NTM|WC)')
      from grand_oral.classes where nom = 'Tirage';
      rollback;""")
    controle('2 000 codes de classe différents, sans I ni O, 24 lettres en tête, sans suite gênante', v.splitlines()[-1] == '2000|2000|true|24|false', v)

    # --- 5. Le registre (0006 du socle) ---
    if a.registre:
        print('5. Le registre du socle (0006)')
        f6 = sans_maintain(a.registre, tmp)
        f6i = sans_maintain(pathlib.Path(a.registre).with_name(pathlib.Path(a.registre).stem + '-inverse.sql'), tmp)
        avant6 = b.schema()
        b.psql(fichier=f6)
        v = b.valeur("select string_agg(table_nom || ':' || coalesce(donnees_eleves, '?'), ',' order by table_nom) from commun.registre where application = 'grand_oral'")
        controle('0006 : le registre range les 5 tables de grand_oral', v == 'classes:non,eleves:oui,enseignants:non,mots:non,sessions:oui', v)
        apres6 = b.schema()
        b.psql(fichier=f6)
        controle('0006 : relance sans effet', b.schema() == apres6)
        controle('0006 : la vue reste security_invoker et fermée à anon',
                 b.valeur("select 'security_invoker=true' = any(reloptions) and not has_table_privilege('anon', oid, 'select') from pg_class where oid = 'commun.registre'::regclass") == 't')
        b.psql(fichier=f6i)
        controle('0006 inverse : le schéma revient à l\'identique', b.schema() == avant6)
        b.psql(fichier=f6)

    # --- 6. L'inverse, puis de nouveau ---
    print('6. Inverse, nouvelle application, schema.sql')
    # registre éventuel retiré d'abord (le schéma de départ ne l'avait pas)
    if a.registre:
        b.psql(fichier=f6i)
    b.psql(fichier=finv)
    controle('inverse : le schéma revient exactement à l\'état de départ', b.schema() == depart)
    controle('inverse : les compteurs de grand_oral sont effacés, ceux des autres applications restent',
             b.valeur("select count(*) filter (where application = 'grand_oral') || '|' || count(*) filter (where application = 'court_circuit') from commun.essais") == '0|1')
    b.psql(fichier=finv)
    controle('inverse relancé sans effet', b.schema() == depart)
    b.psql(fichier=f0001)
    controle('0001 appliqué de nouveau après l\'inverse : même schéma qu\'au premier passage', b.schema() == apres1)
    # l'inverse s'arrête si un objet d'ailleurs se sert de grand_oral
    b.psql("create view public.espion as select id from grand_oral.eleves;")
    r = b.psql(fichier=finv, erreur_permise=True)
    controle('inverse : arrêt si un objet hors du schéma se sert de grand_oral', r.returncode != 0 and 'espion' in r.stderr, r.stderr[-300:])
    b.psql("drop view public.espion; create table grand_oral.ajout (x int);")
    r = b.psql(fichier=finv, erreur_permise=True)
    controle('inverse : arrêt si le schéma contient un objet d\'une migration plus récente', r.returncode != 0 and 'plus récente' in r.stderr)
    b.psql("drop table grand_oral.ajout;")
    # schema.sql sur une base neuve
    preparer(b, 'collegue')
    b.psql(fichier=fsocle, base='collegue')
    b.psql(fichier=fschema, base='collegue')
    sc, se = b.schema('collegue'), b.schema()
    if sc != se:
        import difflib
        print('\n'.join(list(difflib.unified_diff(se.splitlines(), sc.splitlines(), lineterm=''))[:40]))
    controle('schema.sql : une base neuve de collègue identique à 0001', sc == se)
    b.psql(fichier=fschema, base='collegue')
    controle('schema.sql : relancé sans effet', b.schema('collegue') == b.schema())


if __name__ == '__main__':
    sys.exit(main())
