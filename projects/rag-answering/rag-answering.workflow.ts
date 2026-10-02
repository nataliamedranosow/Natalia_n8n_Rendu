const when_chat_message_received = trigger({
  type: '@n8n/n8n-nodes-langchain.chatTrigger',
  version: 1.4,
  config: { name: 'When chat message received', parameters: { public: false, options: { responseMode: 'lastNode' } }, position: [-200, 300] }
});

const context = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: { name: 'Context', parameters: { assignments: { assignments: [{ id: 'a0', name: 'question', value: expr('{{ $json.chatInput }}'), type: 'string' }, { id: 'a1', name: 'seuil', value: 0.5, type: 'number' }] }, options: {} }, position: [60, 300] }
});

const routing = node({
  type: '@n8n/n8n-nodes-langchain.googleGemini',
  version: 1.2,
  config: { name: 'Routing', parameters: { modelId: { __rl: true, value: 'models/gemini-3.5-flash-lite', mode: 'list', cachedResultName: 'models/gemini-3.5-flash-lite' }, messages: { values: [{ content: expr('{{ \'Question de l\\\'utilisateur : \' + $json.question + \'\\n\\nRéponds uniquement par un JSON de la forme {"requete": "la question reformulée de façon autonome et précise pour chercher dans le livre", "mots_cles": "3 à 6 mots-clés séparés par des espaces"}\' }}') }] }, builtInTools: {}, options: { systemMessage: 'Tu analyses une question sur le livre « Père riche, père pauvre » pour préparer une recherche. Tu réponds uniquement par le JSON demandé.' } }, position: [320, 300], retryOnFail: true, maxTries: 3, waitBetweenTries: 4000 }
});

const routing_Parse = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: { name: 'Routing - Parse', parameters: { assignments: { assignments: [{ id: 'a0', name: 'requete', value: expr('{{ (() => { try { return JSON.parse(($json.candidates?.[0]?.content?.parts?.[0]?.text || $json.content?.parts?.[0]?.text || \'\').replace(/```json|```/g, \'\').trim()).requete; } catch (e) { return $(\'Context\').item.json.question; } })() }}'), type: 'string' }, { id: 'a1', name: 'mots_cles', value: expr('{{ (() => { try { return JSON.parse(($json.candidates?.[0]?.content?.parts?.[0]?.text || $json.content?.parts?.[0]?.text || \'\').replace(/```json|```/g, \'\').trim()).mots_cles; } catch (e) { return $(\'Context\').item.json.question; } })() }}'), type: 'string' }] }, options: {} }, position: [580, 300] }
});

const embedding_de_la_requ_te = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: { name: 'Embedding de la requête', parameters: { method: 'POST', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent', authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', sendBody: true, specifyBody: 'json', jsonBody: expr('{{ { model: \'models/gemini-embedding-001\', content: { parts: [{ text: $json.requete }] }, taskType: \'RETRIEVAL_QUERY\' } }}'), options: {} }, position: [840, 300] }
});

const search = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.7,
  config: { name: 'Search', parameters: { operation: 'executeQuery', query: expr('with q as (select \'[{{ $json.embedding.values.join(\',\') }}]\'::vector as v, $kw${{ $(\'Routing - Parse\').item.json.mots_cles }}$kw$ as kw)\nselect d.id, d.chunk, d.mots_cles, round((1 - (d.embedding <=> q.v))::numeric, 3)::float as score\nfrom documents d, q\norder by (d.embedding <=> q.v) - case when to_tsvector(\'french\', coalesce(d.chunk, \'\') || \' \' || coalesce(d.mots_cles, \'\')) @@ websearch_to_tsquery(\'french\', q.kw) then 0.05 else 0 end\nlimit 10;'), options: {} }, position: [1100, 300] }
});

const filter_Based_on_Score = node({
  type: 'n8n-nodes-base.filter',
  version: 2.3,
  config: { name: 'Filter Based on Score', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ id: 'c1', leftValue: expr('{{ $json.score }}'), rightValue: expr('{{ $(\'Context\').first().json.seuil }}'), operator: { type: 'number', operation: 'gt' } }], combinator: 'and' } }, position: [1360, 300], alwaysOutputData: true }
});

const aggregate = node({
  type: 'n8n-nodes-base.aggregate',
  version: 1,
  config: { name: 'Aggregate', parameters: { aggregate: 'aggregateIndividualFields', fieldsToAggregate: { fieldToAggregate: [{ fieldToAggregate: 'id' }, { fieldToAggregate: 'chunk' }, { fieldToAggregate: 'score' }] }, options: {} }, position: [1620, 300] }
});

