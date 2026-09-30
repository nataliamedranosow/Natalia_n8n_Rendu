# Application des 3 skills au projet « Veille offres Data & IA, Londres »

Ce document applique les trois skills au workflow `workflows/projects/veille-offres-data-ia-londres.workflow.ts`.

**Convention de preuve.** *Observé* = vu pendant les essais dans n8n ou lors d'un test. *Testé ici* = vérifié par un petit calcul ou script lors de cette analyse. *Supposé* = raisonnable mais non testé. Les corrections listées sont des **propositions** : elles ne sont pas encore appliquées au workflow.

---

## 1. Interview et représentation (10 %)

### Ce que la demande initiale disait
Un cahier des charges détaillé a été fourni : Londres uniquement, aucun Google Sheet, un seul e-mail de 10 offres le lundi et le jeudi à 12h30, offres déjà envoyées retenues par la mémoire du workflow, règles d'exclusion C1 à C10, plancher salarial de 35 000 GBP, score sur 100.

### Fiche de compréhension (à valider)

```
FICHE DE COMPRÉHENSION
Objectif : recevoir automatiquement une sélection d'offres Data & IA à Londres,
           adaptées à un profil junior finance/data, avec sponsorisation de visa.
Livrable : un e-mail HTML de 10 offres maximum, le lundi et le jeudi à 12h30 (Europe/Paris).
Réussite si : les offres sont récentes (moins de 14 jours), sans doublon d'un envoi à l'autre,
              émises par un employeur du registre officiel des sponsors, avec un score
              expliqué ; l'e-mail part même sans nouvelle offre ; une panne est signalée.
Contraintes : Londres uniquement ; aucun Google Sheet ; API gratuites (Reed, Adzuna, Gemini
              limité à 15 requêtes par minute) ; les clés sont gérées par l'utilisatrice.
Données / accès : Reed, Adzuna, registre GOV.UK des sponsors, Gemini, Gmail ;
                  un profil rédigé par l'utilisatrice, sans nom ni coordonnées.
Hors périmètre : sources Jooble et JSearch (prévues plus tard), Google Sheets.
Points que j'ai supposés (à confirmer) :
  - « junior » signifie 3 ans d'expérience demandés au maximum ;
  - 12 offres analysées par exécution suffisent pour en présenter 10 ;
  - le fuseau de l'horaire de 12h30 est celui de Paris.
Questions encore ouvertes :
  - Les contrats à durée déterminée de 6 mois ou plus sont-ils acceptés ?
  - Faut-il inclure les « graduate schemes », qui visent justement des profils juniors ?
  - Quelle tolérance pour les offres manquées à tort (faux négatifs) ?
  - Que faire si, un jour, moins de 10 offres passent tous les filtres ?
```

Cette fiche sépare ce qui a été **dit** (cahier des charges) de ce qui est **supposé** et des questions **ouvertes**. Deux de ces questions (graduate schemes, faux négatifs) se sont révélées importantes dans la suite, voir les doutes D1 et D3.

---

## 2. Développement piloté par le doute (80 %)

### Journal des doutes

