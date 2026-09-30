# Veille automatique d'offres Data & IA à Londres (n8n)

Projet réalisé avec **n8n** : un workflow qui cherche chaque semaine des offres d'emploi Data et IA à Londres, ne garde que celles qui correspondent à un profil junior finance/data avec **sponsorisation de visa**, les note avec une IA (Gemini), et envoie **un seul e-mail de 10 offres** le lundi et le jeudi à 12h30.

Le dépôt contient aussi **3 skills Claude Code** et leur **application** à ce projet, avec des tests exécutables.

> **Statut.** Le workflow est construit, corrigé et testé nœud par nœud sur des données réelles. Une exécution complète avec envoi d'e-mail a été faite dans n8n. Les réglages finaux (seuils, sources supplémentaires) restent à affiner à l'usage.

---

## Où trouver quoi

| Je veux… | Ouvrir |
|---|---|
| Comprendre les **3 skills** et leurs poids (10 % / 10 % / 80 %) | [`docs/EXPLICATIONS-SKILLS.md`](docs/EXPLICATIONS-SKILLS.md) |
| Voir les skills **appliqués au projet** (interview, journal des doutes, relecture hostile, test sur données réelles) | [`docs/APPLICATION-VEILLE-OFFRES.md`](docs/APPLICATION-VEILLE-OFFRES.md) |
| Lire le **code des nœuds** en JavaScript | [`veille-offres-londres/code/`](veille-offres-londres/code/) |
| **Lancer les tests** | [`veille-offres-londres/tests/`](veille-offres-londres/tests/) (voir plus bas) |
| Voir les **fichiers des skills** | [`.claude/skills/`](.claude/skills/) |
| Voir les **workflows en TypeScript** (format n8ncli) | [`workflows-ts/`](workflows-ts/) |
| **Importer** un workflow dans n8n (fichiers `.json`) | [`n8n-workflows/`](n8n-workflows/) |

## Structure du dépôt

```
README.md                    Cette page
docs/                        Explications des skills + application au projet
.claude/skills/              Les 3 skills (un dossier chacun, avec un SKILL.md)
workflows-ts/                Workflows en TypeScript (format n8ncli), rangés comme mes dossiers n8n
  projects/  sandbox/  templates/
n8n-workflows/               Les mêmes workflows en .json, à importer dans n8n (⋯ > Import from file)
  projects/  sandbox/  templates/
veille-offres-londres/       Tout ce qui concerne le projet principal
  code/                      Code JavaScript des 8 nœuds « Code », lisible
  tests/                     Tests automatiques
  scripts/ts-vers-json.js    Convertit un workflow .ts en .json
.env.example                 Modèle des clés à renseigner (aucune clé réelle)
```

## Comment fonctionne le workflow

```mermaid
flowchart LR
  A[Déclencheur<br/>lun. et jeu. 12h30] --> B[4 intitulés<br/>de recherche]
  B --> C[Reed]
  B --> D[Adzuna]
  C --> E[Fusion]
  D --> E
  E --> F[Règles C1 à C4<br/>doublons, date, senior, contrat]
  F --> G[Registre officiel<br/>des sponsors UK]
  G --> H[Règle C5]
  H --> I[Limite : 12 offres]
  I --> J[Gemini :<br/>extraction + compétences]
  J --> K[Score et règles<br/>C4, C6 à C10]
  K --> L[E-mail HTML<br/>10 meilleures offres]
  L --> M[Mémorisation<br/>des offres traitées]
```

| Bloc | Rôle | Code |
|---|---|---|
| 1. Requêtes | 4 intitulés : Data Analyst, Financial Data Analyst, AI Solutions Engineer, ML Engineer | [`02`](veille-offres-londres/code/02-generer-requetes.js) |
| 2. Collecte | Reed et Adzuna (Londres), puis fusion | (nœuds HTTP) |
| 3. Règles C1 à C4 | Normalise les offres, supprime les doublons, applique les 4 premières règles | [`06`](veille-offres-londres/code/06-normaliser-regles.js) |
| 4. Sponsors | Télécharge le registre GOV.UK et ne garde que les employeurs autorisés (C5) | [`08`](veille-offres-londres/code/08-extraire-lien-csv.js), [`10`](veille-offres-londres/code/10-appliquer-sponsors.js) |
| 5. IA et score | Gemini extrait contrat, expérience, salaire, secteur ; le score est calculé par du code | [`12`](veille-offres-londres/code/12-preparer-requete-ia.js), [`14`](veille-offres-londres/code/14-scorer.js) |
| 6. E-mail | Compose l'e-mail, l'envoie, puis mémorise les offres | [`16`](veille-offres-londres/code/16-composer-email.js), [`18`](veille-offres-londres/code/18-memoriser.js) |
| 7. Alerte | Un second workflow prévient par e-mail si le premier plante | `workflows-ts/sandbox/alerte-erreur` |

