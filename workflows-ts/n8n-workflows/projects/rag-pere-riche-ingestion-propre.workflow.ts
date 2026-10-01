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
  config: { name: 'Chunking (SUB)', parameters: { source: 'database', workflowId: { __rl: true, mode: 'id', value: 'hbWnS7thJLreD3FZ' }, mode: 'once', options: { waitForSubWorkflow: true } }, position: [1880, 300] }
});

const erreur_PDF_vide_ou_scann = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: { name: 'Erreur : PDF vide ou scanné', parameters: { errorMessage: 'Moins de 500 caractères extraits : le PDF est vide ou scanné (image). Utilise un PDF avec du texte.' }, position: [580, 520] }
});

const chunking_Trigger = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.2,
  config: { name: 'Chunking (Trigger)', parameters: { inputSource: 'passthrough' }, position: [-200, 700] }
});

const augmentation = node({
  type: '@n8n/n8n-nodes-langchain.googleGemini',
  version: 1.2,
  config: { name: 'Augmentation', parameters: { modelId: { __rl: true, value: 'models/gemini-3.5-flash-lite', mode: 'list', cachedResultName: 'models/gemini-3.5-flash-lite' }, messages: { values: [{ content: expr('{{ \'Voici un extrait d\\\'un livre (section : \' + $json.titre + \').\\n\\n\' + $json.contenu + \'\\n\\nRéponds exactement en deux lignes, en français :\\nCONTEXTE: une phrase qui situe cet extrait dans le livre.\\nQUESTIONS: trois questions auxquelles cet extrait répond, séparées par " | ".\' }}') }] }, builtInTools: {}, options: { systemMessage: 'Tu enrichis des extraits de livre pour la recherche documentaire. Tu n\'inventes rien : tu t\'appuies uniquement sur l\'extrait.' } }, position: [60, 700], retryOnFail: true, maxTries: 3, waitBetweenTries: 3000 }
});

const pr_parer_le_texte = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: { name: 'Préparer le texte', parameters: { assignments: { assignments: [{ id: 'a0', name: 'augmentation', value: expr('{{ $json.candidates?.[0]?.content?.parts?.[0]?.text || $json.content?.parts?.[0]?.text || \'\' }}'), type: 'string' }, { id: 'a1', name: 'texte_a_vectoriser', value: expr('{{ $(\'Chunking (Trigger)\').item.json.contenu + \'\\n\\n\' + ($json.candidates?.[0]?.content?.parts?.[0]?.text || $json.content?.parts?.[0]?.text || \'\') }}'), type: 'string' }] }, options: {} }, position: [320, 700] }
});

const embedding = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: { name: 'Embedding', parameters: { method: 'POST', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent', authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', sendBody: true, specifyBody: 'json', jsonBody: expr('{{ { model: \'models/gemini-embedding-001\', content: { parts: [{ text: $json.texte_a_vectoriser }] }, taskType: \'RETRIEVAL_DOCUMENT\' } }}'), options: { batching: { batch: { batchSize: 5, batchInterval: 1000 } } } }, position: [580, 700] }
});

const vecteur_valide = node({
  type: 'n8n-nodes-base.if',
  version: 2.3,
  config: { name: 'Vecteur valide ?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ id: 'c3', leftValue: expr('{{ $json.embedding.values.length }}'), rightValue: 3072, operator: { type: 'number', operation: 'equals' } }], combinator: 'and' } }, position: [840, 700] }
});

const pr_parer_la_ligne = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: { name: 'Préparer la ligne', parameters: { assignments: { assignments: [{ id: 'a0', name: 'content', value: expr('{{ $(\'Chunking (Trigger)\').item.json.contenu }}'), type: 'string' }, { id: 'a1', name: 'metadata', value: expr('{{ { source: $(\'Chunking (Trigger)\').item.json.nom_fichier, titre: $(\'Chunking (Trigger)\').item.json.titre, chunk_index: $(\'Chunking (Trigger)\').item.json.index, chunk_total: $(\'Chunking (Trigger)\').item.json.total, augmentation: $(\'Préparer le texte\').item.json.augmentation, ingested_at: $now.toISO() } }}'), type: 'object' }, { id: 'a2', name: 'embedding', value: expr('{{ \'[\' + $json.embedding.values.join(\',\') + \']\' }}'), type: 'string' }] }, options: {} }, position: [1100, 700] }
});

const save_Chunk_Embedding = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  config: { name: 'Save Chunk & Embedding', parameters: { tableId: 'documents', dataToSend: 'autoMapInputData' }, position: [1360, 700] }
});

const erreur_mauvaise_dimension = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: { name: 'Erreur : mauvaise dimension', parameters: { errorMessage: 'Le vecteur ne fait pas 3072 dimensions : le modèle d\'embedding ne correspond pas à la table Supabase vector(3072).' }, position: [840, 920] }
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
  .add(chunking_Trigger)
  .to(augmentation)
  .to(pr_parer_le_texte)
  .to(embedding)
  .to(vecteur_valide.onTrue(pr_parer_la_ligne
    .to(save_Chunk_Embedding)).onFalse(erreur_mauvaise_dimension))