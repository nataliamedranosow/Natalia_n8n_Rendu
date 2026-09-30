const _01_D_clencher_Lundi_et_jeudi_12h30 = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: { name: '01 Déclencher – Lundi et jeudi 12h30', parameters: { rule: { interval: [{ field: 'cronExpression', expression: '30 12 * * 1,4' }] } }, position: [16, 0] }
});

const _02_G_n_rer_4_requ_tes = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: '02 Générer – 4 requêtes', parameters: { jsCode: '// Une exécution = 4 intitulés. Chaque source fera donc 4 requêtes.\nconst titres = [\'Data Analyst\', \'Financial Data Analyst\', \'AI Solutions Engineer\', \'ML Engineer\'];\nreturn titres.map(t => ({ json: { title: t } }));' }, position: [240, 0] }
});

const _05_Fusionner_Sources = merge({
  version: 3.2,
  config: { name: '05 Fusionner – Sources', position: [1104, 0] }
});

const _03_Collecter_Reed = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: { name: '03 Collecter – Reed', parameters: { url: 'https://www.reed.co.uk/api/1.0/search', authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth', sendQuery: true, specifyQuery: expr('keywords={{ $json.title }}'), queryParameters: { parameters: [{}] }, options: {} }, credentials: { httpBasicAuth: newCredential('Reed API', 'ID') }, position: [688, -288], retryOnFail: true, maxTries: 2, waitBetweenTries: 2000, onError: 'continueRegularOutput' }
});

const _04_Collecter_Adzuna = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: { name: '04 Collecter – Adzuna', parameters: { authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth', options: {} }, credentials: { httpBasicAuth: newCredential('Adzuna API', 'ID') }, position: [688, 240], retryOnFail: true, maxTries: 2, waitBetweenTries: 2000, onError: 'continueRegularOutput' }
});

const a1_D_clencher_Erreur = trigger({
  type: 'n8n-nodes-base.errorTrigger',
  version: 1,
  config: { name: 'A1 Déclencher – Erreur', position: [16, 672] }
});

const a2_Alerter_E_mail = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: { name: 'A2 Alerter – E-mail', parameters: { options: {} }, credentials: { gmailOAuth2: newCredential('Gmail account', 'ID') }, position: [240, 672], webhookId: '040746a5-c482-4ec7-8e2f-ce670c51927d' }
});

const _06_Normaliser_R_gles_C1_C4 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: '06 Normaliser – Règles C1 à C4', parameters: { jsCode: '// Loop over input items and add a new field called \'myNewField\' to the JSON of each one\nfor (const item of $input.all()) {\n  item.json.myNewField = 1;\n}\n\nreturn $input.all();' }, position: [1392, 0] }
});

const _07_Collecter_Page_registre = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: { name: '07 Collecter – Page registre', parameters: { options: {} }, position: [1616, 0] }
});

const _08_Extraire_Lien_CSV = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: '08 Extraire – Lien CSV', parameters: { jsCode: '// Loop over input items and add a new field called \'myNewField\' to the JSON of each one\nfor (const item of $input.all()) {\n  item.json.myNewField = 1;\n}\n\nreturn $input.all();' }, position: [1840, 0] }
});

const _09_T_l_charger_Registre = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: { name: '09 Télécharger – Registre', parameters: { options: {} }, position: [2064, 0] }
});

const _10_Appliquer_Sponsors_C5 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: '10 Appliquer – Sponsors C5', parameters: { jsCode: '// Loop over input items and add a new field called \'myNewField\' to the JSON of each one\nfor (const item of $input.all()) {\n  item.json.myNewField = 1;\n}\n\nreturn $input.all();' }, position: [2288, 0] }
});

const _15_Fusionner_Scor_es_et_signal = merge({
  version: 3.2,
  config: { name: '15 Fusionner – Scorées et signal', position: [3408, -16] }
});

