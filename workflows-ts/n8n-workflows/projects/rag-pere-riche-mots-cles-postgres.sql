-- Mots-clés générés par Postgres (aucun appel à Gemini, aucun quota)

-- 1. Fonction : les N mots les plus fréquents du chunk, sans mots vides ni mots courts
create or replace function extraire_mots_cles(txt text, n int default 7)
returns text
language sql
immutable
as $$
  select string_agg(w, ', ' order by cnt desc, w)
  from (
    select w, count(*) as cnt
    from regexp_split_to_table(lower(coalesce(txt, '')), '[^a-zàâäçéèêëîïôöùûüÿœ]+') as w
    where length(w) >= 5
      and ts_lexize('french_stem', w) <> '{}'
    group by w
    order by count(*) desc, w
    limit n
  ) s;
$$;

-- 2. Trigger : remplit mots_cles automatiquement à chaque insertion si la colonne est vide
create or replace function documents_set_mots_cles()
returns trigger
language plpgsql
as $$
begin
  if new.mots_cles is null or new.mots_cles = '' then
    new.mots_cles := extraire_mots_cles(new.chunk);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_mots_cles on documents;
create trigger trg_mots_cles
  before insert or update of chunk on documents
  for each row execute function documents_set_mots_cles();

-- 3. Remplit les lignes déjà présentes
update documents set mots_cles = extraire_mots_cles(chunk)
where mots_cles is null or mots_cles = '';

-- 4. Test de la fonction (doit afficher une liste de mots, pas NULL)
select extraire_mots_cles('Le père riche enseigne à ses enfants comment investir son argent. Les pauvres travaillent pour l''argent, les riches font travailler l''argent.') as test_mots_cles;
