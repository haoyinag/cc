import { AppBar, Box, Container, IconButton, Toolbar, Typography } from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import { useQueryClient } from '@tanstack/react-query';
import { Dashboard } from '../pages/Dashboard';
import { Modules } from '../pages/Modules';
import { Logs } from '../pages/Logs';
import { useMemo, useState } from 'react';

export const AppLayout = ({ mode, onToggleMode }: { mode: 'light' | 'dark'; onToggleMode: () => void }) => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'dashboard' | 'modules' | 'logs'>('dashboard');

  const page = useMemo(() => {
    switch (tab) {
      case 'modules':
        return <Modules />;
      case 'logs':
        return <Logs />;
      case 'dashboard':
      default:
        return <Dashboard onNavigate={setTab} />;
    }
  }, [tab]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            cmdcc 控制台
          </Typography>
          <IconButton
            aria-label="刷新"
            onClick={() => queryClient.invalidateQueries()}
            color="inherit"
          >
            <RefreshRoundedIcon />
          </IconButton>
          <IconButton aria-label="切换主题" onClick={onToggleMode} color="inherit">
            {mode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {page}
      </Container>
      <Box component="nav" sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', gap: 2 }}>
        <NavButton label="总览" active={tab === 'dashboard'} onClick={() => setTab('dashboard')} />
        <NavButton label="模块" active={tab === 'modules'} onClick={() => setTab('modules')} />
        <NavButton label="日志" active={tab === 'logs'} onClick={() => setTab('logs')} />
      </Box>
    </Box>
  );
};

const NavButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <Box
    component="button"
    onClick={onClick}
    sx={{
      border: 'none',
      px: 3,
      py: 1.5,
      borderRadius: 99,
      cursor: 'pointer',
      bgcolor: active ? 'primary.main' : 'background.paper',
      color: active ? 'primary.contrastText' : 'text.primary',
      boxShadow: 3,
      fontWeight: 600,
      '&:hover': {
        transform: 'translateY(-1px)'
      }
    }}
  >
    {label}
  </Box>
);
