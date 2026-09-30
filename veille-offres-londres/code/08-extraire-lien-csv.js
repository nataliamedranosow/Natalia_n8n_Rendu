// Retrouve le lien du dernier CSV dans la réponse de l'API contenu GOV.UK
const brut = JSON.stringify($input.first().json);
const liens = brut.match(/https:\/\/assets\.publishing\.service\.gov\.uk[^"\s\\]+\.csv/g);
if (!liens || !liens.length) throw new Error('Lien CSV du registre introuvable : arrêt.');
return [{ json: { url: liens[0] } }];
