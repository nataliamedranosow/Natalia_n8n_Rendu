// Convertit un workflow .ts (format n8ncli) en fichier .json importable dans n8n.
// Usage : node scripts/ts-vers-json.js workflows-ts/projects/xxx.workflow.ts n8n-workflows/projects/xxx.json
// Prérequis : npm install @n8n/workflow-sdk   (installé aussi avec @workflows-accelerator/n8n-cli)
const fs = require('fs');
const path = require('path');
let sdk;
try { sdk = require('@n8n/workflow-sdk'); }
catch (e) { sdk = require(path.join(process.env.N8NCLI_DIR || '', 'node_modules', '@n8n', 'workflow-sdk')); }
const [entree, sortie] = process.argv.slice(2);
if (!entree || !sortie) { console.error('Usage : node scripts/ts-vers-json.js <entrée.ts> <sortie.json>'); process.exit(1); }
const json = sdk.parseWorkflowCodeToBuilder(fs.readFileSync(entree, 'utf-8')).toJSON();
fs.mkdirSync(path.dirname(sortie), { recursive: true });
fs.writeFileSync(sortie, JSON.stringify(json, null, 2) + '\n');
console.log(`${sortie} : ${json.nodes.length} nœuds`);
