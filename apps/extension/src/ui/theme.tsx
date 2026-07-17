import { useEffect, useMemo, useState, type ReactNode } from "react";
import GlobalStyles from "@mui/material/GlobalStyles";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";

export type AppThemeMode = "light" | "dark";

const THEME_EVENT = "mosaiclynx:theme-change";

export const setAppThemeMode = (mode: AppThemeMode): void => {
  window.dispatchEvent(new CustomEvent<AppThemeMode>(THEME_EVENT, { detail: mode }));
};

export const createAppTheme = (mode: AppThemeMode) => createTheme({
  palette: {
    mode,
    primary: { main: mode === "light" ? "#0f766e" : "#5eead4", contrastText: mode === "light" ? "#ffffff" : "#062925" },
    secondary: { main: mode === "light" ? "#4f46e5" : "#a5b4fc" },
    error: { main: mode === "light" ? "#b42318" : "#ff8a80" },
    warning: { main: mode === "light" ? "#b54708" : "#fdb022" },
    success: { main: mode === "light" ? "#067647" : "#6ce9a6" },
    background: {
      default: mode === "light" ? "#f4f7f6" : "#091210",
      paper: mode === "light" ? "#ffffff" : "#111c19",
    },
    text: {
      primary: mode === "light" ? "#102522" : "#edf7f4",
      secondary: mode === "light" ? "#526864" : "#9bb5af",
    },
    divider: mode === "light" ? "#dbe6e2" : "#263b36",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: { fontWeight: 700, letterSpacing: 0, textTransform: "none" },
    h1: { fontSize: "1.65rem", fontWeight: 750, letterSpacing: "-0.035em" },
    h2: { fontSize: "1.25rem", fontWeight: 720, letterSpacing: "-0.025em" },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 40, borderRadius: 10 } },
    },
    MuiIconButton: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiCard: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 10 } } },
  },
});

export const AppThemeProvider = ({ children }: { readonly children: ReactNode }) => {
  const [mode, setMode] = useState<AppThemeMode>("light");

  useEffect(() => {
    const listener = (event: Event): void => setMode((event as CustomEvent<AppThemeMode>).detail);
    window.addEventListener(THEME_EVENT, listener);
    return () => window.removeEventListener(THEME_EVENT, listener);
  }, []);

  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const dark = mode === "dark";

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={{
        ":root": {
          colorScheme: mode,
          "--app-bg": theme.palette.background.default,
          "--app-paper": theme.palette.background.paper,
          "--app-surface": dark ? "#172521" : "#edf4f1",
          "--app-surface-strong": dark ? "#20342f" : "#e1ece8",
          "--app-text": theme.palette.text.primary,
          "--app-muted": theme.palette.text.secondary,
          "--app-divider": theme.palette.divider,
          "--app-primary": theme.palette.primary.main,
          "--app-primary-contrast": theme.palette.primary.contrastText,
          "--app-primary-soft": dark ? "#173e38" : "#d9f1eb",
          "--app-danger": dark ? "#ff8a80" : "#b42318",
          "--app-danger-soft": dark ? "#3d211e" : "#fef0ee",
          "--app-warning": dark ? "#fdb022" : "#8a4b08",
          "--app-warning-soft": dark ? "#382d18" : "#fff6df",
          "--app-success": dark ? "#6ce9a6" : "#067647",
          "--app-shadow": dark ? "0 18px 50px rgba(0,0,0,.3)" : "0 14px 40px rgba(28,64,56,.1)",
        },
      }} />
      {children}
    </ThemeProvider>
  );
};
