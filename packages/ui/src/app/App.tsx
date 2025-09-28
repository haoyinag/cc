import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { createTheme } from '@/theme';
import type { ThemeMode } from '@/theme';

const queryClient = new QueryClient();

const App = () => {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setMode(mq.matches ? 'dark' : 'light');
    const listener = (event: MediaQueryListEvent) => setMode(event.matches ? 'dark' : 'light');
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  const theme = useMemo(() => createTheme(mode, 'default'), [mode]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppLayout
          mode={mode}
          onToggleMode={() => setMode((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
