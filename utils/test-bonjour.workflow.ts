const manual_Trigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Trigger', position: [100, 0], notes: 'Cliquer sur Execute workflow pour lancer le test.', notesInFlow: true }
});

const set_Message = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: { name: 'Set Message', parameters: { assignments: { assignments: [{ id: 'set-message', name: 'message', value: 'Bonjour depuis n8ncli !', type: 'string' }, { id: 'set-date', name: 'date', value: expr('{{ $now.toFormat("dd/MM/yyyy HH:mm") }}'), type: 'string' }] }, includeOtherFields: false, options: {} }, position: [320, 0], notes: 'Cree un message et la date du jour.', notesInFlow: true }
});

const wf = workflow('ainzSWzhDsyIcQa5', 'Test Bonjour', { binaryMode: 'separate', description: 'Workflow de test simple : declencheur manuel puis message.', availableInMCP: true, executionOrder: 'v1' });

export default wf
  .add(manual_Trigger)
  .to(set_Message)