import { readFile } from 'node:fs/promises';

const root = new URL('../public/', import.meta.url);
const [html, script] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('bootstrap.js', root), 'utf8'),
]);
if (!html.includes("connect-src 'none'") || !html.includes('no-referrer'))
  throw new Error('Fallback security policy is missing.');
if (/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|console\./.test(script))
  throw new Error('Fallback bootstrap contains a forbidden data sink.');
if (script.indexOf('replaceState') > script.indexOf('getElementById'))
  throw new Error('Fragment must be removed before DOM rendering.');
