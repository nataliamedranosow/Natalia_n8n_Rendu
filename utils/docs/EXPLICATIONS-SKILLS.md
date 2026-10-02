# Les skills du dépôt, expliqués simplement

## C'est quoi un skill ?

Un skill est un mode d'emploi qu'on donne à Claude Code pour une tâche précise. C'est un dossier avec un fichier `SKILL.md` : un titre, une description qui dit **quand** l'utiliser, puis les étapes à suivre. Claude le lit tout seul quand la demande correspond, sans qu'on le lui rappelle.

Un bon skill ressemble à une collègue expérimentée qui vous dit : « Voilà comment je m'y prends, et voilà pourquoi. »

## Les cinq skills (dossier `.claude/skills/`)

| Skill | Il sert à… | Quand il se déclenche |
|---|---|---|
| `interview` | Comprendre le besoin, **explorer en ligne** ce qui existe (surtout le bon modèle d'IA, au meilleur prix), puis redire une fiche à valider | Début de projet, demande floue, choix d'un modèle |
| `n8n-bonnes-pratiques` | Des workflows n8n lisibles : linéaires, nœuds natifs avant Code et HTTP, bons modèles, pas de secret | Création, import ou relecture d'un workflow n8n |
| `n8n-rag` | Construire un RAG : ingestion (extraction, chunking, mots-clés, embeddings) et answering (context, routing, search, reranking) | Tout ce qui touche aux documents, embeddings, chunks, chatbot sur ses fichiers |
| `doubt-driven-development` | Construire en doutant : repérer où ça peut casser, le prouver avant d'avancer | Développement, débogage, « ça devrait marcher » |
| `hostile-review` | Relecture exigeante avant de rendre ou de présenter un travail | Avant un examen, une démo, une livraison |

Le dossier `.agents/skills/n8n/` contient le skill officiel fourni par `n8ncli` (`n8ncli import-skill`). Il est régénéré à chaque mise à jour de l'outil.

## Comment ils s'enchaînent

1. **interview** : on comprend, on explore, on choisit les modèles, on fait valider la fiche.
2. **n8n-bonnes-pratiques** et **n8n-rag** : on construit.
3. **doubt-driven-development** : à chaque étape, on prouve avant d'avancer.
4. **hostile-review** : avant de rendre, on relit à froid.

## Ce qui rend ces skills efficaces

- **Une description précise** : c'est elle qui décide si Claude utilise le skill. Elle dit à la fois ce que fait le skill et dans quels cas l'appeler.
- **Court dans le corps, détaillé à côté** : le `SKILL.md` reste lisible ; les détails vivent dans `references/` et ne sont lus que si besoin.
- **On explique le pourquoi** : une règle comprise est mieux suivie qu'une règle imposée.
- **Des faits datés** : les modèles et les prix changent. Les repères sont écrits avec leur date de vérification, et la méthode pour les refaire est dans le skill.
- **Des pièges réels** : les erreurs rencontrées (quota, données épinglées, mauvais déclencheur) sont consignées pour ne pas être refaites.

## Mise à jour d'un modèle ou d'un prix

Ouvre `.claude/skills/interview/references/choix-modeles.md`, refais la recherche sur les pages officielles de l'éditeur, mets à jour le tableau et sa date.
