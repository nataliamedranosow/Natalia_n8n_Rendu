const _01_D_clencher_Lundi_et_jeudi_12h30 = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: { name: '01 Déclencher – Lundi et jeudi 12h30', parameters: { rule: { interval: [{ field: 'cronExpression', expression: '30 12 * * 1,4' }] } }, position: [112, 208], notes: 'Lundi et jeudi à 12h30 (Europe/Paris).' }
});

const _02_G_n_rer_4_requ_tes = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: '02 Générer – 4 requêtes', parameters: { jsCode: '// Une exécution = 4 intitulés. Chaque source fera donc 4 requêtes.\nconst titres = [\'Data Analyst\', \'Financial Data Analyst\', \'AI Solutions Engineer\', \'ML Engineer\'];\nreturn titres.map(t => ({ json: { title: t } }));' }, position: [320, 208] }
});

const _05_Fusionner_Sources = merge({
  version: 3.2,
  config: { name: '05 Fusionner – Sources', position: [768, 208] }
});

const _03_Collecter_Reed = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: { name: '03 Collecter – Reed', parameters: { url: 'https://www.reed.co.uk/api/1.0/search', authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth', sendQuery: true, queryParameters: { parameters: [{ name: 'keywords', value: expr('{{ $json.title }}') }, { name: 'locationName', value: 'London' }, { name: 'distanceFromLocation', value: '15' }, { name: 'resultsToTake', value: '100' }] }, options: {} }, credentials: { httpBasicAuth: newCredential('Reed API', 'ID') }, position: [544, 112], notes: 'TODO : credential Basic Auth (User = clé API Reed, Password vide).', retryOnFail: true, maxTries: 2, waitBetweenTries: 2000, onError: 'continueRegularOutput' }
});

const _04_Collecter_Adzuna = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: { name: '04 Collecter – Adzuna', parameters: { url: 'https://api.adzuna.com/v1/api/jobs/gb/search/1', authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth', sendQuery: true, queryParameters: { parameters: [{ name: 'app_id', value: 'TODO' }, { name: 'app_key', value: 'TODO' }, { name: 'what', value: expr('{{ $json.title }}') }, { name: 'where', value: 'London' }, { name: 'results_per_page', value: '50' }, { name: 'max_days_old', value: '14' }, { name: 'sort_by', value: 'date' }] }, options: {} }, credentials: { httpBasicAuth: newCredential('Adzuna API', 'ID') }, position: [544, 304], notes: 'TODO : app_id et app_key Adzuna.', retryOnFail: true, maxTries: 2, waitBetweenTries: 2000, onError: 'continueRegularOutput' }
});

