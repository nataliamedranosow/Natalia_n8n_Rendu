# Answering : nœud par nœud

Tableau de référence : **Context → Routing → Search → Reranking**, puis génération.

| Bloc | Nœud | Type n8n | Rôle et réglages |
|---|---|---|---|
| Context | When chat message received | Chat Trigger | Réponse du dernier nœud (`responseMode: lastNode`) |
| Context | Context | Edit Fields | `question` = message, `seuil` = 0,5 (à régler) |
| Routing | Routing | Google Gemini, Message a model | Modèle bon marché. Renvoie un JSON `{requete, mots_cles}` : la question reformulée de façon autonome et 3 à 6 mots-clés |
| Routing | Routing - Parse | Edit Fields | Lit le JSON ; si illisible, retombe sur la question d'origine |
| Search | Embedding de la requête | HTTP Request | Même modèle et même dimension que l'ingestion, `taskType: RETRIEVAL_QUERY` |
| Search | Search | Postgres, Execute Query | Distance vectorielle `<=>`, avec un petit bonus (−0,05) si les mots-clés correspondent au chunk. 10 résultats avec `score` = 1 − distance |
| Search | Filter Based on Score | Filter | `score > seuil`. « Always output data » activé pour ne pas bloquer le flux |
| Search | Aggregate | Aggregate | Regroupe `id`, `chunk`, `score` |
| Reranking | Chunks pertinents ? | If | Au moins un chunk. Sinon : « Je ne trouve pas cette information dans le livre. » |
| Reranking | Format Chunks | Edit Fields | Liste numérotée des candidats |
| Reranking | Reranking | Google Gemini | Modèle bon marché. Choisit les 3 extraits les plus utiles (JSON `{ids}`) |
| Reranking | Parse Chunks | Edit Fields | Garde le texte des extraits choisis ; par défaut les 3 premiers |
| Réponse | Génération | Google Gemini | Dernier modèle stable. Répond uniquement avec les extraits, cite les numéros, dit « je ne trouve pas » sinon |
| Réponse | Réponse | Edit Fields | Champ `output` renvoyé au chat |

## Régler le seuil

Regarde la sortie de **Search** avec une question dont tu connais la réponse. Si les bons chunks ont un score autour de 0,6–0,75 et les mauvais sous 0,5, un seuil de 0,5 convient. Si le bot dit « je ne trouve pas » à tort, baisse le seuil ; s'il répond hors sujet, monte-le.

## Tester

1. Une question dont la réponse est dans le livre : la réponse cite des extraits.
2. Une question hors livre : « Je ne trouve pas cette information dans le livre. »
3. Une question de suivi : sans mémoire de conversation, elle n'est pas comprise. C'est une limite connue de la version linéaire.

## Pistes d'amélioration

Recherche hybride dans Postgres (fusion vecteurs et mots avec RRF), mémoire de conversation (historique en base), vérification des citations, reformulation multiple.
