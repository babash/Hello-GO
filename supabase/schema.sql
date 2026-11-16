begin;
-- =============================================================================
--  Hello GO : le script complet de la base (dossiers des élèves, espace de l'enseignant·e)
-- =============================================================================
--  À quoi il sert : installer la base de Hello GO dans un projet Supabase neuf
--  (la copie d'un·e collègue), APRÈS le socle commun du site
--  (supabase/schema.sql du dépôt Babash-NSI-SNT), qui crée le compteur
--  d'essais et le sel secret. Il réunit les migrations de ce dossier, dans
--  l'ordre : aujourd'hui, la seule 0001-dossiers.sql, recopiée telle quelle à
--  partir du garde-fou.
--  Mode d'emploi : LISEZMOI.md.
-- =============================================================================

-- Garde-fou : le bon rôle, le schéma commun et pgcrypto présents, et aucun
-- objet du même nom venu d'ailleurs. Sinon, arrêt avant toute modification.
do $$
declare o text;
begin
  if current_user <> 'postgres' then
    raise exception 'À lancer en postgres (éditeur SQL de Supabase ou apply_migration), pas en % : arrêt, rien n''a été modifié.', current_user;
  end if;
  if to_regprocedure('commun.essai_permis(text, text, integer)') is null or to_regprocedure('commun.noter_echec(text, text)') is null
     or to_regprocedure('commun.debloquer_reseau(text)') is null or to_regprocedure('commun.echecs_heure(text)') is null
     or to_regclass('commun.secret') is null then
    raise exception 'Le schéma commun manque (migration base_unique_0003_schema_commun, ou supabase/schema.sql du site) : arrêt, rien n''a été modifié.';
  end if;
  if to_regprocedure('extensions.gen_random_bytes(integer)') is null then
    raise exception 'L''extension pgcrypto manque dans le schéma extensions : arrêt, rien n''a été modifié.';
  end if;
  if to_regnamespace('grand_oral') is not null
     and coalesce(obj_description(to_regnamespace('grand_oral'), 'pg_namespace'), '') not like 'Hello GO%' then
    raise exception 'Un schéma grand_oral existe déjà et ne vient pas de cette migration : arrêt, rien n''a été modifié.';
  end if;
  foreach o in array array['grand_oral.mots', 'grand_oral.enseignants', 'grand_oral.classes', 'grand_oral.eleves', 'grand_oral.sessions'] loop
    if to_regclass(o) is not null and coalesce(obj_description(to_regclass(o), 'pg_class'), '') not like 'Hello GO.%' then
      raise exception '% existe déjà et ne vient pas de cette migration : arrêt, rien n''a été modifié.', o;
    end if;
  end loop;
  if exists (select 1 from pg_catalog.pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname like 'go\_%'
             and coalesce(obj_description(p.oid, 'pg_proc'), '') not like 'Hello GO%') then
    raise exception 'Une fonction public.go_… existe déjà et ne vient pas de cette migration : arrêt, rien n''a été modifié.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1. Le schéma
-- -----------------------------------------------------------------------------
create schema if not exists grand_oral authorization postgres;
revoke all on schema grand_oral from public, anon, authenticated;
comment on schema grand_oral is
  'Hello GO (préparation du Grand oral de NSI) : les espaces des enseignant·e·s, leurs classes, et le dossier de chaque élève avec les retours de son enseignant·e. Jamais exposé à l''API ; aucun droit pour anon ni pour authenticated.';

-- -----------------------------------------------------------------------------
-- 2. Les tables
-- -----------------------------------------------------------------------------
create table if not exists grand_oral.mots (
  rang smallint primary key check (rang between 0 and 63),
  mot  text not null unique check (mot ~ '^[A-Z]{4,8}$')
);
alter table grand_oral.mots enable row level security;
revoke all on grand_oral.mots from public, anon, authenticated;
comment on table grand_oral.mots is
  'Hello GO. Les 64 mots des codes des élèves et des enseignant·e·s (thème : la scène et la parole). Aucun n''est dans la liste d''une autre application, ni le début d''un autre mot (supabase/verifier_liste.py). Données d''élèves : non.';
comment on column grand_oral.mots.rang is 'La place du mot dans la liste, de 0 à 63 : le tirage d''un octet modulo 64 donne le rang.';
comment on column grand_oral.mots.mot is 'Le mot, en majuscules sans accent, de 4 à 8 lettres.';
insert into grand_oral.mots (rang, mot)
select (o - 1)::smallint, m from unnest(array[
  'MICRO', 'DECOR', 'ESTRADE', 'PUPITRE', 'PODIUM', 'COULISSE', 'GRADIN', 'FAUTEUIL',
  'BILLET', 'AFFICHE', 'SPOT', 'TAPIS', 'CARNET', 'CAHIER', 'STYLO', 'FEUILLE',
  'LIVRE', 'ALBUM', 'DISQUE', 'VINYLE', 'COSTUME', 'CRAVATE', 'CHAPEAU', 'TROPHEE',
  'RUBAN', 'BADGE', 'SIFFLET', 'TAMBOUR', 'GUITARE', 'PIANO', 'VIOLON', 'SAXO',
  'CYMBALE', 'BANJO', 'UKULELE', 'CLAIRON', 'HAUTBOIS', 'CHANSON', 'REFRAIN', 'COUPLET',
  'JOURNAL', 'DIALOGUE', 'SCRIPT', 'LETTRE', 'PODCAST', 'CLIP', 'FILM', 'TICKET',
  'PANTIN', 'AGENDA', 'LANTERNE', 'BOUGIE', 'CHRONO', 'HORLOGE', 'TABLEAU', 'ARDOISE',
  'PLUME', 'GONG', 'CLOCHE', 'MIROIR', 'TRIANGLE', 'FANFARE', 'BAGUETTE', 'TROMBONE'
]) with ordinality as l(m, o)
on conflict (rang) do nothing;

create table if not exists grand_oral.enseignants (
  id             uuid primary key default gen_random_uuid(),
  code_empreinte text not null unique check (code_empreinte ~ '^[0-9a-f]{64}$'),
  nom            text not null check (char_length(nom) between 2 and 40),
  cree_le        timestamptz not null default now(),
  vu_le          timestamptz not null default now()
);
alter table grand_oral.enseignants enable row level security;
revoke all on grand_oral.enseignants from public, anon, authenticated;
comment on table grand_oral.enseignants is
  'Hello GO. Un espace par enseignant·e : le nom affiché aux élèves et l''empreinte de son code (3 mots et 4 chiffres, montré une seule fois, gardé nulle part en clair). Supprimé seulement par l''enseignant·e. Données d''élèves : non.';
comment on column grand_oral.enseignants.id is 'L''identifiant de l''espace, tiré au hasard ; il ne change jamais.';
comment on column grand_oral.enseignants.code_empreinte is 'L''empreinte SHA-256 du code de l''enseignant·e (forme canonique, avec le sel secret du projet, commun.secret) : c''est elle qu''on cherche. Le code lui-même n''est gardé nulle part.';
comment on column grand_oral.enseignants.nom is 'Le nom affiché aux élèves de ses classes (« M. Martin », « Mme Diallo »), de 2 à 40 caractères.';
comment on column grand_oral.enseignants.cree_le is 'La date de création de l''espace.';
comment on column grand_oral.enseignants.vu_le is 'La date de la dernière ouverture de l''espace (à 10 minutes près).';

create table if not exists grand_oral.classes (
  id            uuid primary key default gen_random_uuid(),
  enseignant_id uuid not null references grand_oral.enseignants (id) on delete cascade,
  nom           text not null check (char_length(nom) between 1 and 40),
  code          text not null unique check (code ~ '^[A-HJ-NP-Z]{4}$'),
  ouverte       boolean not null default true,
  cree_le       timestamptz not null default now()
);
create index if not exists classes_enseignant on grand_oral.classes (enseignant_id);
alter table grand_oral.classes enable row level security;
revoke all on grand_oral.classes from public, anon, authenticated;
comment on table grand_oral.classes is
  'Hello GO. Les classes de chaque enseignant·e (NSI seulement, une classe par élève) : nom, code de classe public (lien et QR code d''inscription), inscriptions ouvertes ou fermées. Aucun plafond du nombre d''élèves. Supprimée seulement par l''enseignant·e, avec ses élèves. Données d''élèves : non.';
comment on column grand_oral.classes.id is 'L''identifiant de la classe, tiré au hasard.';
comment on column grand_oral.classes.enseignant_id is 'L''espace de l''enseignant·e de la classe (grand_oral.enseignants).';
comment on column grand_oral.classes.nom is 'Le nom de la classe choisi par l''enseignant·e (« Terminale NSI 2026-2027 »), de 1 à 40 caractères.';
comment on column grand_oral.classes.code is 'Le code de classe, public : 4 lettres sans I ni O (le lien d''inscription le porte). Il ne donne accès à aucun dossier, seulement à l''inscription.';
comment on column grand_oral.classes.ouverte is 'Vrai si un·e nouvel·le élève peut s''inscrire avec le code de classe. Les élèves déjà inscrit·e·s ne sont pas concerné·e·s.';
comment on column grand_oral.classes.cree_le is 'La date de création de la classe.';

create table if not exists grand_oral.eleves (
  id                 uuid primary key default gen_random_uuid(),
  classe_id          uuid not null references grand_oral.classes (id) on delete cascade,
  pseudo             text not null check (char_length(pseudo) between 2 and 24),
  code               text not null unique check (code ~ '^[A-Z]{8,16}[0-9]{3}$'),
  code_affiche       text not null check (code_affiche ~ '^[A-Z]{4,8}-[A-Z]{4,8}-[0-9]{3}$'),
  dossier            jsonb check (dossier is null or (jsonb_typeof(dossier) = 'object' and char_length(dossier::text) <= 600000)),
  dossier_version    integer not null default 0 check (dossier_version >= 0),
  dossier_modifie_le timestamptz,
  resume             jsonb check (resume is null or (jsonb_typeof(resume) = 'object' and char_length(resume::text) <= 8000)),
  retours            jsonb not null default '{}'::jsonb check (jsonb_typeof(retours) = 'object' and char_length(retours::text) <= 300000),
  retours_version    integer not null default 0 check (retours_version >= 0),
  retours_modifie_le timestamptz,
  cree_le            timestamptz not null default now(),
  vu_le              timestamptz not null default now()
);
create index if not exists eleves_classe on grand_oral.eleves (classe_id);
alter table grand_oral.eleves enable row level security;
revoke all on grand_oral.eleves from public, anon, authenticated;
comment on table grand_oral.eleves is
  'Hello GO. Un compte par élève, dans une classe : son prénom et l''initiale de son nom, son code (2 mots et 3 chiffres), son dossier de Grand oral, un résumé chiffré pour le tableau de la classe et les retours de son enseignant·e. Aucun effacement automatique : supprimé seulement par l''enseignant·e. Données d''élèves : oui.';
comment on column grand_oral.eleves.id is 'L''identifiant du compte, tiré au hasard ; il ne change jamais.';
comment on column grand_oral.eleves.classe_id is 'La classe de l''élève (grand_oral.classes) : une seule.';
comment on column grand_oral.eleves.pseudo is 'Le prénom et l''initiale du nom (« Inès B. »), de 2 à 24 caractères. Jamais le nom complet.';
comment on column grand_oral.eleves.code is 'Le code de l''élève sous sa forme canonique (MICROPIANO482) : c''est lui qu''on cherche. Il ne sort que par les fonctions de l''élève et de son enseignant·e.';
comment on column grand_oral.eleves.code_affiche is 'Le même code tel qu''on l''affiche (MICRO-PIANO-482) : l''enseignant·e le voit, au cas où l''élève le perd.';
comment on column grand_oral.eleves.dossier is 'Le dossier de Grand oral, tel que la page le tient (un objet JSON de forme v: 1 : pistes, questions, plans, mots, sources, oraux…). Vide tant que l''élève n''a rien enregistré. La fonction borne le texte envoyé à 300 000 caractères ; la table garde un filet au double, car la forme rangée (jsonb) ajoute des espaces.';
comment on column grand_oral.eleves.dossier_version is 'Le numéro de version du dossier, augmenté de 1 à chaque enregistrement (par l''élève ou par une correction de l''enseignant·e) : un enregistrement fait sur une version ancienne est refusé, et la page reçoit la version la plus récente.';
comment on column grand_oral.eleves.dossier_modifie_le is 'La date du dernier enregistrement du dossier.';
comment on column grand_oral.eleves.resume is 'Un petit résumé chiffré du dossier, calculé par la page à chaque enregistrement (étape, nombre de points, de mots, de sources…), pour le tableau de la classe : 4 000 caractères au plus envoyés.';
comment on column grand_oral.eleves.retours is 'Les retours de l''enseignant·e, en un objet JSON : commentaires sur un point, un mot ou une source, demandes de définition, ressources et questions suggérées, validation des questions, évaluation des oraux blancs et des vidéos. 150 000 caractères au plus envoyés. Seul·e l''enseignant·e les écrit ; l''élève les lit.';
comment on column grand_oral.eleves.retours_version is 'Le numéro de version des retours, augmenté de 1 à chaque enregistrement : la page de l''élève ne les recharge que s''il a changé.';
comment on column grand_oral.eleves.retours_modifie_le is 'La date du dernier enregistrement des retours.';
comment on column grand_oral.eleves.cree_le is 'La date de l''inscription.';
comment on column grand_oral.eleves.vu_le is 'La date de la dernière visite (à 10 minutes près), que voit l''enseignant·e.';

create table if not exists grand_oral.sessions (
  jeton    uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references grand_oral.eleves (id) on delete cascade,
  cree_le  timestamptz not null default now(),
  vu_le    timestamptz not null default now()
);
create index if not exists sessions_eleve on grand_oral.sessions (eleve_id, vu_le desc);
create index if not exists sessions_vu_le on grand_oral.sessions (vu_le);
alter table grand_oral.sessions enable row level security;
revoke all on grand_oral.sessions from public, anon, authenticated;
comment on table grand_oral.sessions is
  'Hello GO. Les jetons de session des élèves : un par appareil où l''élève est entré·e avec son code, 5 au plus (le plus ancien part). Un jeton sans usage depuis 30 jours est effacé ; un nouveau code les efface tous. Données d''élèves : oui (un jeton au hasard et deux dates, liés au compte de l''élève).';
comment on column grand_oral.sessions.jeton is 'Le jeton, tiré au hasard : la page le garde et l''envoie à chaque appel, à la place du code.';
comment on column grand_oral.sessions.eleve_id is 'Le compte de l''élève (grand_oral.eleves).';
comment on column grand_oral.sessions.cree_le is 'La date d''entrée sur cet appareil.';
comment on column grand_oral.sessions.vu_le is 'La date du dernier usage du jeton (à 10 minutes près) : il expire 30 jours après.';

-- -----------------------------------------------------------------------------
-- 3. Les fonctions internes : aucun droit pour personne
-- -----------------------------------------------------------------------------

-- La forme canonique d'un code : majuscules, sans accent, sans séparateur.
-- (La page lit le code avec plus de tolérance : O et 0, I et 1, mots proches.)
create or replace function grand_oral.normaliser_code(p_code text)
returns text
language sql immutable
set search_path = ''
as $$
  select regexp_replace(upper(translate(replace(replace(coalesce(p_code, ''), 'œ', 'oe'), 'Œ', 'OE'),
    'àâäáãåçéèêëíìîïñóòôöõúùûüýÿÀÂÄÁÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝ',
    'aaaaaaceeeeiiiinooooouuuuyyAAAAAACEEEEIIIINOOOOOUUUUY')), '[^A-Z0-9]', '', 'g')
$$;

-- Un nom propre à garder (prénom et initiale, nom de classe, nom affiché) :
-- espaces resserrés, entre p_min et p_max caractères, sans caractère de
-- contrôle ni caractère invisible (écrits par leur code). Sinon, null.
create or replace function grand_oral.nettoyer_nom(p_texte text, p_min integer, p_max integer)
returns text
language sql immutable
set search_path = ''
as $$
  select case when char_length(x.t) between p_min and p_max
               and x.t !~ ('[' || chr(1) || '-' || chr(31) || chr(127) || '-' || chr(159) || chr(173) || chr(8203) || '-' || chr(8207)
                           || chr(8232) || '-' || chr(8238) || chr(8288) || '-' || chr(8303) || chr(65279) || ']')
              then x.t end
  from (select btrim(regexp_replace(left(coalesce(p_texte, ''), 100), '\s+', ' ', 'g')) as t) x
$$;

-- L'empreinte d'un code d'enseignant·e (forme canonique) : SHA-256 du code et
-- du sel secret du projet. Sans le sel, une copie de la table ne permet pas de
-- retrouver les codes en les essayant tous.
create or replace function grand_oral.empreinte(p_code text)
returns text
language sql stable
set search_path = ''
as $$
  select encode(sha256(convert_to('grand_oral|' || coalesce(p_code, '') || '|' || s.sel, 'UTF8')), 'hex')
  from commun.secret s
$$;

-- Un code d'élève neuf : 2 mots tirés au hasard (un octet modulo 64, sans
-- biais), 3 chiffres tirés par rejet (sans biais), jamais un code déjà pris.
create or replace function grand_oral.nouveau_code_eleve(out code text, out code_affiche text)
language plpgsql volatile
set search_path = ''
as $$
declare b bytea; v integer; w1 text; w2 text; d text;
begin
  loop
    b := extensions.gen_random_bytes(4);
    v := get_byte(b, 2) * 256 + get_byte(b, 3);
    continue when v >= 64000;
    select m.mot into w1 from grand_oral.mots m where m.rang = get_byte(b, 0) % 64;
    select m.mot into w2 from grand_oral.mots m where m.rang = get_byte(b, 1) % 64;
    d := lpad((v % 1000)::text, 3, '0');
    code := w1 || w2 || d;
    code_affiche := w1 || '-' || w2 || '-' || d;
    exit when not exists (select 1 from grand_oral.eleves e where e.code = nouveau_code_eleve.code);
  end loop;
end $$;

-- Un code d'enseignant·e neuf : 3 mots et 4 chiffres (sans biais), dont
-- l'empreinte n'est pas déjà prise. Renvoie la forme canonique (pour
-- l'empreinte) et la forme affichée (montrée une seule fois).
create or replace function grand_oral.nouveau_code_enseignant(out code text, out code_affiche text)
language plpgsql volatile
set search_path = ''
as $$
declare b bytea; v integer; w1 text; w2 text; w3 text; d text;
begin
  loop
    b := extensions.gen_random_bytes(5);
    v := get_byte(b, 3) * 256 + get_byte(b, 4);
    continue when v >= 60000;
    select m.mot into w1 from grand_oral.mots m where m.rang = get_byte(b, 0) % 64;
    select m.mot into w2 from grand_oral.mots m where m.rang = get_byte(b, 1) % 64;
    select m.mot into w3 from grand_oral.mots m where m.rang = get_byte(b, 2) % 64;
    d := lpad((v % 10000)::text, 4, '0');
    code := w1 || w2 || w3 || d;
    code_affiche := w1 || '-' || w2 || '-' || w3 || '-' || d;
    exit when not exists (select 1 from grand_oral.enseignants e where e.code_empreinte = grand_oral.empreinte(nouveau_code_enseignant.code));
  end loop;
end $$;

-- Un code de classe neuf : 4 lettres sans I ni O (24 lettres, tirées par
-- rejet, sans biais), sans suite gênante, jamais un code déjà pris.
create or replace function grand_oral.nouveau_code_classe()
returns text
language plpgsql volatile
set search_path = ''
as $$
declare b bytea; c text; i integer; x integer;
begin
  loop
    b := extensions.gen_random_bytes(8);
    c := '';
    for i in 0..7 loop
      x := get_byte(b, i);
      continue when x >= 240;
      c := c || substr('ABCDEFGHJKLMNPQRSTUVWXYZ', x % 24 + 1, 1);
      exit when char_length(c) = 4;
    end loop;
    continue when char_length(c) < 4 or c ~ '(CUL|PUTE|SEXE|KKK|PD|SS|FDP|NTM|WC|MERD|ZGEG)';
    exit when not exists (select 1 from grand_oral.classes k where k.code = c);
  end loop;
  return c;
end $$;

-- Le compte qui porte ce jeton encore valable (usage depuis moins de 30 jours),
-- ou null. La date de visite n'est écrite qu'une fois par tranche de 10 minutes :
-- la page peut interroger souvent sans écrire à chaque fois.
create or replace function grand_oral.eleve_par_jeton(p_jeton uuid)
returns uuid
language plpgsql volatile
set search_path = ''
as $$
declare v_eleve uuid; v_vu timestamptz;
begin
  select s.eleve_id, s.vu_le into v_eleve, v_vu from grand_oral.sessions s
   where s.jeton = p_jeton and s.vu_le > now() - interval '30 days';
  if v_eleve is not null and v_vu < now() - interval '10 minutes' then
    update grand_oral.sessions s set vu_le = now() where s.jeton = p_jeton;
    update grand_oral.eleves e set vu_le = now() where e.id = v_eleve;
  end if;
  return v_eleve;
end $$;

-- Une nouvelle session pour cet·te élève (un appareil de plus) : efface les
-- jetons sans usage depuis 30 jours (de tous les comptes) et ne garde que les
-- 4 plus récents de l'élève avant d'en ajouter un. Renvoie le jeton.
create or replace function grand_oral.ouvrir_session(p_eleve uuid)
returns uuid
language plpgsql volatile
set search_path = ''
as $$
declare j uuid;
begin
  delete from grand_oral.sessions s where s.vu_le <= now() - interval '30 days';
  delete from grand_oral.sessions s where s.eleve_id = p_eleve
     and s.jeton not in (select x.jeton from grand_oral.sessions x where x.eleve_id = p_eleve order by x.vu_le desc, x.cree_le desc limit 4);
  insert into grand_oral.sessions (eleve_id) values (p_eleve) returning jeton into j;
  update grand_oral.eleves e set vu_le = now() where e.id = p_eleve;
  return j;
end $$;

-- Le code d'un·e enseignant·e : son espace (prof), ou un message (trop
-- d'essais depuis ce réseau, ou code inconnu). 10 échecs au plus par heure et
-- par réseau, 0,3 s d'attente après un échec.
create or replace function grand_oral.verifier_enseignant(p_code text, out prof uuid, out message text)
language plpgsql volatile
set search_path = ''
as $$
declare c text := grand_oral.normaliser_code(left(coalesce(p_code, ''), 80)); v_vu timestamptz;
begin
  if not commun.essai_permis('grand_oral', 'enseignant', 10) then
    message := 'Trop d''essais de code enseignant·e depuis ce réseau : attendez la fin de l''heure, ou passez par un autre réseau.';
    return;
  end if;
  select e.id, e.vu_le into prof, v_vu from grand_oral.enseignants e where e.code_empreinte = grand_oral.empreinte(c);
  if prof is null then
    perform commun.noter_echec('grand_oral', 'enseignant');
    perform pg_sleep(0.3);
    message := 'Ce code enseignant·e n''existe pas. Vérifiez-le.';
    return;
  end if;
  if v_vu < now() - interval '10 minutes' then
    update grand_oral.enseignants e set vu_le = now() where e.id = prof;
  end if;
end $$;

-- Un objet JSON accepté : null si c'est bon, sinon le message d'erreur.
-- p_quoi : 'dossier' (un objet de forme v: 1), 'resume' ou 'retours' ;
-- p_max : le nombre de caractères du texte envoyé.
create or replace function grand_oral.refus_json(p_valeur json, p_quoi text, p_max integer)
returns text
language sql immutable
set search_path = ''
as $$
  select case
    when p_valeur is null then 'Il manque ' || l.nom || '.'
    when json_typeof(p_valeur) <> 'object' then 'Forme refusée : ' || l.nom || ' doit être un objet JSON.'
    when char_length(p_valeur::text) > p_max then
      'Trop long : ' || l.nom || ' (' || regexp_replace(p_max::text, '(\d)(?=(\d{3})+$)', '\1 ', 'g') || ' caractères au plus).'
    when p_quoi = 'dossier' and coalesce(p_valeur ->> 'v', '') <> '1' then 'Ce dossier n''a pas la forme d''un dossier Hello GO.'
  end
  from (select case p_quoi when 'resume' then 'le résumé' when 'retours' then 'les retours' else 'le dossier' end as nom) l
$$;

revoke all on function grand_oral.normaliser_code(text), grand_oral.nettoyer_nom(text, integer, integer),
  grand_oral.empreinte(text), grand_oral.nouveau_code_eleve(), grand_oral.nouveau_code_enseignant(),
  grand_oral.nouveau_code_classe(), grand_oral.eleve_par_jeton(uuid), grand_oral.ouvrir_session(uuid),
  grand_oral.verifier_enseignant(text), grand_oral.refus_json(json, text, integer)
  from public, anon, authenticated;
comment on function grand_oral.normaliser_code(text) is
  'Hello GO, interne. La forme canonique d''un code : majuscules, sans accent, sans séparateur.';
comment on function grand_oral.nettoyer_nom(text, integer, integer) is
  'Hello GO, interne. Un nom à garder (prénom et initiale, classe, nom affiché) : espaces resserrés, longueur bornée, sans caractère de contrôle ni invisible ; sinon null.';
comment on function grand_oral.empreinte(text) is
  'Hello GO, interne. L''empreinte SHA-256 d''un code d''enseignant·e, avec le sel secret du projet (commun.secret).';
comment on function grand_oral.nouveau_code_eleve() is
  'Hello GO, interne. Tire un code d''élève neuf (2 mots de grand_oral.mots et 3 chiffres, sans biais) qu''aucun compte n''a encore.';
comment on function grand_oral.nouveau_code_enseignant() is
  'Hello GO, interne. Tire un code d''enseignant·e neuf (3 mots et 4 chiffres, sans biais) dont l''empreinte n''est pas déjà prise.';
comment on function grand_oral.nouveau_code_classe() is
  'Hello GO, interne. Tire un code de classe neuf : 4 lettres sans I ni O, sans biais, sans suite gênante.';
comment on function grand_oral.eleve_par_jeton(uuid) is
  'Hello GO, interne. Le compte qui porte ce jeton encore valable (30 jours sans usage au plus), ou null ; la date de visite à 10 minutes près.';
comment on function grand_oral.ouvrir_session(uuid) is
  'Hello GO, interne. Ouvre une session (un jeton) pour un·e élève : 5 appareils au plus, les jetons de plus de 30 jours sans usage effacés.';
comment on function grand_oral.verifier_enseignant(text) is
  'Hello GO, interne. Vérifie un code d''enseignant·e (10 échecs au plus par heure et par réseau) : son espace, ou un message.';
comment on function grand_oral.refus_json(json, text, integer) is
  'Hello GO, interne. Contrôle un objet JSON envoyé (dossier, résumé ou retours) : null s''il est accepté, sinon le message.';

-- -----------------------------------------------------------------------------
-- 4. Les fonctions d'entrée de l'élève : public, security definer, anon seul.
--    Elles bornent chaque paramètre et répondent { "ok": false, "message" }
--    plutôt que de lever une exception (qui annulerait le compteur d'essais).
--    Un·e élève n'atteint jamais que son propre compte, par son jeton.
-- -----------------------------------------------------------------------------

-- Le code de classe du lien d'inscription : le nom de la classe et de son
-- enseignant·e, et si les inscriptions sont ouvertes. 30 échecs au plus par
-- heure et par réseau.
create or replace function public.go_classe_par_code(p_code_classe text)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare c text := upper(regexp_replace(left(coalesce(p_code_classe, ''), 20), '[^A-Za-z]', '', 'g')); k record;
begin
  if not commun.essai_permis('grand_oral', 'classe', 30) then
    return json_build_object('ok', false, 'message', 'Trop d''essais depuis ce réseau. Attends un peu, ou demande le lien de la classe à ton enseignant·e.');
  end if;
  select cl.nom, cl.ouverte, en.nom as enseignant into k
    from grand_oral.classes cl join grand_oral.enseignants en on en.id = cl.enseignant_id where cl.code = c;
  if not found then
    perform commun.noter_echec('grand_oral', 'classe');
    perform pg_sleep(0.3);
    return json_build_object('ok', false, 'message', 'Ce code de classe n''existe pas. Vérifie le lien donné par ton enseignant·e.');
  end if;
  return json_build_object('ok', true, 'classe', k.nom, 'enseignant', k.enseignant, 'ouverte', k.ouverte);
end $$;

-- S'inscrire dans une classe ouverte : prénom et initiale du nom. Renvoie le
-- code (à noter) et un jeton. 60 créations au plus par heure et par réseau.
create or replace function public.go_inscription(p_code_classe text, p_pseudo text)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare c text := upper(regexp_replace(left(coalesce(p_code_classe, ''), 20), '[^A-Za-z]', '', 'g'));
        ps text := grand_oral.nettoyer_nom(p_pseudo, 2, 24); k record; n record; e grand_oral.eleves; j uuid;
begin
  if ps is null then
    return json_build_object('ok', false, 'message', 'Écris ton prénom et l''initiale de ton nom (2 à 24 caractères), par exemple « Inès B. ». Jamais ton nom complet.');
  end if;
  if not commun.essai_permis('grand_oral', 'classe', 30) then
    return json_build_object('ok', false, 'message', 'Trop d''essais depuis ce réseau. Attends un peu, ou demande le lien de la classe à ton enseignant·e.');
  end if;
  select cl.id, cl.nom, cl.ouverte, en.nom as enseignant into k
    from grand_oral.classes cl join grand_oral.enseignants en on en.id = cl.enseignant_id where cl.code = c;
  if not found then
    perform commun.noter_echec('grand_oral', 'classe');
    perform pg_sleep(0.3);
    return json_build_object('ok', false, 'message', 'Ce code de classe n''existe pas. Vérifie le lien donné par ton enseignant·e.');
  end if;
  if not k.ouverte then
    return json_build_object('ok', false, 'message', 'Les inscriptions de cette classe sont fermées : demande à ton enseignant·e de les ouvrir.');
  end if;
  if not commun.essai_permis('grand_oral', 'creation', 60) then
    return json_build_object('ok', false, 'message', 'Trop d''inscriptions depuis ce réseau dans l''heure : ton enseignant·e peut débloquer le réseau depuis son espace.');
  end if;
  perform commun.noter_echec('grand_oral', 'creation');
  select * into n from grand_oral.nouveau_code_eleve();
  insert into grand_oral.eleves (classe_id, pseudo, code, code_affiche) values (k.id, ps, n.code, n.code_affiche) returning * into e;
  j := grand_oral.ouvrir_session(e.id);
  return json_build_object('ok', true, 'pseudo', e.pseudo, 'code_affiche', e.code_affiche, 'jeton', j,
    'classe', k.nom, 'enseignant', k.enseignant);
end $$;

-- Entrer avec son code, sur un appareil de plus : un nouveau jeton (5
-- appareils au plus). 20 échecs au plus par heure et par réseau.
create or replace function public.go_connexion(p_code text)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare c text := grand_oral.normaliser_code(left(coalesce(p_code, ''), 60)); e grand_oral.eleves; k record; j uuid;
begin
  if not commun.essai_permis('grand_oral', 'eleve', 20) then
    return json_build_object('ok', false, 'message', 'Trop d''essais depuis ce réseau. Attends un peu, ou demande ton code à ton enseignant·e.');
  end if;
  select * into e from grand_oral.eleves x where x.code = c;
  if e.id is null then
    perform commun.noter_echec('grand_oral', 'eleve');
    perform pg_sleep(0.3);
    return json_build_object('ok', false, 'message', 'Ce code n''existe pas. Vérifie-le, ou demande-le à ton enseignant·e.');
  end if;
  j := grand_oral.ouvrir_session(e.id);
  select cl.nom, en.nom as enseignant into k
    from grand_oral.classes cl join grand_oral.enseignants en on en.id = cl.enseignant_id where cl.id = e.classe_id;
  return json_build_object('ok', true, 'pseudo', e.pseudo, 'code_affiche', e.code_affiche, 'jeton', j,
    'classe', k.nom, 'enseignant', k.enseignant);
end $$;

-- Reprendre sa session : tout ce que la page doit afficher, en un seul objet JSON.
create or replace function public.go_reprise(p_jeton uuid)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v_eleve uuid := grand_oral.eleve_par_jeton(p_jeton); e grand_oral.eleves; k record;
begin
  if v_eleve is null then
    return json_build_object('ok', false, 'message', 'Ta session a expiré : entre de nouveau ton code.');
  end if;
  select * into e from grand_oral.eleves x where x.id = v_eleve;
  select cl.nom, en.nom as enseignant into k
    from grand_oral.classes cl join grand_oral.enseignants en on en.id = cl.enseignant_id where cl.id = e.classe_id;
  return json_build_object('ok', true, 'pseudo', e.pseudo, 'code_affiche', e.code_affiche,
    'classe', k.nom, 'enseignant', k.enseignant,
    'dossier', e.dossier, 'dossier_version', e.dossier_version, 'dossier_modifie_le', e.dossier_modifie_le,
    'retours', e.retours, 'retours_version', e.retours_version, 'retours_modifie_le', e.retours_modifie_le);
end $$;

-- Enregistrer son dossier (et son résumé) sur la version qu'on connaît. Si
-- le dossier a changé entre-temps (autre appareil, ou correction), refus : la
-- réponse donne la version la plus récente, que la page reprend.
create or replace function public.go_sauvegarde(p_jeton uuid, p_dossier json, p_resume json, p_version_connue integer)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v_eleve uuid; r text; e grand_oral.eleves;
begin
  r := coalesce(grand_oral.refus_json(p_dossier, 'dossier', 300000),
                case when p_resume is not null then grand_oral.refus_json(p_resume, 'resume', 4000) end);
  if r is not null then
    return json_build_object('ok', false, 'message', r);
  end if;
  if p_version_connue is null or p_version_connue < 0 then
    return json_build_object('ok', false, 'message', 'Il manque la version du dossier.');
  end if;
  v_eleve := grand_oral.eleve_par_jeton(p_jeton);
  if v_eleve is null then
    return json_build_object('ok', false, 'message', 'Ta session a expiré : entre de nouveau ton code.');
  end if;
  update grand_oral.eleves x
     set dossier = p_dossier::jsonb, resume = coalesce(p_resume::jsonb, x.resume),
         dossier_version = x.dossier_version + 1, dossier_modifie_le = now()
   where x.id = v_eleve and x.dossier_version = p_version_connue
  returning * into e;
  if e.id is null then
    select * into e from grand_oral.eleves x where x.id = v_eleve;
    return json_build_object('ok', false, 'conflit', true,
      'message', 'Ton dossier a changé depuis ta dernière ouverture : voici sa version la plus récente.',
      'dossier', e.dossier, 'dossier_version', e.dossier_version, 'dossier_modifie_le', e.dossier_modifie_le);
  end if;
  return json_build_object('ok', true, 'dossier_version', e.dossier_version, 'dossier_modifie_le', e.dossier_modifie_le);
end $$;

-- L'appel léger, à l'ouverture ou toutes les quelques secondes : les retours
-- seulement s'ils ont changé depuis la version connue, et la version du
-- dossier (pour savoir s'il faut le recharger).
create or replace function public.go_retours(p_jeton uuid, p_version_connue integer)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v_eleve uuid := grand_oral.eleve_par_jeton(p_jeton); e grand_oral.eleves;
begin
  if v_eleve is null then
    return json_build_object('ok', false, 'message', 'Ta session a expiré : entre de nouveau ton code.');
  end if;
  select * into e from grand_oral.eleves x where x.id = v_eleve;
  if e.retours_version = p_version_connue then
    return json_build_object('ok', true, 'change', false, 'retours_version', e.retours_version, 'dossier_version', e.dossier_version);
  end if;
  return json_build_object('ok', true, 'change', true, 'retours', e.retours, 'retours_version', e.retours_version,
    'retours_modifie_le', e.retours_modifie_le, 'dossier_version', e.dossier_version);
end $$;

-- Quitter cet appareil : son jeton est effacé (les autres appareils gardent le leur).
create or replace function public.go_deconnexion(p_jeton uuid)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
begin
  delete from grand_oral.sessions s where s.jeton = p_jeton;
  return json_build_object('ok', found);
end $$;

-- -----------------------------------------------------------------------------
-- 5. Les fonctions d'entrée de l'enseignant·e : public, security definer, anon
--    seul. Chacune vérifie le code (grand_oral.verifier_enseignant), puis que
--    la classe ou l'élève est bien à cet·te enseignant·e. Sinon, « introuvable » :
--    on ne dit jamais si une classe ou un·e élève existe chez quelqu'un d'autre.
-- -----------------------------------------------------------------------------

-- Créer son espace : renvoie le code (montré une seule fois, gardé en
-- empreinte). 60 créations au plus par heure et par réseau.
create or replace function public.go_prof_creer_espace(p_nom text)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare nm text := grand_oral.nettoyer_nom(p_nom, 2, 40); n record;
begin
  if nm is null then
    return json_build_object('ok', false, 'message', 'Écrivez le nom que verront vos élèves, de 2 à 40 caractères (par exemple « M. Martin »).');
  end if;
  if not commun.essai_permis('grand_oral', 'creation', 60) then
    return json_build_object('ok', false, 'message', 'Trop de créations depuis ce réseau dans l''heure : réessayez plus tard.');
  end if;
  perform commun.noter_echec('grand_oral', 'creation');
  select * into n from grand_oral.nouveau_code_enseignant();
  insert into grand_oral.enseignants (code_empreinte, nom) values (grand_oral.empreinte(n.code), nm);
  return json_build_object('ok', true, 'nom', nm, 'code_affiche', n.code_affiche);
end $$;

-- Ouvrir son espace : son nom et ses classes (avec le nombre d'élèves), et
-- l'alarme si plus de 200 échecs de code dans l'heure, tous réseaux confondus.
create or replace function public.go_prof_ouvrir(p_code text)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v record; n integer := commun.echecs_heure('grand_oral');
begin
  select * into v from grand_oral.verifier_enseignant(p_code);
  if v.prof is null then
    return json_build_object('ok', false, 'message', v.message);
  end if;
  return json_build_object('ok', true,
    'nom', (select e.nom from grand_oral.enseignants e where e.id = v.prof),
    'classes', coalesce((select json_agg(json_build_object('id', c.id, 'nom', c.nom, 'code', c.code, 'ouverte', c.ouverte, 'cree_le', c.cree_le,
                                 'eleves', (select count(*) from grand_oral.eleves e where e.classe_id = c.id),
                                 'derniere_visite', (select max(e.vu_le) from grand_oral.eleves e where e.classe_id = c.id))
                                 order by c.cree_le)
                         from grand_oral.classes c where c.enseignant_id = v.prof), '[]'::json),
    'echecs_heure', n, 'alarme', n > 200);
end $$;

-- Créer une classe : son code de classe est tiré au hasard. 40 classes au plus
-- par espace (le nombre d'élèves, lui, n'a pas de plafond).
create or replace function public.go_prof_creer_classe(p_code text, p_nom text)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v record; nm text := grand_oral.nettoyer_nom(p_nom, 1, 40); k grand_oral.classes;
begin
  if nm is null then
    return json_build_object('ok', false, 'message', 'Donnez à la classe un nom de 1 à 40 caractères.');
  end if;
  select * into v from grand_oral.verifier_enseignant(p_code);
  if v.prof is null then
    return json_build_object('ok', false, 'message', v.message);
  end if;
  if (select count(*) from grand_oral.classes c where c.enseignant_id = v.prof) >= 40 then
    return json_build_object('ok', false, 'message', 'Votre espace a déjà 40 classes : supprimez-en une avant d''en créer une autre.');
  end if;
  insert into grand_oral.classes (enseignant_id, nom, code) values (v.prof, nm, grand_oral.nouveau_code_classe()) returning * into k;
  return json_build_object('ok', true, 'id', k.id, 'nom', k.nom, 'code', k.code, 'ouverte', k.ouverte);
end $$;

-- Renommer une de ses classes.
create or replace function public.go_prof_renommer_classe(p_code text, p_classe uuid, p_nom text)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v record; nm text := grand_oral.nettoyer_nom(p_nom, 1, 40);
begin
  if nm is null then
    return json_build_object('ok', false, 'message', 'Donnez à la classe un nom de 1 à 40 caractères.');
  end if;
  select * into v from grand_oral.verifier_enseignant(p_code);
  if v.prof is null then
    return json_build_object('ok', false, 'message', v.message);
  end if;
  update grand_oral.classes c set nom = nm where c.id = p_classe and c.enseignant_id = v.prof;
  if not found then
    return json_build_object('ok', false, 'message', 'Classe introuvable dans votre espace.');
  end if;
  return json_build_object('ok', true, 'nom', nm);
end $$;

-- Ouvrir ou fermer les inscriptions d'une de ses classes.
create or replace function public.go_prof_ouvrir_inscriptions(p_code text, p_classe uuid, p_ouverte boolean)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v record;
begin
  if p_ouverte is null then
    return json_build_object('ok', false, 'message', 'Dites si les inscriptions sont ouvertes (vrai) ou fermées (faux).');
  end if;
  select * into v from grand_oral.verifier_enseignant(p_code);
  if v.prof is null then
    return json_build_object('ok', false, 'message', v.message);
  end if;
  update grand_oral.classes c set ouverte = p_ouverte where c.id = p_classe and c.enseignant_id = v.prof;
  if not found then
    return json_build_object('ok', false, 'message', 'Classe introuvable dans votre espace.');
  end if;
  return json_build_object('ok', true, 'ouverte', p_ouverte);
end $$;

-- Supprimer une de ses classes, avec ses élèves et leurs dossiers (sans
-- retour possible : la page propose l'export juste avant).
create or replace function public.go_prof_supprimer_classe(p_code text, p_classe uuid)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v record; n integer;
begin
  select * into v from grand_oral.verifier_enseignant(p_code);
  if v.prof is null then
    return json_build_object('ok', false, 'message', v.message);
  end if;
  select count(*)::integer into n from grand_oral.eleves e join grand_oral.classes c on c.id = e.classe_id
   where c.id = p_classe and c.enseignant_id = v.prof;
  delete from grand_oral.classes c where c.id = p_classe and c.enseignant_id = v.prof;
  if not found then
    return json_build_object('ok', false, 'message', 'Classe introuvable dans votre espace.');
  end if;
  return json_build_object('ok', true, 'eleves_supprimes', n);
end $$;

-- Le tableau d'une de ses classes : chaque élève avec son code, sa dernière
-- visite, son résumé et les versions (sans les dossiers, lus un par un).
create or replace function public.go_prof_classe(p_code text, p_classe uuid)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v record; k grand_oral.classes;
begin
  select * into v from grand_oral.verifier_enseignant(p_code);
  if v.prof is null then
    return json_build_object('ok', false, 'message', v.message);
  end if;
  select * into k from grand_oral.classes c where c.id = p_classe and c.enseignant_id = v.prof;
  if k.id is null then
    return json_build_object('ok', false, 'message', 'Classe introuvable dans votre espace.');
  end if;
  return json_build_object('ok', true,
    'classe', json_build_object('id', k.id, 'nom', k.nom, 'code', k.code, 'ouverte', k.ouverte, 'cree_le', k.cree_le),
    'eleves', coalesce((select json_agg(json_build_object('id', e.id, 'pseudo', e.pseudo, 'code_affiche', e.code_affiche,
                                'cree_le', e.cree_le, 'vu_le', e.vu_le, 'resume', e.resume,
                                'dossier_version', e.dossier_version, 'dossier_modifie_le', e.dossier_modifie_le,
                                'retours_version', e.retours_version, 'retours_modifie_le', e.retours_modifie_le)
                                order by lower(e.pseudo), e.cree_le)
                        from grand_oral.eleves e where e.classe_id = k.id), '[]'::json));
end $$;

-- Le dossier complet d'un·e de ses élèves, avec ses retours.
create or replace function public.go_prof_dossier(p_code text, p_eleve uuid)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v record; e grand_oral.eleves;
begin
  select * into v from grand_oral.verifier_enseignant(p_code);
  if v.prof is null then
    return json_build_object('ok', false, 'message', v.message);
  end if;
  select x.* into e from grand_oral.eleves x join grand_oral.classes c on c.id = x.classe_id
   where x.id = p_eleve and c.enseignant_id = v.prof;
  if e.id is null then
    return json_build_object('ok', false, 'message', 'Élève introuvable dans vos classes.');
  end if;
  return json_build_object('ok', true, 'id', e.id, 'classe_id', e.classe_id, 'pseudo', e.pseudo, 'code_affiche', e.code_affiche,
    'cree_le', e.cree_le, 'vu_le', e.vu_le, 'resume', e.resume,
    'dossier', e.dossier, 'dossier_version', e.dossier_version, 'dossier_modifie_le', e.dossier_modifie_le,
    'retours', e.retours, 'retours_version', e.retours_version, 'retours_modifie_le', e.retours_modifie_le);
end $$;

-- Enregistrer ses retours pour un·e élève, sur la version qu'on connaît (deux
-- onglets ouverts ne s'écrasent pas : le second reçoit les retours en base).
create or replace function public.go_prof_retours(p_code text, p_eleve uuid, p_retours json, p_version_connue integer)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v record; r text := grand_oral.refus_json(p_retours, 'retours', 150000); e grand_oral.eleves;
begin
  if r is not null then
    return json_build_object('ok', false, 'message', r);
  end if;
  if p_version_connue is null or p_version_connue < 0 then
    return json_build_object('ok', false, 'message', 'Il manque la version des retours.');
  end if;
  select * into v from grand_oral.verifier_enseignant(p_code);
  if v.prof is null then
    return json_build_object('ok', false, 'message', v.message);
  end if;
  if not exists (select 1 from grand_oral.eleves x join grand_oral.classes c on c.id = x.classe_id
                 where x.id = p_eleve and c.enseignant_id = v.prof) then
    return json_build_object('ok', false, 'message', 'Élève introuvable dans vos classes.');
  end if;
  update grand_oral.eleves x
     set retours = p_retours::jsonb, retours_version = x.retours_version + 1, retours_modifie_le = now()
   where x.id = p_eleve and x.retours_version = p_version_connue
  returning * into e;
  if e.id is null then
    select * into e from grand_oral.eleves x where x.id = p_eleve;
    return json_build_object('ok', false, 'conflit', true,
      'message', 'Ces retours ont changé depuis votre dernière ouverture (autre onglet ou autre appareil) : voici leur version la plus récente.',
      'retours', e.retours, 'retours_version', e.retours_version, 'retours_modifie_le', e.retours_modifie_le);
  end if;
  return json_build_object('ok', true, 'retours_version', e.retours_version, 'retours_modifie_le', e.retours_modifie_le);
end $$;

-- Corriger directement le dossier d'un·e élève (rare), sur la version qu'on
-- connaît. La correction n'est pas annoncée : l'élève reçoit simplement la
-- nouvelle version à son prochain enregistrement ou à son prochain appel.
create or replace function public.go_prof_corriger(p_code text, p_eleve uuid, p_dossier json, p_version_connue integer, p_resume json default null)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v record; r text; e grand_oral.eleves;
begin
  r := coalesce(grand_oral.refus_json(p_dossier, 'dossier', 300000),
                case when p_resume is not null then grand_oral.refus_json(p_resume, 'resume', 4000) end);
  if r is not null then
    return json_build_object('ok', false, 'message', r);
  end if;
  if p_version_connue is null or p_version_connue < 0 then
    return json_build_object('ok', false, 'message', 'Il manque la version du dossier.');
  end if;
  select * into v from grand_oral.verifier_enseignant(p_code);
  if v.prof is null then
    return json_build_object('ok', false, 'message', v.message);
  end if;
  if not exists (select 1 from grand_oral.eleves x join grand_oral.classes c on c.id = x.classe_id
                 where x.id = p_eleve and c.enseignant_id = v.prof) then
    return json_build_object('ok', false, 'message', 'Élève introuvable dans vos classes.');
  end if;
  update grand_oral.eleves x
     set dossier = p_dossier::jsonb, resume = coalesce(p_resume::jsonb, x.resume),
         dossier_version = x.dossier_version + 1, dossier_modifie_le = now()
   where x.id = p_eleve and x.dossier_version = p_version_connue
  returning * into e;
  if e.id is null then
    select * into e from grand_oral.eleves x where x.id = p_eleve;
    return json_build_object('ok', false, 'conflit', true,
      'message', 'L''élève a enregistré son dossier entre-temps : voici sa version la plus récente. Refaites la correction sur celle-ci.',
      'dossier', e.dossier, 'dossier_version', e.dossier_version, 'dossier_modifie_le', e.dossier_modifie_le);
  end if;
  return json_build_object('ok', true, 'dossier_version', e.dossier_version, 'dossier_modifie_le', e.dossier_modifie_le);
end $$;

-- Donner un nouveau code à un·e élève (code perdu, ou vu par quelqu'un
-- d'autre) : l'ancien ne marche plus, et ses appareils doivent entrer le nouveau.
create or replace function public.go_prof_nouveau_code_eleve(p_code text, p_eleve uuid)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v record; n record;
begin
  select * into v from grand_oral.verifier_enseignant(p_code);
  if v.prof is null then
    return json_build_object('ok', false, 'message', v.message);
  end if;
  if not exists (select 1 from grand_oral.eleves x join grand_oral.classes c on c.id = x.classe_id
                 where x.id = p_eleve and c.enseignant_id = v.prof) then
    return json_build_object('ok', false, 'message', 'Élève introuvable dans vos classes.');
  end if;
  select * into n from grand_oral.nouveau_code_eleve();
  update grand_oral.eleves x set code = n.code, code_affiche = n.code_affiche where x.id = p_eleve;
  delete from grand_oral.sessions s where s.eleve_id = p_eleve;
  return json_build_object('ok', true, 'code_affiche', n.code_affiche);
end $$;

-- Corriger le prénom et l'initiale d'un·e élève.
create or replace function public.go_prof_renommer_eleve(p_code text, p_eleve uuid, p_pseudo text)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v record; ps text := grand_oral.nettoyer_nom(p_pseudo, 2, 24);
begin
  if ps is null then
    return json_build_object('ok', false, 'message', 'Le prénom et l''initiale du nom ont de 2 à 24 caractères (jamais le nom complet).');
  end if;
  select * into v from grand_oral.verifier_enseignant(p_code);
  if v.prof is null then
    return json_build_object('ok', false, 'message', v.message);
  end if;
  update grand_oral.eleves x set pseudo = ps
   where x.id = p_eleve and x.classe_id in (select c.id from grand_oral.classes c where c.enseignant_id = v.prof);
  if not found then
    return json_build_object('ok', false, 'message', 'Élève introuvable dans vos classes.');
  end if;
  return json_build_object('ok', true, 'pseudo', ps);
end $$;

-- Supprimer un·e de ses élèves et son dossier (sans retour possible).
create or replace function public.go_prof_supprimer_eleve(p_code text, p_eleve uuid)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v record;
begin
  select * into v from grand_oral.verifier_enseignant(p_code);
  if v.prof is null then
    return json_build_object('ok', false, 'message', v.message);
  end if;
  delete from grand_oral.eleves x
   where x.id = p_eleve and x.classe_id in (select c.id from grand_oral.classes c where c.enseignant_id = v.prof);
  if not found then
    return json_build_object('ok', false, 'message', 'Élève introuvable dans vos classes.');
  end if;
  return json_build_object('ok', true);
end $$;

-- Changer son propre code : le nouveau est montré une seule fois, l'ancien ne
-- marche plus.
create or replace function public.go_prof_nouveau_code(p_code text)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v record; n record;
begin
  select * into v from grand_oral.verifier_enseignant(p_code);
  if v.prof is null then
    return json_build_object('ok', false, 'message', v.message);
  end if;
  select * into n from grand_oral.nouveau_code_enseignant();
  update grand_oral.enseignants e set code_empreinte = grand_oral.empreinte(n.code) where e.id = v.prof;
  return json_build_object('ok', true, 'code_affiche', n.code_affiche);
end $$;

-- Débloquer son réseau : remet à zéro les compteurs d'essais de Hello GO pour
-- le réseau d'où vient l'appel (par exemple après les inscriptions de deux
-- classes dans la même heure).
create or replace function public.go_prof_debloquer_reseau(p_code text)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v record;
begin
  select * into v from grand_oral.verifier_enseignant(p_code);
  if v.prof is null then
    return json_build_object('ok', false, 'message', v.message);
  end if;
  return json_build_object('ok', true, 'compteurs_effaces', commun.debloquer_reseau('grand_oral'));
end $$;

-- L'export complet de son espace (ou d'une seule classe, si p_classe est
-- donné), en un seul objet JSON, que la page propose au téléchargement :
-- classes, élèves avec leur code, dossiers, résumés et retours.
create or replace function public.go_prof_export(p_code text, p_classe uuid default null)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v record; en grand_oral.enseignants;
begin
  select * into v from grand_oral.verifier_enseignant(p_code);
  if v.prof is null then
    return json_build_object('ok', false, 'message', v.message);
  end if;
  if p_classe is not null and not exists (select 1 from grand_oral.classes c where c.id = p_classe and c.enseignant_id = v.prof) then
    return json_build_object('ok', false, 'message', 'Classe introuvable dans votre espace.');
  end if;
  select * into en from grand_oral.enseignants e where e.id = v.prof;
  return json_build_object('ok', true, 'application', 'Hello GO', 'format', 1, 'exporte_le', now(),
    'enseignant', json_build_object('nom', en.nom, 'cree_le', en.cree_le),
    'classes', coalesce((select json_agg(json_build_object('id', c.id, 'nom', c.nom, 'code', c.code, 'ouverte', c.ouverte, 'cree_le', c.cree_le,
        'eleves', coalesce((select json_agg(json_build_object('id', e.id, 'pseudo', e.pseudo, 'code_affiche', e.code_affiche,
                                    'cree_le', e.cree_le, 'vu_le', e.vu_le,
                                    'dossier', e.dossier, 'dossier_version', e.dossier_version, 'dossier_modifie_le', e.dossier_modifie_le,
                                    'resume', e.resume,
                                    'retours', e.retours, 'retours_version', e.retours_version, 'retours_modifie_le', e.retours_modifie_le)
                                    order by lower(e.pseudo), e.cree_le)
                            from grand_oral.eleves e where e.classe_id = c.id), '[]'::json))
        order by c.cree_le)
      from grand_oral.classes c where c.enseignant_id = v.prof and (p_classe is null or c.id = p_classe)), '[]'::json));
end $$;

-- Supprimer tout son espace : ses classes, ses élèves et leurs dossiers (sans
-- retour possible). Il faut écrire SUPPRIMER pour confirmer.
create or replace function public.go_prof_supprimer_espace(p_code text, p_confirmation text)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare v record; n integer;
begin
  if p_confirmation is distinct from 'SUPPRIMER' then
    return json_build_object('ok', false, 'message', 'Pour supprimer tout votre espace, écrivez SUPPRIMER.');
  end if;
  select * into v from grand_oral.verifier_enseignant(p_code);
  if v.prof is null then
    return json_build_object('ok', false, 'message', v.message);
  end if;
  select count(*)::integer into n from grand_oral.eleves e join grand_oral.classes c on c.id = e.classe_id where c.enseignant_id = v.prof;
  delete from grand_oral.enseignants e where e.id = v.prof;
  return json_build_object('ok', true, 'eleves_supprimes', n);
end $$;

-- Les droits : anon seul, pour les 24 fonctions d'entrée.
revoke all on function public.go_classe_par_code(text), public.go_inscription(text, text), public.go_connexion(text),
  public.go_reprise(uuid), public.go_sauvegarde(uuid, json, json, integer), public.go_retours(uuid, integer),
  public.go_deconnexion(uuid),
  public.go_prof_creer_espace(text), public.go_prof_ouvrir(text), public.go_prof_creer_classe(text, text),
  public.go_prof_renommer_classe(text, uuid, text), public.go_prof_ouvrir_inscriptions(text, uuid, boolean),
  public.go_prof_supprimer_classe(text, uuid), public.go_prof_classe(text, uuid), public.go_prof_dossier(text, uuid),
  public.go_prof_retours(text, uuid, json, integer), public.go_prof_corriger(text, uuid, json, integer, json),
  public.go_prof_nouveau_code_eleve(text, uuid), public.go_prof_renommer_eleve(text, uuid, text),
  public.go_prof_supprimer_eleve(text, uuid), public.go_prof_nouveau_code(text), public.go_prof_debloquer_reseau(text),
  public.go_prof_export(text, uuid), public.go_prof_supprimer_espace(text, text)
  from public, anon, authenticated;
grant execute on function public.go_classe_par_code(text), public.go_inscription(text, text), public.go_connexion(text),
  public.go_reprise(uuid), public.go_sauvegarde(uuid, json, json, integer), public.go_retours(uuid, integer),
  public.go_deconnexion(uuid),
  public.go_prof_creer_espace(text), public.go_prof_ouvrir(text), public.go_prof_creer_classe(text, text),
  public.go_prof_renommer_classe(text, uuid, text), public.go_prof_ouvrir_inscriptions(text, uuid, boolean),
  public.go_prof_supprimer_classe(text, uuid), public.go_prof_classe(text, uuid), public.go_prof_dossier(text, uuid),
  public.go_prof_retours(text, uuid, json, integer), public.go_prof_corriger(text, uuid, json, integer, json),
  public.go_prof_nouveau_code_eleve(text, uuid), public.go_prof_renommer_eleve(text, uuid, text),
  public.go_prof_supprimer_eleve(text, uuid), public.go_prof_nouveau_code(text), public.go_prof_debloquer_reseau(text),
  public.go_prof_export(text, uuid), public.go_prof_supprimer_espace(text, text)
  to anon;

comment on function public.go_classe_par_code(text) is
  'Hello GO, entrée élève. Le code de classe du lien d''inscription : le nom de la classe et de l''enseignant·e, inscriptions ouvertes ou non. 30 échecs au plus par heure et par réseau.';
comment on function public.go_inscription(text, text) is
  'Hello GO, entrée élève. S''inscrire dans une classe ouverte (prénom et initiale du nom) : renvoie le code et un jeton. 60 créations au plus par heure et par réseau.';
comment on function public.go_connexion(text) is
  'Hello GO, entrée élève. Entrer avec son code sur un appareil : renvoie un nouveau jeton (5 appareils au plus). 20 échecs au plus par heure et par réseau.';
comment on function public.go_reprise(uuid) is
  'Hello GO, entrée élève. Avec le jeton : pseudo, code, classe, dossier et sa version, retours et leur version, en un seul objet JSON.';
comment on function public.go_sauvegarde(uuid, json, json, integer) is
  'Hello GO, entrée élève. Avec le jeton : enregistre le dossier (300 000 caractères au plus) et le résumé (4 000) sur la version connue ; si elle a changé, refus et renvoi de la version en base.';
comment on function public.go_retours(uuid, integer) is
  'Hello GO, entrée élève. Avec le jeton, l''appel léger : les retours seulement s''ils ont changé depuis la version connue, et la version du dossier.';
comment on function public.go_deconnexion(uuid) is
  'Hello GO, entrée élève. Efface le jeton de cet appareil.';
comment on function public.go_prof_creer_espace(text) is
  'Hello GO, entrée enseignant·e. Crée un espace (nom affiché) : renvoie le code, montré une seule fois et gardé en empreinte. 60 créations au plus par heure et par réseau.';
comment on function public.go_prof_ouvrir(text) is
  'Hello GO, entrée enseignant·e. Avec le code (10 échecs au plus par heure et par réseau) : le nom, les classes avec leur nombre d''élèves, et l''alarme des échecs.';
comment on function public.go_prof_creer_classe(text, text) is
  'Hello GO, entrée enseignant·e. Crée une classe et tire son code de classe (4 lettres sans I ni O). 40 classes au plus par espace.';
comment on function public.go_prof_renommer_classe(text, uuid, text) is
  'Hello GO, entrée enseignant·e. Renomme une de ses classes.';
comment on function public.go_prof_ouvrir_inscriptions(text, uuid, boolean) is
  'Hello GO, entrée enseignant·e. Ouvre ou ferme les inscriptions d''une de ses classes.';
comment on function public.go_prof_supprimer_classe(text, uuid) is
  'Hello GO, entrée enseignant·e. Supprime une de ses classes, avec ses élèves et leurs dossiers.';
comment on function public.go_prof_classe(text, uuid) is
  'Hello GO, entrée enseignant·e. Le tableau d''une de ses classes : chaque élève avec son code, sa dernière visite, son résumé et ses versions, en un seul objet JSON.';
comment on function public.go_prof_dossier(text, uuid) is
  'Hello GO, entrée enseignant·e. Le dossier complet d''un·e de ses élèves, avec ses retours et leurs versions.';
comment on function public.go_prof_retours(text, uuid, json, integer) is
  'Hello GO, entrée enseignant·e. Enregistre les retours pour un·e de ses élèves (150 000 caractères au plus) sur la version connue ; si elle a changé, refus et renvoi des retours en base.';
comment on function public.go_prof_corriger(text, uuid, json, integer, json) is
  'Hello GO, entrée enseignant·e. Corrige directement le dossier d''un·e de ses élèves sur la version connue (et son résumé si donné) ; si elle a changé, refus et renvoi du dossier en base.';
comment on function public.go_prof_nouveau_code_eleve(text, uuid) is
  'Hello GO, entrée enseignant·e. Donne un nouveau code à un·e de ses élèves : l''ancien et tous ses jetons ne marchent plus.';
comment on function public.go_prof_renommer_eleve(text, uuid, text) is
  'Hello GO, entrée enseignant·e. Corrige le prénom et l''initiale d''un·e de ses élèves.';
comment on function public.go_prof_supprimer_eleve(text, uuid) is
  'Hello GO, entrée enseignant·e. Supprime un·e de ses élèves et son dossier.';
comment on function public.go_prof_nouveau_code(text) is
  'Hello GO, entrée enseignant·e. Change son propre code : le nouveau est montré une seule fois, l''ancien ne marche plus.';
comment on function public.go_prof_debloquer_reseau(text) is
  'Hello GO, entrée enseignant·e. Remet à zéro les compteurs d''essais de Hello GO pour le réseau de l''appel.';
comment on function public.go_prof_export(text, uuid) is
  'Hello GO, entrée enseignant·e. L''export complet de son espace, ou d''une classe : classes, élèves et codes, dossiers, résumés et retours, en un seul objet JSON.';
comment on function public.go_prof_supprimer_espace(text, text) is
  'Hello GO, entrée enseignant·e. Supprime tout son espace (classes, élèves, dossiers), avec la confirmation SUPPRIMER.';

-- -----------------------------------------------------------------------------
-- 6. Contrôle : rien d'ouvert à l'API, sauf les 24 fonctions d'entrée.
--    Sinon, arrêt : rien n'est appliqué.
-- -----------------------------------------------------------------------------
do $$
begin
  if has_schema_privilege('anon', 'grand_oral', 'usage') or has_schema_privilege('authenticated', 'grand_oral', 'usage') then
    raise exception 'Le schéma grand_oral est ouvert à anon ou à authenticated : arrêt, rien n''a été modifié.';
  end if;
  if exists (select 1 from pg_catalog.pg_class c where c.relnamespace = 'grand_oral'::regnamespace and c.relkind = 'r'
             and (not c.relrowsecurity
                  or has_table_privilege('anon', c.oid, 'select, insert, update, delete, truncate, references, trigger, maintain')
                  or has_table_privilege('authenticated', c.oid, 'select, insert, update, delete, truncate, references, trigger, maintain'))) then
    raise exception 'Une table de grand_oral est ouverte, ou sans RLS : arrêt, rien n''a été modifié.';
  end if;
  if exists (select 1 from pg_catalog.pg_policy p join pg_catalog.pg_class c on c.oid = p.polrelid
             where c.relnamespace = 'grand_oral'::regnamespace) then
    raise exception 'Une table de grand_oral a une règle RLS : arrêt, rien n''a été modifié.';
  end if;
  if exists (select 1 from pg_catalog.pg_proc p where p.pronamespace = 'grand_oral'::regnamespace
             and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))) then
    raise exception 'Une fonction interne de grand_oral est appelable par l''API : arrêt, rien n''a été modifié.';
  end if;
  if (select count(*) from pg_catalog.pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname like 'go\_%'
      and p.prosecdef and has_function_privilege('anon', p.oid, 'execute') and not has_function_privilege('authenticated', p.oid, 'execute')
      and array_to_string(p.proconfig, ',') = 'search_path=""') <> 24
     or (select count(*) from pg_catalog.pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname like 'go\_%') <> 24 then
    raise exception 'Les 24 fonctions d''entrée go_… ne sont pas toutes security definer, à search_path vide et appelables par anon seul : arrêt, rien n''a été modifié.';
  end if;
  if (select count(*) from grand_oral.mots) <> 64 then
    raise exception 'grand_oral.mots doit avoir 64 mots : arrêt, rien n''a été modifié.';
  end if;
end $$;

commit;
