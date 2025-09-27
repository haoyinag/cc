import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { createTheme } from '../theme';
import { AppLayout } from '../components/AppLayout';

const queryClient = new QueryClient();

const App = () => {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setMode(mq.matches ? 'dark' : 'light');
    const listener = (event: MediaQueryListEvent) => setMode(event.matches ? 'dark' : 'light');
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);
  const theme = useMemo(() => createTheme(mode), [mode]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppLayout mode={mode} onToggleMode={() => setMode(mode === 'dark' ? 'light' : 'dark')} />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
