// Local tests for the MDPH Certificate workflow: replays the Code node and the n8n expressions, with no network call and no credit used.
const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');
const raw = fs.readFileSync(process.argv[2] || path.join(__dirname, '..', 'MDPH Certificate.workflow.ts'), 'utf8');
const NOW = DateTime.fromISO('2026-10-22T09:00:00');
const unTs = s => s.replace(/\\\\/g, '\u0000').replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\u0000/g, '\\');
const between = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('missing ' + a); return s.slice(i + a.length, s.indexOf(b, i + a.length)); };
function render(t, ctx) {
  return t.replace(/\{\{([\s\S]*?)\}\}/g, (_, code) => {
    const v = new Function('$json', '$', 'DateTime', '$now', 'return (' + code + ');')(ctx.json, n => ({ item: { json: ctx.nodes[n] } }), DateTime, NOW);
    return typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v);
  });
}
const lines = raw.split('\n');
const lineOf = name => lines.find(l => l.includes(`name: '${name}'`));
const tpl = unTs(between(lineOf('Fill Cerfa PDF'), "jsonBody: expr('", "'), options"));
let jsCode = 'return { json: { output: $json.output, adresse: undefined, secu: undefined } };'; try { jsCode = unTs(between(lineOf('Validate AI Output') || '', "jsCode: '", "' }, position")); } catch (e) {}
const baseOut = JSON.parse(unTs(between(lines[1], "jsonSchemaExample: '", "}'") + '}'));
const patient = { id_patient: 'P001', nom: 'Dupont', prenom: 'Jean', date_naissance: '01/02/1960', adresse: '3 rue A', code_postal: '75001', ville: 'Paris', num_secu: '160027511200123', sexe: 'M' };
const form = { 'ID patient': 'P001', 'Date de consultation': '2026-10-22', Notes: "Gonarthrose bilatérale depuis 8 ans, en aggravation. Marche avec une canne à l'extérieur, périmètre de marche 200 m, besoin de pauses. Kiné 2 fois par semaine." };
function controle(p = {}, o = {}, notes = form.Notes) {
  const nodes = { 'Get Patient Record': { ...patient, ...p }, 'New Certificate Form': { ...form, Notes: notes } };
  return new Function('$json', '$', jsCode)({ output: { ...baseOut, ...o } }, n => ({ item: { json: nodes[n] } })).json;
}
function cerfa(p = {}, o = {}) {
  const c = controle(p, o);
  return { body: JSON.parse(render(tpl, { json: c, nodes: { 'Get Patient Record': { ...patient, ...p }, 'New Certificate Form': form } })), c };
}
const field = (b, n) => (b.fields.find(f => f.fieldName === n) || {}).text;
const ann = (b, id) => b.annotations.find(a => a.id === id);
const has = (c, txt) => c.output.a_verifier.some(a => a.includes(txt));
const res = []; let fails = 0;
function check(id, desc, expected, fn) {
  let actual; try { actual = fn(); } catch (e) { actual = 'THROW:' + e.constructor.name + ':' + e.message.slice(0, 60); }
  const ok = JSON.stringify(actual) === JSON.stringify(expected); if (!ok) fails++;
  res.push(`${id} ${ok ? 'TRUE ' : 'FALSE'} | ${desc}${ok ? '' : `\n     expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`}`);
}
// ---- predictions written before running ----
check('N1', 'happy path: SS box1, address, a_verifier = example point only', ['1', '3 rue A, 75001 Paris', 1],
  () => { const { body, c } = cerfa(); return [field(body, 'N° immatriculation SS 1'), field(body, 'Adresse'), c.output.a_verifier.length]; });
