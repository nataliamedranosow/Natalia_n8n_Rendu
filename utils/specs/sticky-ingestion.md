## INGESTION · du PDF à la base vectorielle

**Objectif.** Transformer un livre (PDF) en morceaux de texte (chunks) que l'on peut retrouver par le sens. Chaque ligne stockée dans Supabase contient : `id`, `chunk` (le texte), `embedding` (le vecteur de 3072 nombres), `mots_cles`.

**Principe.** Quatre étapes : Extraction, Chunking, Augmentation, Vectorisation. Le workflow est linéaire : deux lignes, reliées par un appel du workflow à lui-même (Chunking (SUB) vers Chunking (Trigger)).

---

### Ligne 1 · Préparer le texte

1. **Formulaire PDF** (Form Trigger). Un champ fichier `data`, PDF uniquement. C'est le seul point d'entrée à utiliser pour lancer.
2. **Extract** (Extract From File, opération PDF). Sort le texte brut et le nombre de pages. Si le PDF est scanné (image), il n'y a pas de texte : prévoir un OCR (ex. Mistral OCR) qui rendrait du Markdown.
3. **Cleaning** (Edit Fields). Nettoie : retours chariot, mots coupés en fin de ligne, espaces multiples, lignes qui ne contiennent qu'un numéro de page. Produit `texte_propre`, `nom_fichier`, `pages`.
4. **Texte exploitable ?** (If). Vrai si `texte_propre` fait plus de 500 caractères. Sinon, **Erreur : PDF vide ou scanné** (Stop and Error) arrête avec un message clair.
5. **Chunking** (Code, le seul justifié). Découpe par titres (Markdown, « Chapitre N », numérotés, ou en majuscules). Un chunk fait au plus **5000 caractères**, avec **200 caractères de chevauchement** quand une section est coupée. Le titre est gardé au début du chunk. Sortie : `titre`, `contenu`, `nom_fichier`, `index`, `total`.
6. **Garder les morceaux utiles** (Filter). Écarte les morceaux de moins de 100 caractères.
7. **Supprimer les doublons** (Remove Duplicates). Compare le champ `contenu`.
8. **Limit** (200). Plafond de sécurité. Mettre **5** puis **30** pour tester. Le livre fait environ 115 chunks.
9. **Chunking (SUB)** (Execute Workflow). Rappelle ce même workflow : les chunks arrivent dans la ligne 2.

---

### Ligne 2 · Enrichir, vectoriser, stocker

1. **Chunking (Trigger)** (Execute Workflow Trigger, « Accept all data »). Reçoit les chunks de la ligne 1.
2. **Augmentation (mots-clés)** (Postgres). Appelle la fonction SQL `extraire_mots_cles` : les 7 mots les plus fréquents du chunk, sans mots vides. Instantané, gratuit, sans quota.
3. **Préparer le texte** (Edit Fields). `mots_cles`, et `texte_a_vectoriser` = chunk + mots-clés.
4. **Embedding** (HTTP Request). Appelle l'API Gemini, modèle `gemini-embedding-001`, type de tâche `RETRIEVAL_DOCUMENT`. Un appel toutes les 5 secondes, 5 essais automatiques (quota gratuit). HTTP car n8n n'a pas de nœud natif pour cet appel.
5. **Vecteur valide ?** (If). Vérifie que le vecteur fait bien **3072** valeurs, sinon **Erreur : mauvaise dimension**.
6. **Préparer la ligne** (Edit Fields). Trois champs String : `chunk`, `embedding` (= `[v1,v2,...]`), `mots_cles`.
7. **Save Chunk & Embedding** (Supabase, Create row). Écrit dans la table `documents`.

---

### Base de données (Supabase)

`documents ( id bigserial, chunk text, embedding vector(3072), mots_cles text )`
Fonction SQL `extraire_mots_cles` + trigger qui remplit `mots_cles` si vide. Script : `utils/sql/supabase.sql`.
**Règle d'or : la dimension 3072 doit être la même partout** (modèle, colonne, fonction de recherche).

### Credentials à brancher
- **Header Auth** : nom `x-goog-api-key`, valeur = clé API Gemini. Nœud Embedding.
- **Postgres** : Session pooler de Supabase (host, port, user `postgres.<ref>`, mot de passe). Nœud Augmentation.
- **Supabase API** : host du projet + clé secrète. Nœud Save Chunk & Embedding.

### Lancer
1. `truncate documents restart identity;` dans Supabase (évite les doublons).
2. Flèche du bouton orange puis **Execute workflow from Formulaire PDF**.
3. Environ 10 minutes pour 115 chunks (Chunking (SUB) reste orange).
4. Vérifier : `select count(*), min(length(chunk)), round(avg(length(chunk))), max(length(chunk)) from documents;`

### Pièges connus
- Lancé depuis Chunking (Trigger) : données vides, `chunk` nul. Toujours lancer depuis Formulaire PDF.
- Nœud épinglé (pin) : il rejoue de vieilles données. Dépingler.
- `Too many requests` : quota Gemini par minute/jour. Allonger l'intervalle, réessayer, ou clé dans un nouveau projet Google.
- Une table sans `vector(3072)` : erreur de dimension.
