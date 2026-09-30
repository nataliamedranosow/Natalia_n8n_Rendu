---
name: doubt-driven-development
description: Méthode de développement où chaque décision technique est contestée par un doute explicite, puis vérifiée par une preuve (test, mesure, lecture de la doc) avant d'avancer. À utiliser quand on construit, modifie ou débogue du code ou un workflow (n8n, script, API), surtout avec des règles métier, des APIs externes ou des quotas.
---

# Développement piloté par le doute (Doubt-Driven Development)

Principe : **une affirmation non vérifiée est une hypothèse, pas un fait.** Avant de considérer une étape comme terminée, on cherche ce qui pourrait la faire échouer, puis on le vérifie avec une preuve.

## Le cycle (à répéter à chaque étape significative)

1. **Affirmer** : écrire en une phrase ce que l'on pense vrai. Exemple : « le nœud 07 est appelé une seule fois ».
2. **Douter** : lister 3 à 6 doutes concrets, classés par risque (probabilité × gravité). Ne pas se limiter au cas heureux. Passer en revue ces familles :
   - **Entrées** : format inattendu, valeur vide, très grand volume, caractères spéciaux.
   - **Cas limites** : règles qui excluent trop ou pas assez, arrondis, dates, fuseaux horaires.
   - **Dépendances externes** : API qui change, quota, panne, modèle retiré, format de réponse modifié.
   - **Environnement** : différence entre test manuel et exécution réelle, données épinglées, cache.
   - **Sécurité et confidentialité** : clés, données personnelles envoyées à un tiers.
   - **Silence** : que se passe-t-il quand ça échoue ? Est-ce que quelqu'un le voit ?
3. **Vérifier** : pour chaque doute important, produire une **preuve** la moins coûteuse possible : un mini-test, une exécution avec des données simulées, la lecture de la documentation officielle, une requête réelle en lecture seule. Ne jamais tester par une action destructive ou coûteuse.
4. **Trancher** : trois décisions possibles, à écrire noir sur blanc :
   - **Corriger** (le doute était fondé) ;
   - **Garder** (le doute est levé, dire pourquoi) ;
   - **Documenter le risque** (impossible à lever maintenant : qui le surveille, comment).
5. **Journaliser** : consigner dans le journal des doutes (voir modèle plus bas).

## Règles

- Trois statuts seulement pour une information : **Vérifié** (preuve citée), **Supposé** (raisonnable mais non testé), **Inconnu**. Ne jamais écrire « ça devrait marcher » sans statut.
- Un doute sans preuve n'est pas levé. Un doute levé sans preuve citée est un mensonge.
- Commencer par le doute **le plus risqué**, pas le plus facile à tester.
- S'arrêter quand les doutes restants sont tous de faible risque et documentés. Douter à l'infini est aussi un échec.
- Ne pas dramatiser : un doute fondé est concret (« si X alors Y se produit »). Sinon, c'est une simple crainte, à noter en « Inconnu ».
- Ne rien exécuter d'irréversible (suppression, envoi d'e-mail réel, publication) pour tester un doute sans l'accord explicite de l'utilisateur.

## Modèle du journal des doutes

| # | Affirmation | Doute (si… alors…) | Risque | Preuve / vérification | Statut | Décision |
|---|---|---|---|---|---|---|
| D1 | … | … | Élevé / Moyen / Faible | … | Vérifié / Supposé / Inconnu | Corriger / Garder / Documenter |

## Ce que le skill produit à la fin

1. Le journal des doutes rempli.
2. La liste des corrections faites, et celles proposées mais non appliquées.
3. Les risques restants, avec un responsable et un moyen de les surveiller.
