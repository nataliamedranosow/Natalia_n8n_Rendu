const formulaire_PDF = trigger({
  type: 'n8n-nodes-base.formTrigger',
  version: 2.6,
  config: { name: 'Formulaire PDF', parameters: { formTitle: 'Ajouter un livre', formDescription: 'Dépose un PDF avec du texte (pas un scan).', formFields: { values: [{ fieldLabel: 'data', fieldType: 'file', multipleFiles: false, acceptFileTypes: '.pdf', requiredField: true }] }, options: {} }, position: [-200, 300], webhookId: 'rag-pere-riche-ingestion' }
});

const extract = node({
  type: 'n8n-nodes-base.extractFromFile',
  version: 1.1,
  config: { name: 'Extract', parameters: { operation: 'pdf', options: {} }, position: [60, 300] }
});

const cleaning = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: { name: 'Cleaning', parameters: { assignments: { assignments: [{ id: 'a0', name: 'texte_propre', value: expr('{{ ($json.text || \'\').replace(/\\r/g,\'\').replace(/(\\w)-\\n(\\w)/g,\'$1$2\').replace(/[ \\t]+/g,\' \').replace(/^\\s*\\d+\\s*$/gm,\'\').replace(/\\n{3,}/g,\'\\n\\n\').trim() }}'), type: 'string' }, { id: 'a1', name: 'nom_fichier', value: expr('{{ $(\'Formulaire PDF\').item.binary.data.fileName }}'), type: 'string' }, { id: 'a2', name: 'pages', value: expr('{{ $json.numpages }}'), type: 'number' }] }, options: {} }, position: [320, 300] }
});

const texte_exploitable = node({
  type: 'n8n-nodes-base.if',
  version: 2.3,
  config: { name: 'Texte exploitable ?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ id: 'c1', leftValue: expr('{{ $json.texte_propre.length }}'), rightValue: 500, operator: { type: 'number', operation: 'gt' } }], combinator: 'and' } }, position: [580, 300] }
});

const chunking = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Chunking', parameters: { jsCode: '// Découpe par titres (Markdown ou titres détectés), sections de 5000 caractères maximum\nconst MAX = 5000;\nconst CHEVAUCHEMENT = 200;\nconst { texte_propre, nom_fichier } = $input.first().json;\n\nconst estTitre = (l) =>\n  /^#{1,6}\\s+\\S/.test(l) ||\n  /^(chapitre|chapter|partie|part|section)\\s+[\\dIVXivx]+/i.test(l) ||\n  (/^\\d+(\\.\\d+)*\\s+\\p{Lu}/u.test(l) && l.length < 80) ||\n  (l.length > 3 && l.length < 80 && l === l.toUpperCase() && /\\p{L}/u.test(l));\n\nconst sections = [];\nlet titre = \'Introduction\';\nlet tampon = [];\nconst clore = () => {\n  const t = tampon.join(\'\\n\').trim();\n  if (t) sections.push({ titre, texte: t });\n  tampon = [];\n};\nfor (const ligne of texte_propre.split(\'\\n\')) {\n  const l = ligne.trim();\n  if (estTitre(l)) { clore(); titre = l.replace(/^#+\\s*/, \'\'); } else { tampon.push(ligne); }\n}\nclore();\n\nconst morceaux = [];\nfor (const sec of sections) {\n  if (sec.texte.length <= MAX) { morceaux.push({ titre: sec.titre, contenu: sec.texte }); continue; }\n  let courant = \'\';\n  for (const p of sec.texte.split(/\\n{2,}/)) {\n    if (courant && (courant + \'\\n\\n\' + p).length > MAX) {\n      morceaux.push({ titre: sec.titre, contenu: courant });\n      courant = courant.slice(-CHEVAUCHEMENT) + \'\\n\\n\' + p;\n    } else {\n      courant = courant ? courant + \'\\n\\n\' + p : p;\n    }\n    while (courant.length > MAX) {\n      morceaux.push({ titre: sec.titre, contenu: courant.slice(0, MAX) });\n      courant = courant.slice(MAX - CHEVAUCHEMENT);\n    }\n  }\n  if (courant) morceaux.push({ titre: sec.titre, contenu: courant });\n}\n\nreturn morceaux.map((m, i) => ({\n  json: { titre: m.titre, contenu: m.titre + \'\\n\\n\' + m.contenu, nom_fichier, index: i, total: morceaux.length },\n}));' }, position: [840, 300] }
});

const garder_les_morceaux_utiles = node({
  type: 'n8n-nodes-base.filter',
  version: 2.3,
  config: { name: 'Garder les morceaux utiles', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ id: 'c2', leftValue: expr('{{ $json.contenu.length }}'), rightValue: 100, operator: { type: 'number', operation: 'gt' } }], combinator: 'and' } }, position: [1100, 300] }
});

const supprimer_les_doublons = node({
  type: 'n8n-nodes-base.removeDuplicates',
  version: 2,
  config: { name: 'Supprimer les doublons', parameters: { compare: 'selectedFields', fieldsToCompare: 'contenu', options: {} }, position: [1360, 300] }
});

const limit = node({
  type: 'n8n-nodes-base.limit',
  version: 1,
  config: { name: 'Limit', parameters: { maxItems: 200, keep: 'firstItems' }, position: [1620, 300] }
});

const chunking_SUB = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: { name: 'Chunking (SUB)', parameters: { source: 'database', workflowId: { __rl: true, mode: 'id', value: 'xAJdWIs6dm0sGfdq' }, mode: 'once', options: { waitForSubWorkflow: true } }, position: [1880, 300] }
});

const erreur_PDF_vide_ou_scann = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: { name: 'Erreur : PDF vide ou scanné', parameters: { errorMessage: 'Moins de 500 caractères extraits : le PDF est vide ou scanné (image). Utilise un PDF avec du texte.' }, position: [580, 520] }
});

const wf = workflow('hbWnS7thJLreD3FZ', 'RAG Père riche père pauvre - Ingestion propre', { executionOrder: 'v1' });

export default wf
  .add(formulaire_PDF)
  .to(extract)
  .to(cleaning)
  .to(texte_exploitable.onTrue(chunking
    .to(garder_les_morceaux_utiles)
    .to(supprimer_les_doublons)
    .to(limit)
    .to(chunking_SUB)).onFalse(erreur_PDF_vide_ou_scann))