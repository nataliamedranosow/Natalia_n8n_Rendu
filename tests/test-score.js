// Règles C4, C6 à C10 et score du nœud 14, avec de fausses réponses de Gemini.
const { chargerNoeud, verifier, bilan } = require('./helpers');
const code = chargerNoeud('14-scorer.js');
const iaBase = { annees_requises_min: null, duree_contrat_mois: null, type_contrat: 'permanent', secteur: 'tech_startup',
  salaire_min: null, salaire_max: null, salaire_periode: null, s_competences: 0.6, resume: 'r', explication_competences: 'e' };
const rep = ia => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(ia) }] } }] });
function lancer(salaire, ia = {}) {
  const o = { id: 'x', titre: 't', entreprise: 'e', salaire: { periode: null, estime: false, devise: 'GBP', ...salaire }, body: {} };
  return new Function('$json', '$', code)(rep({ ...iaBase, ...ia }), () => ({ item: { json: o } })).json;
}

let r = lancer({ min: 3120, max: 3120 });
verifier('3 120 (montant mensuel) converti en 37 440 par an, offre gardée', r.salaire_annuel === 37440 && !r.regle_exclusion);
r = lancer({ min: 45000, max: 45000 });
verifier('45 000 par an : gardée, score 70,5', !r.regle_exclusion && r.score === 70.5);
r = lancer({ min: 20, max: 20 });
verifier('20 par heure converti en 39 000 par an', r.salaire_annuel === 39000);
r = lancer({ min: 450, max: 450 });
verifier('450 par jour : tarif journalier, exclue (C4)', r.regle_exclusion === 'C4');
r = lancer({ min: null, max: null });
verifier('Sans salaire : gardée, "salaire non précisé"', !r.regle_exclusion && r.salaire_label === 'salaire non précisé');
r = lancer({ min: 30000, max: 30000 });
verifier('30 000 par an : sous le plancher, exclue (C9)', r.regle_exclusion === 'C9');
r = lancer({}, { secteur: 'trading_ib_hf' });
verifier('Trading / banque d\'investissement : exclue (C6)', r.regle_exclusion === 'C6');
r = lancer({}, { duree_contrat_mois: 3 });
verifier('Contrat de 3 mois : exclu (C7)', r.regle_exclusion === 'C7');
r = lancer({}, { annees_requises_min: 4 });
verifier('4 ans d\'expérience : exclue (C8)', r.regle_exclusion === 'C8');
r = lancer({}, { annees_requises_min: 3 });
verifier('3 ans d\'expérience : gardée', !r.regle_exclusion);
r = lancer({}, { type_contrat: 'contractor_freelance' });
verifier('Contrat freelance : exclu (C4)', r.regle_exclusion === 'C4');
r = lancer({}, { secteur: 'autre', s_competences: 0.2 });
verifier('Compétences 0,2 : exclue (C10)', r.regle_exclusion === 'C10');
r = lancer({}, { secteur: 'finance_eligible', s_competences: 0.3 });
verifier('Finance, compétences 0,3, tout inconnu : score 65 (cas limite du cahier des charges)', r.score === 65);
bilan('Score et règles de l\'IA');
