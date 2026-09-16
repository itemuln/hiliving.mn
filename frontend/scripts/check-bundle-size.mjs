import { readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const dist = new URL('../dist/', import.meta.url);
const assets = new URL('assets/', dist);
const html = readFileSync(new URL('index.html', dist), 'utf8');

const entryJavaScript = requiredMatch(html, /<script[^>]+src="\/assets\/([^"?]+\.js)"/);
const entryCss = requiredMatch(html, /<link[^>]+href="\/assets\/([^"?]+\.css)"/);
const lazyJavaScript = readdirSync(assets).filter(
  (name) => name.endsWith('.js') && name !== entryJavaScript
);

const limits = [
  budget('initial JavaScript', entryJavaScript, 150),
  budget('initial CSS', entryCss, 25),
  largestLazyBudget(lazyJavaScript, 75),
];

for (const result of limits) {
  const status = result.bytes <= result.maximumBytes ? 'PASS' : 'FAIL';
  console.log(
    `${status} ${result.label}: ${toKib(result.bytes)} KiB / ${toKib(result.maximumBytes)} KiB gzip`
  );
}

if (limits.some((result) => result.bytes > result.maximumBytes)) {
  process.exitCode = 1;
}

function requiredMatch(value, pattern) {
  const match = value.match(pattern);
  if (!match) throw new Error(`Could not find build asset matching ${pattern}`);
  return match[1];
}

function budget(label, filename, maximumKib) {
  return {
    label,
    bytes: gzipSize(filename),
    maximumBytes: maximumKib * 1024,
  };
}

function largestLazyBudget(filenames, maximumKib) {
  if (filenames.length === 0) throw new Error('The build contains no lazy JavaScript chunks');
  const largest = filenames
    .map((filename) => ({ filename, bytes: gzipSize(filename) }))
    .sort((left, right) => right.bytes - left.bytes)[0];
  return {
    label: `largest lazy JavaScript (${largest.filename})`,
    bytes: largest.bytes,
    maximumBytes: maximumKib * 1024,
  };
}

function gzipSize(filename) {
  return gzipSync(readFileSync(new URL(filename, assets))).byteLength;
}

function toKib(bytes) {
  return (bytes / 1024).toFixed(1);
}
