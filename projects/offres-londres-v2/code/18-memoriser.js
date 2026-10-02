// Après l'envoi réussi : retient les offres envoyées pour ne plus les renvoyer
const memoire = $getWorkflowStaticData('global');
memoire.vus = memoire.vus || {};
for (const id of $('16 Composer – E-mail').first().json.ids) memoire.vus[id] = Date.now();
return [{ json: { memorisees: $('16 Composer – E-mail').first().json.ids.length } }];
