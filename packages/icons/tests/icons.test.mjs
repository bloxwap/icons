import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {gzipSync} from 'node:zlib';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {build} from 'esbuild';
import sharp from 'sharp';
import * as icons from '../dist/react/index.js';
import {toSvg, toDataUri} from '../dist/core/index.js';
import {iconSource} from '../dist/native/source.js';
import {Check as check} from '../dist/definitions/check.js';

const catalog = JSON.parse(readFileSync(new URL('../catalog.json', import.meta.url)));
const manifest = JSON.parse(readFileSync(new URL('../dist/manifest.json', import.meta.url)));
const packageRoot = new URL('..', import.meta.url).pathname;

test('decorative and named web icons have distinct accessibility semantics', () => {
  const hidden = renderToStaticMarkup(createElement(icons.Check, {size: 20}));
  assert.match(hidden, /aria-hidden="true"/);
  assert.match(hidden, /focusable="false"/);
  assert.match(hidden, /width="20" height="20"/);
  const named = renderToStaticMarkup(createElement(icons.Check, {'aria-label': 'Saved', color: '#008844'}));
  assert.match(named, /role="img"/);
  assert.match(named, /aria-label="Saved"/);
  assert.doesNotMatch(named, /aria-hidden/);
  const cssSized = renderToStaticMarkup(createElement(icons.Check, {size: '1em', absoluteStrokeWidth: true, className: 'status', style: {opacity: 0.5}}));
  assert.match(cssSized, /--bloxwap-icon-vector-effect:non-scaling-stroke/);
  assert.match(cssSized, /vector-effect="var\(--bloxwap-icon-vector-effect, none\)"/);
  assert.match(cssSized, /opacity:0.5/);
  assert.match(cssSized, /bloxwap-icon-check status/);
});

test('all aliases share their canonical component rather than duplicating artwork', () => {
  for (const [alias, canonical] of Object.entries(catalog.aliases)) assert.equal(icons[alias], icons[canonical]);
  assert.equal(manifest.icons.length, catalog.icons.length);
  assert.equal(new Set(manifest.icons.map(icon => icon.sha256)).size, manifest.icons.length);
});

test('serialization preserves paint, escapes attributes, and rejects invalid widths', () => {
  const svg = toSvg(check, {color: '#11aa33', strokeWidth: 3, fill: 'none'});
  assert.match(svg, /stroke="#11aa33" stroke-width="3"/);
  assert.equal(decodeURIComponent(toDataUri(check).split(',')[1]), toSvg(check));
  assert.match(toSvg(check, {color: '"<>&'}), /stroke="&quot;&lt;&gt;&amp;"/);
  for (const strokeWidth of [NaN, Infinity, -1]) assert.throws(() => toSvg(check, {strokeWidth}), RangeError);
});

test('native sources reuse equal paint and evict old entries after 256 variants', () => {
  const first = iconSource(check, {color: '#ff0000', strokeWidth: 2});
  assert.equal(first, iconSource(check, {strokeWidth: 2, color: '#ff0000'}));
  assert(Object.isFrozen(first));
  const changed = iconSource(check, {color: '#00ff00'});
  assert.notEqual(first.uri, changed.uri);
  for (let i = 0; i < 257; i++) iconSource(check, {color: `rgb(${i % 256},${Math.floor(i / 256)},0)`});
  assert.notEqual(first, iconSource(check, {color: '#ff0000', strokeWidth: 2}));
});

test('native icons produce one image view with vector paint and no SVG child tree', async () => {
  const temporary = mkdtempSync(join(packageRoot, '.test-native-'));
  try {
    const path = join(temporary, 'native.mjs');
    await build({entryPoints: [join(packageRoot, 'dist/native/index.js')], outfile: path, bundle: true, platform: 'node', format: 'esm', external: ['react'],
      plugins: [{name: 'native-image-host', setup(builder) {
        builder.onResolve({filter: /^expo-image$/}, () => ({path: 'expo-image', namespace: 'fixture'}));
        builder.onLoad({filter: /.*/, namespace: 'fixture'}, () => ({contents: 'export function Image() {}', loader: 'js'}));
      }}]});
    const native = await import(pathToFileURL(path));
    for (const entry of manifest.icons) {
      const element = native[entry.symbol]({size: 20, color: '#abcdef', strokeWidth: 2.5});
      assert.equal(element.type.name, 'Image');
      assert.equal(element.props.children, undefined);
      assert.equal(element.props.accessible, false);
      assert.equal(element.props.cachePolicy, 'memory');
      assert.equal(element.props.transition, 0);
      assert.equal(element.props.tintColor, '#abcdef');
      assert.match(decodeURIComponent(element.props.source.uri), /stroke="#000000" stroke-width="2.5"/);
      assert.deepEqual(element.props.style[0], {width: 20, height: 20, flexShrink: 0});
    }
    const named = native.Check({accessibilityLabel: 'Saved', size: 12, absoluteStrokeWidth: true, testID: 'saved'});
    assert.equal(named.props.accessible, true);
    assert.equal(named.props.accessibilityRole, 'image');
    assert.equal(named.props.testID, 'saved');
    assert.match(decodeURIComponent(named.props.source.uri), /stroke-width="4"/);
    assert.equal(native.Check({size: 0}), null);
  } finally {rmSync(temporary, {recursive: true, force: true});}
});

