// Une exécution = 4 intitulés. Chaque source fera donc 4 requêtes.
const titres = ['Data Analyst', 'Financial Data Analyst', 'AI Solutions Engineer', 'ML Engineer'];
return titres.map(t => ({ json: { title: t } }));
