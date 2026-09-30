# Application des 3 skills au projet « Veille offres Data & IA, Londres »

Ce document applique les trois skills au workflow `workflows-ts/projects/veille-offres-data-ia-londres.workflow.ts`.

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
| D13 | La clé Adzuna est valide. | Un espace au début de la clé la rend invalide. | Moyen | *Testé* (2 requêtes réelles) : Adzuna accepte la clé avec et sans l'espace. Le doute était infondé ; l'espace est retiré par précaution. | Vérifié | **Garder** la correction préventive, sans impact. |
| D14 | Seules les offres traitées sont mémorisées. | Si le nœud 16 mémorise toutes les offres, alors celles qui dépassent le Top 10 ne reviennent jamais ; s'il n'en mémorise aucune rejetée, alors les mêmes 12 offres refusées reprennent la place à chaque fois. | Élevé | *Testé* (13 offres simulées) : sont mémorisées les offres du Top 10 et celles rejetées par C4, C6 à C10 ; les offres valables hors Top 10 ne le sont pas, conformément au cahier des charges. | Vérifié | **Corrigé** (nœud 16). |
| D15 | Les salaires d'Adzuna sont interprétés correctement. | Si une offre indique 3 120 (montant mensuel), alors elle est lue comme 3 120 par an et rejetée par C9. | Élevé | *Observé sur données réelles* : deux offres Tripledot Studios (3 120, temps partiel) étaient exclues par C9. *Testé* : une valeur de 1 000 à 9 999 est maintenant lue comme mensuelle (3 120 devient 37 440 par an). | Vérifié | **Corrigé** (nœud 14). |
| D16 | Le seuil de score 60 laisse passer des offres. | Si une offre d'un secteur « autre » a des compétences correctes, alors elle ne peut presque jamais atteindre 60. | Élevé | *Observé sur données réelles* : sur 12 offres analysées par Gemini, 1 seule dépassait 60 ; 5 étaient exclues par C10, dont « Data & AI Analyst » à 52,5. | Vérifié | **Corrigé** : seuil abaissé de 60 à 50 (prévu comme réglable dans l'annexe C du cahier des charges). |
| D17 | L'IA distingue un contrat temporaire salarié d'un freelance. | Si Gemini classe un poste « temporaire, 15 mois, salaire annuel » comme freelance, alors la règle C4 l'exclut à tort. | Élevé | *Observé sur données réelles* : « FP&A Analyst » (Robert Half, 60 à 70 k£, finance, poste temporaire de 15 mois) était classé `contractor_freelance` et exclu par C4, alors qu'il obtenait 88/100. *Testé* : après précision de la consigne (freelance seulement si tarif journalier, umbrella, outside IR35), il est classé `fixed_term`, retenu à 82/100 ; les vrais contrats à la journée restent exclus. | Vérifié | **Corrigé** (consigne du nœud 12). |

### Bilan du doute
- **Corrigés** : D1, D2, D3, D4, D5, D6, D12, D14, D15, D16, D17.
- **Gardés après vérification** : D7, D13.
- **Documentés (à surveiller en réel)** : D8, D9, D10, D11.
- **Tests automatiques** : 5 fichiers dans `veille-offres-londres/tests/` (voir le README), tous verts. **Test sur données réelles** : voir la section suivante. **Non réalisé** : source Reed (clé non disponible pour ce test) et envoi d'e-mail réel depuis ce test.


### Test sur données réelles

Pour ne pas se fier à des cas inventés, les vrais nœuds 06, 10, 12 et 14 ont été rejoués sur des données réelles : 4 recherches **Reed** (358 offres) et 4 recherches **Adzuna** (137 offres) à Londres, le registre officiel des sponsors du jour (143 136 lignes, dont 123 103 « Skilled Worker »), et 12 appels réels à Gemini.

| Étape | Offres | Détail |
|---|---|---|
| Collecte Reed + Adzuna | 495 | 339 après retrait des doublons |
| Après règles C1 à C4 (nœud 06) | **146** | C2 (trop anciennes) : 114 ; C3 (seniors) : 78 ; C4 : 1 |
| Après le registre des sponsors (nœud 10) | **48** | C5 : 98 offres écartées |
| Analyse par Gemini (12 premières) | 12 | **4 retenues**, 3 C10, 3 C4 (vrais contrats), 2 C6 (trading) |

Les 4 offres retenues : FP&A Analyst (82/100), Data Analyst - music (59), Data Analyst chez Salt Search (50,7), AI Business Analyst - Law Firm (51,5).

Enseignements :
- Reed renvoie beaucoup d'offres anciennes (médiane : 14 jours) ; la règle C2 les écarte à juste titre. Adzuna renvoie des offres de 0 à 2 jours.
- Le registre fonctionne : 48 offres sur 146 passent le contrôle des sponsors (les agences de recrutement en sont souvent écartées).
- Les exclusions C4 restantes sont justifiées : ce sont de vrais contrats (tarifs à la journée, « umbrella », « outside IR35 »).
- Trois vrais défauts sont apparus et ont été corrigés : salaires mensuels lus comme annuels (D15), seuil de score trop dur (D16), contrat temporaire confondu avec un freelance (D17).
- Sur 12 offres analysées, 4 sont retenues. Les 36 autres offres qui ont passé C5 seront analysées aux exécutions suivantes (elles ne sont pas mémorisées).
- Limite : l'IA n'est pas parfaitement déterministe ; les scores peuvent varier de quelques points d'une exécution à l'autre.

---

## 3. Relecture hostile (10 %)

**Livrable examiné** : le workflow déployé dans n8n (18 nœuds + nœud 11b) avant, puis après corrections.
**Limite** : le workflow complet n'a pas été exécuté par l'auteur de l'analyse ; elle repose sur la lecture du workflow, 4 fichiers de tests, un rejeu des nœuds 06, 10 et 14 sur données réelles, et les incidents observés dans n8n.

### Failles trouvées

**1. Majeure : e-mail potentiellement en double (nœud 15)**
- *Scénario* : les nœuds 10 et 14 sont branchés sur la même entrée du nœud de fusion ; il s'exécute deux fois, donc deux e-mails.
- *Preuve* : lecture des connexions du workflow déployé.
- *Statut* : **corrigé** (nœud 10 relié à l'entrée 1).

**2. Mineure : espace au début de la clé Adzuna (nœud 04)**
- *Scénario supposé* : Adzuna refuse la clé et une source disparaît.
- *Preuve* : test réel, Adzuna accepte la clé avec l'espace. Le soupçon était infondé.
- *Statut* : espace retiré par précaution.

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

**9. Majeure : salaires mensuels lus comme annuels, et seuil de score trop dur (nœud 14)**
- *Scénario* : « 3 120 » (mensuel) est rejeté par C9 ; une offre correcte du secteur « autre » n'atteint presque jamais 60.
- *Preuve* : test sur données réelles (D15, D16).
- *Statut* : **corrigé** (mensuel 1 000 à 9 999 ; seuil 50).

### Verdict
**Livrable après correction : les 5 failles majeures sont corrigées** (double e-mail, sponsors, règles C3/C4, mémorisation, salaires et seuil).
Comptage : 0 bloquante, 5 majeures corrigées, 4 mineures.
**Non examiné** : envoi Gmail réel, comportement de la mémoire en production, contenu exact du registre des sponsors.