const _11_Filtrer_Offres_en_course = node({
  type: 'n8n-nodes-base.filter',
  version: 2.3,
  config: { name: '11 Filtrer – Offres en course', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 3 }, conditions: [{ id: '7aabd5ef-857f-4331-ad4c-2700e7b4949f', leftValue: '', rightValue: '', operator: { type: 'string', operation: 'equals', name: 'filter.operator.equals' } }], combinator: 'and' }, options: {} }, position: [2496, -224] }
});

const _12_Pr_parer_Requ_te_IA = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: '12 Préparer – Requête IA', parameters: { jsCode: '// Loop over input items and add a new field called \'myNewField\' to the JSON of each one\nfor (const item of $input.all()) {\n  item.json.myNewField = 1;\n}\n\nreturn $input.all();' }, position: [2720, -224] }
});

const _13_Extraire_IA = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: { name: '13 Extraire – IA', parameters: { authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth', options: {} }, credentials: { httpBasicAuth: newCredential('OpenAI API', 'ID') }, position: [2944, -224] }
});

const _14_Scorer_R_gles_et_score = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: '14 Scorer – Règles et score', parameters: { jsCode: '// Loop over input items and add a new field called \'myNewField\' to the JSON of each one\nfor (const item of $input.all()) {\n  item.json.myNewField = 1;\n}\n\nreturn $input.all();' }, position: [3168, -224] }
});

const _16_Composer_E_mail = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: '16 Composer – E-mail', parameters: { jsCode: '// Loop over input items and add a new field called \'myNewField\' to the JSON of each one\nfor (const item of $input.all()) {\n  item.json.myNewField = 1;\n}\n\nreturn $input.all();' }, position: [3632, -16] }
});

const _17_Envoyer_E_mail = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: { name: '17 Envoyer – E-mail', parameters: { options: {} }, credentials: { gmailOAuth2: newCredential('Gmail account', 'ID') }, position: [3856, -16], webhookId: 'b4d3fe36-679a-4dbc-b6c2-ca358980b9e1' }
});

const _18_M_moriser_Envoy_es = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: '18 Mémoriser – Envoyées', parameters: { jsCode: '// Loop over input items and add a new field called \'myNewField\' to the JSON of each one\nfor (const item of $input.all()) {\n  item.json.myNewField = 1;\n}\n\nreturn $input.all();' }, position: [4080, -16] }
});

const wf = workflow('prsHJOGNiHtU4riL', 'Offres Data et IA', { executionOrder: 'v1', binaryMode: 'separate', availableInMCP: true });