test('every icon renders identically on web and the native SVG source', async () => {
  for (const {name, symbol} of manifest.icons) {
    const definition = (await import(`../dist/definitions/${name}.js`))[symbol];
    for (const [size, color, strokeWidth] of [[16, '#000000', 1.5], [24, '#00a860', 2], [48, '#ffffff', 3]]) {
      const web = renderToStaticMarkup(createElement(icons[symbol], {size, color, strokeWidth}));
      const native = toSvg(definition, {color, strokeWidth});
      const render = svg => sharp(Buffer.from(svg)).resize(size * 2, size * 2).ensureAlpha().raw().toBuffer();
      assert.deepEqual(await render(web), await render(native), `${name} at ${size}px`);
    }
  }
});

test('optimized artwork stays visually equivalent to its catalog source', async () => {
  let worst = 0;
  for (const icon of catalog.icons) {
    const body = icon.nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([key, value]) => `${key}="${value}"`).join(' ')}/>`).join('');
    const original = toSvg({name: icon.name, body}, {color: '#000000'});
    const optimized = readFileSync(join(packageRoot, 'svg', `${icon.name}.svg`), 'utf8').replace('currentColor', '#000000');
    const render = svg => sharp(Buffer.from(svg)).resize(96, 96).ensureAlpha().raw().toBuffer();
    const a = await render(original), b = await render(optimized);
    let total = 0;
    for (let i = 3; i < a.length; i += 4) total += Math.abs(a[i] - b[i]);
    const meanAlphaDifference = total / (96 * 96 * 255);
    worst = Math.max(worst, meanAlphaDifference);
    assert(meanAlphaDifference < 0.003, `${icon.name}: alpha difference ${meanAlphaDifference}`);
  }
  console.log(`Largest mean alpha difference after optimization: ${(worst * 100).toFixed(4)}%`);
});

test('per-icon and barrel imports tree-shake; platform dependencies remain isolated', async () => {
  const results = [];
  for (const [entry, imports, maxGzip] of [
    ['react/index.js', ['Check'], 1500], ['react/check.js', ['Check'], 1500],
    ['react/index.js', ['Check', 'Search', 'ChevronRight'], 1900],
    ['native/index.js', ['Check'], 2100], ['native/check.js', ['Check'], 2100],
  ]) {
    const result = await build({stdin: {contents: `export {${imports.join(',')}} from './dist/${entry}';`, resolveDir: packageRoot},
      bundle: true, write: false, minify: true, format: 'esm', platform: 'neutral', metafile: true, external: ['react', 'expo-image']});
    const code = result.outputFiles[0].contents;
    const gzip = gzipSync(code).byteLength;
    const graph = Object.values(result.metafile.outputs).flatMap(output => Object.entries(output.inputs).filter(([, stats]) => stats.bytesInOutput > 0).map(([path]) => path));
    assert(!graph.some(path => /lucide|react-native-svg|react-dom/.test(path)));
    assert(!graph.some(path => /definitions\/wallet|react\/wallet|native\/wallet/.test(path)) && !Buffer.from(code).includes(Buffer.from('wallet')), 'unused icon survives tree shaking');
    if (entry.startsWith('react')) assert(!Buffer.from(code).includes(Buffer.from('expo-image')));
    assert(gzip <= maxGzip, `${entry}: ${gzip} gzip bytes exceeds ${maxGzip}`);
    results.push({entry, icons: imports, bytes: code.byteLength, gzip});
  }
  console.log(JSON.stringify(results));
});
