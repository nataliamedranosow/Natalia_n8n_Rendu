# Ingestion : nœud par nœud

Le workflow tient sur **deux lignes** dans le même canvas, reliées par un appel du workflow à lui-même (nœud Execute Workflow vers un Execute Workflow Trigger).

## Ligne 1 · Préparer le texte

| Nœud | Type n8n | Réglages importants |
|---|---|---|
| Formulaire PDF | Form Trigger | Un champ fichier nommé `data`, PDF uniquement |
| Extract | Extract From File | Opération « PDF » |
| Cleaning | Edit Fields | `texte_propre` (retire retours chariot, mots coupés, espaces multiples, lignes qui ne sont qu'un numéro de page), `nom_fichier`, `pages` |
| Texte exploitable ? | If | `texte_propre.length > 500`. Sinon : Stop and Error « PDF vide ou scanné » |
| Chunking | Code | Découpe par titres (Markdown, « Chapitre N », numérotés, majuscules), 5000 caractères maximum, chevauchement 200. Une idée par chunk, le titre est gardé au début du chunk |
| Garder les morceaux utiles | Filter | `contenu.length > 100` |
| Supprimer les doublons | Remove Duplicates | Comparer le champ `contenu` |
| Limit | Limit | 200 en production (5 puis 30 pour tester) |
| Chunking (SUB) | Execute Workflow | Source « Database », le workflow lui-même, « Run once with all items », attendre le sous-workflow |

## Ligne 2 · Enrichir, vectoriser, stocker

| Nœud | Type n8n | Réglages importants |
|---|---|---|
| Chunking (Trigger) | Execute Workflow Trigger | « Accept all data » (sinon les champs sont perdus) |
| Augmentation (mots-clés) | Postgres, Execute Query | `select extraire_mots_cles($q${{ $json.contenu }}$q$) as mots_cles;` |
| Préparer le texte | Edit Fields | `mots_cles`, et `texte_a_vectoriser` = contenu + mots-clés |
| Embedding | HTTP Request | POST `…/models/gemini-embedding-001:embedContent`, en-tête `x-goog-api-key` (credential Header Auth), `taskType: RETRIEVAL_DOCUMENT`. Batching : 1 élément par lot, 5000 ms. Retry on fail : 5 essais, 5000 ms |
| Vecteur valide ? | If | `embedding.values.length == 3072`. Sinon : Stop and Error |
| Préparer la ligne | Edit Fields | Trois champs, tous en String : `chunk`, `embedding` (= `'[' + valeurs.join(',') + ']'`), `mots_cles` |
| Save Chunk & Embedding | Supabase, Create row | Table `documents`, mapping automatique |

## Lancer et vérifier

1. `truncate documents restart identity;`
2. « Execute workflow from Formulaire PDF » (jamais depuis Chunking (Trigger)).
3. Compter environ 10 minutes pour 115 chunks avec 5 s entre deux embeddings.
4. `select count(*), min(length(chunk)), round(avg(length(chunk))), max(length(chunk)) from documents;`

## Pourquoi ces choix

- **Mots-clés par Postgres** : instantanés, gratuits, sans quota. Un modèle d'IA ferait mieux (contexte, questions hypothétiques) mais coûte des appels.
- **Embedding en HTTP** : n8n n'a pas de nœud natif pour appeler l'embedding en direct sans sous-nœuds. Le workflow reste linéaire.
- **Code pour le chunking** : aucun nœud natif ne découpe par titres.
