## ANSWERING · de la question à la réponse sourcée

**Objectif.** Répondre à une question sur le livre, uniquement à partir des extraits stockés par l'ingestion, en citant les extraits, et en disant « Je ne trouve pas cette information dans le livre. » quand la réponse n'y est pas.

**Principe.** Quatre blocs, comme dans le cours : **Context → Routing → Search → Reranking**, puis la génération. Workflow linéaire, une seule requête HTTP, aucun nœud Code.

---

### 1 · Context
- **When chat message received** (Chat Trigger). Chaque message déclenche le flux. La réponse est celle du dernier nœud (champ `output`).
- **Context** (Edit Fields). `question` = le message ; `seuil` = **0,5** (seuil de pertinence, modifiable ici).

### 2 · Routing (comprendre la question)
- **Routing** (Google Gemini, modèle le moins cher : tâche simple). Reçoit la question et renvoie un JSON : `requete` (la question reformulée de façon autonome et précise) et `mots_cles` (3 à 6 mots).
- **Routing - Parse** (Edit Fields). Lit le JSON. S'il est illisible, retombe sur la question d'origine : le flux ne casse jamais ici.

### 3 · Search (retrouver les extraits)
- **Embedding de la requête** (HTTP Request). Même modèle (`gemini-embedding-001`) et même dimension (3072) que l'ingestion, type de tâche `RETRIEVAL_QUERY`. Sans cette règle, les vecteurs ne sont pas comparables.
- **Search** (Postgres, Execute Query). Calcule la distance entre la question et chaque chunk (`<=>`), prend les **10** plus proches, avec un petit bonus si les mots-clés de la question se trouvent dans le chunk ou ses mots-clés. Renvoie `id`, `chunk`, `mots_cles`, `score` (1 moins la distance : plus c'est proche de 1, plus c'est pertinent).
- **Filter Based on Score** (Filter). Garde les résultats dont `score > seuil`. « Always output data » est activé pour que le flux continue même si rien n'est gardé.
- **Aggregate** (Aggregate). Regroupe `id`, `chunk` et `score` en listes.

### 4 · Reranking (garder les meilleurs)
- **Chunks pertinents ?** (If). Vrai s'il reste au moins un chunk. Sinon : **Pas de chunk pertinent** répond « Je ne trouve pas cette information dans le livre. ».
- **Format Chunks** (Edit Fields). Prépare la liste numérotée des candidats `[id] (score …) texte`.
- **Reranking** (Google Gemini, modèle le moins cher). Choisit les 3 extraits les plus utiles et renvoie un JSON `{ids: […]}`.
- **Parse Chunks** (Edit Fields). Garde le texte de ces extraits (par défaut les 3 premiers si le JSON est illisible).

### 5 · Réponse
- **Génération** (Google Gemini, dernier modèle stable). Répond en français, uniquement avec les extraits, en citant leurs numéros entre crochets, par exemple [12]. Température basse implicite grâce aux consignes strictes.
- **Réponse** (Edit Fields). Met le texte dans `output` : c'est ce que le chat affiche.

---

### Credentials à brancher
- **Google Gemini (PaLM)** : Routing, Reranking, Génération.
- **Header Auth** (`x-goog-api-key`) : Embedding de la requête.
- **Postgres** (Session pooler Supabase) : Search.

### Régler et tester
1. Pose une question dont tu connais la réponse. Regarde la sortie de **Search** : les bons extraits doivent avoir les meilleurs scores.
2. Si le bot répond « je ne trouve pas » à tort : baisse `seuil` (0,4). S'il répond hors sujet : monte-le (0,6).
3. Pose une question hors livre : il doit répondre « Je ne trouve pas cette information dans le livre. ».

### Limites assumées
- Pas de mémoire de conversation : « Et le deuxième ? » n'est pas compris.
- La qualité dépend de l'ingestion : un mauvais découpage donne de mauvaises réponses.
- Le quota gratuit Gemini limite le nombre de questions par minute et par jour.

### Pistes d'amélioration
Recherche hybride (vecteurs + mots, fusion RRF), mémoire de conversation, vérification des citations, reformulations multiples.
