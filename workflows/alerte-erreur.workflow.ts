const a1_Declencher_Erreur = trigger({
  type: 'n8n-nodes-base.errorTrigger',
  version: 1,
  config: { name: 'A1 Déclencher – Erreur', position: [100, 0], notes: 'Se déclenche quand le workflow principal plante.', notesInFlow: false }
});

const a2_Alerter_Email = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: { name: 'A2 Alerter – E-mail', parameters: { resource: 'message', operation: 'send', sendTo: 'TODO@exemple.com', subject: expr('ALERTE : {{ $json.workflow.name }} en erreur'), emailType: 'text', message: expr('Nœud : {{ $json.execution.lastNodeExecuted }} / Erreur : {{ $json.execution.error.message }} / Exécution : {{ $json.execution.url }}'), options: { appendAttribution: false } }, position: [320, 0], notes: 'TODO : credential Gmail et adresse destinataire.', notesInFlow: false }
});

const wf = workflow('', 'Veille offres – Alerte', { binaryMode: 'separate', description: 'Alerte e-mail quand le workflow Veille offres Data & IA plante.', availableInMCP: false, executionOrder: 'v1', timezone: 'Europe/Paris' });

export default wf
  .add(a1_Declencher_Erreur)
  .to(a2_Alerter_Email)