const _06_Normaliser_R_gles_C1_C4 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: '06 Normaliser – Règles C1 à C4', parameters: { jsCode: '// Normalisation des 4 sources + règles C1 à C4 (C1 = doublon : jeté sans écriture)\nconst JOURS_MAX = 14;\nconst now = Date.now();\n\nconst nettoyerEntreprise = s => String(s || \'\').toLowerCase()\n  .replace(/\\b(ltd|limited|plc|llc|inc)\\b/g, \' \')\n  .replace(/[^\\p{L}\\p{N}\\s]/gu, \' \').replace(/\\s+/g, \' \').trim();\nconst nettoyerTitre = s => String(s || \'\').toLowerCase()\n  .replace(/\\([^)]*\\)/g, \' \')\n  .replace(/[^\\p{L}\\p{N}\\s]/gu, \' \').replace(/\\s+/g, \' \').trim();\nconst texteBrut = s => String(s || \'\').replace(/<[^>]*>/g, \' \').replace(/\\s+/g, \' \').trim();\n\nfunction dateReed(s) { // dd/mm/yyyy\n  const m = /^(\\d{2})\\/(\\d{2})\\/(\\d{4})/.exec(String(s || \'\'));\n  return m ? new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00Z`).toISOString() : null;\n}\nfunction dateISO(s) {\n  const t = Date.parse(s);\n  return isNaN(t) ? null : new Date(t).toISOString();\n}\nconst periodeJSearch = p => ({ YEAR: \'year\', MONTH: \'month\', WEEK: \'week\', DAY: \'day\', HOUR: \'hour\' }[String(p || \'\').toUpperCase()] || null);\n\nconst sources = [\n  { nom: \'Reed\', noeud: \'03 Collecter – Reed\', cle: \'results\', map: r => ({\n    source: \'Reed\', id_source: \'reed-\' + r.jobId, titre: r.jobTitle, entreprise: r.employerName,\n    lien: r.jobUrl, ville: r.locationName || \'London\', date_publication: dateReed(r.date),\n    contrat_brut: \'\', texte: texteBrut(r.jobDescription),\n    salaire: { min: r.minimumSalary ?? null, max: r.maximumSalary ?? null, periode: null, estime: false, devise: r.currency || \'GBP\' } }) },\n  { nom: \'Adzuna\', noeud: \'04 Collecter – Adzuna\', cle: \'results\', map: r => ({\n    source: \'Adzuna\', id_source: \'adzuna-\' + r.id, titre: r.title, entreprise: r.company && r.company.display_name,\n    lien: r.redirect_url, ville: (r.location && r.location.display_name) || \'London\', date_publication: dateISO(r.created),\n    contrat_brut: [r.contract_type, r.contract_time].filter(Boolean).join(\' \'), texte: texteBrut(r.description),\n    salaire: { min: r.salary_min ?? null, max: r.salary_max ?? null, periode: null,\n               estime: String(r.salary_is_predicted) === \'1\', devise: \'GBP\' } }) },\n  { nom: \'Jooble\', noeud: \'03b Collecter – Jooble\', cle: \'jobs\', map: r => ({\n    source: \'Jooble\', id_source: \'jooble-\' + r.id, titre: r.title, entreprise: r.company,\n    lien: r.link, ville: r.location || \'London\', date_publication: dateISO(r.updated),\n    contrat_brut: r.type || \'\', texte: texteBrut(r.snippet),\n    salaire: { min: null, max: null, periode: null, estime: false, devise: \'GBP\', texte: r.salary || \'\' } }) },\n  { nom: \'JSearch\', noeud: \'03c Collecter – JSearch\', cle: \'data\', map: r => ({\n    source: \'JSearch\', id_source: \'jsearch-\' + r.job_id, titre: r.job_title, entreprise: r.employer_name,\n    lien: r.job_apply_link, ville: r.job_city || \'London\', date_publication: dateISO(r.job_posted_at_datetime_utc),\n    contrat_brut: r.job_employment_type || \'\', texte: texteBrut(r.job_description),\n    remote: !!r.job_is_remote,\n    salaire: { min: r.job_min_salary ?? null, max: r.job_max_salary ?? null, periode: periodeJSearch(r.job_salary_period),\n               estime: false, devise: r.job_salary_currency || \'GBP\' } }) },\n];\n\n// --- Lecture des sources et détection des pannes ---\nconst meta = {};\nlet offres = [];\nlet requetesTotal = 0, requetesEnErreur = 0;\nfor (const s of sources) {\n  let items = [];\n  try { items = $(s.noeud).all(); } catch (e) { continue; }   // source non construite : ignorée\n  let erreurs = 0, total = 0;\n  for (const it of items) {\n    const j = it.json || {};\n    if (j.error || !Array.isArray(j[s.cle])) { erreurs++; continue; }\n    for (const r of j[s.cle]) { total++; offres.push(s.map(r)); }\n  }\n  meta[s.nom] = { requetes: items.length, erreurs, total };\n  requetesTotal += items.length; requetesEnErreur += erreurs;\n}\nif (requetesTotal === 0 || requetesEnErreur === requetesTotal) {\n  throw new Error(\'Toutes les sources sont en panne : arrêt, historique inchangé.\');\n}\n\n// --- Offres déjà envoyées (mémoire interne de n8n, purgée après 30 jours) ---\nconst memoire = $getWorkflowStaticData(\'global\');\nmemoire.vus = memoire.vus || {};\nfor (const k of Object.keys(memoire.vus)) if (now - memoire.vus[k] > 30 * 86400000) delete memoire.vus[k];\nconst dejaVus = new Set(Object.keys(memoire.vus));\n\nconst RE_C3 = /\\b(senior|lead|head|principal|staff|director)\\b/i;\nconst RE_C4 = /\\b(freelance|contractor|day rate|stage|internship|intern|alternance|apprenticeship|graduate scheme)\\b/i;\n\nconst sortie = [];\nconst cles = new Set();\nfor (const o of offres) {\n  if (!o.titre || !o.entreprise) continue;\n  const cle = `${nettoyerEntreprise(o.entreprise)}|${nettoyerTitre(o.titre)}|london`;\n  if (dejaVus.has(cle) || cles.has(cle)) continue;           // C1 : jeté\n  cles.add(cle);\n  let regle = \'\';\n  if (o.date_publication && (now - Date.parse(o.date_publication)) >= JOURS_MAX * 86400000) regle = \'C2\';\n  else if (RE_C3.test(o.titre)) regle = \'C3\';\n  else if (RE_C4.test(`${o.titre} ${o.contrat_brut}`)) regle = \'C4\';\n  sortie.push({ json: { ...o, id: cle, regle_exclusion: regle } });\n}\n\n// Toujours au moins un item, pour que la suite du workflow (et l\'e-mail) s\'exécute\nif (sortie.length === 0) sortie.push({ json: { __vide: true } });\nreturn sortie;' }, position: [992, 208] }
});

