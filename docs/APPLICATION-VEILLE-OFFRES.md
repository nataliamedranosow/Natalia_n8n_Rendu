# Application des 3 skills au projet « Veille offres Data & IA, Londres »

Ce document applique les trois skills au workflow `workflows/projects/veille-offres-data-ia-londres.workflow.ts`.

**Convention de preuve.** *Observé* = vu pendant les essais dans n8n ou lors d'un test. *Testé ici* = vérifié par un petit calcul ou script lors de cette analyse. *Supposé* = raisonnable mais non testé. Les corrections ont été **appliquées** dans la version `v2 corrigée` du workflow (voir la section 2).

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
| D1 | La règle C4 écarte freelance, stage, alternance. | Si le titre contient « Early-Stage », alors l'offre est exclue à tort. | Élevé | *Testé* : avant correction, « Data Analyst, Early-Stage Fintech » et « Stage 2 Trials » étaient exclus. Après : ils sont gardés, alors que « Data Analyst (Stage) », « Intern », « Freelance » restent exclus (15 cas de test, 0 échec). | Vérifié | **Corrigé** (nœud 06). Les « graduate schemes » restent exclus, car le cahier des charges les liste. |
| D2 | La règle C3 écarte les postes seniors. | Si « Lead » désigne autre chose (« Lead Generation »), alors l'offre est exclue à tort. | Moyen | *Testé* : « Lead Generation Data Analyst » était exclu ; il est maintenant gardé. « Lead Data Analyst », « Head of Data », « Senior » restent exclus. Le cahier des charges impose l'exclusion de « Lead » en mot entier : elle est conservée. | Vérifié | **Corrigé** (nœud 06), sans contredire le cahier des charges. |
| D3 | La règle C5 garde les employeurs du registre des sponsors. | Si le nom sur l'offre diffère un peu du nom au registre, alors un vrai sponsor est écarté. | Élevé | *Testé* : avant, « FDM Group » / « FDM Group (Holdings) PLC » = 0,64 de similarité, donc rejeté. Après ajout d'un « noyau » du nom (sans Group, Holdings, UK, Co, and…), 9 cas de test sur 9 conformes : FDM, Barclays Bank UK, Deloitte, Morgan Stanley, Smith and Williamson trouvés ; « Morgan Sindall » et une entreprise inconnue non trouvés. | Vérifié | **Corrigé** (nœud 10). Le seuil de similarité reste à 0,9 et sera ajusté avec de vrais noms. |
| D4 | Le nœud 07 appelle le registre une seule fois. | S'il reçoit N offres, alors il fait N appels. | Élevé | *Observé* : échec entre les nœuds 06 et 07 après environ 40 s. Cause probable, non confirmée. | Supposé | **Corrigé** : *Execute Once* activé. |
| D5 | Le modèle Gemini choisi répond. | Si le modèle est retiré ou surchargé, alors le nœud 13 échoue. | Élevé | *Observé* : `gemini-2.5-flash` retiré (404) ; `gemini-3.1-flash-lite-preview` en surcharge (503) puis OK ; `gemini-3.5-flash-lite` OK (200). | Vérifié | **Corrigé** : `gemini-3.5-flash-lite`, 5 tentatives espacées de 5 s. |
| D6 | 12 offres passent par l'IA par exécution. | Au-delà de 15 requêtes par minute, alors Google renvoie une erreur 429. | Élevé | *Observé* : « quota exceeded, limit 15 ». | Vérifié | **Corrigé** : nœud *Limit* à 12 offres (nœud 11b). |
| D7 | Une panne de l'IA est signalée. | Si Gemini échoue, alors l'e-mail dit « Aucune nouvelle offre » sans prévenir. | Élevé | Lecture du workflow déployé : le nœud 13 n'a pas de « Continue on error » et le nœud 14 lève une erreur sur une réponse illisible. Le workflow s'arrête, ce qui déclenche l'alerte, conforme au cahier des charges. Le risque de silence ne concernait qu'une variante tolérante, non déployée. | Vérifié | **Garder**. À vérifier : que le workflow d'alerte est bien relié dans les réglages (*Error Workflow*). |
| D8 | La mémoire anti-doublon fonctionne. | En lancement manuel, elle n'est pas enregistrée : la règle C1 ne peut pas être testée. | Moyen | Documentation n8n sur les données statiques. Non testé ici. | Supposé | **Documenter** : tester après activation, sur deux envois successifs. |
| D9 | Les salaires sont interprétés correctement. | Une valeur mensuelle (3 500) lue comme annuelle serait rejetée par C9. | Moyen | Lecture du code (nœud 14). Non testé sur de vraies données. | Supposé | **Documenter**. |
| D10 | Le profil n'est pas exposé. | Le profil complet est envoyé à Google à chaque analyse. | Moyen | Lecture du code (nœud 12). | Vérifié | **Documenter** et retirer du dépôt (fait). |
| D11 | Le registre est téléchargé correctement. | Un fichier plus petit ou des colonnes changées arrêtent le nœud 10. | Moyen | Vérifié : l'API GOV.UK répond 200 avec un lien `.csv`. Non vérifié : taille et colonnes. | Supposé | **Documenter** (le nœud échoue avec un message clair). |
| D12 | Le nœud 15 reçoit une branche par entrée. | Si deux nœuds sont branchés sur la même entrée, alors il s'exécute deux fois et l'e-mail part en double. | Élevé | Lecture du workflow déployé : les nœuds 10 et 14 étaient tous deux reliés à l'entrée 0. | Vérifié | **Corrigé** : le nœud 10 est relié à l'entrée 1. |
| D13 | La clé Adzuna est valide. | Un espace au début de la clé la rend invalide. | Élevé | Lecture du workflow déployé : la valeur de `app_key` commençait par un espace. | Vérifié | **Corrigé** : espace retiré. |
| D14 | Seules les offres traitées sont mémorisées. | Si le nœud 16 mémorise toutes les offres, alors celles qui dépassent le Top 10 ne reviennent jamais ; s'il n'en mémorise aucune rejetée, alors les mêmes 12 offres refusées reprennent la place à chaque fois. | Élevé | *Testé* (13 offres simulées) : sont mémorisées les offres du Top 10 et celles rejetées par C4, C6 à C10 ; les offres valables hors Top 10 ne le sont pas, conformément au cahier des charges. | Vérifié | **Corrigé** (nœud 16). |

