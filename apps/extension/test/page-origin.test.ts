import { describe, expect, it } from 'vitest';

import { pageOrigin } from '../src/background/page-origin.js';

describe('browser caller origin policy', () => {
  it('allows HTTPS origins and loopback HTTP development origins', () => {
    expect(pageOrigin('https://app.example/path')).toBe('https://app.example');
    expect(pageOrigin('http://localhost:5173/app')).toBe('http://localhost:5173');
    expect(pageOrigin('http://127.0.0.1:5173/app')).toBe('http://127.0.0.1:5173');
    expect(pageOrigin('http://[::1]:5173/app')).toBe('http://[::1]:5173');
  });

  it('rejects non-loopback HTTP and non-web origins', () => {
    expect(pageOrigin('http://app.example')).toBeUndefined();
    expect(pageOrigin('file:///tmp/app.html')).toBeUndefined();
    expect(pageOrigin('data:text/html,hello')).toBeUndefined();
    expect(pageOrigin('not a URL')).toBeUndefined();
  });
});
