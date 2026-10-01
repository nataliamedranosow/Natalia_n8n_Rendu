-- Repart de zéro : 4 colonnes seulement (id, chunk, embedding, mots_cles)
drop table if exists documents cascade;
drop function if exists match_hybrid(text, vector, int, int);

create extension if not exists vector;

create table documents (
  id bigserial primary key,
  chunk text not null,
  embedding vector(3072),
  mots_cles text
);

-- Index de recherche par mots (sur le chunk et les mots-clés, sans colonne en plus)
create index documents_mots_idx on documents
  using gin (to_tsvector('french', coalesce(chunk, '') || ' ' || coalesce(mots_cles, '')));

-- Recherche hybride : vecteurs + mots-clés, fusionnés (Reciprocal Rank Fusion)
create or replace function match_hybrid (
  query_text text,
  query_embedding vector,
  match_count int default 5,
  rrf_k int default 60
)
returns table (id bigint, chunk text, mots_cles text, score float)
language sql stable as $$
  with sem as (
    select d.id, row_number() over (order by d.embedding <=> query_embedding) as r
    from documents d
    order by d.embedding <=> query_embedding
    limit match_count * 4
  ),
  kw as (
    select d.id,
           row_number() over (order by ts_rank_cd(to_tsvector('french', coalesce(d.chunk, '') || ' ' || coalesce(d.mots_cles, '')), websearch_to_tsquery('french', query_text)) desc) as r
    from documents d
    where to_tsvector('french', coalesce(d.chunk, '') || ' ' || coalesce(d.mots_cles, '')) @@ websearch_to_tsquery('french', query_text)
    order by ts_rank_cd(to_tsvector('french', coalesce(d.chunk, '') || ' ' || coalesce(d.mots_cles, '')), websearch_to_tsquery('french', query_text)) desc
    limit match_count * 4
  )
  select d.id, d.chunk, d.mots_cles,
         (coalesce(1.0 / (rrf_k + sem.r), 0) + coalesce(1.0 / (rrf_k + kw.r), 0))::float as score
  from documents d
  left join sem on sem.id = d.id
  left join kw on kw.id = d.id
  where sem.id is not null or kw.id is not null
  order by score desc
  limit match_count;
$$;

notify pgrst, 'reload schema';

-- Vérification
select id, length(chunk) as nb_caracteres, mots_cles from documents order by id limit 10;
