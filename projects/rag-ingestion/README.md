# RAG · ingestion

Transforme un PDF en lignes `id, chunk, embedding, mots_cles` dans Supabase.

- Workflow : [`rag-ingestion.workflow.ts`](rag-ingestion.workflow.ts) (format n8ncli) ou [`rag-ingestion.import.json`](rag-ingestion.import.json) (à importer dans n8n).
- Description nœud par nœud : [`utils/specs/sticky-ingestion.md`](../../utils/specs/sticky-ingestion.md).
- Base de données à créer d'abord : [`utils/sql/supabase.sql`](../../utils/sql/supabase.sql).

**Avant de lancer** : brancher les credentials (Header Auth Gemini, Postgres, Supabase), rechoisir le workflow lui-même dans le nœud Chunking (SUB), lancer depuis **Formulaire PDF**.