check('N2', 'address missing -> empty field + alert', ['', true], () => { const { body, c } = cerfa({ adresse: undefined, code_postal: undefined, ville: undefined }); return [field(body, 'Adresse'), has(c, 'adresse incomplète')]; });
check('N2b', 'only street missing -> "75001 Paris" + alert', ['75001 Paris', true], () => { const { body, c } = cerfa({ adresse: '' }); return [field(body, 'Adresse'), has(c, 'adresse incomplète')]; });
check('N3', 'SS missing -> box empty + alert', ['', true], () => { const { body, c } = cerfa({ num_secu: undefined }); return [field(body, 'N° immatriculation SS 1'), has(c, 'absent')]; });
check('N4', 'SS with spaces -> box2 = "6" (no shift)', '6', () => field(cerfa({ num_secu: '1 60 02 75 112 001 23' }).body, 'N° immatriculation SS 2'));
check('N4b', 'SS scientific "1.60028E+14" -> boxes empty + alert', ['', true], () => { const { body, c } = cerfa({ num_secu: '1.60028E+14' }); return [field(body, 'N° immatriculation SS 2'), has(c, 'illisible')]; });
check('N4c', 'SS as a number -> box15 = "3"', '3', () => field(cerfa({ num_secu: 160027511200123 }).body, 'N° immatriculation SS 15'));
check('N4d', 'SS Corse 2A -> box7 = "A"', 'A', () => field(cerfa({ num_secu: '160022A11200123' }).body, 'N° immatriculation SS 7'));
check('N5', 'origine off-list -> no box drawn + alert', [false, true], () => { const { body, c } = cerfa({}, { origine: 'Accident de travail' }); return [!!ann(body, 'x_origine'), has(c, 'origine')]; });
check('N5a', 'origine "accident du travail" (case) -> X at (36,339)', ['X', 36, 339], () => { const a = ann(cerfa({}, { origine: 'accident du travail' }).body, 'x_origine'); return [a.text, a.x, a.y]; });
check('N5b', 'frequence "Régulier" -> no box drawn + alert', [false, true], () => { const { body, c } = cerfa({}, { frequence_signe_1: 'Régulier' }); return [!!ann(body, 'x_frequence_signe_1'), has(c, 'frequence_signe_1')]; });
check('N5c', 'grid "b" -> X at x=431', ['X', 431], () => { const a = ann(cerfa({}, { marcher: 'b' }).body, 'x_marcher'); return [a.text, a.x]; });
check('N5d', 'evolution "Evolutivite majeure" (no accent) -> X at (127,75)', ['X', 127, 75], () => { const a = ann(cerfa({}, { evolution: 'Evolutivite majeure' }).body, 'x_evolution'); return [a.text, a.x, a.y]; });
check('N9', 'checkbox missing -> "false"; "oui" -> "true"', ['false', 'true'], () => [field(cerfa({}, { kine: undefined }).body, 'Case à cocher P4 3'), field(cerfa({}, { kine: 'oui' }).body, 'Case à cocher P4 3')]);
check('N11', 'id with a double quote -> valid JSON, name kept', 'P"01_2026-10-22_MDPH.pdf', () => cerfa({ id_patient: 'P"01' }).body.name);
check('N16', 'no box drawn in a page corner (0,0) and every box is an X', [false, true], () => { const b = cerfa().body; return [b.annotations.some(a => a.x === 0 && a.y === 0), b.annotations.filter(a => a.id !== 'tel_medecin').every(a => a.text === 'X')]; });
check('N17', 'example answer -> 12 ticked boxes + doctor phone', 13, () => cerfa().body.annotations.length);
// ---- onset recomputed by the Code node (consultation on 2026-10-22) ----
const anc = (ia, notes) => controle({}, { date_apparition: ia }, notes).output.date_apparition;
check('N18', '"AVC survenu en 2023", model says "<1 year" -> "Depuis 1 à 5 ans"', 'Depuis 1 à 5 ans', () => anc('Depuis moins de 1 an', "Hémiplégie d'un AVC survenu en 2023."));
check('N19', '"il y a 3 ans", model says ">5 years" -> "Depuis 1 à 5 ans"', 'Depuis 1 à 5 ans', () => anc('Depuis plus de 5 ans', 'Accident du travail il y a 3 ans.'));
check('N20', '"depuis 8 ans", model says "1-5 years" -> "Depuis plus de 5 ans"', 'Depuis plus de 5 ans', () => anc('Depuis 1 à 5 ans', 'Gonarthrose depuis 8 ans.'));
check('N21', 'model left it empty + "stable depuis 2 ans" -> stays empty', '', () => anc('', 'Sclérose en plaques. État stable depuis 2 ans.'));
check('N22', 'conflicting durations ("depuis 8 ans", "en 2024") -> model value kept', 'Depuis plus de 5 ans', () => anc('Depuis plus de 5 ans', 'Diabète depuis 8 ans, opéré en 2024.'));
check('N23', '"depuis 18 mois", model says "<1 year" -> "Depuis 1 à 5 ans"; "à 3 ans" (an age) ignored', ['Depuis 1 à 5 ans', 'Depuis plus de 5 ans'], () => [anc('Depuis moins de 1 an', 'Douleurs depuis 18 mois.'), anc('Depuis plus de 5 ans', 'Autisme diagnostiqué à 3 ans.')]);
// ---- rule 9 enforced by the Code node ----
check('N24', 'courses "C" but a question about shopping -> courses emptied', '', () => controle({}, { courses: 'C', a_verifier: ['Courses : difficultés modérées ou graves ?'] }).output.courses);
check('N25', 'toilette "A" and a question about shopping only -> toilette keeps "A"', 'A', () => controle({}, { toilette: 'A', a_verifier: ['Courses : difficultés modérées ou graves ?'] }).output.toilette);
// ---- aids and therapies only ticked when the notes name them ----
check('N26', 'cane ticked by the model, notes never mention a cane -> unticked + warning', [false, true], () => { const c = controle({}, { appareil_canne: true }, 'Parkinson. Marche avec un déambulateur.').output; return [c.appareil_canne, c.a_verifier.some(a => a.includes('appareil_canne'))]; });
check('N27', 'cane ticked and the notes say "canne" -> stays ticked', true, () => controle({}, { appareil_canne: true }, 'Marche avec une canne.').output.appareil_canne);
check('N28', 'physio ticked and notes say "kinésithérapie" -> stays ticked', true, () => controle({}, { kine: true }, 'Séances de kinésithérapie.').output.kine);
check('N14', 'text field missing -> "" (not "undefined")', '', () => field(cerfa({}, { remarques: undefined }).body, 'Remarques ou observations complémentaires si besoin '));
// ---- Ajouter au suivi ----
const l85 = lineOf('Log to Tracking Sheet');
const ech = unTs(between(l85, "date_echeance: expr('", "'), lien_pdf"));
const av = unTs(between(l85, "a_verifier: expr('", "'), statut"));
const suivi = o => ({ nodes: { 'New Certificate Form': form, 'Validate AI Output': controle({}, o) }, json: {} });
check('N6', 'a_verifier absent -> ""', '', () => render(av, suivi({ a_verifier: undefined })));
check('N10', 'a_verifier string -> kept', 'Escaliers ?', () => render(av, suivi({ a_verifier: 'Escaliers ?' })));
check('N6b', 'a_verifier 7 points -> 5 kept', 5, () => render(av, suivi({ a_verifier: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] })).split(' ; ').length);
check('N7', 'date_echeance = "2027-10-22" exactly (no tab)', '2027-10-22', () => render(ech, suivi({})));
check('N7b', 'Ajouter au suivi writes RAW', true, () => l85.includes("cellFormat: 'RAW'"));
// ---- Reminder branch ----
const filt = unTs(between(lineOf('Due for Renewal'), "id: '1b2e6b78-13c7-41b5-a7b6-1124662fa843', leftValue: expr('", "'), rightValue"));
const prep = unTs(between(lineOf('Format Reminder Line'), "value: expr('", "'), type"));
const F = d => render(filt, { json: { date_echeance: d }, nodes: {} });
check('N8', 'filter: 2026-11-30 / 22/11/2026 / 2027-10-22 / 22/10/2027 / "abc" / ""', ['true', 'true', 'false', 'false', 'true', 'true'],
  () => ['2026-11-30', '22/11/2026', '2027-10-22', '22/10/2027', 'abc', ''].map(F));
