/**
 * The bits both library scripts need: reading the committed library back,
 * applying the admin overrides, and writing the generated files.
 *
 * The committed library is the source of truth. The upstream dataset is only
 * needed to re-import, which is why the admin tool does not ask for it.
 */
import fs from 'node:fs';
import path from 'node:path';

export const BODY_PARTS = [
  'chest', 'back', 'shoulders', 'arms', 'forearms',
  'core', 'legs', 'calves', 'neck', 'cardio',
];

export const ROOT = process.cwd();
export const LIBRARY_TS = path.join(ROOT, 'src/data/defaultExercises.ts');
export const IMAGES_TS = path.join(ROOT, 'src/data/exerciseImages.ts');
export const PUBLIC_IMAGES = path.join(ROOT, 'public/exercise-images');
export const DROP_DIR = path.join(ROOT, 'library/images');
export const OVERRIDES = path.join(ROOT, 'library/overrides.json');

const ALLOWED_IMAGE = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/** "Farmer\'s Walk" — a name is not simply everything up to the next quote. */
const QUOTED = /\bname: (?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/;
const unquote = (s) => s.replace(/\\(.)/g, '$1');

/** Reads the generated library back, so it can be edited in place. */
export function parseLibrary(source = fs.readFileSync(LIBRARY_TS, 'utf8')) {
  const rows = [];
  for (const line of source.split('\n')) {
    const id = line.match(/\bid: '([^']+)'/)?.[1];
    const name = line.match(QUOTED);
    const bodyPart = line.match(/\bbodyPart: '(\w+)'/)?.[1];
    if (!id || !name || !bodyPart) continue;
    rows.push({ id, name: unquote(name[1] ?? name[2]), bodyPart });
  }
  if (rows.length === 0) throw new Error(`Parsed no exercises from ${LIBRARY_TS}`);
  return rows;
}

export function readOverrides() {
  if (!fs.existsSync(OVERRIDES)) return { edit: {}, add: [], remove: [] };
  const raw = JSON.parse(fs.readFileSync(OVERRIDES, 'utf8'));
  return { edit: raw.edit ?? {}, add: raw.add ?? [], remove: raw.remove ?? [] };
}

/**
 * Edits, additions and removals, applied in that order so an override can
 * rename something and then a later removal still finds it by id.
 *
 * Everything is checked against the library rather than trusted: a typo in an
 * id would otherwise be a silent no-op, and the admin would be left wondering
 * why their change never appeared.
 */
export function applyOverrides(exercises, overrides, { log = () => {} } = {}) {
  const byId = new Map(exercises.map((e) => [e.id, e]));

  for (const [id, change] of Object.entries(overrides.edit)) {
    const target = byId.get(id);
    if (!target) throw new Error(`overrides.edit: no exercise with id "${id}"`);
    if (change.bodyPart && !BODY_PARTS.includes(change.bodyPart)) {
      throw new Error(`overrides.edit["${id}"]: "${change.bodyPart}" is not a body part`);
    }
    if (change.name) target.name = change.name;
    if (change.bodyPart) target.bodyPart = change.bodyPart;
    log(`edited   ${id} -> ${target.name} [${target.bodyPart}]`);
  }

  for (const entry of overrides.add) {
    if (!entry.id || !entry.name || !entry.bodyPart) {
      throw new Error(`overrides.add: each entry needs id, name and bodyPart — got ${JSON.stringify(entry)}`);
    }
    if (byId.has(entry.id)) throw new Error(`overrides.add: "${entry.id}" is already in the library`);
    if (!BODY_PARTS.includes(entry.bodyPart)) {
      throw new Error(`overrides.add["${entry.id}"]: "${entry.bodyPart}" is not a body part`);
    }
    const added = { id: entry.id, name: entry.name, bodyPart: entry.bodyPart };
    exercises.push(added);
    byId.set(added.id, added);
    log(`added    ${added.id} -> ${added.name} [${added.bodyPart}]`);
  }

  const removing = new Set(overrides.remove);
  for (const id of removing) {
    if (!byId.has(id)) throw new Error(`overrides.remove: no exercise with id "${id}"`);
    log(`removed  ${id}`);
  }
  return exercises.filter((e) => !removing.has(e.id));
}

/**
 * Copies anything dropped in library/images over whatever the exercise had,
 * and drops images belonging to exercises that no longer exist.
 *
 * Returns id -> filename for everything outside the ex-gv range, which is what
 * the app needs to find one.
 */
