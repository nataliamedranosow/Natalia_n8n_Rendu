-- 1. Nouvelle colonne pour les mots-clés
alter table documents add column if not exists mots_cles text;

-- 2. La colonne de recherche par mots doit maintenant inclure les mots-clés
drop index if exists documents_fts_idx;
alter table documents drop column if exists fts;

alter table documents
  add column fts tsvector
  generated always as (
    to_tsvector('french',
      coalesce(content, '') || ' ' ||
      coalesce(mots_cles, '') || ' ' ||
      coalesce(metadata->>'augmentation', ''))
  ) stored;

create index documents_fts_idx on documents using gin (fts);

notify pgrst, 'reload schema';

-- Vérification : id, chunk, mots-clés, embedding
select id, content, mots_cles, embedding from documents order by id limit 10;