export default wf
  .add(sticky('# SPEC | Veille offres Data & IA, Londres\n\n## 1. Objectif\nRecevoir **lundi et jeudi à 12h30** (Europe/Paris, cron `30 12 * * 1,4`, fuseau réglé dans les paramètres du workflow) **un e-mail avec les 10 meilleures nouvelles offres à Londres**, classées par correspondance avec mon profil.\n\n**Le workflow informe, je décide : aucune candidature automatique.**\n\nPérimètre : Londres uniquement (sur site ou hybride). Dubaï mis de côté. Aucun Google Sheet : la seule sortie est l\'e-mail.\n\n---\n\n## 2. Résultat attendu (à vérifier avant d\'activer le planning)\n- **RA1 Zéro doublon** : 0 offre (même clé) dans deux e-mails sur 4 exécutions consécutives, workflow activé\n- **RA2 Zéro violation de règle** : 0 offre envoyée qui enfreigne C1 à C10 sur 4 exécutions\n- **RA3 Sponsor vérifié** : 100 % des offres envoyées ont une entreprise retrouvée à la main dans le registre officiel\n- **RA4 Pertinence** : en moyenne au moins 3 offres par e-mail que je juge pertinentes (comptées à la main) sur les 8 e-mails de 4 semaines\n- **RA5 Pannes** : une source coupée = e-mail reçu avec la mention "Sources indisponibles". Toutes les sources, le registre ou l\'IA en panne = e-mail d\'alerte, aucun e-mail d\'offres\n- **RA6 Aucune perte, aucun double envoi** : les offres ne sont mémorisées qu\'après l\'envoi Gmail réussi. Si Gmail échoue, elles repartent à l\'exécution suivante\n- **RA7 Jeu de test** : 12 offres fictives, chacune déclenchant une règle précise, toutes écartées avec la bonne règle (visible dans la sortie des nœuds 06, 10 et 14 de l\'exécution)\n- **RA8 Coût** : IA < 0,10 EUR par exécution, sources gratuites\n- **RA9 Test à blanc** : au moins 2 exécutions manuelles envoyées à moi seule avant activation\n\n---\n\n## 3. Affirmations et contraintes\n\n### 3.1 Critères\n- Intitulés : Data Analyst, Financial Data Analyst, AI Solutions Engineer, ML Engineer\n- Niveau : jusqu\'à **3 ans** d\'expérience\n- Lieu : Londres, sur site ou hybride\n- Nouvelle offre = jamais envoyée **et** publiée depuis moins de 14 jours (date inconnue = gardée)\n\n### 3.2 Règles d\'exclusion (dans cet ordre)\nUne offre exclue n\'est écrite nulle part : elle n\'existe que dans les données de l\'exécution n8n (champ `regle_exclusion`).\n\n- **C1** Déjà envoyée (mémoire interne n8n, même clé, conservée 30 jours) : exclue. *Nœud 06. Test : offre rejouée après activation, exclue la 2e fois*\n- **C2** Publiée depuis 14 jours ou plus : exclue. Date inconnue : gardée. *Nœud 06. Test : J-15 exclue, sans date gardée*\n- **C3** Titre avec Senior, Lead, Head, Principal, Staff, Director **en mot entier** : exclue. *Nœud 06 (regex `\\b`). Test : "Lead Data Analyst" exclu, "Leading Edge Analyst" gardé*\n- **C4** Contrat freelance, contractor, day rate, stage, intern, internship, alternance, apprenticeship, graduate scheme : exclu. Vérifié sur le titre et le type de contrat (nœud 06), puis sur le type de contrat et le tarif journalier extraits par l\'IA (nœud 14). *Test : une offre par mot-clé*\n- **C5** Entreprise absente du registre officiel des sponsors (Skilled Worker, note A) : exclue. *Nœud 10. Test : entreprise inconnue exclue, "X Ltd" = "X Limited" accepté*\n- **C6** Trading, banque d\'investissement, hedge fund : exclu (le reste de la finance est accepté). *Nœud 14, sur classification IA*\n- **C7** Contrat de moins de 6 mois : exclu. Durée non précisée : gardée. *Nœud 14, sur extraction IA*\n- **C8** Années requises y > 3 : exclue. y = borne basse d\'une fourchette. Non précisé : gardée ("expérience non précisée"). *Nœud 14. Test : "4 ans" exclu, "3 ans" gardé, "3 à 5 ans" gardé (y = 3), "5 ans" exclu*\n- **C9** Salaire annuel A < plancher P : exclu. Absent ou estimé par un agrégateur : gardé ("salaire non précisé"). *Nœud 14. Test : 34 000 exclu*\n- **C10** Score < 60 **ou** S_competences < 0,3 : exclue. *Nœud 14*\n\n### 3.3 Autres contraintes\n- Plancher P = **35 000 GBP/an**. **À comparer avant activation au seuil de salaire du visa Skilled Worker (gov.uk)** : un sponsor ne veut pas dire que le poste est sponsorisable\n- Fourchette de salaire : exclue si le **max** < P, scorée avec le **milieu**\n- Conversion annuelle : annuel tel quel ; mensuel x 12 ; hebdomadaire x 52 ; horaire x 37,5 x 52. Tarif journalier = signal de contractor (C4)\n- Offres qui passent le seuil mais dépassent le Top 10 : **non mémorisées**, elles reviennent à l\'exécution suivante tant qu\'elles ont moins de 14 jours\n- Offres 100 % remote : non exclues par une règle (à décider si besoin)\n\n### 3.4 Score\n**Score = 35 x S_secteur + 30 x S_competences + 20 x S_salaire + 15 x S_experience** (chaque S entre 0 et 1)\n\n- **S_secteur** : 1 = banque de détail/commerciale, assurance, gestion d\'actifs, private equity, fintech ; 0,7 = startup ou scale-up tech ; 0,3 = autre\n- **S_competences** : recouvrement outils demandés / mon profil (Excel, Tableau, Python, IA), estimé par l\'IA (0 à 1)\n- **S_salaire** = min(1 ; max(0 ; (A - P) / (0,3 x P))), soit (A - 35 000) / 10 500 borné entre 0 et 1. **0,6** si non précisé\n- **S_experience** = 1 si y <= 2 ; 0,7 si 2 < y <= 3 ; **0,6** si non précisé\n- Score calculé par un nœud Code (déterministe). L\'IA fait seulement l\'extraction et S_competences\n\nCas limites (inconnu = 0,6) :\n- Finance, compétences 0 : exclu par la porte S_competences >= 0,3\n- Finance, compétences 0,3, tout inconnu : 35 + 9 + 12 + 9 = **65**, gardé\n- Autre secteur, compétences 1, tout inconnu : 10,5 + 30 + 12 + 9 = **61,5**, gardé\n- Autre secteur, compétences 0,3, tout inconnu : 10,5 + 9 + 12 + 9 = **40,5**, exclu\n\n### 3.5 Clé de dédoublonnage et mémoire\n`minuscule(entreprise normalisée) | minuscule(titre normalisé) | london`\n- Entreprise : minuscules, retrait de ltd, limited, plc, llc, inc, ponctuation, espaces multiples\n- Titre : minuscules, ponctuation retirée, espaces réduits, niveau entre parenthèses retiré\n- La normalisation pour le registre est distincte (rapprochement exact, puis similarité >= 0,9)\n- **Mémoire** : stockée dans la mémoire interne du workflow (Workflow Static Data), purgée après 30 jours. Elle ne fonctionne que **workflow activé** : en test manuel, rien n\'est mémorisé et les doublons reviennent. Elle est perdue si le workflow est supprimé ou recréé\n\n### 3.6 Erreurs\n- Chaque HTTP Request de source : **On Error : Continue**\n- Source en panne = erreur HTTP, quota (429) ou réponse invalide. **Zéro résultat n\'est pas une panne** mais est signalé ("0 résultat")\n- Une source en panne : on continue, mention en bas de l\'e-mail\n- Toutes les sources en panne, registre en panne ou IA en panne : le workflow s\'arrête et le workflow d\'alerte (Error Trigger) m\'envoie un e-mail\n- La mémorisation (nœud 18) vient **après** Gmail : un échec d\'envoi ne perd aucune offre\n- Envoi **toujours** d\'un e-mail ("Aucune nouvelle offre cette fois" si vide) : pas d\'e-mail à 13h30 = n8n lui-même en panne, ce que l\'Error Trigger ne peut pas détecter\n\n### 3.7 Coûts, sources, données\n- IA < 0,10 EUR par exécution. Profil d\'une page en texte, sans nom ni coordonnées\n- Offres gratuites uniquement. n8n Cloud : essai, puis petit abonnement\n- Sources au départ : Reed API, Adzuna API. Optionnelles ensuite : Jooble API, JSearch (RapidAPI)\n- Hors périmètre : LinkedIn et Indeed en direct, Bayt, GulfTalent. **À vérifier** : JSearch relaie des offres LinkedIn/Indeed, conditions d\'utilisation à confirmer\n- Volume : 4 requêtes par exécution et par source, environ 36 par mois et par source\n- Limite : descriptions souvent tronquées, score calculé sur un extrait\n\n---\n\n## Annexe A | Pipeline (noms des nœuds)\nBloc 1 Requêtes\n- 01 Déclencher – Lundi et jeudi 12h30\n- 02 Générer – 4 requêtes\n\nBloc 2 Collecte\n- 03 Collecter – Reed\n- 04 Collecter – Adzuna\n- (option) 03b Collecter – Jooble, 03c Collecter – JSearch\n- 05 Fusionner – Sources\n\nBloc 3 Règles\n- 06 Normaliser – Règles C1 à C4\n\nBloc 4 Sponsors\n- 07 Collecter – Page registre\n- 08 Extraire – Lien CSV\n- 09 Télécharger – Registre\n- 10 Appliquer – Sponsors C5\n\nBloc 5 IA et score\n- 11 Filtrer – Offres en course\n- 12 Préparer – Requête IA\n- 13 Extraire – IA\n- 14 Scorer – Règles et score\n\nBloc 6 E-mail\n- 15 Fusionner – Scorées et signal (garantit l\'envoi même sans offre)\n- 16 Composer – E-mail\n- 17 Envoyer – E-mail\n- 18 Mémoriser – Envoyées\n\nBloc 7 Alerte (second workflow)\n- A1 Déclencher – Erreur\n- A2 Alerter – E-mail\n\n## Annexe B | Livrable\n- **E-mail** : 10 offres max par score décroissant. Par offre : titre, entreprise, lien, ville, date, contrat, salaire, expérience, résumé, score + explication. Bas : sources indisponibles ou sans résultat. Sans offre : "Aucune nouvelle offre cette fois"\n- Aucun autre fichier, aucune base : pas d\'historique consultable, pas de colonne de retour\n\n## Annexe C | À régler en test\nSeuil de similarité du registre (0,9), quotas réels des API, prix n8n, seuil 60 et poids 35/30/20/15, plancher de salaire (contrôle visa), valeur "non précisé" à 0,6, heuristique de période de salaire (< 100 horaire, < 1000 journalier, sinon annuel).', [], { name: 'Sticky Note', color: 3, width: 1264, height: 2784, position: [-1280, -256] }))
  .add(_01_D_clencher_Lundi_et_jeudi_12h30)
  .to(_02_G_n_rer_4_requ_tes
  .to([
    _03_Collecter_Reed,
    _04_Collecter_Adzuna]))
  .add(a1_D_clencher_Erreur)
  .to(a2_Alerter_E_mail)
  .add(sticky('n8ncli envs edit prod \\\n  --url https://TON-INSTANCE.app.n8n.cloud/ \n  --access-token "mcp_token_..." TOKEN_RETIRE', [], { name: 'Sticky Note1', width: 448, height: 304, position: [352, 1056] }))
  .add(_03_Collecter_Reed.to(_05_Fusionner_Sources.input(0)))
  .add(_04_Collecter_Adzuna.to(_05_Fusionner_Sources.input(1)))
  .add(_10_Appliquer_Sponsors_C5.to(_15_Fusionner_Scor_es_et_signal.input(1)))
  .add(_14_Scorer_R_gles_et_score.to(_15_Fusionner_Scor_es_et_signal.input(0)))
  .add(_05_Fusionner_Sources)
  .to(_06_Normaliser_R_gles_C1_C4
  .to(_07_Collecter_Page_registre)
  .to(_08_Extraire_Lien_CSV)
  .to(_09_T_l_charger_Registre)
  .to(_10_Appliquer_Sponsors_C5)
  .to(_11_Filtrer_Offres_en_course)
  .to(_12_Pr_parer_Requ_te_IA)
  .to(_13_Extraire_IA)
  .to(_14_Scorer_R_gles_et_score))
  .add(_15_Fusionner_Scor_es_et_signal)
  .to(_16_Composer_E_mail
  .to(_17_Envoyer_E_mail)
  .to(_18_M_moriser_Envoy_es))