// Deploy only files used by the offline shell, never the repository root.
import { readFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
const destination = resolve(process.argv[2] || '_site');
const source = readFileSync('sw.js', 'utf8');
const paths = new Set(['sw.js', ...Array.from(source.matchAll(/["']\.\/([^"']+)["']/g), match => match[1])]);
for (const path of paths) {
  if (!/^(?:index\.html|sw\.js|manifest(?:-dark)?\.webmanifest|assets\/(?:js|css|icons)\/[a-zA-Z0-9_./-]+)$/.test(path) || path.split('/').includes('..')) throw new Error('Unexpected shell path: ' + path);
  const output = resolve(destination, path);
  mkdirSync(dirname(output), { recursive: true });
  copyFileSync(path, output);
}
console.log('Staged ' + paths.size + ' public runtime files.');
