// Règles C4 (contrat), C6, C7, C8, C9, C10 dans l'ordre + score déterministe
const P = 35000;                 // plancher GBP / an
const SEUIL_SCORE = 50;          // abaissé de 60 à 50 après test sur données réelles (Annexe C)
const SEUIL_COMP = 0.3;
const INCONNU = 0.6;

const o = { ...$('12 Préparer – Requête IA').item.json }; delete o.body;
let ia;
try {
  const brut = $json.content?.parts?.[0]?.text ?? $json.candidates?.[0]?.content?.parts?.[0]?.text ?? $json.text;
  ia = JSON.parse(String(brut).replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, ''));
} catch (e) { throw new Error('Réponse IA invalide pour ' + o.id + ' : arrêt.'); }

const num = v => (typeof v === 'number' && isFinite(v)) ? v : null;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// --- Salaire : source structurée (hors estimation agrégateur) sinon extraction IA ---
let min = null, max = null, periode = null, origine = '';
const s = o.salaire || {};
if (!s.estime && (num(s.min) !== null || num(s.max) !== null) && (s.devise || 'GBP').toUpperCase() === 'GBP') {
  min = num(s.min); max = num(s.max); periode = s.periode;
  const ref = max ?? min;
  if (!periode) periode = ref < 100 ? 'hour' : ref < 1000 ? 'day' : ref < 10000 ? 'month' : 'year';   // 1 000 à 9 999 = montant mensuel
  origine = `${min ?? ''}-${max ?? ''} ${periode}`;
} else if (num(ia.salaire_min) !== null || num(ia.salaire_max) !== null) {
  min = num(ia.salaire_min); max = num(ia.salaire_max); periode = ia.salaire_periode || 'year';
  origine = `${min ?? ''}-${max ?? ''} ${periode} (texte)`;
}
const facteur = { year: 1, month: 12, week: 52, hour: 37.5 * 52 };
let A = null, Amax = null, jour = false;
if (periode === 'day') jour = true;
else if (periode && facteur[periode] && (min !== null || max !== null)) {
  const lo = min ?? max, hi = max ?? min;
  A = ((lo + hi) / 2) * facteur[periode];
  Amax = hi * facteur[periode];
}

const typeContrat = ia.type_contrat || 'unknown';
const y = num(ia.annees_requises_min);
const duree = num(ia.duree_contrat_mois);
const comp = clamp(num(ia.s_competences) ?? 0, 0, 1);

const sSecteur = ia.secteur === 'finance_eligible' ? 1 : ia.secteur === 'tech_startup' ? 0.7 : 0.3;
const sSalaire = A === null ? INCONNU : clamp((A - P) / (0.3 * P), 0, 1);
const sExp = y === null ? INCONNU : (y <= 2 ? 1 : (y <= 3 ? 0.7 : 0));
const score = Math.round((35 * sSecteur + 30 * comp + 20 * sSalaire + 15 * sExp) * 10) / 10;

let regle = '';
if (jour || typeContrat === 'contractor_freelance' || typeContrat === 'internship_apprenticeship') regle = 'C4';
else if (ia.secteur === 'trading_ib_hf') regle = 'C6';
else if (duree !== null && duree < 6) regle = 'C7';
else if (y !== null && y > 3) regle = 'C8';
else if (Amax !== null && Amax < P) regle = 'C9';
else if (score < SEUIL_SCORE || comp < SEUIL_COMP) regle = 'C10';

const explication = `Secteur 35×${sSecteur}=${(35 * sSecteur).toFixed(1)} | Compétences 30×${comp.toFixed(2)}=${(30 * comp).toFixed(1)} | Salaire 20×${sSalaire.toFixed(2)}=${(20 * sSalaire).toFixed(1)} | Expérience 15×${sExp}=${(15 * sExp).toFixed(1)}. ${ia.explication_competences || ''}`;

return { json: {
  ...o, scored: true, regle_exclusion: regle, score,
  s_secteur: sSecteur, s_competences: comp, s_salaire: Math.round(sSalaire * 100) / 100, s_experience: sExp,
  annees_requises: y, duree_contrat_mois: duree, type_contrat: typeContrat, secteur: ia.secteur,
  salaire_annuel: A === null ? '' : Math.round(A), salaire_origine: origine,
  salaire_label: A === null ? 'salaire non précisé' : `${Math.round(A).toLocaleString('en-GB')} GBP/an`,
  experience_label: y === null ? 'expérience non précisée' : `${y} an(s) min.`,
  resume: ia.resume || '', explication
} };
