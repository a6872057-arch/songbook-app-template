import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeLibrary } from '../library.ts';

const song = (id, number, title = id) => ({ id, number, title, category: 'sample', lyrics: ['demo'] });

test('a changed catalog retains personal lyrics and imported audio', () => {
  const saved = { ...song('one', '001'), lyrics: ['my edit'], audioUrl: 'file:///my-recording.mp3' };
  const result = mergeLibrary([saved], [song('one', '005', 'New title')]);
  assert.equal(result[0].number, '005');
  assert.equal(result[0].title, 'New title');
  assert.deepEqual(result[0].lyrics, ['my edit']);
  assert.equal(result[0].audioUrl, saved.audioUrl);
});

test('new bundled songs do not overwrite imported songs with the same number', () => {
  const imported = { ...song('personal', '002'), audioUrl: 'file:///personal.mp3' };
  const result = mergeLibrary([imported], [song('one', '001'), song('two', '002')]);
  assert.equal(result.length, 3);
  assert.equal(result[2].id, 'personal');
  assert.equal(result[2].number, '003');
  assert.equal(result[2].audioUrl, imported.audioUrl);
  assert.equal(new Set(result.map(s => s.number)).size, 3);
});

test('merging twice stays stable and duplicate IDs are discarded', () => {
  const catalog = [song('one', '001')];
  const once = mergeLibrary([song('personal', '001'), song('personal', '001')], catalog);
  assert.equal(once.length, 2);
  assert.deepEqual(mergeLibrary(once, catalog), once);
});
