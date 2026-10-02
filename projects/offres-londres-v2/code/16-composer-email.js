// Trie, garde les 10 meilleures, compose l'e-mail (toujours envoyé)
const LIMITE = 10;
const tous = $input.all().map(i => i.json);
const uniques = new Map();
for (const o of tous.filter(o => o.scored === true && !o.regle_exclusion)) if (!uniques.has(o.id)) uniques.set(o.id, o);
const top = [...uniques.values()].sort((a, b) => b.score - a.score).slice(0, LIMITE);

const date = new Date().toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' });
const liste = [
  ['Reed', '03 Collecter – Reed', 'results'],
  ['Adzuna', '04 Collecter – Adzuna', 'results'],
  ['Jooble', '03b Collecter – Jooble', 'jobs'],
  ['JSearch', '03c Collecter – JSearch', 'data'],
];
const enPanne = [], vides = [];
for (const [label, noeud, cle] of liste) {
  let items; try { items = $(noeud).all(); } catch (e) { continue; }   // source non construite : ignorée
  const erreurs = items.filter(i => i.json.error || !Array.isArray(i.json[cle])).length;
  const total = items.reduce((a, i) => a + (Array.isArray(i.json[cle]) ? i.json[cle].length : 0), 0);
  if (erreurs > 0) enPanne.push(`${label} (${erreurs}/${items.length} requêtes en erreur)`);
  else if (total === 0) vides.push(`${label} (0 résultat)`);
}
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let corps = '<p>Aucune nouvelle offre cette fois.</p>';
if (top.length) {
  corps = top.map((o, i) => `
  <div style="margin:0 0 18px;padding:0 0 12px;border-bottom:1px solid #ddd">
    <p style="margin:0"><b>${i + 1}. <a href="${esc(o.lien)}">${esc(o.titre)}</a></b> — ${esc(o.entreprise)}</p>
    <p style="margin:2px 0;color:#555">${esc(o.ville)} · publiée le ${esc(String(o.date_publication || '').slice(0, 10) || 'date inconnue')} · ${esc(o.contrat_brut || o.type_contrat)} · ${esc(o.salaire_label)} · ${esc(o.experience_label)}</p>
    <p style="margin:4px 0">${esc(o.resume)}</p>
    <p style="margin:2px 0"><b>Score ${esc(o.score)}/100</b> <span style="color:#555">${esc(o.explication)}</span></p>
  </div>`).join('');
}
let pied = '';
if (enPanne.length) pied += `<p style="color:#b00"><b>Sources indisponibles :</b> ${esc(enPanne.join(', '))}</p>`;
if (vides.length) pied += `<p style="color:#555">Sources sans résultat : ${esc(vides.join(', '))}</p>`;

return [{ json: {
  subject: `Veille Data & IA Londres : ${top.length} offre(s) du ${date}`,
  html: `<div style="font-family:Arial,sans-serif;font-size:14px">${corps}${pied}</div>`,
  // À mémoriser : les offres envoyées, et celles rejetées par les règles de fond (elles le resteraient).
  // Les offres valables mais hors Top 10 ne sont PAS mémorisées : elles reviennent à l'exécution suivante.
  ids: [...new Set([...top.map(o => o.id), ...tous.filter(o => o.scored === true && ['C4', 'C6', 'C7', 'C8', 'C9', 'C10'].includes(o.regle_exclusion)).map(o => o.id)])]
} }];
