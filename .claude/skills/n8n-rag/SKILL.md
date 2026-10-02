---
name: n8n-rag
description: Concevoir, construire et déboguer un RAG (retrieval-augmented generation) dans n8n avec Supabase et Postgres : ingestion (extraction, nettoyage, découpage en chunks, mots-clés, embeddings, stockage) puis answering (contexte, routing, recherche, filtre sur score, reranking, génération). À utiliser dès qu'on parle de RAG, de base vectorielle, d'embeddings, de chunks, de pgvector, de chatbot sur ses propres documents, ou quand un workflow d'ingestion ou de chat sur documents est à créer, expliquer ou réparer.
---

# RAG dans n8n : de l'ingestion à la réponse

Un RAG fait deux métiers très différents. **L'ingestion** prépare le savoir une fois. **L'answering** s'en sert à chaque question. Presque toute la qualité d'un RAG se joue dans l'ingestion et dans la recherche, pas dans le modèle qui rédige la réponse.

Avant de construire, applique le skill `interview` (besoin, puis choix du modèle) et respecte `n8n-bonnes-pratiques` (linéaire, nœuds natifs).

## La base : une table, quatre colonnes

```
documents ( id bigserial, chunk text, embedding vector(3072), mots_cles text )
```
Les scripts SQL prêts à l'emploi sont dans `references/supabase.sql` : table, index de recherche par mots, fonction `extraire_mots_cles` et trigger (les mots-clés sont calculés par Postgres, sans appel à un modèle d'IA, donc sans quota). **La dimension du vecteur doit être identique partout** : modèle d'embedding, colonne, fonction de recherche.

## Ingestion : les 4 étapes

| Étape | Ce qu'on fait | Nœuds |
|---|---|---|
| Extraction | PDF vers texte (Markdown via OCR si le PDF est scanné) ; test « assez de texte ? » | Form Trigger, Extract From File, If, Stop and Error |
| Chunking | Découper par titres, ~5000 caractères maximum, chevauchement ~200 | Code (justifié), Filter, Remove Duplicates, Limit |
| Augmentation | Mots-clés (Postgres), contexte et questions hypothétiques (modèle d'IA, optionnel et coûteux en quota) | Postgres |
| Vectorisation | Embedding du chunk (+ mots-clés), contrôle de la dimension, insertion | HTTP Request (pas de nœud natif), If, Edit Fields, Supabase |

Détails, réglages et nœud par nœud : [references/ingestion.md](references/ingestion.md).

## Answering : les 4 blocs

**Context** (message, configuration) → **Routing** (reformuler la question, extraire des mots-clés) → **Search** (embedding de la question, recherche vectorielle avec bonus mots-clés, score) → **Reranking** (un modèle bon marché garde les meilleurs extraits) → génération avec citations, ou « je ne trouve pas ».

Détails : [references/answering.md](references/answering.md).

## Les règles qui évitent 90 % des problèmes

- **Même modèle d'embedding** à l'ingestion et à la question, avec la même dimension. Types de tâche : `RETRIEVAL_DOCUMENT` pour les chunks, `RETRIEVAL_QUERY` pour les questions.
- **Débit raisonnable** : sur un plan gratuit, un embedding toutes les 3 à 5 secondes. Active les nouvelles tentatives automatiques. Les gros chunks consomment plus de tokens par minute.
- **Tester petit** : `Limit` à 5 puis 30, et seulement ensuite le livre entier.
- **Vider avant de relancer** (`truncate documents restart identity;`) pour éviter les doublons.
- **Lancer depuis le bon déclencheur** et dépingler les nœuds.
- **Choisir les modèles par le prix** : routing et reranking sur le moins cher, réponse finale sur le dernier stable (voir `interview/references/choix-modeles.md`).

## Si la réponse est mauvaise, cherche dans cet ordre

1. Les bons chunks sont-ils dans la table ? (`select count(*), avg(length(chunk)) from documents;`)
2. La recherche les remonte-t-elle ? (regarde la sortie de Search et les scores ; ajuste le seuil.)
3. Le reranking garde-t-il les bons ? (sortie de Reranking.)
4. Le prompt autorise-t-il « je ne sais pas » et exige-t-il les citations ?
