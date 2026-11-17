"""Une reproduction locale de la base de Hello GO, pour les essais de la page (jamais la base en ligne).

Lance un PostgreSQL 16 neuf dans un dossier temporaire, avec les rôles de Supabase, le socle commun du site
(supabase/schema.sql du dépôt Babash-NSI-SNT) et la migration de Hello GO (supabase/0001-dossiers.sql), puis
répond aux appels comme l'API (POST /rest/v1/rpc/go_…) : en rôle anon, avec des données inventées.

Chemins : HG_SOCLE (le socle commun) et HG_MIGRATION (0001-dossiers.sql), sinon les emplacements habituels.
"""
import json, os, pathlib, shutil, subprocess, tempfile

RACINE = pathlib.Path(__file__).resolve().parent.parent
PG = pathlib.Path(os.environ.get('HG_PG', '/usr/lib/postgresql/16/bin'))

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
create table public.snt_responses (id integer);
"""


def chemin(env, *candidats):
    if os.environ.get(env):
        return pathlib.Path(os.environ[env])
    for c in candidats:
        if pathlib.Path(c).exists():
            return pathlib.Path(c)
    raise SystemExit(f'{env} : fichier introuvable ({", ".join(map(str, candidats))})')


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


class BaseLocale:
    def __init__(self, port=54383):
        self.tmp = pathlib.Path(tempfile.mkdtemp(prefix='hello-go-pont-'))
        self.port, self.sock, self.root = port, self.tmp / 'sock', os.geteuid() == 0
        self.appels = []

    def _serveur(self, *cmd):
        cmd = [str(PG / cmd[0]), *cmd[1:]]
        if self.root:
            cmd = ['runuser', '-u', 'postgres', '--', *cmd]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    def psql(self, sql=None, fichier=None, base='essais', erreur_permise=False):
        cmd = [str(PG / 'psql'), '-h', str(self.sock), '-p', str(self.port), '-U', 'postgres', '-d', base, '-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1']
        r = subprocess.run(cmd + (['-f', str(fichier)] if fichier else []), input=sql, capture_output=True, text=True)
        if r.returncode and not erreur_permise:
            raise RuntimeError('psql : ' + r.stderr.strip()[:1000])
        return r

    def demarrer(self):
        if self.root:
            os.chmod(self.tmp, 0o755)
        self.sock.mkdir()
        if self.root:
            shutil.chown(self.tmp, 'postgres'); shutil.chown(self.sock, 'postgres')
        self._serveur('initdb', '-D', str(self.tmp / 'donnees'), '-U', 'postgres', '-A', 'trust', '-E', 'UTF8', '--locale=C.UTF-8')
        self._serveur('pg_ctl', '-D', str(self.tmp / 'donnees'), '-l', str(self.tmp / 'journal.txt'), '-w', 'start',
                      '-o', f"-p {self.port} -k {self.sock} -c listen_addresses=''")
        self.psql('create database essais;', base='postgres')
        self.psql(PREPARATION)
        socle = chemin('HG_SOCLE', RACINE.parent / 'Babash-NSI-SNT/supabase/schema.sql', RACINE.parent / 'babash-nsi-snt/supabase/schema.sql',
                       '/home/claude/babash-nsi-snt/supabase/schema.sql')
        migration = chemin('HG_MIGRATION', RACINE / 'supabase/0001-dossiers.sql')
        for f in (socle, migration):  # PostgreSQL 16 n'a pas le droit « maintain » (17, sur Supabase)
            copie = self.tmp / ('pg16-' + f.name)
            copie.write_text(f.read_text(encoding='utf-8').replace(', maintain', ''), encoding='utf-8')
            self.psql(fichier=copie)
        return self

    def arreter(self):
        try:
            self._serveur('pg_ctl', '-D', str(self.tmp / 'donnees'), '-m', 'fast', '-w', 'stop')
        finally:
            shutil.rmtree(self.tmp, ignore_errors=True)

    def appel(self, fonction, params=None, reseau='10.0.0.1'):
        """Comme l'API : (statut HTTP, réponse JSON). Un uuid mal formé donne 400, comme PostgREST."""
        assert fonction.startswith('go_') and fonction.replace('_', '').isalnum()
        params = params or {}
        args = ', '.join(f'{k} => {litteral(v)}' for k, v in params.items() if k.replace('_', '').isalnum())
        entetes = json.dumps({'x-forwarded-for': reseau + ', 172.16.0.1'})
        r = self.psql(f"set role anon;\nset request.headers = {litteral(entetes)};\nselect public.{fonction}({args});", erreur_permise=True)
        self.appels.append(fonction)
        if r.returncode:
            return 400, {'message': r.stderr.strip()[:300]}
        return 200, json.loads(r.stdout.strip())

    def valeur(self, sql):
        return self.psql(sql).stdout.strip()
