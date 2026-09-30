// Normalisation des 4 sources + règles C1 à C4 (C1 = doublon : jeté sans écriture)
const JOURS_MAX = 14;
const now = Date.now();

const nettoyerEntreprise = s => String(s || '').toLowerCase()
  .replace(/\b(ltd|limited|plc|llc|inc)\b/g, ' ')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
const nettoyerTitre = s => String(s || '').toLowerCase()
  .replace(/\([^)]*\)/g, ' ')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
const texteBrut = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

function dateReed(s) { // dd/mm/yyyy
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(s || ''));
  return m ? new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00Z`).toISOString() : null;
}
function dateISO(s) {
  const t = Date.parse(s);
  return isNaN(t) ? null : new Date(t).toISOString();
}
const periodeJSearch = p => ({ YEAR: 'year', MONTH: 'month', WEEK: 'week', DAY: 'day', HOUR: 'hour' }[String(p || '').toUpperCase()] || null);

const sources = [
  { nom: 'Reed', noeud: '03 Collecter – Reed', cle: 'results', map: r => ({
    source: 'Reed', id_source: 'reed-' + r.jobId, titre: r.jobTitle, entreprise: r.employerName,
    lien: r.jobUrl, ville: r.locationName || 'London', date_publication: dateReed(r.date),
    contrat_brut: '', texte: texteBrut(r.jobDescription),
    salaire: { min: r.minimumSalary ?? null, max: r.maximumSalary ?? null, periode: null, estime: false, devise: r.currency || 'GBP' } }) },
  { nom: 'Adzuna', noeud: '04 Collecter – Adzuna', cle: 'results', map: r => ({
    source: 'Adzuna', id_source: 'adzuna-' + r.id, titre: r.title, entreprise: r.company && r.company.display_name,
    lien: r.redirect_url, ville: (r.location && r.location.display_name) || 'London', date_publication: dateISO(r.created),
    contrat_brut: [r.contract_type, r.contract_time].filter(Boolean).join(' '), texte: texteBrut(r.description),
    salaire: { min: r.salary_min ?? null, max: r.salary_max ?? null, periode: null,
               estime: String(r.salary_is_predicted) === '1', devise: 'GBP' } }) },
  { nom: 'Jooble', noeud: '03b Collecter – Jooble', cle: 'jobs', map: r => ({
    source: 'Jooble', id_source: 'jooble-' + r.id, titre: r.title, entreprise: r.company,
    lien: r.link, ville: r.location || 'London', date_publication: dateISO(r.updated),
    contrat_brut: r.type || '', texte: texteBrut(r.snippet),
    salaire: { min: null, max: null, periode: null, estime: false, devise: 'GBP', texte: r.salary || '' } }) },
  { nom: 'JSearch', noeud: '03c Collecter – JSearch', cle: 'data', map: r => ({
    source: 'JSearch', id_source: 'jsearch-' + r.job_id, titre: r.job_title, entreprise: r.employer_name,
    lien: r.job_apply_link, ville: r.job_city || 'London', date_publication: dateISO(r.job_posted_at_datetime_utc),
    contrat_brut: r.job_employment_type || '', texte: texteBrut(r.job_description),
    remote: !!r.job_is_remote,
    salaire: { min: r.job_min_salary ?? null, max: r.job_max_salary ?? null, periode: periodeJSearch(r.job_salary_period),
               estime: false, devise: r.job_salary_currency || 'GBP' } }) },
];

// --- Lecture des sources et détection des pannes ---
const meta = {};
let offres = [];
let requetesTotal = 0, requetesEnErreur = 0;
for (const s of sources) {
  let items = [];
  try { items = $(s.noeud).all(); } catch (e) { continue; }   // source non construite : ignorée
  let erreurs = 0, total = 0;
  for (const it of items) {
    const j = it.json || {};
    if (j.error || !Array.isArray(j[s.cle])) { erreurs++; continue; }
    for (const r of j[s.cle]) { total++; offres.push(s.map(r)); }
  }
  meta[s.nom] = { requetes: items.length, erreurs, total };
  requetesTotal += items.length; requetesEnErreur += erreurs;
}
if (requetesTotal === 0 || requetesEnErreur === requetesTotal) {
  throw new Error('Toutes les sources sont en panne : arrêt, historique inchangé.');
}

// --- Offres déjà envoyées (mémoire interne de n8n, purgée après 30 jours) ---
const memoire = $getWorkflowStaticData('global');
memoire.vus = memoire.vus || {};
for (const k of Object.keys(memoire.vus)) if (now - memoire.vus[k] > 30 * 86400000) delete memoire.vus[k];
const dejaVus = new Set(Object.keys(memoire.vus));

const RE_C3 = /\b(senior|lead(?!\s+generation|-in)|head|principal|staff|director)\b/i;
// 'stage' seul (stage = stagiaire) : on ignore Early-Stage, Late-Stage, Stage 2
const RE_C4 = /\b(freelance|contractor|day rate|internship|intern|alternance|apprenticeship|graduate scheme)\b|(?<![\w-])stage(?![\w-]|\s*\d)/i;

const sortie = [];
const cles = new Set();
for (const o of offres) {
  if (!o.titre || !o.entreprise) continue;
  const cle = `${nettoyerEntreprise(o.entreprise)}|${nettoyerTitre(o.titre)}|london`;
  if (dejaVus.has(cle) || cles.has(cle)) continue;           // C1 : jeté
  cles.add(cle);
  let regle = '';
  if (o.date_publication && (now - Date.parse(o.date_publication)) >= JOURS_MAX * 86400000) regle = 'C2';
  else if (RE_C3.test(o.titre)) regle = 'C3';
  else if (RE_C4.test(`${o.titre} ${o.contrat_brut}`)) regle = 'C4';
  sortie.push({ json: { ...o, id: cle, regle_exclusion: regle } });
}

// Toujours au moins un item, pour que la suite du workflow (et l'e-mail) s'exécute
if (sortie.length === 0) sortie.push({ json: { __vide: true } });
return sortie;
