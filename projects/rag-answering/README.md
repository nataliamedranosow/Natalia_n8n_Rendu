# RAG · answering

Répond à une question sur le livre à partir des extraits stockés par l'ingestion : Context, Routing, Search, Reranking, puis génération avec citations.

- Workflow : [`rag-answering.workflow.ts`](rag-answering.workflow.ts) ou [`rag-answering.import.json`](rag-answering.import.json).
- Description nœud par nœud : [`utils/specs/sticky-answering.md`](../../utils/specs/sticky-answering.md).

**Avant de lancer** : brancher Gemini (Routing, Reranking, Génération), Header Auth (Embedding de la requête) et Postgres (Search). Régler `seuil` dans le nœud Context si besoin.