const chunks_pertinents = node({
  type: 'n8n-nodes-base.if',
  version: 2.3,
  config: { name: 'Chunks pertinents ?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ id: 'c2', leftValue: expr('{{ ($json.chunk || []).filter(x => x).length }}'), rightValue: 0, operator: { type: 'number', operation: 'gt' } }], combinator: 'and' } }, position: [1880, 300] }
});

const format_Chunks = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: { name: 'Format Chunks', parameters: { assignments: { assignments: [{ id: 'a0', name: 'candidats', value: expr('{{ $json.chunk.map((c, i) => \'[\' + $json.id[i] + \'] (score \' + $json.score[i] + \') \' + c.slice(0, 1200)).join(\'\\n\\n\') }}'), type: 'string' }] }, options: {}, includeOtherFields: true }, position: [2140, 300] }
});

const reranking = node({
  type: '@n8n/n8n-nodes-langchain.googleGemini',
  version: 1.2,
  config: { name: 'Reranking', parameters: { modelId: { __rl: true, value: 'models/gemini-3.5-flash-lite', mode: 'list', cachedResultName: 'models/gemini-3.5-flash-lite' }, messages: { values: [{ content: expr('{{ \'Question : \' + $(\'Context\').item.json.question + \'\\n\\nExtraits candidats :\\n\' + $json.candidats + \'\\n\\nChoisis les 3 extraits les plus utiles pour répondre. Réponds uniquement par un JSON : {"ids": [id1, id2, id3]}\' }}') }] }, builtInTools: {}, options: { systemMessage: 'Tu classes des extraits de livre par pertinence. Tu réponds uniquement par le JSON demandé.' } }, position: [2400, 300], retryOnFail: true, maxTries: 3, waitBetweenTries: 4000 }
});

const parse_Chunks = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: { name: 'Parse Chunks', parameters: { assignments: { assignments: [{ id: 'a0', name: 'contexte', value: expr('{{ (() => { const f = $(\'Format Chunks\').item.json; let sel = []; try { sel = JSON.parse(($json.candidates?.[0]?.content?.parts?.[0]?.text || $json.content?.parts?.[0]?.text || \'\').replace(/```json|```/g, \'\').trim()).ids.map(Number); } catch (e) {} const pick = f.id.map((id, i) => (sel.length === 0 ? i < 3 : sel.includes(Number(id))) ? \'[\' + id + \'] \' + f.chunk[i] : null).filter(Boolean); return pick.join(\'\\n\\n---\\n\\n\'); })() }}'), type: 'string' }] }, options: {} }, position: [2660, 300] }
});

const g_n_ration = node({
  type: '@n8n/n8n-nodes-langchain.googleGemini',
  version: 1.2,
  config: { name: 'Génération', parameters: { modelId: { __rl: true, value: 'models/gemini-3.5-flash-lite', mode: 'list', cachedResultName: 'models/gemini-3.5-flash-lite' }, messages: { values: [{ content: expr('{{ \'Question : \' + $(\'Context\').item.json.question + \'\\n\\nExtraits du livre :\\n\' + $json.contexte }}') }] }, builtInTools: {}, options: { systemMessage: 'Tu réponds en français à des questions sur le livre « Père riche, père pauvre ». Tu utilises uniquement les extraits fournis. Si la réponse n\'y est pas, tu réponds exactement : « Je ne trouve pas cette information dans le livre. » Tu n\'inventes rien et tu cites les numéros d\'extraits entre crochets, par exemple [12].' } }, position: [2920, 300], retryOnFail: true, maxTries: 3, waitBetweenTries: 4000 }
});

const r_ponse = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: { name: 'Réponse', parameters: { assignments: { assignments: [{ id: 'a0', name: 'output', value: expr('{{ ($json.candidates?.[0]?.content?.parts?.[0]?.text || $json.content?.parts?.[0]?.text || \'\') }}'), type: 'string' }] }, options: {} }, position: [3180, 300] }
});

const pas_de_chunk_pertinent = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: { name: 'Pas de chunk pertinent', parameters: { assignments: { assignments: [{ id: 'a0', name: 'output', value: 'Je ne trouve pas cette information dans le livre.', type: 'string' }] }, options: {} }, position: [1880, 520] }
});

const wf = workflow('', 'RAG Père riche père pauvre - ANSWERING', { executionOrder: 'v1' });

export default wf
  .add(when_chat_message_received)
  .to(context)
  .to(routing)
  .to(routing_Parse)
  .to(embedding_de_la_requ_te)
  .to(search)
  .to(filter_Based_on_Score)
  .to(aggregate)
  .to(chunks_pertinents.onTrue(format_Chunks
    .to(reranking)
    .to(parse_Chunks)
    .to(g_n_ration)
    .to(r_ponse)).onFalse(pas_de_chunk_pertinent))