check('N8b', 'line text for "22/11/2026" and "abc"', ["P001 : à renouveler avant le 22/11/2026 (<a href=\"L\">dernier certificat</a>)", "P001 : date d'échéance illisible (« abc »), à corriger dans le suivi (<a href=\"L\">dernier certificat</a>)"],
  () => ['22/11/2026', 'abc'].map(d => render(prep, { json: { id_patient: 'P001', date_echeance: d, lien_pdf: 'L' }, nodes: {} })));
// ---- Prompt ----
const prompt = unTs(between(lineOf('Sort Notes into Fields'), "text: expr('", "'), hasOutputParser"));
check('N12', 'age: "01/02/1960" / "1960-02-01" / "" ', ['66 years', '66 years', 'unknown'],
  () => ['01/02/1960', '1960-02-01', ''].map(d => (render(prompt, { json: { date_naissance: d }, nodes: { 'New Certificate Form': form } }).match(/Age: (.*)/) || [])[1]));
check('N13', 'rules 1..9 each exactly once, no birth date in prompt', [[1, 1, 1, 1, 1, 1, 1, 1, 1], false],
  () => [[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (prompt.match(new RegExp('\\n' + n + '\\. ', 'g')) || []).length), prompt.includes('Date de naissance')]);
check('N15', 'patient lookup returns first match only', true, () => lineOf('Get Patient Record').includes('returnFirstMatch: true'));
console.log(res.join('\n')); console.log(`\n${res.length - fails}/${res.length} TRUE`);
