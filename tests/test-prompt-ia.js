// Nœud 12 : la consigne envoyée à Gemini distingue bien contrat temporaire et freelance.
const { chargerNoeud, verifier, bilan } = require('./helpers');
const code = chargerNoeud('12-preparer-requete-ia.js');
const offre = { titre: 'FP&A Analyst', entreprise: 'Exemple', contrat_brut: '', texte: 'Poste temporaire de 15 mois.', salaire: { texte: '' } };
const r = new Function('$json', code)(offre).json;
verifier('La requête contient le système et l\'utilisateur', typeof r.systeme === 'string' && typeof r.utilisateur === 'string');
verifier('Le titre et l\'entreprise sont transmis', r.utilisateur.includes('FP&A Analyst') && r.utilisateur.includes('Exemple'));
verifier('Le contrat temporaire salarié est décrit comme fixed_term', /fixed_term.*temporaire/s.test(r.utilisateur));
verifier('Freelance réservé au tarif journalier / umbrella / IR35', /UNIQUEMENT si tarif journalier/.test(r.utilisateur));
verifier('Le profil est présent dans la requête', r.utilisateur.includes('PROFIL:'));
bilan('Consigne IA (nœud 12)');
