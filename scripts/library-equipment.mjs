/**
 * Adds an `equipment` tag to every entry of the committed library.
 *
 *   node scripts/library-equipment.mjs <path-to>/data/exercises.json
 *
 * A lighter alternative to the full re-import: it touches nothing but that one
 * field, so images (which the importer deletes and recopies as JPEGs) and any
 * admin edits are left exactly as they are. Imported rows take the dataset's
 * own equipment value; the hand-written ones are named in lib/equipment.mjs.
 */
import fs from 'node:fs';
import { parseLibrary, syncImages, writeLibrary } from './lib/library.mjs';
import { equipmentFromDataset, equipmentForHandWritten } from './lib/equipment.mjs';

const SOURCE_JSON = process.argv[2];
if (!SOURCE_JSON) throw new Error('Usage: node scripts/library-equipment.mjs <path-to>/exercises.json');

const rows = new Map(JSON.parse(fs.readFileSync(SOURCE_JSON, 'utf8')).map((r) => [`ex-gv-${r.id}`, r]));
const exercises = parseLibrary().map((e) => ({ ...e }));

const unknown = [];
for (const e of exercises) {
  if (e.id.startsWith('ex-gv-')) {
    const row = rows.get(e.id);
    if (!row) throw new Error(`${e.id} is not in the dataset — it has changed upstream.`);
    e.equipment = equipmentFromDataset(row.equipment);
  } else {
    e.equipment = equipmentForHandWritten(e.name) ?? e.equipment;
    if (!e.equipment) unknown.push(`${e.id} ${e.name}`);
  }
}
if (unknown.length > 0) {
  throw new Error(`No equipment known for:\n  ${unknown.join('\n  ')}\nAdd them to scripts/lib/equipment.mjs.`);
}

const own = syncImages(exercises, { log: (m) => console.log('  ' + m) });
writeLibrary(exercises, own);

const counts = {};
for (const e of exercises) counts[e.equipment] = (counts[e.equipment] ?? 0) + 1;
console.log(counts);
