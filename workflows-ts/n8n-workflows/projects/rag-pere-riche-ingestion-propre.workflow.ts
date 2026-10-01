const formulaire_PDF = trigger({
  type: 'n8n-nodes-base.formTrigger',
  version: 2.6,
  config: { name: 'Formulaire PDF', parameters: { formTitle: 'Ajouter un livre', formDescription: 'Dépose un PDF avec du texte (pas un scan).', formFields: { values: [{ fieldLabel: 'data', fieldType: 'file', multipleFiles: false, acceptFileTypes: '.pdf', requiredField: true }] }, options: {} }, position: [-200, 300], webhookId: 'rag-pere-riche-ingestion' }
});

const extraire_le_texte_du_PDF = node({
  type: 'n8n-nodes-base.extractFromFile',
  version: 1.1,
  config: { name: 'Extraire le texte du PDF', parameters: { operation: 'pdf', options: {} }, position: [60, 300] }
});

const nettoyer_le_texte = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: { name: 'Nettoyer le texte', parameters: { assignments: { assignments: [{ id: 'a0', name: 'texte_propre', value: expr('{{ ($json.text || \'\').replace(/\\r/g,\'\').replace(/(\\w)-\\n(\\w)/g,\'$1$2\').replace(/[ \\t]+/g,\' \').replace(/^\\s*\\d+\\s*$/gm,\'\').replace(/\\n{3,}/g,\'\\n\\n\').trim() }}'), type: 'string' }, { id: 'a1', name: 'nom_fichier', value: expr('{{ $(\'Formulaire PDF\').item.binary.data.fileName }}'), type: 'string' }, { id: 'a2', name: 'pages', value: expr('{{ $json.numpages }}'), type: 'number' }] }, options: {} }, position: [320, 300] }
});

const texte_exploitable = node({
  type: 'n8n-nodes-base.if',
  version: 2.3,
  config: { name: 'Texte exploitable ?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ id: 'c1', leftValue: expr('{{ $json.texte_propre.length }}'), rightValue: 500, operator: { type: 'number', operation: 'gt' } }], combinator: 'and' } }, position: [580, 300] }
});

const d_couper_en_morceaux = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Découper en morceaux', parameters: { jsCode: '// Découpe le texte nettoyé en morceaux de ~1000 caractères, avec 150 caractères de chevauchement\nconst TAILLE = 1000;\nconst CHEVAUCHEMENT = 150;\nconst { texte_propre, nom_fichier } = $input.first().json;\n\nconst paragraphes = texte_propre.split(/\\n{2,}/).map(p => p.trim()).filter(Boolean);\nconst morceaux = [];\nlet courant = \'\';\nfor (const p of paragraphes) {\n  if (courant && (courant + \'\\n\\n\' + p).length <= TAILLE) { courant += \'\\n\\n\' + p; continue; }\n  if (courant) morceaux.push(courant);\n  if (p.length > TAILLE) {\n    for (let i = 0; i < p.length; i += TAILLE - CHEVAUCHEMENT) morceaux.push(p.slice(i, i + TAILLE));\n    courant = \'\';\n  } else {\n    courant = p;\n  }\n}\nif (courant) morceaux.push(courant);\n\nconst final = morceaux.map((m, i) => (i === 0 ? m : morceaux[i - 1].slice(-CHEVAUCHEMENT) + \' \' + m));\nreturn final.map((contenu, i) => ({ json: { contenu, nom_fichier, index: i, total: final.length } }));' }, position: [840, 300] }
});

const garder_les_morceaux_utiles = node({
  type: 'n8n-nodes-base.filter',
  version: 2.3,
  config: { name: 'Garder les morceaux utiles', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ id: 'c2', leftValue: expr('{{ $json.contenu.length }}'), rightValue: 50, operator: { type: 'number', operation: 'gt' } }], combinator: 'and' } }, position: [1100, 300] }
});

const supprimer_les_doublons = node({
  type: 'n8n-nodes-base.removeDuplicates',
  version: 2,
  config: { name: 'Supprimer les doublons', parameters: { compare: 'selectedFields', fieldsToCompare: 'contenu', options: {} }, position: [1360, 300] }
});

const embedding_Gemini = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: { name: 'Embedding Gemini', parameters: { method: 'POST', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent', authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', sendBody: true, specifyBody: 'json', jsonBody: expr('{{ { model: \'models/gemini-embedding-001\', content: { parts: [{ text: $json.contenu }] }, taskType: \'RETRIEVAL_DOCUMENT\' } }}'), options: { batching: { batch: { batchSize: 5, batchInterval: 1000 } } } }, position: [1620, 300] }
});

const vecteur_valide = node({
  type: 'n8n-nodes-base.if',
  version: 2.3,
  config: { name: 'Vecteur valide ?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ id: 'c3', leftValue: expr('{{ $json.embedding.values.length }}'), rightValue: 3072, operator: { type: 'number', operation: 'equals' } }], combinator: 'and' } }, position: [1880, 300] }
});

const pr_parer_la_ligne = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: { name: 'Préparer la ligne', parameters: { assignments: { assignments: [{ id: 'a0', name: 'content', value: expr('{{ $(\'Supprimer les doublons\').item.json.contenu }}'), type: 'string' }, { id: 'a1', name: 'metadata', value: expr('{{ { source: $(\'Supprimer les doublons\').item.json.nom_fichier, chunk_index: $(\'Supprimer les doublons\').item.json.index, chunk_total: $(\'Supprimer les doublons\').item.json.total, ingested_at: $now.toISO() } }}'), type: 'object' }, { id: 'a2', name: 'embedding', value: expr('{{ \'[\' + $json.embedding.values.join(\',\') + \']\' }}'), type: 'string' }] }, options: {} }, position: [2140, 300] }
});

const ins_rer_dans_Supabase = node({
  type: 'n8n-nodes-base.supabase',
  version: 1,
  config: { name: 'Insérer dans Supabase', parameters: { tableId: 'documents', dataToSend: 'autoMapInputData' }, position: [2400, 300] }
});

const erreur_mauvaise_dimension = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: { name: 'Erreur : mauvaise dimension', parameters: { errorMessage: 'Le vecteur ne fait pas 3072 dimensions : le modèle d\'embedding ne correspond pas à la table Supabase vector(3072).' }, position: [1880, 520] }
});

const erreur_PDF_vide_ou_scann = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: { name: 'Erreur : PDF vide ou scanné', parameters: { errorMessage: 'Moins de 500 caractères extraits : le PDF est vide ou scanné (image). Utilise un PDF avec du texte.' }, position: [580, 520] }
});

const wf = workflow('', 'RAG Père riche père pauvre - Ingestion propre', { executionOrder: 'v1' });

export default wf
  .add(formulaire_PDF)
  .to(extraire_le_texte_du_PDF)
  .to(nettoyer_le_texte)
  .to(texte_exploitable.onTrue(d_couper_en_morceaux
    .to(garder_les_morceaux_utiles)
    .to(supprimer_les_doublons)
    .to(embedding_Gemini)
    .to(vecteur_valide.onTrue(pr_parer_la_ligne
      .to(ins_rer_dans_Supabase)).onFalse(erreur_mauvaise_dimension))).onFalse(erreur_PDF_vide_ou_scann))