| # | Affirmation | Doute (si… alors…) | Risque | Preuve | Statut | Décision |
|---|---|---|---|---|---|---|
| D1 | La règle C4 écarte freelance, stage, alternance. | Si le titre contient « Early-Stage » ou « Graduate Scheme », alors l'offre est exclue à tort. | Élevé | *Testé ici* : « Data Analyst, Early-Stage Fintech », « Junior Data Analyst - Graduate Scheme » et « Data Analyst - Stage 2 Trials » sont tous exclus (C4). | Vérifié | **Corriger** : retirer `stage` et `graduate scheme` de la liste, ou exiger « stage » seul en fin de titre. |
| D2 | La règle C3 écarte les postes seniors. | Si le titre contient « Lead » dans un autre sens, alors l'offre est exclue à tort. | Moyen | *Testé ici* : « Lead Generation Data Analyst », « Lead-in Data Analyst » et « Staff Accountant Data » sont exclus (C3). | Vérifié | **Corriger** : cibler « Lead Data », « Team Lead », « Head of ». |
| D3 | La règle C5 garde les employeurs du registre des sponsors. | Si le nom sur l'offre diffère un peu du nom au registre, alors un vrai sponsor est écarté. | Élevé | *Testé ici* (similarité de Dice, seuil 0,9) : « FDM Group » / « FDM Group (Holdings) PLC » = 0,64 ; « Deloitte LLP » / « Deloitte MCS Limited » = 0,73 ; « Barclays Bank UK PLC » / « Barclays Bank PLC » = 0,89 : tous rejetés. Faux positif possible : « Acme Analytics » / « Acme Analytica » = 0,92. | Vérifié | **Corriger** : retirer les mots de forme juridique (holdings, group, uk) avant comparaison ; comparer aussi par inclusion ; abaisser le seuil vers 0,8 après un test sur de vrais noms. |
| D4 | Le nœud 07 appelle le registre une seule fois. | Si le nœud 07 reçoit N offres en entrée, alors il fait N appels. | Élevé | *Observé* : le workflow échouait entre les nœuds 06 et 07, après environ 40 s ; ce comportement (N appels) est la cause probable, non confirmée. | Supposé | **Corriger** : activer *Execute Once* (déjà présent dans le fichier du dépôt). |
| D5 | Le modèle Gemini choisi répond. | Si le modèle est retiré ou surchargé, alors le nœud 13 échoue. | Élevé | *Observé* : `gemini-2.5-flash` a renvoyé « no longer available » (404) ; `gemini-3.1-flash-lite-preview` a renvoyé 503 (« high demand ») puis 200 lors d'un test ; `gemini-3.5-flash-lite` a répondu 200. | Vérifié | **Corriger** : utiliser un modèle stable (`gemini-3.5-flash-lite`), avec nouvelles tentatives. |
| D6 | 12 offres passent par l'IA par exécution. | Si plus de 15 requêtes partent en une minute, alors Google renvoie une erreur 429. | Élevé | *Observé* : « quota exceeded, limit 15 ». | Vérifié | **Corriger** : nœud *Limit* à 12 offres (proposé ; le fichier du dépôt ne le contient pas). |
| D7 | Si l'IA échoue, le workflow le signale. | Si Gemini est en panne, alors les offres sont écartées et l'e-mail dit « Aucune nouvelle offre », donc l'utilisatrice croit qu'il n'y en a pas. | Élevé | *Testé ici* : le nœud 14 renvoie `regle_exclusion = 'IA'` sur erreur ou réponse vide, sans alerte. | Vérifié | **Corriger** : compter les offres écartées pour cause d'IA et l'écrire dans le pied de l'e-mail. |
| D8 | La mémoire anti-doublon fonctionne. | Si le workflow est lancé à la main, alors la mémoire n'est pas enregistrée : la règle C1 ne peut pas être testée. | Moyen | Documentation n8n sur les données statiques : elles ne persistent que pour les exécutions de production. Non testé ici. | Supposé | **Documenter** : tester après activation, sur deux envois successifs. |
| D9 | Les salaires sont interprétés correctement. | Si une valeur mensuelle (par exemple 3 500) est lue comme annuelle, alors l'offre est rejetée par C9. | Moyen | Lecture du code (nœud 14) : moins de 100 = horaire, moins de 1 000 = journalier, sinon annuel. Non testé sur de vraies données. | Supposé | **Documenter** et vérifier sur les premières réponses réelles. |
| D10 | Le profil n'est pas exposé. | Si le profil contient l'employeur actuel, alors il est envoyé à Google à chaque analyse. | Moyen | Lecture du code (nœud 12) : le profil complet est inséré dans chaque requête. | Vérifié | **Documenter** : n'y mettre que l'essentiel ; le retirer du dépôt public (fait). |
| D11 | Le registre est téléchargé correctement. | Si le fichier CSV est plus petit que prévu ou change de colonnes, alors le nœud 10 s'arrête. | Moyen | Vérifié : l'API GOV.UK répond 200 et fournit un lien `.csv`. Non vérifié : taille du fichier et noms de colonnes. | Supposé | **Documenter** : le nœud échoue volontairement avec un message clair. |