### Règles de filtrage

| Règle | Exclut |
|---|---|
| C1 | Offre déjà envoyée ou en double |
| C2 | Offre publiée depuis 14 jours ou plus |
| C3 | Postes Senior, Lead, Head, Principal, Staff, Director |
| C4 | Freelance, stage, alternance, contrat à la journée |
| C5 | Employeur absent du registre des sponsors (Skilled Worker, note A) |
| C6 | Trading, banque d'investissement, hedge fund |
| C7 | Contrat de moins de 6 mois |
| C8 | Plus de 3 ans d'expérience exigés |
| C9 | Salaire maximum inférieur à 35 000 GBP par an |
| C10 | Score inférieur à 50 (réglé de 60 à 50 après test), ou compétences inférieures à 0,3 |

### Formule de score (sur 100)

`Score = 35 × S_secteur + 30 × S_compétences + 20 × S_salaire + 15 × S_expérience`

Le calcul est fait par du code et non par l'IA : il est reproductible et vérifiable. L'IA extrait seulement les informations et estime l'adéquation des compétences.

## Résultats des tests

Les nœuds 06, 10, 12 et 14 ont été rejoués sur des **données réelles** (offres Reed et Adzuna du jour, registre officiel de 143 136 lignes, 12 appels réels à Gemini) :

| Étape | Offres restantes |
|---|---|
| Collecte Reed + Adzuna (doublons retirés) | 339 |
| Après C1 à C4 | 146 |
| Après le registre des sponsors (C5) | **48** |
| Après analyse par Gemini (12 premières) | **4 retenues** |

Le détail, les défauts trouvés et corrigés (salaires mensuels, seuil trop strict, contrat temporaire pris pour un freelance, noms de sponsors, double e-mail) sont dans [`docs/APPLICATION-VEILLE-OFFRES.md`](docs/APPLICATION-VEILLE-OFFRES.md).

## Lancer les tests

Il faut seulement [Node.js](https://nodejs.org). Aucune clé n'est nécessaire.

```bash
node veille-offres-londres/tests/run-all.js
```

| Test | Vérifie |
|---|---|
| `test-regles-titres.js` | Règles C3 et C4 sur 14 titres |
| `test-sponsors.js` | Règle C5 : rapprochement des noms avec un faux registre |
| `test-score.js` | Salaires, règles C4 et C6 à C10, score |
| `test-memorisation.js` | Nœud 16 : e-mail et liste des offres mémorisées |
| `test-prompt-ia.js` | Nœud 12 : consigne envoyée à Gemini (contrat temporaire ou freelance) |

## Les 3 skills Claude Code

| Skill | Poids | Rôle |
|---|---|---|
| [`interview-and-represent`](.claude/skills/interview-and-represent/SKILL.md) | 10 % | Interroger, puis re-présenter le besoin pour validation |
| [`hostile-review`](.claude/skills/hostile-review/SKILL.md) | 10 % | Relecture hostile : chercher ce qui casse |
| [`doubt-driven-development`](.claude/skills/doubt-driven-development/SKILL.md) | 80 % | Développer en doutant, puis en prouvant chaque étape |

## Installation du workflow

1. Créer un compte n8n Cloud (ou lancer n8n avec Docker).
2. Importer les fichiers `.json` du dossier `n8n-workflows/` (menu **⋯ → Import from file**). Commencer par `projects/` puis `sandbox/alerte-erreur.json`.
3. Créer les credentials dans n8n : **Reed** (Basic Auth), **Google Gemini(PaLM) API**, **Gmail**.
4. Renseigner `app_id` et `app_key` Adzuna (nœud 04), l'adresse destinataire (nœud 17) et son propre profil (nœud 12).
5. Exécuter à la main plusieurs fois avant d'activer le workflow (la mémoire anti-doublon ne fonctionne qu'une fois activé).

## Sécurité et confidentialité

- Aucune clé API dans ce dépôt : le fichier `.env` est exclu par `.gitignore`, et les exports de workflows ont été nettoyés (clés, jetons, e-mails, identifiants).
- Le profil du candidat est un texte à fournir soi-même dans le nœud 12 ; il est envoyé à l'API Gemini à chaque analyse.

## Limites connues

- Quota gratuit de Gemini : 15 requêtes par minute, d'où la limite de 12 offres analysées par exécution.
- Le rendement reste modeste : la plupart des offres Data à Londres sont dans le secteur « autre », peu valorisé par le score.
- La mémoire anti-doublon n'est testable qu'après activation du workflow.

## Outils et transparence

Projet construit avec l'aide de **Claude Code** (assistant IA d'Anthropic) pour générer, valider et tester les workflows, à partir d'un cahier des charges défini par l'auteure. Les réglages dans n8n, la configuration des comptes et les essais ont été faits par l'auteure.

## Auteure

Natalia Medrano Sow
