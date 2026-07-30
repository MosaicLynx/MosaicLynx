import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

export type AppThemeMode = 'light' | 'dark';

const THEME_EVENT = 'mosaiclynx:theme-change';

export const setAppThemeMode = (mode: AppThemeMode): void => {
  window.dispatchEvent(new CustomEvent<AppThemeMode>(THEME_EVENT, { detail: mode }));
};

export const createAppTheme = (mode: AppThemeMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#007aff' : '#0a84ff',
        contrastText: '#ffffff',
      },
      secondary: { main: mode === 'light' ? '#5856d6' : '#5e5ce6' },
      error: { main: mode === 'light' ? '#ff3b30' : '#ff453a' },
      warning: { main: mode === 'light' ? '#ff9500' : '#ff9f0a' },
      success: { main: mode === 'light' ? '#34c759' : '#30d158' },
      background: {
        default: mode === 'light' ? '#f2f2f7' : '#000000',
        paper: mode === 'light' ? '#ffffff' : '#1c1c1e',
      },
      text: {
        primary: mode === 'light' ? '#000000' : '#ffffff',
        secondary: mode === 'light' ? '#3c3c43' : '#ebebf599',
      },
      divider: mode === 'light' ? '#c6c6c8' : '#38383a',
    },
    shape: { borderRadius: 13 },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
      button: { fontWeight: 600, letterSpacing: 0, textTransform: 'none' },
      h1: { fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.03em' },
      h2: { fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { minHeight: 40, borderRadius: 10, fontWeight: 600 } },
      },
      MuiIconButton: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiCheckbox: { styleOverrides: { root: { padding: 4 } } },
      MuiCard: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: 10 } } },
    },
  });

export const AppThemeProvider = ({ children }: { readonly children: ReactNode }) => {
  const [mode, setMode] = useState<AppThemeMode>('light');

  useEffect(() => {
    const listener = (event: Event): void => setMode((event as CustomEvent<AppThemeMode>).detail);
    window.addEventListener(THEME_EVENT, listener);
    return () => window.removeEventListener(THEME_EVENT, listener);
  }, []);

  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const dark = mode === 'dark';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          ':root': {
            colorScheme: mode,
            '--app-bg': theme.palette.background.default,
            '--app-paper': theme.palette.background.paper,
            '--app-surface': dark ? '#2c2c2e' : '#e5e5ea',
            '--app-surface-strong': dark ? '#3a3a3c' : '#d1d1d6',
            '--app-text': theme.palette.text.primary,
            '--app-muted': theme.palette.text.secondary,
            '--app-divider': theme.palette.divider,
            '--app-primary': theme.palette.primary.main,
            '--app-primary-contrast': theme.palette.primary.contrastText,
            '--app-primary-soft': dark ? '#0a3d77' : '#d8eaff',
            '--app-danger': dark ? '#ff453a' : '#ff3b30',
            '--app-danger-soft': dark ? '#4a1d1a' : '#ffe5e4',
            '--app-warning': dark ? '#ff9f0a' : '#c76c00',
            '--app-warning-soft': dark ? '#4a3310' : '#fff0d8',
            '--app-success': dark ? '#30d158' : '#248a3d',
            '--app-shadow': dark ? '0 18px 50px rgba(0,0,0,.35)' : '0 14px 40px rgba(60,60,67,.12)',
          },
        }}
      />
      {children}
    </ThemeProvider>
  );
};