const _07_Collecter_Page_registre = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: { name: '07 Collecter – Page registre', parameters: { url: 'https://www.gov.uk/api/content/government/publications/register-of-licensed-sponsors-workers', options: {} }, position: [1200, 208], notes: 'Sans registre, on n\'envoie rien (On Error = Stop).', executeOnce: true, retryOnFail: true, maxTries: 2 }
});

const _08_Extraire_Lien_CSV = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: '08 Extraire – Lien CSV', parameters: { jsCode: '// Retrouve le lien du dernier CSV dans la réponse de l\'API contenu GOV.UK\nconst brut = JSON.stringify($input.first().json);\nconst liens = brut.match(/https:\\/\\/assets\\.publishing\\.service\\.gov\\.uk[^"\\s\\\\]+\\.csv/g);\nif (!liens || !liens.length) throw new Error(\'Lien CSV du registre introuvable : arrêt.\');\nreturn [{ json: { url: liens[0] } }];' }, position: [1424, 208] }
});

const _09_T_l_charger_Registre = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: { name: '09 Télécharger – Registre', parameters: { url: expr('{{ $json.url }}'), options: { response: { response: { responseFormat: 'text' } }, timeout: 180000 } }, position: [1648, 208], retryOnFail: true, maxTries: 2 }
});

