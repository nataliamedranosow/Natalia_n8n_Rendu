-- 1. Colonne de recherche par mots-clés + index
alter table documents
  add column if not exists fts tsvector
  generated always as (
    to_tsvector('french',
      coalesce(content, '') || ' ' || coalesce(metadata->>'augmentation', ''))
  ) stored;

create index if not exists documents_fts_idx on documents using gin (fts);

-- 2. Recherche hybride : vecteurs + mots-clés, fusionnés (Reciprocal Rank Fusion)
create or replace function match_hybrid (
  query_text text,
  query_embedding vector,
  match_count int default 5,
  rrf_k int default 60
)
returns table (id bigint, content text, metadata jsonb, score float)
language sql stable as $$
  with sem as (
    select documents.id, row_number() over (order by documents.embedding <=> query_embedding) as r
    from documents
    order by documents.embedding <=> query_embedding
    limit match_count * 4
  ),
  kw as (
    select documents.id,
           row_number() over (order by ts_rank_cd(documents.fts, websearch_to_tsquery('french', query_text)) desc) as r
    from documents
    where documents.fts @@ websearch_to_tsquery('french', query_text)
    order by ts_rank_cd(documents.fts, websearch_to_tsquery('french', query_text)) desc
    limit match_count * 4
  )
  select d.id, d.content, d.metadata,
         (coalesce(1.0 / (rrf_k + sem.r), 0) + coalesce(1.0 / (rrf_k + kw.r), 0))::float as score
  from documents d
  left join sem on sem.id = d.id
  left join kw on kw.id = d.id
  where sem.id is not null or kw.id is not null
  order by score desc
  limit match_count;
$$;

notify pgrst, 'reload schema';
