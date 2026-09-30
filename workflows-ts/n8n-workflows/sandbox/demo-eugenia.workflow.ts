const d_clencheur_Tous_les_jours_7h = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: { name: 'Déclencheur - Tous les jours à 7h', parameters: { rule: { interval: [{ triggerAtHour: 7 }] } } }
});

const r_cup_rer_la_m_t_o_de_Paris_API_Open_Meteo = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: { name: 'Récupérer la météo de Paris (API Open-Meteo)', parameters: { url: 'https://api.open-meteo.com/v1/forecast?latitude=48.8534&longitude=2.3488&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&hourly=temperature_2m&timezone=Europe%2FBerlin&forecast_days=1', options: {} }, position: [224, 0] }
});

const envoyer_la_m_t_o_par_mail = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: { name: 'Envoyer la météo par mail', parameters: { sendTo: 'TODO@exemple.com', subject: 'Météo du jour', emailType: 'text', message: expr('Bonjour Natalia ! \n\nAujourd\'hui à Paris : entre {{ $json.daily.temperature_2m_min[0] }}°C et {{ $json.daily.temperature_2m_max[0] }}°C. \nRisque de pluie : {{ $json.daily.precipitation_probability_max[0] }}% — {{ $json.daily.precipitation_probability_max[0] >= 50 ? "prends ton parapluie ☔" : "pas besoin de parapluie ☀️" }}\n\nCordialement,\nNMS'), options: { appendAttribution: false } }, credentials: { gmailOAuth2: newCredential('Gmail account', 'ID') }, position: [448, 0], webhookId: 'a4fd1974-163a-43ce-a2fe-3ed698c8a618' }
});

const wf = workflow('4XqEgF138sC4Ei8A', 'Demo Eugenia First Workflow', { executionOrder: 'v1', binaryMode: 'separate', availableInMCP: true });

export default wf
  .add(d_clencheur_Tous_les_jours_7h)
  .to(r_cup_rer_la_m_t_o_de_Paris_API_Open_Meteo)
  .to(envoyer_la_m_t_o_par_mail)