### Bilan du doute
- **Corrections à appliquer** : D1, D2, D3, D5, D6, D7 (et D4 déjà présent dans le fichier du dépôt).
- **Risques documentés** : D8, D9, D10, D11.
- **Nombre de doutes levés par une preuve** : 7 sur 11. Les autres restent « supposés » et sont à surveiller lors des premiers envois réels.

---

## 3. Relecture hostile (10 %)

**Livrable examiné** : `veille-offres-data-ia-londres.workflow.ts` (18 nœuds) et son alerte.
**Limite** : le workflow n'a pas été exécuté de bout en bout ; l'analyse repose sur la lecture du code, des tests isolés et les incidents observés.

### Failles

**1. Majeure : des offres pertinentes sont écartées à tort (règles C3 et C4)**
- *Où* : nœud 06, expressions `RE_C3` et `RE_C4`.
- *Scénario* : une offre « Junior Data Analyst - Graduate Scheme » ou « Data Analyst, Early-Stage Fintech » est exclue avant même l'analyse.
- *Preuve* : test réalisé (D1, D2).
- *Correction* : resserrer les expressions.

**2. Majeure : des employeurs sponsors sont écartés à tort (règle C5)**
- *Où* : nœud 10, fonction de comparaison des noms.
- *Scénario* : « FDM Group » est cherché dans un registre où il figure sous « FDM Group (Holdings) PLC » ; la similarité vaut 0,64, donc l'offre est rejetée.
- *Preuve* : test réalisé (D3).
- *Correction* : normaliser plus fortement et comparer aussi par inclusion.

**3. Majeure : une panne de l'IA est invisible**
- *Où* : nœuds 14 et 16.
- *Scénario* : Gemini est surchargé ; toutes les offres sont écartées ; l'e-mail annonce « Aucune nouvelle offre cette fois ».
- *Preuve* : test réalisé sur le code du nœud 14 (D7).
- *Correction* : indiquer dans l'e-mail le nombre d'offres non analysées.

**4. Majeure : le livrable dépend d'un modèle qui change**
- *Où* : nœud 13.
- *Scénario* : le modèle configuré est retiré, comme `gemini-2.5-flash` pendant les essais.
- *Preuve* : incident observé (D5).
- *Correction* : modèle stable, nouvelles tentatives, alerte sur échec.

**5. Mineure : la mémoire anti-doublon n'est pas testable à la main**
- *Où* : nœuds 06 et 18.
- *Scénario* : tous les tests manuels réussissent, mais en production les doublons reviennent si la mémoire n'a pas été écrite.
- *Preuve* : soupçon fondé sur la documentation, non testé.
- *Correction* : tester sur deux envois réels après activation.

**6. Mineure : interprétation des salaires non validée**
- *Où* : nœud 14.
- *Scénario* : un salaire mensuel est lu comme annuel et exclu par C9.
- *Preuve* : lecture du code, non testé sur données réelles.

**7. Mineure : confidentialité du profil**
- *Où* : nœud 12.
- *Scénario* : parcours et employeur sont envoyés à un service tiers à chaque analyse.
- *Preuve* : lecture du code.
- *Correction* : réduire le profil aux compétences.

### Verdict
**À livrer après correction des failles 1 à 4.**
Comptage : 4 majeures, 3 mineures, 0 bloquante.
**Non examiné** : envoi Gmail réel, comportement de la mémoire en production, contenu exact du registre des sponsors.
