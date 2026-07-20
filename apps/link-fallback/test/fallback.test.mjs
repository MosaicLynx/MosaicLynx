import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('fallback removes fragments before rendering and has no network sink', async () => {
  const script = await readFile(new URL('../public/bootstrap.js', import.meta.url), 'utf8');
  assert.ok(script.indexOf('replaceState') < script.indexOf('getElementById'));
  assert.doesNotMatch(script, /fetch\s*\(|sendBeacon|localStorage|sessionStorage/);
});
