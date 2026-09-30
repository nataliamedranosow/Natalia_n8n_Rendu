const a1_D_clencher_Erreur = trigger({
  type: 'n8n-nodes-base.errorTrigger',
  version: 1,
  config: { name: 'A1 Déclencher – Erreur', position: [100, 0], notes: 'Se déclenche quand le workflow principal plante.' }
});

const a2_Alerter_E_mail = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: { name: 'A2 Alerter – E-mail', parameters: { resource: 'message', operation: 'send', sendTo: 'TODO@exemple.com', subject: expr('ALERTE : {{ $json.workflow.name }} en erreur'), emailType: 'text', message: expr('Nœud : {{ $json.execution.lastNodeExecuted }} / Erreur : {{ $json.execution.error.message }} / Exécution : {{ $json.execution.url }}'), options: { appendAttribution: false } }, credentials: { gmailOAuth2: newCredential('Gmail account', 'ID') }, position: [320, 0], webhookId: '3ea98aff-0914-4d2d-b5e5-3ea79f7f3e72', notes: 'TODO : credential Gmail et adresse destinataire.' }
});

const wf = workflow('9QMrch3iYIzwVMUj', 'Veille offres – Alerte', { binaryMode: 'separate', description: 'Alerte e-mail quand le workflow Veille offres Data & IA plante.', availableInMCP: true, executionOrder: 'v1', timezone: 'Europe/Paris' });

export default wf
  .add(a1_D_clencher_Erreur)
  .to(a2_Alerter_E_mail)