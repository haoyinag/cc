import { createTheme as muiCreateTheme, ThemeOptions } from '@mui/material/styles';
import { getCyberpunkPalette } from './themes';

export type ThemeMode = 'light' | 'dark';

export const createTheme = (mode: ThemeMode, variant: 'default' | 'cyberpunk' = 'default') => {
  if (variant === 'cyberpunk') {
    return muiCreateTheme(getCyberpunkPalette(mode));
  }

  const base: ThemeOptions = {
    palette: {
      mode,
      primary: { main: mode === 'dark' ? '#7dd3fc' : '#0284c7' },
      secondary: { main: mode === 'dark' ? '#f472b6' : '#db2777' },
      background: {
        default: mode === 'dark' ? '#0f172a' : '#f8fafc',
        paper: mode === 'dark' ? '#1e293b' : '#ffffff'
      }
    },
    typography: {
      fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif'
    }
  };
  return muiCreateTheme(base);
};
