/*
 * NexusBet local crest and custom-team fallback verification.
 * Run from project root: node frontend/scripts/verify-team-logos.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const vm = require('vm');
const Module = require('module');
const assert = require('assert');
const babel = require('@babel/core');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const frontendRoot = path.resolve(__dirname, '..');
const resolverPath = path.join(frontendRoot, 'src', 'utils', 'getLogo.js');
const componentPath = path.join(frontendRoot, 'src', 'components', 'TeamLogo.jsx');
const resolverSource = fs.readFileSync(resolverPath, 'utf8');
const componentSource = fs.readFileSync(componentPath, 'utf8');
const executableResolver = resolverSource
  .replace(/export const /g, 'const ')
  .replace(/export default getLogo;?/, 'globalThis.__nexusLogoApi = { getLogo, normalizeTeamName };');
const context = { console };
vm.createContext(context);
vm.runInContext(executableResolver, context, { filename: resolverPath });
const { getLogo, normalizeTeamName } = context.__nexusLogoApi;

let verifiedFiles = 0;
const paths = [...resolverSource.matchAll(/"(\/logos\/[^"\n]+)"/g)].map((match) => match[1]);
for (const url of new Set(paths)) {
  const filePath = path.join(frontendRoot, 'public', url.replace(/^\//, ''));
  assert(fs.existsSync(filePath), `Resolver points to missing local image: ${url}`);
  assert(fs.statSync(filePath).size > 300, `Resolver points to tiny placeholder: ${url}`);
  verifiedFiles += 1;
}

const knownTeamCases = [
  ['Arsenal FC', '/logos/arsenal_fc.svg'],
  ['FC Barcelona', '/logos/fc_barcelona.svg'],
  ['FC Bayern München', '/logos/fc_bayern_munchen.svg'],
  ['AC Milan', '/logos/ac_milan.svg'],
  ['AFC Ajax', '/logos/afc_ajax.svg'],
  ['Celtic FC', '/logos/celtic_fc.svg'],
  ['Fenerbahçe SK', '/logos/fenerbahce_sk.svg'],
  ['AEK Athens FC', '/logos/aek_athens.svg'],
];
for (const [team, expected] of knownTeamCases) {
  const result = getLogo(team);
  assert(result, `Known local team did not resolve: ${team}`);
  const filePath = path.join(frontendRoot, 'public', result.replace(/^\//, ''));
  assert(fs.existsSync(filePath) && fs.statSync(filePath).size > 300, `${team} resolved to an unusable image: ${result}`);
  console.log(`PASS real local crest: ${team} -> ${result}`);
}

for (const team of ['Accra Lions', 'Royal Stars FC', 'Test United Outside League']) {
  assert.strictEqual(getLogo(team), null, `${team} should use the generated fallback when no local crest is mapped`);
  console.log(`PASS custom fallback route: ${team} -> generated badge`);
}

assert(componentSource.includes('function makeFallback(text)'), 'TeamLogo must contain generated custom badge fallback');
assert(componentSource.includes('const source = useFallback ? makeFallback(text) : logo;'), 'TeamLogo must render fallback when no usable local crest is found');
assert(componentSource.includes('loading="eager"') && componentSource.includes('decoding="sync"'), 'TeamLogo should avoid lazy-load flashing');
assert(componentSource.includes('object-contain'), 'TeamLogo should preserve stable logo dimensions');
assert(normalizeTeamName('Fenerbahçe SK') === 'fenerbahce_sk', 'Accent normalization failed');

// Render the real React component server-side twice to verify the local-crest and
// unknown-team fallback routes are deterministic and do not depend on animations.
const transformed = babel.transformFileSync(componentPath, {
  babelrc: false,
  configFile: false,
  presets: [require.resolve('@babel/preset-env'), require.resolve('@babel/preset-react')],
}).code;
const componentModule = new Module(componentPath, module);
componentModule.filename = componentPath;
componentModule.paths = Module._nodeModulePaths(path.dirname(componentPath));
const originalRequire = componentModule.require.bind(componentModule);
componentModule.require = (id) => id === '@/utils/getLogo' ? { getLogo } : originalRequire(id);
componentModule._compile(transformed, componentPath);
const TeamLogo = componentModule.exports.default;
for (const [team, expectedPrefix] of [['Arsenal FC', '/logos/'], ['Accra Lions', 'data:image/svg+xml'], ['Royal Stars FC', 'data:image/svg+xml']]) {
  const first = renderToStaticMarkup(React.createElement(TeamLogo, { name: team, size: 34 }));
  const second = renderToStaticMarkup(React.createElement(TeamLogo, { name: team, size: 34 }));
  assert.strictEqual(first, second, `Repeated render changed the logo markup for ${team}`);
  const sourceMatch = first.match(/src=\"([^\"]+)\"/);
  assert(sourceMatch && sourceMatch[1].startsWith(expectedPrefix), `${team} did not render the expected logo/fallback type`);
  console.log(`PASS stable React render: ${team}`);
}

// Exercise the importer's resolver-refresh helper against a temporary new crest.
const importerPath = path.join(frontendRoot, 'src', 'setup_nexusbet_logos.js');
const importerSource = fs.readFileSync(importerPath, 'utf8');
const helperStart = importerSource.indexOf('function refreshResolverFromLocalAssets() {');
const helperEnd = importerSource.indexOf('async function main() {', helperStart);
assert(helperStart >= 0 && helperEnd > helperStart, 'Importer must rebuild the resolver after downloads');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nexusbet-logo-test-'));
try {
  const tempLogos = path.join(tempRoot, 'logos');
  const tempResolver = path.join(tempRoot, 'getLogo.js');
  fs.mkdirSync(tempLogos);
  fs.writeFileSync(path.join(tempLogos, 'new_test_club.svg'), `<svg>${'x'.repeat(400)}</svg>`);
  fs.writeFileSync(tempResolver, 'const ALIASES = {\n  "test_alias": "new_test_club"\n};\nexport const normalizeTeamName = value => value;');
  const importerContext = {
    fs, path, LOGOS_DIR: tempLogos, UTILS_FILE: tempResolver, console,
    normalize: (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
  };
  vm.createContext(importerContext);
  vm.runInContext(importerSource.slice(helperStart, helperEnd) + '\nrefreshResolverFromLocalAssets();', importerContext);
  const refreshed = fs.readFileSync(tempResolver, 'utf8');
  assert(refreshed.includes('/logos/new_test_club.svg'), 'Downloaded crest was not added to the resolver');
  assert(refreshed.includes('test_alias'), 'Resolver refresh did not preserve valid aliases');
  console.log('PASS importer refresh: newly downloaded crest is registered and valid aliases remain');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log(`\nPASS: ${verifiedFiles} unique local crest paths verified; known teams resolve; custom teams render deterministic generated badges.`);
console.log('NOTE: This verifies local assets currently bundled. It does not mean every requested league club already has a real crest.');
