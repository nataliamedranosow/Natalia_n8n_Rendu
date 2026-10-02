---
name: doubt-driven-development
description: Construire ou déboguer en doutant honnêtement de chaque étape et en la prouvant avant de passer à la suivante. À utiliser dès qu'on développe, modifie ou répare du code, un workflow n8n, un script ou une intégration d'API, surtout avec des règles métier, des quotas, des clés ou des modèles d'IA. À utiliser aussi quand quelqu'un dit « ça devrait marcher », « c'est bon » ou « ça marchait hier ».
---

# Développer en doutant

« Ça devrait marcher » n'est pas un résultat, c'est une hypothèse. Ce skill sert à transformer les hypothèses en preuves avant qu'elles ne te coûtent une heure, ou un examen.

Le doute n'est pas de l'anxiété : c'est de la curiosité méthodique. Tu ne cherches pas à tout remettre en cause, tu cherches **le seul endroit où ça risque de casser**, et tu vas le regarder.

## Le cycle, à chaque étape qui compte

1. **Dis ce que tu crois.** Une phrase : « le nœud 7 reçoit un morceau à la fois ».
2. **Cherche 3 à 5 façons dont c'est faux**, classées par ce qui ferait le plus mal. Aide-toi de ces familles :
   - **Les données** : vides, énormes, accentuées, dans un format inattendu.
   - **Les cas limites** : zéro résultat, un seul, des doublons, des dates.
   - **Ce qui ne t'appartient pas** : API, quota, clé expirée, modèle retiré ou remplacé, limite par minute ou par jour.
   - **L'environnement** : test manuel contre exécution réelle, données épinglées, cache, copier-coller qui abîme les accents.
   - **La confidentialité** : quelles données partent chez un tiers ?
   - **Le silence** : si ça échoue, est-ce que quelqu'un le voit ?
3. **Prouve avec le moyen le moins coûteux** : un test sur 5 éléments au lieu de 500, la lecture de la doc officielle, une requête en lecture seule, un aperçu de sortie. Jamais d'action irréversible pour tester (suppression, envoi réel, publication) sans l'accord de l'utilisateur.
4. **Tranche et écris-le** : *Corriger* (le doute était fondé), *Garder* (levé, avec la preuve), ou *Surveiller* (impossible à lever maintenant : qui regarde quoi ?).
5. **Note-le** dans le journal des doutes ci-dessous.

## Trois statuts, pas un de plus

**Vérifié** (preuve citée) · **Supposé** (plausible, pas testé) · **Inconnu**. Ne dis jamais « normalement » sans statut. Un doute levé sans preuve citée n'est pas levé.

## Quand s'arrêter

Quand les doutes restants sont faibles et notés. Douter à l'infini est aussi une façon d'échouer. Si tu hésites, commence par le doute le plus risqué, pas le plus facile à tester.

## Pour les workflows n8n, les doutes qui reviennent

- Le test est-il lancé depuis le **bon déclencheur** ? Lancé depuis un déclencheur interne, un workflow reçoit des données vides.
- Un nœud est-il **épinglé** (pin data) ? Il rejoue de vieilles données au lieu de la vraie entrée.
- Les **dimensions** correspondent-elles (modèle d'embedding, colonne vectorielle, fonction de recherche) ?
- Le **quota** tient-il à l'échelle réelle (115 morceaux, pas 5) ? Voir `interview/references/choix-modeles.md` pour les repères datés.
- Un nœud Code ou HTTP est-il vraiment nécessaire, ou un nœud natif ferait-il le travail ? Voir `n8n-bonnes-pratiques`.

## Journal des doutes

| # | Je crois que… | Mais si… alors… | Risque | Preuve | Statut | Décision |
|---|---|---|---|---|---|---|
| D1 | | | élevé / moyen / faible | | vérifié / supposé / inconnu | corriger / garder / surveiller |

## Ce que tu rends à la fin

1. Le journal rempli.
2. Les corrections faites, et celles proposées mais pas appliquées.
3. Les risques restants, avec qui les surveille et comment.