const _10_Appliquer_Sponsors_C5 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: '10 Appliquer – Sponsors C5', parameters: { jsCode: '// Règle C5 : entreprise présente au registre officiel des sponsors (Skilled Worker, A rating)\nconst SEUIL_SIMILARITE = 0.9;     // à régler en test (Annexe C)\n\nconst csv = String($input.first().json.data || \'\');\nif (csv.length < 100000) throw new Error(\'Registre des sponsors invalide ou vide : arrêt.\');\n\nfunction parseCSV(t) {\n  const rows = []; let row = [], cur = \'\', q = false;\n  for (let i = 0; i < t.length; i++) {\n    const c = t[i];\n    if (q) {\n      if (c === \'"\') { if (t[i + 1] === \'"\') { cur += \'"\'; i++; } else q = false; }\n      else cur += c;\n    } else if (c === \'"\') q = true;\n    else if (c === \',\') { row.push(cur); cur = \'\'; }\n    else if (c === \'\\n\') { row.push(cur); rows.push(row); row = []; cur = \'\'; }\n    else if (c !== \'\\r\') cur += c;\n  }\n  if (cur.length || row.length) { row.push(cur); rows.push(row); }\n  return rows;\n}\nconst nettoyer = s => String(s || \'\').toLowerCase()\n  .replace(/\\b(ltd|limited|plc|llc|inc)\\b/g, \' \')\n  .replace(/[^\\p{L}\\p{N}\\s]/gu, \' \').replace(/\\s+/g, \' \').trim();\nfunction bigrammes(s) { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const b = s.slice(i, i + 2); m.set(b, (m.get(b) || 0) + 1); } return m; }\nfunction dice(a, b) {\n  if (a === b) return 1; if (a.length < 2 || b.length < 2) return 0;\n  const A = bigrammes(a), B = bigrammes(b); let inter = 0;\n  for (const [k, v] of A) if (B.has(k)) inter += Math.min(v, B.get(k));\n  return 2 * inter / ((a.length - 1) + (b.length - 1));\n}\n\nconst rows = parseCSV(csv);\nconst h = rows[0].map(x => x.trim().toLowerCase());\nconst iNom = h.findIndex(x => x.startsWith(\'organisation\'));\nconst iType = h.findIndex(x => x.startsWith(\'type\'));\nconst iRoute = h.findIndex(x => x === \'route\');\nif (iNom < 0 || iRoute < 0) throw new Error(\'Colonnes du registre introuvables : le format a changé.\');\n\nconst exact = new Set(); const parPremierMot = new Map();\nfor (let r = 1; r < rows.length; r++) {\n  const row = rows[r]; if (!row[iNom]) continue;\n  if (!/skilled worker/i.test(row[iRoute] || \'\')) continue;\n  if (iType >= 0 && !/a\\s*rating/i.test(row[iType] || \'\')) continue;\n  const n = nettoyer(row[iNom]); if (!n) continue;\n  exact.add(n);\n  const k = n.split(\' \')[0];\n  if (!parPremierMot.has(k)) parPremierMot.set(k, []);\n  parPremierMot.get(k).push(n);\n}\nif (exact.size < 1000) throw new Error(\'Registre filtré trop petit : vérifier le filtre Skilled Worker / A rating.\');\n\nfunction chercher(nom) {\n  const n = nettoyer(nom); if (!n) return null;\n  if (exact.has(n)) return \'exact\';\n  for (const c of (parPremierMot.get(n.split(\' \')[0]) || [])) if (dice(n, c) >= SEUIL_SIMILARITE) return \'approx\';\n  return null;\n}\n\nconst offres = $(\'06 Normaliser – Règles C1 à C4\').all().map(i => i.json);\nconst sortie = offres.map(o => {\n  if (o.__vide || o.regle_exclusion) return { json: o };\n  const m = chercher(o.entreprise);\n  return { json: { ...o, sponsor_match: m || \'\', regle_exclusion: m ? \'\' : \'C5\' } };\n});\nreturn sortie.length ? sortie : [{ json: { __vide: true } }];' }, position: [1872, 208] }
});

const _15_Fusionner_Scor_es_et_signal = merge({
  version: 3.2,
  config: { name: '15 Fusionner – Scorées et signal', position: [2960, 208], notes: 'Entrée 2 = signal du nœud 10 : l\'e-mail part même sans offre.' }
});

const _11_Filtrer_Offres_en_course = node({
  type: 'n8n-nodes-base.filter',
  version: 2.3,
  config: { name: '11 Filtrer – Offres en course', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 1 }, conditions: [{ id: 'filtre-en-course', leftValue: expr('{{ !$json.regle_exclusion && !$json.__vide }}'), rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} }, position: [2080, 112] }
});

