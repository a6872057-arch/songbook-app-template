/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const app = JSON.parse(read('app.json')).expo;
const catalog = JSON.parse(read('catalog.json'));
assert.equal(app.owner, undefined, 'Template must not bind an Expo owner');
assert.equal(app.extra?.eas?.projectId, undefined, 'Template must not bind an EAS project');
assert.equal(app.android.package, 'com.example.songbooktemplate');
assert.equal(catalog.length, 3, 'Pristine template contains three demo entries');
assert.equal(new Set(catalog.map(s => s.id)).size, catalog.length);
assert.equal(new Set(catalog.map(s => s.number)).size, catalog.length);
for (const song of catalog) {
  assert.match(song.id, /^sample-\d{3}$/);
  assert.match(song.number, /^\d{3}$/);
  assert.ok(Array.isArray(song.lyrics) && song.lyrics.every(line => typeof line === 'string'));
  assert.equal(song.audioUrl, undefined, 'Do not bundle machine-local audio paths');
}
const excluded = new Set(['node_modules', '.git', '.expo', 'dist', 'dist-check']);
let count = 0;
function inspect(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (excluded.has(item.name)) continue;
    const filename = path.join(dir, item.name);
    const relative = path.relative(root, filename).split(path.sep).join('/');
    assert.ok(!item.isSymbolicLink(), `Unexpected symlink: ${relative}`);
    if (item.isDirectory()) { inspect(filename); continue; }
    if (!item.isFile()) continue;
    count++;
    assert.ok(!/^\.env(?:\.|$)/.test(item.name), `Unexpected env file: ${relative}`);
    assert.ok(!/\.(pem|key|jks|p12|apk|aab|pdf)$/i.test(item.name), `Unexpected private/generated file: ${relative}`);
    if (/\.(mp3|wav|m4a|aac|ogg|flac|mp4|webm)$/i.test(item.name)) {
      assert.equal(relative, 'assets/demo-tone.wav', 'Only the generated test tone belongs in this template');
    } else {
      const text = fs.readFileSync(filename, 'utf8');
      assert.ok(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text), `Private key found: ${relative}`);
      assert.ok(!/\bgh[pousr]_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b|\bsk-(?:proj-)?[A-Za-z0-9_-]{30,}\b/.test(text), `Potential token found: ${relative}`);
      assert.ok(!/"type"\s*:\s*"service_account"/.test(text), `Service account found: ${relative}`);
    }
  }
}
inspect(root);
const wav = fs.readFileSync(path.join(root, 'assets/demo-tone.wav'));
assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
assert.equal(wav.readUInt32LE(24), 22050);
assert.equal(wav.readUInt32LE(40) / wav.readUInt32LE(28), 1.5);
assert.ok(read('skills/songbook-app-starter/SKILL.md').startsWith('---\n'));
console.log(`Clean template verified: ${count} files, 3 sample entries, one synthetic test tone, no account binding.`);
