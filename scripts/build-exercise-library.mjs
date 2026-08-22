/**
 * Regenerates src/data/defaultExercises.ts.
 *
 * The bulk of the library comes from hasaneyldrm/exercises-dataset, whose
 * exercise DATA is MIT licensed. Only the data is used here — the repository's
 * images and GIFs belong to Gym visual and are not ours to ship.
 *
 *   node scripts/build-exercise-library.mjs <path-to>/data/exercises.json
 *
 * The generated file is the source of truth; this script exists so the mapping
 * can be re-run and argued with rather than hand-audited once.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  readOverrides, applyOverrides, syncImages, writeLibrary, PUBLIC_IMAGES,
} from './lib/library.mjs';

const OUT = path.join(process.cwd(), 'src/data/defaultExercises.ts');
const CURRENT = fs.readFileSync(OUT, 'utf8');

/** The dataset's `target` is the only field that lines up with our categories. */
const TARGET_TO_CATEGORY = {
  pectorals: 'push', delts: 'push', triceps: 'push', 'serratus anterior': 'push',
  biceps: 'pull', 'upper back': 'pull', lats: 'pull', traps: 'pull',
  forearms: 'pull', 'levator scapulae': 'pull',
  glutes: 'legs', quads: 'legs', hamstrings: 'legs', calves: 'legs',
  adductors: 'legs', abductors: 'legs',
  abs: 'core', spine: 'core',
  'cardiovascular system': 'cardio',
};

const BODY_PART_FROM_DATASET = {
  chest: 'chest', back: 'back', shoulders: 'shoulders', 'upper arms': 'arms',
  'lower arms': 'forearms', waist: 'core', 'upper legs': 'legs',
  'lower legs': 'calves', neck: 'neck', cardio: 'cardio',
};

/** First match wins, so the specific cases have to come before the loose ones. */
const BODY_PART_RULES = [
  [/wrist/, 'forearms'],
  [/calf|calves/, 'calves'],
  [/treadmill|rowing machine|stationary bike|elliptical|stair climber|jump rope|battle ropes|box jump|burpee|kettlebell swing|assault bike|sled/, 'cardio'],
  // Before the generic curl/bench rules below, which would otherwise claim
  // these for arms and chest respectively.
  [/leg curl|hamstring curl/, 'legs'],
  [/close-grip/, 'arms'],
  [/back extension|reverse hyper|superman/, 'back'],
  [/row|pull-up|chin-up|pulldown|pullover|shrug|rack pull/, 'back'],
  [/reverse pec deck|face pull/, 'shoulders'],
  [/overhead press|shoulder press|lateral raise|front raise|arnold|pike push-up|landmine press/, 'shoulders'],
  [/bench press|fly|pec deck|chest press|push-up|dip/, 'chest'],
  [/curl|tricep|skull crusher|close-grip/, 'arms'],
  [/squat|deadlift|lunge|leg press|leg extension|hip thrust|glute|step-up|good morning|pull-through|hamstring|adductor|abductor|sissy/, 'legs'],
  [/plank|crunch|sit-up|leg raise|knee raise|russian twist|ab wheel|v-up|toe touch|pallof|woodchop|dragon flag|l-sit|flutter|hollow|bird dog|dead bug|mountain climber/, 'core'],
];

const CATEGORY_FALLBACK = { push: 'chest', pull: 'back', legs: 'legs', core: 'core', cardio: 'cardio' };

function bodyPartFor(name, category) {
  const lower = name.toLowerCase();
  for (const [re, part] of BODY_PART_RULES) if (re.test(lower)) return part;
  return CATEGORY_FALLBACK[category];
}

const KEEP_CASE = {
  ez: 'EZ', tbar: 'T-Bar', iii: 'III', ii: 'II', iv: 'IV', v: 'V', l: 'L',
  rdl: 'RDL', ghd: 'GHD', bosu: 'BOSU',
};