const _12_Pr_parer_Requ_te_IA = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: '12 Préparer – Requête IA', parameters: { mode: 'runOnceForEachItem', jsCode: '// Construit la requête OpenAI pour chaque offre encore en course\nconst PROFIL = `À REMPLACER : profil du candidat (formation, expériences, outils), sans nom ni coordonnées.`;\nconst o = $json;\nconst systeme = `Tu extrais des informations d\'une offre d\'emploi et tu estimes son adéquation avec un profil. Réponds uniquement par un objet JSON valide, sans texte autour. Si une information n\'est pas écrite explicitement dans l\'offre, mets null. N\'invente rien.`;\nconst utilisateur = `PROFIL:\\n${PROFIL}\\n\\nOFFRE:\\nTitre: ${o.titre}\\nEntreprise: ${o.entreprise}\\nContrat indiqué: ${o.contrat_brut || \'non indiqué\'}\\nSalaire indiqué (texte): ${(o.salaire && o.salaire.texte) || \'non indiqué\'}\\nDescription (extrait): ${String(o.texte || \'\').slice(0, 3000)}\\n\\nRenvoie ce JSON exact:\\n{\\n "annees_requises_min": nombre ou null (borne basse des années d\'expérience demandées),\\n "duree_contrat_mois": nombre ou null (durée du contrat si à durée déterminée),\\n "type_contrat": "permanent" | "fixed_term" | "contractor_freelance" | "internship_apprenticeship" | "unknown",\\n "secteur": "finance_eligible" (banque de détail ou commerciale, assurance, gestion d\'actifs, private equity, fintech) | "trading_ib_hf" (trading, banque d\'investissement, hedge fund) | "tech_startup" (startup ou scale-up tech) | "autre",\\n "salaire_min": nombre ou null, "salaire_max": nombre ou null,\\n "salaire_periode": "year" | "month" | "week" | "day" | "hour" | null,\\n "s_competences": nombre entre 0 et 1 (recouvrement entre outils demandés et profil),\\n "resume": "2 phrases maximum en français",\\n "explication_competences": "1 phrase en français"\\n}`;\nreturn { json: { ...o, body: { model: \'gpt-4o-mini\', temperature: 0, response_format: { type: \'json_object\' },\n  messages: [{ role: \'system\', content: systeme }, { role: \'user\', content: utilisateur }] } } };' }, position: [2304, 112], notes: 'TODO : remplacer la constante PROFIL par ton profil.' }
});

const _13_Extraire_IA = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: { name: '13 Extraire – IA', parameters: { method: 'POST', url: 'https://api.openai.com/v1/chat/completions', authentication: 'predefinedCredentialType', nodeCredentialType: 'openAiApi', sendBody: true, specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.body) }}'), options: { timeout: 60000 } }, credentials: { openAiApi: newCredential('OpenAI account', 'ID') }, position: [2528, 112], notes: 'TODO : credential OpenAI.', retryOnFail: true, maxTries: 3 }
});

