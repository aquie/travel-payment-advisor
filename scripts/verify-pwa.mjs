import { access, readFile } from 'node:fs/promises';

const base = '/travel-payment-advisor/';
const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'));
const serviceWorker = await readFile('dist/sw.js', 'utf8');

if (manifest.start_url !== base || manifest.scope !== base || manifest.display !== 'standalone') {
  throw new Error('PWA manifest base path or install settings are invalid.');
}

for (const icon of manifest.icons ?? []) {
  await access(`dist/${icon.src}`);
}

for (const required of ['index.html', 'manifest.webmanifest', `${base}index.html`]) {
  if (!serviceWorker.includes(required)) {
    throw new Error(`Service worker is missing required offline path: ${required}`);
  }
}

console.log('PWA artifact contract verified.');
