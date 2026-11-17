import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateRelease} from '../scripts/release-ui-icons.mjs';

const pkg = {name: '@bloxwap/icons', version: '0.1.1'};
test('a matching stable release tag publishes the versioned archive to latest', () => {
  assert.deepEqual(validateRelease(pkg, 'tag', 'icons-v0.1.1'), {
    version: '0.1.1', dist_tag: 'latest', archive: './artifacts/bloxwap-icons-0.1.1.tgz',
  });
});
test('prereleases use next without advancing latest', () => {
  assert.equal(validateRelease({...pkg, version: '0.2.0-rc.1'}, 'tag', 'icons-v0.2.0-rc.1').dist_tag, 'next');
});
test('branches, mismatched tags, other packages, and private packages cannot publish', () => {
  for (const [candidate, type, ref] of [
    [pkg, 'branch', 'icons-v0.1.1'], [pkg, 'tag', 'icons-v0.1.0'], [pkg, 'tag', 'v0.1.1'],
    [{...pkg, name: 'icons-v2'}, 'tag', 'icons-v0.1.1'], [{...pkg, private: true}, 'tag', 'icons-v0.1.1'],
  ]) assert.throws(() => validateRelease(candidate, type, ref));
});
test('invalid versions cannot become release filenames or workflow outputs', () => {
  for (const version of ['01.1.0', '0.1.1-01', '0.1.1+build', '../other', '0.1.1\n', '0.1.1\ndist_tag=latest']) {
    assert.throws(() => validateRelease({...pkg, version}, 'tag', `icons-v${version}`));
  }
});
