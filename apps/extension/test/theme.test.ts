import { describe, expect, it } from 'vitest';

import { createAppTheme } from '../src/ui/theme.js';

describe('extension theme', () => {
  it('uses the Cupertino palette in light mode', () => {
    const theme = createAppTheme('light');
    expect(theme.palette.mode).toBe('light');
    expect(theme.palette.primary.main).toBe('#007aff');
    expect(theme.palette.background.default).toBe('#f2f2f7');
  });

  it('creates the Cupertino dark palette', () => {
    const theme = createAppTheme('dark');
    expect(theme.palette.mode).toBe('dark');
    expect(theme.palette.primary.main).toBe('#0a84ff');
    expect(theme.palette.background.paper).toBe('#1c1c1e');
  });
});
