// Lance tous les tests : node projects/offres-londres-v2/tests/run-all.js
const { spawnSync } = require('child_process');
const fichiers = ['test-regles-titres.js', 'test-sponsors.js', 'test-score.js', 'test-memorisation.js', 'test-prompt-ia.js'];
let ok = true;
for (const f of fichiers) {
  console.log(`\n=== ${f} ===`);
  const r = spawnSync('node', [require('path').join(__dirname, f)], { stdio: 'inherit' });
  if (r.status !== 0) ok = false;
}
console.log(ok ? '\nTOUS LES TESTS PASSENT' : '\nDES TESTS ONT ÉCHOUÉ');
process.exitCode = ok ? 0 : 1;