### Bilan du doute
- **Corrigés** : D1, D2, D3, D4, D5, D6, D12, D13, D14.
- **Gardés après vérification** : D7.
- **Documentés (à surveiller en réel)** : D8, D9, D10, D11.
- **Tests réalisés** : expressions C3/C4 (15 cas), rapprochement des noms (9 cas), mémorisation du nœud 16 (13 offres simulées). **Non réalisé** : une exécution complète avec envoi d'e-mail.

---

## 3. Relecture hostile (10 %)

**Livrable examiné** : le workflow déployé dans n8n (18 nœuds + nœud 11b) avant, puis après corrections.
**Limite** : aucune exécution de bout en bout n'a été faite ; l'analyse repose sur la lecture du workflow, des tests isolés et les incidents observés.

### Failles trouvées

**1. Majeure : e-mail potentiellement en double (nœud 15)**
- *Scénario* : les nœuds 10 et 14 sont branchés sur la même entrée du nœud de fusion ; il s'exécute deux fois, donc deux e-mails.
- *Preuve* : lecture des connexions du workflow déployé.
- *Statut* : **corrigé** (nœud 10 relié à l'entrée 1).

**2. Majeure : clé Adzuna invalide (nœud 04)**
- *Scénario* : la valeur de `app_key` commence par un espace ; Adzuna refuse la requête et une source entière disparaît.
- *Preuve* : lecture du workflow déployé.
- *Statut* : **corrigé**.

**3. Majeure : sponsors légitimes écartés (nœud 10)**
- *Scénario* : « FDM Group » est cherché dans un registre où il figure sous « FDM Group (Holdings) PLC » ; similarité 0,64, offre rejetée.
- *Preuve* : test réalisé.
- *Statut* : **corrigé** (comparaison par noyau du nom).

**4. Majeure : offres pertinentes écartées à tort (nœud 06)**
- *Scénario* : « Data Analyst, Early-Stage Fintech » exclu par la règle C4 ; « Lead Generation Data Analyst » exclu par C3.
- *Preuve* : test réalisé.
- *Statut* : **corrigé**.

**5. Majeure : mémorisation contraire au cahier des charges (nœud 16)**
- *Scénario* : les offres valables hors Top 10 étaient mémorisées et ne revenaient jamais.
- *Preuve* : test réalisé sur 13 offres simulées.
- *Statut* : **corrigé**.

**6. Mineure : mémoire anti-doublon non testable à la main**
- *Preuve* : documentation n8n, non testé ici.
- *Statut* : **à vérifier** après activation, sur deux envois réels.

**7. Mineure : interprétation des salaires non validée**
- *Scénario* : un salaire mensuel lu comme annuel est exclu par C9.
- *Preuve* : lecture du code.
- *Statut* : **à surveiller** sur les premières offres réelles.

**8. Mineure : confidentialité du profil**
- *Scénario* : parcours et employeur envoyés à un service tiers à chaque analyse.
- *Statut* : **documenté**.

### Verdict
**Livrable après correction : les 5 failles majeures sont corrigées dans la version « v2 corrigée ».**
Comptage : 0 bloquante, 5 majeures corrigées, 3 mineures restantes.
**Non examiné** : envoi Gmail réel, comportement de la mémoire en production, contenu exact du registre des sponsors.