const _14_Scorer_R_gles_et_score = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: '14 Scorer – Règles et score', parameters: { mode: 'runOnceForEachItem', jsCode: '// Règles C4 (contrat), C6, C7, C8, C9, C10 dans l\'ordre + score déterministe\nconst P = 35000;                 // plancher GBP / an\nconst SEUIL_SCORE = 60;\nconst SEUIL_COMP = 0.3;\nconst INCONNU = 0.6;\n\nconst o = { ...$(\'12 Préparer – Requête IA\').item.json }; delete o.body;\nlet ia;\ntry { ia = JSON.parse($json.choices[0].message.content); }\ncatch (e) { throw new Error(\'Réponse IA invalide pour \' + o.id + \' : arrêt.\'); }\n\nconst num = v => (typeof v === \'number\' && isFinite(v)) ? v : null;\nconst clamp = (x, a, b) => Math.min(b, Math.max(a, x));\n\n// --- Salaire : source structurée (hors estimation agrégateur) sinon extraction IA ---\nlet min = null, max = null, periode = null, origine = \'\';\nconst s = o.salaire || {};\nif (!s.estime && (num(s.min) !== null || num(s.max) !== null) && (s.devise || \'GBP\').toUpperCase() === \'GBP\') {\n  min = num(s.min); max = num(s.max); periode = s.periode;\n  const ref = max ?? min;\n  if (!periode) periode = ref < 100 ? \'hour\' : ref < 1000 ? \'day\' : \'year\';   // heuristique à valider en test\n  origine = `${min ?? \'\'}-${max ?? \'\'} ${periode}`;\n} else if (num(ia.salaire_min) !== null || num(ia.salaire_max) !== null) {\n  min = num(ia.salaire_min); max = num(ia.salaire_max); periode = ia.salaire_periode || \'year\';\n  origine = `${min ?? \'\'}-${max ?? \'\'} ${periode} (texte)`;\n}\nconst facteur = { year: 1, month: 12, week: 52, hour: 37.5 * 52 };\nlet A = null, Amax = null, jour = false;\nif (periode === \'day\') jour = true;\nelse if (periode && facteur[periode] && (min !== null || max !== null)) {\n  const lo = min ?? max, hi = max ?? min;\n  A = ((lo + hi) / 2) * facteur[periode];\n  Amax = hi * facteur[periode];\n}\n\nconst typeContrat = ia.type_contrat || \'unknown\';\nconst y = num(ia.annees_requises_min);\nconst duree = num(ia.duree_contrat_mois);\nconst comp = clamp(num(ia.s_competences) ?? 0, 0, 1);\n\nconst sSecteur = ia.secteur === \'finance_eligible\' ? 1 : ia.secteur === \'tech_startup\' ? 0.7 : 0.3;\nconst sSalaire = A === null ? INCONNU : clamp((A - P) / (0.3 * P), 0, 1);\nconst sExp = y === null ? INCONNU : (y <= 2 ? 1 : (y <= 3 ? 0.7 : 0));\nconst score = Math.round((35 * sSecteur + 30 * comp + 20 * sSalaire + 15 * sExp) * 10) / 10;\n\nlet regle = \'\';\nif (jour || typeContrat === \'contractor_freelance\' || typeContrat === \'internship_apprenticeship\') regle = \'C4\';\nelse if (ia.secteur === \'trading_ib_hf\') regle = \'C6\';\nelse if (duree !== null && duree < 6) regle = \'C7\';\nelse if (y !== null && y > 3) regle = \'C8\';\nelse if (Amax !== null && Amax < P) regle = \'C9\';\nelse if (score < SEUIL_SCORE || comp < SEUIL_COMP) regle = \'C10\';\n\nconst explication = `Secteur 35×${sSecteur}=${(35 * sSecteur).toFixed(1)} | Compétences 30×${comp.toFixed(2)}=${(30 * comp).toFixed(1)} | Salaire 20×${sSalaire.toFixed(2)}=${(20 * sSalaire).toFixed(1)} | Expérience 15×${sExp}=${(15 * sExp).toFixed(1)}. ${ia.explication_competences || \'\'}`;\n\nreturn { json: {\n  ...o, scored: true, regle_exclusion: regle, score,\n  s_secteur: sSecteur, s_competences: comp, s_salaire: Math.round(sSalaire * 100) / 100, s_experience: sExp,\n  annees_requises: y, duree_contrat_mois: duree, type_contrat: typeContrat, secteur: ia.secteur,\n  salaire_annuel: A === null ? \'\' : Math.round(A), salaire_origine: origine,\n  salaire_label: A === null ? \'salaire non précisé\' : `${Math.round(A).toLocaleString(\'en-GB\')} GBP/an`,\n  experience_label: y === null ? \'expérience non précisée\' : `${y} an(s) min.`,\n  resume: ia.resume || \'\', explication\n} };' }, position: [2752, 112] }
});

