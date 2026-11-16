begin;
-- =============================================================================
--  Hello GO, inverse de la migration 0001 (grand_oral_0001_dossiers)
--  Projet Supabase cukahpyqkljiddmimpyi (« Babash - applications »)
--  Nom de migration : grand_oral_0001_dossiers_inverse
-- =============================================================================
--  **ATTENTION : ce retour efface les données.** Les espaces des
--  enseignant·e·s, leurs classes, les comptes des élèves (prénom et initiale,
--  code), leurs dossiers de Grand oral et les retours disparaissent, sans
--  retour possible. Avant de le lancer, chaque enseignant·e télécharge l'export
--  de son espace (go_prof_export, depuis la page), ou l'enseignant exporte les
--  tables grand_oral.* (Table Editor, export ; règle M8). L'export reste hors
--  du dépôt.
--
--  Ce que ce fichier retire : les 24 fonctions d'entrée public.go_…, le schéma
--  grand_oral (ses tables et ses fonctions internes), et les compteurs
--  d'essais de Hello GO dans commun.essais. Rien d'autre.
--
--  Avant de le lancer : remettre la page de Hello GO dans sa version sans base
--  et la publier, pour qu'elle n'appelle plus ces fonctions (règles M6 et M7 :
--  on retire en deux temps, la page d'abord).
-- =============================================================================

-- Garde-fou : le bon rôle, et rien d'autre que les objets de 0001 dans le
-- schéma grand_oral, ni objet d'ailleurs qui s'en sert. Sinon, arrêt avant
-- toute modification (le drop ... cascade ne retire alors que ces objets).
do $$
declare d text;
begin
  if current_user <> 'postgres' then
    raise exception 'À lancer en postgres (éditeur SQL de Supabase ou apply_migration), pas en % : arrêt, rien n''a été modifié.', current_user;
  end if;
  if to_regnamespace('grand_oral') is null then
    return;
  end if;
  if coalesce(obj_description(to_regnamespace('grand_oral'), 'pg_namespace'), '') not like 'Hello GO%' then
    raise exception 'Le schéma grand_oral ne vient pas de cette migration : arrêt, rien n''a été modifié.';
  end if;
  if exists (select 1 from pg_catalog.pg_class c where c.relnamespace = 'grand_oral'::regnamespace
             and c.relkind in ('r', 'p', 'v', 'm', 'f', 'S', 'c') and c.relname not in ('mots', 'enseignants', 'classes', 'eleves', 'sessions'))
     or exists (select 1 from pg_catalog.pg_proc p where p.pronamespace = 'grand_oral'::regnamespace
                and p.proname not in ('normaliser_code', 'nettoyer_nom', 'empreinte', 'nouveau_code_eleve', 'nouveau_code_enseignant',
                                      'nouveau_code_classe', 'eleve_par_jeton', 'ouvrir_session', 'verifier_enseignant', 'refus_json')) then
    raise exception 'Le schéma grand_oral contient d''autres objets que ceux de 0001 : une migration plus récente s''en sert. La défaire d''abord. Arrêt, rien n''a été modifié.';
  end if;
  select string_agg(distinct o, ', ') into d from (
    select v.oid::regclass::text as o
    from pg_catalog.pg_depend x
    join pg_catalog.pg_rewrite r on r.oid = x.objid
    join pg_catalog.pg_class v on v.oid = r.ev_class
    where x.classid = 'pg_catalog.pg_rewrite'::regclass and v.relnamespace <> 'grand_oral'::regnamespace
      and x.refobjid in (select c.oid from pg_catalog.pg_class c where c.relnamespace = 'grand_oral'::regnamespace)
    union all
    select p.oid::regprocedure::text
    from pg_catalog.pg_proc p
    where p.pronamespace <> 'grand_oral'::regnamespace and p.prosrc ~ '\mgrand_oral\.'
      and not (p.pronamespace = 'public'::regnamespace and p.proname like 'go\_%'
               and coalesce(obj_description(p.oid, 'pg_proc'), '') like 'Hello GO, entrée%')
  ) s;
  if d is not null then
    raise exception 'Des objets hors du schéma se servent de grand_oral (%) : les défaire d''abord. Arrêt, rien n''a été modifié.', d;
  end if;
end $$;

drop function if exists public.go_classe_par_code(text);
drop function if exists public.go_inscription(text, text);
drop function if exists public.go_connexion(text);
drop function if exists public.go_reprise(uuid);
drop function if exists public.go_sauvegarde(uuid, json, json, integer);
drop function if exists public.go_retours(uuid, integer);
drop function if exists public.go_deconnexion(uuid);
drop function if exists public.go_prof_creer_espace(text);
drop function if exists public.go_prof_ouvrir(text);
drop function if exists public.go_prof_creer_classe(text, text);
drop function if exists public.go_prof_renommer_classe(text, uuid, text);
drop function if exists public.go_prof_ouvrir_inscriptions(text, uuid, boolean);
drop function if exists public.go_prof_supprimer_classe(text, uuid);
drop function if exists public.go_prof_classe(text, uuid);
drop function if exists public.go_prof_dossier(text, uuid);
drop function if exists public.go_prof_retours(text, uuid, json, integer);
drop function if exists public.go_prof_corriger(text, uuid, json, integer, json);
drop function if exists public.go_prof_nouveau_code_eleve(text, uuid);
drop function if exists public.go_prof_renommer_eleve(text, uuid, text);
drop function if exists public.go_prof_supprimer_eleve(text, uuid);
drop function if exists public.go_prof_nouveau_code(text);
drop function if exists public.go_prof_debloquer_reseau(text);
drop function if exists public.go_prof_export(text, uuid);
drop function if exists public.go_prof_supprimer_espace(text, text);

drop schema if exists grand_oral cascade;

delete from commun.essais where application = 'grand_oral';

commit;
