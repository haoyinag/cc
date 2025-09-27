import { ThemeOptions } from '@mui/material/styles';

export const getCyberpunkPalette = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    primary: { main: '#ff6ac1' },
    secondary: { main: '#6af7ff' },
    background: {
      default: mode === 'dark' ? '#050014' : '#f5f3ff',
      paper: mode === 'dark' ? '#12043a' : '#ffffff'
    },
    text: {
      primary: mode === 'dark' ? '#e5e7ff' : '#1f1147'
    }
  },
  typography: {
    fontFamily: '"Share Tech Mono", "Fira Code", monospace'
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundImage: mode === 'dark'
            ? 'radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 60%)'
            : 'radial-gradient(circle at top, rgba(17, 24, 39, 0.08), transparent 60%)'
        }
      }
    }
  }
});
