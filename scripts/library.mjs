/**
 * Applies the admin overrides to the shipped exercise library.
 *
 *   1. Drop images in library/images, named after the exercise id
 *      (e.g. ex-legs-028.jpg). Any of .jpg .jpeg .png .webp.
 *   2. Edit, add or remove exercises in library/overrides.json.
 *   3. npm run library
 *   4. Commit and deploy — the library ships with the app, so the change
 *      reaches everyone on the next deploy.
 *
 * Safe to run repeatedly: it reads the committed library, applies the
 * overrides on top, and writes it back. It does not need the upstream dataset,
 * which is only used for re-importing.
 */
import {
  parseLibrary,
  readOverrides,
  applyOverrides,
  syncImages,
  writeLibrary,
  PUBLIC_IMAGES,
} from './lib/library.mjs';
import fs from 'node:fs';
import path from 'node:path';

const log = (m) => console.log('  ' + m);

const before = parseLibrary();
const overrides = readOverrides();
const after = applyOverrides([...before.map((e) => ({ ...e }))], overrides, { log });
const ownImages = syncImages(after, { log });
writeLibrary(after, ownImages);

const withImage = after.filter(
  (e) => ownImages[e.id] || fs.existsSync(path.join(PUBLIC_IMAGES, `${e.id}.webp`)),
);
const without = after.filter((e) => !withImage.includes(e));

console.log(
  `\n${after.length} exercises (${after.length - before.length >= 0 ? '+' : ''}${after.length - before.length}), ` +
    `${withImage.length} with an image, ${without.length} without.`,
);
if (without.length > 0) {
  console.log('\nStill without an image — drop a file in library/images named after the id:');
  for (const e of without) console.log(`  ${e.id.padEnd(16)} ${e.name}`);
}
