-- Base du RAG : 4 colonnes (id, chunk, embedding, mots_cles)
-- À lancer dans Supabase > SQL Editor. Ne supprime rien : rejouable sans risque.

create extension if not exists vector;

create table if not exists documents (
  id bigserial primary key,
  chunk text not null,
  embedding vector(3072),   -- 3072 = dimension par défaut de gemini-embedding-001
  mots_cles text
);

-- Recherche par mots (sur le chunk et les mots-clés)
create index if not exists documents_mots_idx on documents
  using gin (to_tsvector('french', coalesce(chunk, '') || ' ' || coalesce(mots_cles, '')));

-- Mots-clés calculés par Postgres : les N mots les plus fréquents, sans mots vides
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

-- Remplit mots_cles automatiquement si la colonne est vide à l'insertion
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

notify pgrst, 'reload schema';

-- Contrôles
-- select extraire_mots_cles('Le père riche enseigne à ses enfants comment investir son argent.');
-- select count(*), min(length(chunk)), round(avg(length(chunk))), max(length(chunk)) from documents;
