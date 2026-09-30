// Règle C5 (nœud 10) : rapprochement des noms d'entreprise avec un faux registre.
const { chargerNoeud, verifier, bilan } = require('./helpers');
const code = chargerNoeud('10-appliquer-sponsors.js');

const vrais = ['FDM Group (Holdings) PLC', 'Barclays Bank PLC', 'Deloitte LLP', 'Morgan Stanley & Co. International plc', 'Smith & Williamson LLP', 'Capital One (Europe) plc'];
const lignes = ['Organisation Name,Town/City,County,Type & Rating,Route'];
for (const n of vrais) lignes.push(`"${n}",London,,Worker (A rating),Skilled Worker`);
lignes.push('Mauvaise Note Ltd,London,,Worker (B rating),Skilled Worker');
lignes.push('Autre Route Ltd,London,,Worker (A rating),Creative Worker');
for (let i = 0; i < 3000; i++) lignes.push(`Entreprise Remplissage ${i} Ltd,Leeds,,Worker (A rating),Skilled Worker`);
const csv = lignes.join('\n');

const attendus = [
  ['FDM Group', true], ['Barclays Bank UK PLC', true], ['Deloitte', true], ['Morgan Stanley', true],
  ['Smith and Williamson', true], ['Capital One', true], ['Barclays Bank Ltd', true],
  ['Morgan Sindall', false], ['Entreprise Inconnue Ltd', false], ['Mauvaise Note', false], ['Autre Route', false],
];
const offres = attendus.map(([e], i) => ({ json: { id: 'o' + i, titre: 'Data Analyst', entreprise: e, regle_exclusion: '' } }));
const $ = n => { if (n.startsWith('06')) return { all: () => offres }; throw new Error('absent'); };
const sortie = new Function('$', '$input', code)($, { first: () => ({ json: { data: csv } }), all: () => [] });

attendus.forEach(([nom, sponsor], i) => {
  const o = sortie[i].json;
  verifier(`${nom} : ${sponsor ? 'sponsor reconnu' : 'non reconnu (C5)'}`, sponsor ? !o.regle_exclusion : o.regle_exclusion === 'C5');
});
bilan('Règle C5');
