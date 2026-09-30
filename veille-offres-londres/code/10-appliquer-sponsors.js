// Règle C5 : entreprise présente au registre officiel des sponsors (Skilled Worker, A rating)
const SEUIL_SIMILARITE = 0.9;     // à régler en test (Annexe C)

const csv = String($input.first().json.data || '');
if (csv.length < 100000) throw new Error('Registre des sponsors invalide ou vide : arrêt.');

function parseCSV(t) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
const nettoyer = s => String(s || '').toLowerCase()
  .replace(/\b(ltd|limited|plc|llc|inc)\b/g, ' ')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
function bigrammes(s) { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const b = s.slice(i, i + 2); m.set(b, (m.get(b) || 0) + 1); } return m; }
function dice(a, b) {
  if (a === b) return 1; if (a.length < 2 || b.length < 2) return 0;
  const A = bigrammes(a), B = bigrammes(b); let inter = 0;
  for (const [k, v] of A) if (B.has(k)) inter += Math.min(v, B.get(k));
  return 2 * inter / ((a.length - 1) + (b.length - 1));
}

// Noyau du nom : on retire les mots qui varient d'une source à l'autre (Group, Holdings, UK...)
const MOTS_VIDES = new Set(['group', 'holdings', 'holding', 'uk', 'europe', 'international', 'the', 'llp', 'co', 'company', 'and']);
const noyau = s => nettoyer(s).split(' ').filter(w => w && !MOTS_VIDES.has(w)).join(' ');

const rows = parseCSV(csv);
const h = rows[0].map(x => x.trim().toLowerCase());
const iNom = h.findIndex(x => x.startsWith('organisation'));
const iType = h.findIndex(x => x.startsWith('type'));
const iRoute = h.findIndex(x => x === 'route');
if (iNom < 0 || iRoute < 0) throw new Error('Colonnes du registre introuvables : le format a changé.');

const exact = new Set(); const noyaux = new Set(); const parPremierMot = new Map();
for (let r = 1; r < rows.length; r++) {
  const row = rows[r]; if (!row[iNom]) continue;
  if (!/skilled worker/i.test(row[iRoute] || '')) continue;
  if (iType >= 0 && !/a\s*rating/i.test(row[iType] || '')) continue;
  const n = nettoyer(row[iNom]); if (!n) continue;
  exact.add(n);
  const nk = noyau(row[iNom]);
  if (nk) {
    noyaux.add(nk);
    const k = nk.split(' ')[0];
    if (!parPremierMot.has(k)) parPremierMot.set(k, []);
    parPremierMot.get(k).push(nk);
  }
}
if (exact.size < 1000) throw new Error('Registre filtré trop petit : vérifier le filtre Skilled Worker / A rating.');

function chercher(nom) {
  const n = nettoyer(nom); if (!n) return null;
  if (exact.has(n)) return 'exact';
  const k = noyau(nom);
  if (k.length >= 3 && noyaux.has(k)) return 'noyau';
  for (const c of (parPremierMot.get(k.split(' ')[0]) || [])) if (dice(k, c) >= SEUIL_SIMILARITE) return 'approx';
  return null;
}

const offres = $('06 Normaliser – Règles C1 à C4').all().map(i => i.json);
const sortie = offres.map(o => {
  if (o.__vide || o.regle_exclusion) return { json: o };
  const m = chercher(o.entreprise);
  return { json: { ...o, sponsor_match: m || '', regle_exclusion: m ? '' : 'C5' } };
});
return sortie.length ? sortie : [{ json: { __vide: true } }];
