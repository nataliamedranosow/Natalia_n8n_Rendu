const chunking_Trigger = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.2,
  config: { name: 'Chunking (Trigger)', parameters: { inputSource: 'passthrough' }, position: [-200, 300] }
});

const augmentation = node({
  type: '@n8n/n8n-nodes-langchain.googleGemini',
  version: 1.2,
  config: { name: 'Augmentation', parameters: { modelId: { __rl: true, value: 'models/gemini-3.5-flash-lite', mode: 'list', cachedResultName: 'models/gemini-3.5-flash-lite' }, messages: { values: [{ content: expr('{{ \'Voici un extrait d\\\'un livre (section : \' + $json.titre + \').\\n\\n\' + $json.contenu + \'\\n\\nRéponds exactement en deux lignes, en français :\\nCONTEXTE: une phrase qui situe cet extrait dans le livre.\\nQUESTIONS: trois questions auxquelles cet extrait répond, séparées par " | ".\' }}') }] }, builtInTools: {}, options: { systemMessage: 'Tu enrichis des extraits de livre pour la recherche documentaire. Tu n\'inventes rien : tu t\'appuies uniquement sur l\'extrait.' } }, position: [60, 300], retryOnFail: true, maxTries: 3, waitBetweenTries: 3000 }
});

const pr_parer_le_texte = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: { name: 'Préparer le texte', parameters: { assignments: { assignments: [{ id: 'a0', name: 'augmentation', value: expr('{{ $json.candidates?.[0]?.content?.parts?.[0]?.text || $json.content?.parts?.[0]?.text || \'\' }}'), type: 'string' }, { id: 'a1', name: 'texte_a_vectoriser', value: expr('{{ $(\'Chunking (Trigger)\').item.json.contenu + \'\\n\\n\' + ($json.candidates?.[0]?.content?.parts?.[0]?.text || $json.content?.parts?.[0]?.text || \'\') }}'), type: 'string' }] }, options: {} }, position: [320, 300] }
});

const embedding = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: { name: 'Embedding', parameters: { method: 'POST', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent', authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', sendBody: true, specifyBody: 'json', jsonBody: expr('{{ { model: \'models/gemini-embedding-001\', content: { parts: [{ text: $json.texte_a_vectoriser }] }, taskType: \'RETRIEVAL_DOCUMENT\' } }}'), options: { batching: { batch: { batchSize: 5, batchInterval: 1000 } } } }, position: [580, 300] }
});

const vecteur_valide = node({
  type: 'n8n-nodes-base.if',
  version: 2.3,
  config: { name: 'Vecteur valide ?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ id: 'c3', leftValue: expr('{{ $json.embedding.values.length }}'), rightValue: 3072, operator: { type: 'number', operation: 'equals' } }], combinator: 'and' } }, position: [840, 300] }
});

const pr_parer_la_ligne = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: { name: 'Préparer la ligne', parameters: { assignments: { assignments: [{ id: 'a0', name: 'content', value: expr('{{ $(\'Chunking (Trigger)\').item.json.contenu }}'), type: 'string' }, { id: 'a1', name: 'metadata', value: expr('{{ { source: $(\'Chunking (Trigger)\').item.json.nom_fichier, titre: $(\'Chunking (Trigger)\').item.json.titre, chunk_index: $(\'Chunking (Trigger)\').item.json.index, chunk_total: $(\'Chunking (Trigger)\').item.json.total, augmentation: $(\'Préparer le texte\').item.json.augmentation, ingested_at: $now.toISO() } }}'), type: 'object' }, { id: 'a2', name: 'embedding', value: expr('{{ \'[\' + $json.embedding.values.join(\',\') + \']\' }}'), type: 'string' }] }, options: {} }, position: [1100, 300] }
});

const save_Chunk_Embedding = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  config: { name: 'Save Chunk & Embedding', parameters: { tableId: 'documents', dataToSend: 'autoMapInputData' }, position: [1360, 300] }
});

const erreur_mauvaise_dimension = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: { name: 'Erreur : mauvaise dimension', parameters: { errorMessage: 'Le vecteur ne fait pas 3072 dimensions : le modèle d\'embedding ne correspond pas à la table Supabase vector(3072).' }, position: [840, 520] }
});

const wf = workflow('', 'RAG Père riche père pauvre - Embedding (SUB)', { executionOrder: 'v1' });

export default wf
  .add(chunking_Trigger)
  .to(augmentation)
  .to(pr_parer_le_texte)
  .to(embedding)
  .to(vecteur_valide.onTrue(pr_parer_la_ligne
    .to(save_Chunk_Embedding)).onFalse(erreur_mauvaise_dimension))