function titleCase(name) {
  return name
    .split(' ')
    .map((word) => {
      const bare = word.replace(/[^a-z]/gi, '').toLowerCase();
      if (KEEP_CASE[bare]) return word.replace(/[a-z]+/i, KEEP_CASE[bare]);
      // Hyphenated words get each side capitalised: "close-grip" -> "Close-Grip".
      return word.replace(/(^|[-/])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
    })
    .join(' ');
}

/** "Farmer\'s Walk" — a name is not simply everything up to the next quote. */
const QUOTED = /\bname: (?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/;
const unescape = (s) => s.replace(/\\(.)/g, '$1');

/**
 * The library's own entries — the ones predating the import — keep their ids,
 * because saved workouts reference them and renumbering would orphan every
 * logged set. Read from whichever shape the file is currently in, so this can
 * be run again over its own output; the imported rows are left out and rebuilt
 * from source.
 */
const existing = [];
for (const raw of CURRENT.split('\n')) {
  const id = raw.match(/\bid: '([^']+)'/)?.[1];
  const name = raw.match(QUOTED);
  if (!id || !name || id.startsWith('ex-gv-')) continue;
  const label = unescape(name[1] ?? name[2]);
  const bodyPart =
    raw.match(/\bbodyPart: '(\w+)'/)?.[1] ??
    bodyPartFor(label, raw.match(/\bcategory: '(\w+)'/)?.[1]);
  existing.push({ id, name: label, bodyPart });
}
if (existing.length === 0) throw new Error('Parsed no existing exercises — check the regexes.');

const seen = new Set(existing.map((e) => e.name.toLowerCase()));
const byName = new Map(existing.map((e) => [e.name.toLowerCase(), e]));

const SOURCE_JSON = process.argv[2];
const SOURCE_ROOT = path.resolve(path.dirname(SOURCE_JSON), '..');
const IMAGE_DIR = PUBLIC_IMAGES;

/** our exercise id -> the source image to copy in for it */
const media = new Map();

const source = JSON.parse(fs.readFileSync(SOURCE_JSON, 'utf8'));
const added = [];
for (const row of source) {
  // A handful of source rows carry a "(male)"/"(female)" suffix. The movement
  // is the same either way, so it is noise in a picker; dedupe absorbs the
  // few that collide once it is gone.
  const name = titleCase(row.name.replace(/\s*\((male|female)\)\s*$/i, '').trim());
  if (seen.has(name.toLowerCase())) {
    // Dropped as a duplicate, but its picture still belongs to whichever of
    // ours shares the name — otherwise the best-known exercises are the ones
    // without one.
    const twin = byName.get(name.toLowerCase());
    if (twin && !media.has(twin.id)) media.set(twin.id, row.image);
    continue;
  }
  const category = TARGET_TO_CATEGORY[row.target];
  const bodyPart = BODY_PART_FROM_DATASET[row.body_part];
  if (!category || !bodyPart) {
    throw new Error(`Unmapped record ${row.id}: target=${row.target} body_part=${row.body_part}`);
  }
  seen.add(name.toLowerCase());
  const id = `ex-gv-${row.id}`;
  media.set(id, row.image);
  added.push({ id, name, category, bodyPart });
}

/**
 * Our own names are the short, everyday ones — "Bench Press" — while the
 * source spells out equipment. Anything whose words are a superset is the same
 * movement, so it can lend its picture: fewest extra words wins, and among
 * those the most ordinary bit of kit, or "Bench Press" ends up illustrated
 * with a resistance band.
 */
const EQUIPMENT_PREFERENCE = [
  'barbell', 'body weight', 'dumbbell', 'cable', 'leverage machine',
  'smith machine', 'ez barbell', 'kettlebell', 'weighted', 'band',
];

/**
 * Named outright where the two vocabularies don't overlap enough for the word
 * matching below to find each other — the source calls a machine a lever, and
 * spells a rollout "rollerout".
 *
 * Only movements that genuinely are the same. Where the source simply has no
 * equivalent — a sled push, a stair climber, a pec deck — the exercise keeps no
 * picture, because a wrong one is worse than none.
 */
const ALIASES = {
  "farmer's walk": 'farmers walk',
  'battle ropes': 'battling ropes',
  'machine shoulder press': 'lever shoulder press v. 3',
  'machine row': 'lever high row',
  'ab wheel rollout': 'wheel rollerout',
  'single-leg leg press': 'lever horizontal one leg press',
  'flutter kick': 'flutter kicks',
  'smith machine squat': 'smith squat',
  // A chest-supported row is a row done lying on an incline bench.
  'chest-supported row': 'dumbbell incline row',
  // Both are rear-delt flyes; only the machine differs.
  'reverse pec deck': 'band reverse fly',
  'glute kickback machine': 'cable kickback',
};

// Apostrophes split "farmer's" into two words and lose the match.
const words = (s) => new Set(s.toLowerCase().replace(/'/g, '').match(/[a-z]+/g) ?? []);
const isSubset = (a, b) => [...a].every((w) => b.has(w));

/** Field by field: `<` on arrays compares them as strings and misorders 10 vs 2. */
function isBetter(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] < b[i];
  }
  return false;
}

const sourceWords = source.map((row) => ({ row, words: words(row.name) }));

const bare = (n) => n.toLowerCase().replace(/\s*\((male|female)\)\s*$/i, '').trim();
const sourceByName = new Map(source.map((row) => [bare(row.name), row]));
for (const [ours, theirs] of Object.entries(ALIASES)) {
  const row = sourceByName.get(theirs);
  if (!row) throw new Error(`Alias target missing from the source data: "${theirs}"`);
  const mine = existing.find((e) => e.name.toLowerCase() === ours);
  if (!mine) throw new Error(`Alias source missing from our library: "${ours}"`);
  media.set(mine.id, row.image);
}

for (const exercise of existing) {
  if (media.has(exercise.id)) continue;
  const mine = words(exercise.name);
  if (mine.size === 0) continue;

  let best = null;
  for (const { row, words: theirs } of sourceWords) {
    if (!isSubset(mine, theirs)) continue;
    const rank = [
      theirs.size - mine.size,
      EQUIPMENT_PREFERENCE.indexOf(row.equipment) === -1
        ? EQUIPMENT_PREFERENCE.length
        : EQUIPMENT_PREFERENCE.indexOf(row.equipment),
      row.name.length,
    ];
    if (!best || isBetter(rank, best.rank)) best = { rank, row };
  }
  if (best) media.set(exercise.id, best.row.image);
}

// Named by our own exercise id, so the app needs no lookup table to find one.
fs.rmSync(IMAGE_DIR, { recursive: true, force: true });
fs.mkdirSync(IMAGE_DIR, { recursive: true });
for (const [id, relative] of media) {
  fs.copyFileSync(path.join(SOURCE_ROOT, relative), path.join(IMAGE_DIR, `${id}.jpg`));
}

const all = [...existing, ...added];

// Re-importing must not undo what an admin has changed since, so the overrides
// land on top exactly as they do when the admin tool runs on its own.
const final = applyOverrides(all, readOverrides(), { log: (m) => console.log('  ' + m) });
const ownImages = syncImages(final, { log: (m) => console.log('  ' + m) });
writeLibrary(final, ownImages, { imported: added.length });

const tally = (key) =>
  Object.entries(final.reduce((a, e) => ({ ...a, [e[key]]: (a[e[key]] ?? 0) + 1 }), {}))
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${v}`)
    .join(', ');

console.log(`kept ${existing.length}, added ${added.length}, total ${final.length}`);
console.log('bodyPart:', tally('bodyPart'));
