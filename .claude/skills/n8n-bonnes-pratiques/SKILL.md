---
name: n8n-bonnes-pratiques
description: Construire des workflows n8n lisibles, linéaires et peu coûteux, avec des nœuds natifs plutôt que du Code ou du HTTP Request, le bon modèle d'IA au bon prix, et des credentials propres. À utiliser dès qu'on crée, modifie, importe ou relit un workflow n8n (avec n8ncli ou dans l'interface), qu'on choisit un nœud, un modèle Gemini/OpenAI, ou qu'on prépare un workflow à montrer à un enseignant ou à un client.
---

# Des workflows n8n qu'on a envie de lire

Un bon workflow se lit de gauche à droite comme une phrase. Celui qui le reprend dans six mois, ou l'enseignant qui le relit en deux minutes, doit comprendre ce qu'il fait sans ouvrir un seul nœud.

## Les cinq règles

1. **Un nœud natif avant un nœud Code.** Avant d'écrire du JavaScript, cherche : `Edit Fields`, `Filter`, `If`, `Switch`, `Sort`, `Limit`, `Remove Duplicates`, `Aggregate`, `Split Out`, `Merge`, `Postgres`, `Supabase`, `Google Gemini`… (`n8ncli nodes search <mot>` aide). Le Code est justifié quand aucun nœud ne le fait : par exemple découper un texte par titres.
2. **Un nœud natif avant un HTTP Request.** Un `HTTP Request` est légitime quand le service n'a pas de nœud pour l'opération voulue (c'est le cas des embeddings Gemini). Dans les autres cas, utilise le nœud du service.
3. **Linéaire.** Une seule ligne, de gauche à droite. Les seules branches acceptées sont les sorties d'erreur courtes (un `If` qui mène à un `Stop and Error` ou à une réponse « rien trouvé »). Évite les sous-nœuds suspendus en dessous quand une chaîne de nœuds simples suffit.
4. **Des noms qui parlent.** « Garder les morceaux utiles » vaut mieux que « Filter1 ». Une idée, un nœud, un nom.
5. **Aucun secret dans le workflow.** Les clés vivent dans les credentials n8n. Un workflow exporté ne contient jamais de valeurs réelles.

Pourquoi ces règles ? Le Code est invisible dans l'interface, difficile à relire et à déboguer pour quelqu'un d'autre. Un workflow plein de Code et de HTTP ressemble à du code déguisé : il se remarque tout de suite, et il est plus fragile.

## Choisir le modèle d'IA

Ne choisis jamais un modèle de mémoire. Applique la méthode de `interview/references/choix-modeles.md` : chercher en ligne, prendre **le moins cher des modèles récents stables** pour les tâches simples (routing, reranking, mots-clés, extraction) et **le dernier stable** pour la réponse finale, noter la date de vérification.

## Travailler avec n8ncli

- `n8ncli pull` avant de modifier, `n8ncli validate --lint` avant de pousser, `n8ncli push --dry-run` puis `push`.
- Un workflow créé par l'outil n'est visible par `n8ncli` que si l'option « Disponible dans MCP » est activée sur lui. Sinon, `pull` ne le trouve pas et `push` peut annoncer « UPDATED » sans rien changer : relis le résultat depuis n8n pour vérifier.
- Trop de `push` d'affilée déclenchent « Too many requests » : espace-les.
- Les dossiers n8n et l'URL de base de données ne sont pas disponibles sur n8n Cloud : déplace les workflows dans l'interface.

## Les pièges déjà rencontrés (à vérifier en premier)

| Symptôme | Cause habituelle |
|---|---|
| Un nœud reçoit des données vides | Exécution lancée depuis un déclencheur interne au lieu du bon : choisis « Execute workflow from <le vrai déclencheur> » avec la flèche du bouton orange |
| Les résultats ne changent pas d'un test à l'autre | Nœud épinglé (pin) : dépingle |
| `Credentials not found` | Un workflow importé ne garde pas les credentials : rebranche-les |
| `Too many requests` / `exceeded your current quota` | Quota par minute ou par jour : espace les appels, réessaie, ou nouvelle clé dans un nouveau projet |
| Accents abîmés (`p√®re`) après un copier-coller | Presse-papier lu en mauvais encodage : forcer UTF-8 ou passer par un fichier |
| Un nœud Set refuse une valeur | Mauvais type de champ (Object au lieu de String) |
| Un test « Execute step » isolé échoue | Le nœud n'a pas de données en entrée : lance le workflow complet |

## Avant de montrer un workflow

Relis-le comme un enseignant : peut-il suivre la ligne sans ouvrir de nœud ? Y a-t-il du Code ou du HTTP sans raison ? Les erreurs sont-elles visibles ? Un sticky note résume-t-il l'ensemble ? Pour la relecture à froid, appelle `hostile-review`.
