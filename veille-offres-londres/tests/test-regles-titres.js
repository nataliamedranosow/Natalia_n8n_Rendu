// Règles C3 (postes seniors) et C4 (contrats exclus) du nœud 06.
const { chargerNoeud, verifier, bilan } = require('./helpers');
const code = chargerNoeud('06-normaliser-regles.js');
const c3 = eval(code.match(/const RE_C3 = (\/.*\/i);/)[1]);
const c4 = eval(code.match(/const RE_C4 = (\/.*\/i);/)[1]);

// [titre, exclu par C3 ?, exclu par C4 ?]
const cas = [
  ['Data Analyst', 0, 0],
  ['Senior Data Analyst', 1, 0],
  ['Lead Data Analyst', 1, 0],
  ['Head of Data', 1, 0],
  ['Lead Generation Data Analyst', 0, 0],     // « Lead » n'est pas un niveau ici
  ['Leading Edge Analyst', 0, 0],             // mot entier uniquement
  ['Data Analyst, Early-Stage Fintech', 0, 0],// « Early-Stage » n'est pas un stage
  ['Data Analyst - Stage 2 Trials', 0, 0],
  ['Stage - Data Analyst', 0, 1],
  ['Data Analyst Intern', 0, 1],
  ['Freelance Data Analyst', 0, 1],
  ['ML Engineer Contractor', 0, 1],
  ['Junior Data Analyst - Graduate Scheme', 0, 1],
  ['Apprenticeship Data', 0, 1],
];
for (const [titre, e3, e4] of cas) {
  verifier(`${titre}  (C3=${e3}, C4=${e4})`, (c3.test(titre) ? 1 : 0) === e3 && (c4.test(titre) ? 1 : 0) === e4);
}
bilan('Règles C3 et C4');
