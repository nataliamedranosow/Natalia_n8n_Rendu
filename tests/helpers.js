// Utilitaires de test : charge le code d'un nœud n8n et l'exécute avec des faux $json, $input, $().
const fs = require('fs');
const path = require('path');

function chargerNoeud(nomFichier) {
  return fs.readFileSync(path.join(__dirname, '..', 'code', nomFichier), 'utf-8');
}

let echecs = 0;
function verifier(description, condition) {
  if (!condition) echecs++;
  console.log((condition ? 'OK  ' : 'ÉCHEC ') + description);
}
function bilan(titre) {
  console.log(`\n${titre} : ${echecs === 0 ? 'tous les tests passent' : echecs + ' échec(s)'}`);
  process.exitCode = echecs === 0 ? 0 : 1;
}
module.exports = { chargerNoeud, verifier, bilan };
