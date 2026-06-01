import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const currentRedirects = require('../new-website-worker/redirections.json');
const datoRoutes = require('./data/blah-data.json');

import { parse } from 'csv';
import { createReadStream } from 'fs';

// Existing redirects in JSON
const seen = {};
const dupes = currentRedirects
  .filter(({ key, value }) => {
    const isSeen = seen[key];
    if (!isSeen) {
      seen[key] = value;
    }
    return isSeen;
  })
  .map((thing) => thing.key);

const loopsArray = currentRedirects
  .map(({ value }) => value)
  .filter(value => seen[value]);
const loops = new Set(loopsArray);

// Redirects from Dato query
const blah = datoRoutes.data.allRoutes.reduce((acc, route) => {
  const updatedLocales = route._allUpdatedPathLocales
    .filter(({ value }) => value)
    .reduce((accc, { locale, value }) => ({ ...accc, [locale]: value }), {});

  const newEntries = route._allPathLocales
    .filter(({ locale }) => updatedLocales[locale])
    .reduce((accc, { locale, value: path }) => {
      const updatedPath = updatedLocales[locale];

      const [, region, language, ...rest] = path.split('/');
      const standardishRegion = region === 'uk' ? 'gb' : region;
      const urlRegion =
        language !== 'en' || ['uk', 'us', 'ww'].includes(region)
          ? standardishRegion
          : `${standardishRegion}-en`;
      const convertedPath = ['', urlRegion, ...rest].join('/');

      return [
        ...accc,
        { key: path, value: updatedPath },
        { key: convertedPath, value: updatedPath },
      ];
    }, []);
  return [...acc, ...newEntries];
}, []);

const missing = blah
  .filter((thing) => !seen[thing.key])
  .sort((a, b) => a.key.localeCompare(b.key));

// Redirects from CSV
const missingCsv = [];

const srcFile = createReadStream('/Users/nizaroni/Downloads/export-651ac3949a00f0b7982d1088-custom_query.csv');

const srcCsv = parse();
srcCsv.on('error', err => console.error('FAILZ', err));
srcCsv.on('readable', () => {
  let row;
  while((row = srcCsv.read()) !== null) {
    const target = row[1];
    if (target === 'target') continue;

    const url = new URL(target);
    if (url.hostname === 'www.ironhack.com' && seen[url.pathname]) continue;

    seen[url.pathname] = true;
    missingCsv.push(target);
  }
});
srcCsv.on('end', () => {
  missingCsv.sort((a, b) => a.localeCompare(b));
  console.log('MISSING CSV in JSON', missingCsv.length, missingCsv)
});

srcFile.pipe(srcCsv);

console.log('DUPES in JSON', dupes.length, dupes);
console.log('LOOPING in JSON', loops.size, loops);
console.log('MISSING Dato in JSON', missing.length, missing);
