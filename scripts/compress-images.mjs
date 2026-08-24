/**
 * Re-encodes the shipped exercise pictures as WebP.
 *
 * On these line drawings WebP lands around 40% under the JPEG for no visible
 * difference at the sizes the app shows (72px and below). Pictures uploaded
 * through the app are already encoded this way on the way in; this is for
 * anything that arrives as a file in the repo — a fresh import, or a
 * replacement dropped into library/images.
 *
 *   npm run library:compress            # convert every .jpg/.png in place
 *   npm run library:compress -- --check # report what would be saved, change nothing
 *
 * There is no image library in this project's dependencies, so the encoder is
 * a headless Chromium — the same one the browser tests use. Set CHROME to
 * point at a binary if it is somewhere unusual. Run `npm run library`
 * afterwards to regenerate the filename map.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { PUBLIC_IMAGES } from './lib/library.mjs';

const QUALITY = 0.86;
const PORT = 9333;
const SOURCE_EXT = new Set(['.jpg', '.jpeg', '.png']);

const CANDIDATES = [
  process.env.CHROME,
  '/opt/pw-browsers/chromium',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

function findBrowser() {
  for (const c of CANDIDATES) {
    try {
      fs.accessSync(c, fs.constants.X_OK);
      return c;
    } catch {
      /* keep looking */
    }
  }
  throw new Error(
    `No Chromium found. Tried:\n  ${CANDIDATES.join('\n  ')}\nSet CHROME to a browser binary.`,
  );
}

async function connect() {
  for (let i = 0; i < 60; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = targets.find((t) => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Chromium started but never exposed a devtools page.');
}

/** Encodes in the page, because that is where a WebP encoder exists. */
const ENCODER = `async (dataUrl, quality) => {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const x = c.getContext('2d');
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, c.width, c.height);
  x.drawImage(img, 0, 0);
  const out = c.toDataURL('image/webp', quality);
  return out.startsWith('data:image/webp') ? out.split(',')[1] : null;
}`;

const check = process.argv.includes('--check');
const files = fs
  .readdirSync(PUBLIC_IMAGES)
  .filter((f) => SOURCE_EXT.has(path.extname(f).toLowerCase()))
  .sort();

if (files.length === 0) {
  console.log('Nothing to compress — every picture is already WebP.');
  process.exit(0);
}

const browser = spawn(
  findBrowser(),
  ['--headless', '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${PORT}`, 'about:blank'],
  { stdio: 'ignore' },
);
process.on('exit', () => browser.kill());

const ws = new WebSocket(await connect());
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
};
const evaluate = (expression) =>
  new Promise((res) => {
    const n = ++id;
    pending.set(n, res);
    ws.send(
      JSON.stringify({
        id: n,
        method: 'Runtime.evaluate',
        params: { expression, awaitPromise: true, returnByValue: true },
      }),
    );
  }).then((r) => {
    if (r.result?.exceptionDetails) {
      throw new Error(r.result.exceptionDetails.exception?.description ?? 'encode failed');
    }
    return r.result?.result?.value;
  });

await evaluate(`window.__encode = ${ENCODER}; 'ready'`);

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
let before = 0;
let after = 0;
let converted = 0;
const failed = [];

for (const file of files) {
  const full = path.join(PUBLIC_IMAGES, file);
  const buf = fs.readFileSync(full);
  const ext = path.extname(file).toLowerCase();
  const dataUrl = `data:${MIME[ext]};base64,${buf.toString('base64')}`;

  const encoded = await evaluate(`window.__encode(${JSON.stringify(dataUrl)}, ${QUALITY})`);
  if (!encoded) {
    failed.push(file);
    continue;
  }
  const out = Buffer.from(encoded, 'base64');

  // A picture that gets bigger as WebP keeps the encoding it had.
  if (out.length >= buf.length) {
    before += buf.length;
    after += buf.length;
    continue;
  }

  before += buf.length;
  after += out.length;
  converted++;
  if (!check) {
    fs.writeFileSync(path.join(PUBLIC_IMAGES, `${path.basename(file, ext)}.webp`), out);
    fs.rmSync(full);
  }
  if (converted % 200 === 0) console.error(`  ${converted}/${files.length}`);
}

ws.close();
browser.kill();

const kb = (n) => `${Math.round(n / 1024)} kB`;
const saved = before > 0 ? Math.round((1 - after / before) * 100) : 0;
console.log(
  `${check ? 'Would convert' : 'Converted'} ${converted} of ${files.length}: ` +
    `${kb(before)} -> ${kb(after)} (${saved}% smaller)`,
);
if (failed.length > 0) {
  console.error(`Could not encode ${failed.length}, left as they were: ${failed.slice(0, 5).join(', ')}`);
}
if (!check && converted > 0) console.log('Run `npm run library` to update the filename map.');