export function syncImages(exercises, { log = () => {} } = {}) {
  const ids = new Set(exercises.map((e) => e.id));
  fs.mkdirSync(PUBLIC_IMAGES, { recursive: true });

  if (fs.existsSync(DROP_DIR)) {
    for (const file of fs.readdirSync(DROP_DIR)) {
      if (file.startsWith('.')) continue;
      const ext = path.extname(file).toLowerCase();
      const id = path.basename(file, path.extname(file));
      if (!ALLOWED_IMAGE.has(ext)) {
        throw new Error(`library/images/${file}: ${ext} is not one of ${[...ALLOWED_IMAGE].join(', ')}`);
      }
      if (!ids.has(id)) {
        throw new Error(`library/images/${file}: no exercise has the id "${id}"`);
      }
      // Only one image per exercise, whatever it was before.
      for (const stale of fs.readdirSync(PUBLIC_IMAGES)) {
        if (path.basename(stale, path.extname(stale)) === id) {
          fs.rmSync(path.join(PUBLIC_IMAGES, stale));
        }
      }
      fs.copyFileSync(path.join(DROP_DIR, file), path.join(PUBLIC_IMAGES, `${id}${ext}`));
      log(`image    ${id}${ext}`);
    }
  }

  const own = {};
  for (const file of fs.readdirSync(PUBLIC_IMAGES)) {
    const id = path.basename(file, path.extname(file));
    if (!ids.has(id)) {
      fs.rmSync(path.join(PUBLIC_IMAGES, file));
      log(`dropped  ${file} (no such exercise)`);
      continue;
    }
    if (!id.startsWith('ex-gv-') || path.extname(file) !== '.jpg') own[id] = file;
  }
  return own;
}

const line = (e) =>
  `  { id: '${e.id}', name: ${JSON.stringify(e.name)}, bodyPart: '${e.bodyPart}', isCustom: false },`;

export function writeLibrary(exercises, ownImages, { imported = 0 } = {}) {
  // The app finds an ex-gv- picture by convention rather than a lookup table,
  // so that convention has to actually hold.
  const missing = exercises.filter(
    (e) =>
      e.id.startsWith('ex-gv-') &&
      !ownImages[e.id] &&
      !fs.existsSync(path.join(PUBLIC_IMAGES, `${e.id}.jpg`)),
  );
  if (missing.length > 0) {
    throw new Error(
      `These imported exercises have no image, which the app assumes they do: ${missing
        .slice(0, 5)
        .map((e) => e.id)
        .join(', ')}. Remove the exercise or restore the image.`,
    );
  }

  fs.writeFileSync(
    LIBRARY_TS,
    `import type { Exercise } from '../types';

// Generated — run \`npm run library\` rather than editing this by hand.
//
// The ${imported || exercises.filter((e) => e.id.startsWith('ex-gv-')).length} entries prefixed ex-gv- come from the MIT-licensed exercise data
// in hasaneyldrm/exercises-dataset. Its images and GIFs are Gym visual's and
// are deliberately not used here.
export const defaultExercises: Exercise[] = [
${exercises.map(line).join('\n')}
];
`,
  );

  const entries = Object.entries(ownImages).sort(([a], [b]) => a.localeCompare(b));
  fs.writeFileSync(
    IMAGES_TS,
    `// Generated — run \`npm run library\` rather than editing this by hand.
//
// Exercise images from the upstream dataset are © Gym visual
// (https://gymvisual.com/) and are not covered by this project's licence.

/**
 * Pictures the app can't find by convention: everything outside the ex-gv-
 * range, plus any ex-gv- exercise whose image was replaced with another format.
 */
export const OWN_EXERCISE_IMAGES: Readonly<Record<string, string>> = {
${entries.map(([id, file]) => `  '${id}': '${file}',`).join('\n')}
};
`,
  );
}

/**
 * Exercises claiming a picture that isn't on disk. A stale entry ships a URL
 * that 404s, and nothing at runtime notices.
 */
export function missingImageFiles(exercises, ownImages) {
  const gaps = [];
  for (const exercise of exercises) {
    const named = ownImages[exercise.id];
    if (named) {
      if (!fs.existsSync(path.join(PUBLIC_IMAGES, named))) gaps.push(exercise.id);
      continue;
    }
    // Imported ones are resolved by convention rather than by lookup.
    if (exercise.id.startsWith('ex-gv-') && !fs.existsSync(path.join(PUBLIC_IMAGES, `${exercise.id}.jpg`))) {
      gaps.push(exercise.id);
    }
  }
  return gaps;
}
