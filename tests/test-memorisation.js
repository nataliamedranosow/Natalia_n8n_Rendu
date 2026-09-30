// Nœud 16 : tri, e-mail et liste des offres à mémoriser.
const { chargerNoeud, verifier, bilan } = require('./helpers');
const code = chargerNoeud('16-composer-email.js');
const mk = (i, score, regle) => ({ json: { id: 'id' + i, scored: true, score, regle_exclusion: regle, titre: 'T' + i, entreprise: 'E', lien: 'l',
  ville: 'London', date_publication: '2026-09-29', contrat_brut: '', type_contrat: 'permanent', salaire_label: 'x', experience_label: 'y', resume: 'r', explication: 'e' } });

const items = [];
for (let i = 1; i <= 12; i++) items.push(mk(i, 90 - i, ''));
items.push(mk(13, 50, 'C9'), mk(14, 30, 'C10'), mk(15, 0, 'C6'), { json: { __vide: true } });
const $ = n => { if (/Reed|Adzuna/.test(n)) return { all: () => [{ json: { results: [{}] } }] }; throw new Error('absent'); };
const r = new Function('$input', '$', code)({ all: () => items }, $)[0].json;

verifier('Le sujet annonce 10 offres', /10 offre/.test(r.subject));
verifier('Les offres hors Top 10 ne sont PAS mémorisées (elles reviendront)', !r.ids.includes('id11') && !r.ids.includes('id12'));
verifier('Le Top 10 est mémorisé', ['id1', 'id5', 'id10'].every(x => r.ids.includes(x)));
verifier('Les offres rejetées par les règles de fond sont mémorisées', ['id13', 'id14', 'id15'].every(x => r.ids.includes(x)));

const vide = new Function('$input', '$', code)({ all: () => [{ json: { __vide: true } }] }, $)[0].json;
verifier('Sans offre : e-mail « Aucune nouvelle offre cette fois »', /Aucune nouvelle offre/.test(vide.html));
bilan('Nœud 16 (e-mail et mémoire)');