const _16_Composer_E_mail = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: '16 Composer – E-mail', parameters: { jsCode: '// Trie, garde les 10 meilleures, compose l\'e-mail (toujours envoyé)\nconst LIMITE = 10;\nconst tous = $input.all().map(i => i.json);\nconst uniques = new Map();\nfor (const o of tous.filter(o => o.scored === true && !o.regle_exclusion)) if (!uniques.has(o.id)) uniques.set(o.id, o);\nconst top = [...uniques.values()].sort((a, b) => b.score - a.score).slice(0, LIMITE);\n\nconst date = new Date().toLocaleDateString(\'fr-FR\', { timeZone: \'Europe/Paris\' });\nconst liste = [\n  [\'Reed\', \'03 Collecter – Reed\', \'results\'],\n  [\'Adzuna\', \'04 Collecter – Adzuna\', \'results\'],\n  [\'Jooble\', \'03b Collecter – Jooble\', \'jobs\'],\n  [\'JSearch\', \'03c Collecter – JSearch\', \'data\'],\n];\nconst enPanne = [], vides = [];\nfor (const [label, noeud, cle] of liste) {\n  let items; try { items = $(noeud).all(); } catch (e) { continue; }   // source non construite : ignorée\n  const erreurs = items.filter(i => i.json.error || !Array.isArray(i.json[cle])).length;\n  const total = items.reduce((a, i) => a + (Array.isArray(i.json[cle]) ? i.json[cle].length : 0), 0);\n  if (erreurs > 0) enPanne.push(`${label} (${erreurs}/${items.length} requêtes en erreur)`);\n  else if (total === 0) vides.push(`${label} (0 résultat)`);\n}\nconst esc = s => String(s ?? \'\').replace(/&/g, \'&amp;\').replace(/</g, \'&lt;\').replace(/>/g, \'&gt;\');\n\nlet corps = \'<p>Aucune nouvelle offre cette fois.</p>\';\nif (top.length) {\n  corps = top.map((o, i) => `\n  <div style="margin:0 0 18px;padding:0 0 12px;border-bottom:1px solid #ddd">\n    <p style="margin:0"><b>${i + 1}. <a href="${esc(o.lien)}">${esc(o.titre)}</a></b> — ${esc(o.entreprise)}</p>\n    <p style="margin:2px 0;color:#555">${esc(o.ville)} · publiée le ${esc(String(o.date_publication || \'\').slice(0, 10) || \'date inconnue\')} · ${esc(o.contrat_brut || o.type_contrat)} · ${esc(o.salaire_label)} · ${esc(o.experience_label)}</p>\n    <p style="margin:4px 0">${esc(o.resume)}</p>\n    <p style="margin:2px 0"><b>Score ${esc(o.score)}/100</b> <span style="color:#555">${esc(o.explication)}</span></p>\n  </div>`).join(\'\');\n}\nlet pied = \'\';\nif (enPanne.length) pied += `<p style="color:#b00"><b>Sources indisponibles :</b> ${esc(enPanne.join(\', \'))}</p>`;\nif (vides.length) pied += `<p style="color:#555">Sources sans résultat : ${esc(vides.join(\', \'))}</p>`;\n\nreturn [{ json: {\n  subject: `Veille Data & IA Londres : ${top.length} offre(s) du ${date}`,\n  html: `<div style="font-family:Arial,sans-serif;font-size:14px">${corps}${pied}</div>`,\n  ids: top.map(o => o.id)\n} }];' }, position: [3184, 208] }
});

const _17_Envoyer_E_mail = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: { name: '17 Envoyer – E-mail', parameters: { sendTo: 'TODO@exemple.com', subject: expr('{{ $json.subject }}'), message: expr('{{ $json.html }}'), options: { appendAttribution: false } }, credentials: { gmailOAuth2: newCredential('Gmail account', 'ID') }, position: [3408, 208], webhookId: '3280ca20-e6ed-4e3d-b6a1-758ea1515211', notes: 'TODO : credential Gmail et adresse destinataire.' }
});

const _18_M_moriser_Envoy_es = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: '18 Mémoriser – Envoyées', parameters: { jsCode: '// Après l\'envoi réussi : retient les offres envoyées pour ne plus les renvoyer\nconst memoire = $getWorkflowStaticData(\'global\');\nmemoire.vus = memoire.vus || {};\nfor (const id of $(\'16 Composer – E-mail\').first().json.ids) memoire.vus[id] = Date.now();\nreturn [{ json: { memorisees: $(\'16 Composer – E-mail\').first().json.ids.length } }];' }, position: [3632, 208] }
});

const wf = workflow('JQNdY3r2CI5CKPb0', 'CLAUDE offres Data & IA – Londres', { binaryMode: 'separate', description: 'Veille Data & IA à Londres : Reed + Adzuna, règles C1 à C10, score, un e-mail de 10 offres lundi et jeudi 12h30.', availableInMCP: true, executionOrder: 'v1', timezone: 'Europe/Paris' });

export default wf
  .add(_01_D_clencher_Lundi_et_jeudi_12h30)
  .to(_02_G_n_rer_4_requ_tes
  .to([
    _03_Collecter_Reed,
    _04_Collecter_Adzuna]))
  .add(_03_Collecter_Reed.to(_05_Fusionner_Sources.input(0)))
  .add(_04_Collecter_Adzuna.to(_05_Fusionner_Sources.input(1)))
  .add(_10_Appliquer_Sponsors_C5.to(_15_Fusionner_Scor_es_et_signal.input(0)))
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