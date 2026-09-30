---
name: interview-and-represent
description: Interviewer l'utilisateur pour comprendre précisément son besoin, puis lui re-présenter (reformuler) ce qui a été compris sous forme de fiche à valider avant de commencer à travailler. À utiliser au début d'un projet ou quand la demande est vague, incomplète ou contradictoire.
---

# Interview et représentation (Interview & Represent)

Deux temps : **interroger** pour comprendre, puis **re-présenter** ce que l'on a compris pour que l'utilisateur confirme ou corrige. On ne commence pas le travail tant que la fiche n'est pas validée.

## Temps 1 : l'interview

- Poser **une question à la fois** (deux au maximum si elles sont liées). Attendre la réponse.
- Commencer large (le but), puis préciser. Environ 6 à 10 questions suffisent.
- Reprendre les mots de l'utilisateur, ne pas imposer son vocabulaire.
- Ne pas demander ce qui se trouve déjà dans le contexte ou les fichiers : le lire d'abord.
- Signaler tout de suite une **contradiction** entre deux réponses.

Thèmes à couvrir :

1. **Objectif** : quel problème, pour qui, pourquoi maintenant ?
2. **Résultat attendu** : à quoi ressemble un livrable réussi ?
3. **Critères de réussite** : comment saura-t-on que c'est bon ? (chiffres si possible)
4. **Contraintes** : délai, budget, outils imposés, quotas, ce qui est interdit.
5. **Données et accès** : quelles sources, quelles clés, quelles données personnelles ?
6. **Utilisateurs et fréquence** : qui l'utilise, à quel rythme ?
7. **Risques et cas limites** : que craint l'utilisateur ? Que ne doit-il surtout pas arriver ?
8. **Hors périmètre** : ce qui est volontairement exclu.

## Temps 2 : la représentation

Rédiger une **fiche** courte et la lire à l'utilisateur, sans jargon :

```
FICHE DE COMPRÉHENSION
Objectif : …
Livrable : …
Réussite si : …
Contraintes : …
Données / accès : …
Hors périmètre : …
Points que j'ai supposés (à confirmer) : …
Questions encore ouvertes : …
```

Puis demander explicitement : **« Est-ce bien ça ? Qu'est-ce que j'ai mal compris ? »**

## Règles

- Séparer ce que l'utilisateur a **dit** de ce que j'ai **supposé**. Les suppositions vont dans « à confirmer ».
- Corriger la fiche après chaque retour, puis la re-présenter jusqu'à validation.
- Une fois validée, la fiche devient la référence pour la suite (développement, relecture).

## Exploration

Quand le besoin touche un modèle d'IA (choix de Gemini, GPT, etc.), ne propose pas un modèle de mémoire : lance d'abord l'exploration en ligne du skill `exploration-modeles`, puis présente à l'utilisateur les options trouvées (qualité / économique) pour qu'il tranche.
