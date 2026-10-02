# Choisir un modèle d'IA : méthode et repères datés

## La méthode en 5 gestes

1. **Chercher avant d'écrire.** Ouvre la page officielle des modèles et celle des tarifs de l'éditeur (pour Gemini : `ai.google.dev/gemini-api/docs/models` et `.../pricing`). Ne te fie pas à ta mémoire : les modèles changent plus vite que ton entraînement.
2. **Lister 2 ou 3 candidats** avec : l'identifiant exact, le statut (stable, preview, déprécié et sa date d'arrêt), le prix d'entrée et de sortie par million de tokens, la présence d'un quota gratuit.
3. **Choisir selon la tâche, pas selon le prestige.**
   - Tâche simple et répétée (extraire, classer, reformuler une question, trier des extraits, produire des mots-clés) : **le moins cher des modèles récents et stables**.
   - Rédaction finale, raisonnement, code : **le dernier modèle stable** de la gamme Flash.
   - Preview : seulement si l'utilisateur le demande, jamais en production.
4. **Vérifier que l'outil le propose** (liste du nœud n8n, SDK) avant de l'imposer.
5. **Écrire la date de vérification** à côté de l'identifiant (« vérifié le 2026-10-02 ») et garder un modèle de repli.

## Repères vérifiés le 2026-10-02 (à refaire à chaque projet)

| Besoin | Modèle | Prix par million de tokens (entrée / sortie) | Remarque |
|---|---|---|---|
| Le moins cher, génération 3.x stable | `gemini-3.1-flash-lite` | 0,25 $ / 1,50 $ | Routing, reranking, mots-clés, extraction |
| Flash-Lite 3.5 | `gemini-3.5-flash-lite` | 0,30 $ / 2,50 $ | Un peu plus cher que 3.1 |
| Dernier généraliste stable | `gemini-3.8-flash` | 0,75 $ / 3,75 $ jusqu'au 31/12/2026, puis 1,50 $ / 7,50 $ | Réponse finale, raisonnement |
| Embeddings stable | `gemini-embedding-001` | voir page tarifs | 3072 dimensions par défaut |
| Embeddings récent | `gemini-embedding-2` / `-preview` | 0,20 $ pour 1 M de tokens de texte | Multimodal, preview selon les pages |
| À éviter pour un nouveau projet | `gemini-2.5-*` | — | Accès limité aux anciens utilisateurs |

Sources : pages officielles Google AI for Developers (modèles et tarifs), consultées le 2026-10-02.

## Quotas du plan gratuit : ce qu'on a appris à nos dépens

- Les limites sont **par projet Google** et **par modèle** : requêtes par minute, tokens par minute, requêtes par jour.
- Une erreur « too many requests » ou « exceeded your current quota » veut dire : ralentis (une requête toutes les 3 à 5 secondes), réessaie automatiquement, ou change de projet (une clé créée dans un nouveau projet repart avec un quota neuf).
- Chaque modèle a son propre quota. Utiliser un modèle moins cher et différent pour le routing et le reranking soulage aussi le modèle de réponse.
