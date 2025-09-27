import { Box, Button, Card, CardContent, CardHeader, Grid, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchState, runDoctor, runSetup } from '../api/client';
import { useState } from 'react';
import type { DoctorCheck } from '@cmdcc/shared';

export const Dashboard = ({ onNavigate }: { onNavigate: (page: 'modules' | 'logs' | 'dashboard') => void }) => {
  const stateQuery = useQuery({ queryKey: ['state'], queryFn: fetchState, refetchInterval: 15_000 });
  const doctorMutation = useMutation({ mutationFn: runDoctor });
  const setupMutation = useMutation({ mutationFn: runSetup, onSuccess: () => stateQuery.refetch() });
  const [checks, setChecks] = useState<DoctorCheck[]>([]);

  const state = stateQuery.data;
  const loading = stateQuery.isLoading;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title="当前概览" subheader={new Date().toLocaleString()} />
          <CardContent>
            {loading && <Typography>正在获取状态...</Typography>}
            {state && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body1">配置文件：{state.configPath}</Typography>
                <Typography variant="body1">已启用模块：{state.modules.filter((item) => item.enabled).length} / {state.modules.length}</Typography>
                <Button variant="outlined" onClick={() => onNavigate('modules')} sx={{ alignSelf: 'flex-start' }}>
                  管理模块
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title="快速操作" />
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<BuildRoundedIcon />}
              onClick={() => setupMutation.mutate()}
              disabled={setupMutation.isLoading}
            >
              {setupMutation.isLoading ? '执行中...' : '重新安装 (setup)'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<WarningRoundedIcon />}
              onClick={() => doctorMutation.mutate(undefined, { onSuccess: (res) => setChecks(res.checks) })}
              disabled={doctorMutation.isLoading}
            >
              {doctorMutation.isLoading ? '诊断中...' : '执行自检 (doctor)'}
            </Button>
            <Button variant="text" onClick={() => onNavigate('logs')}>
              查看日志
            </Button>
          </CardContent>
        </Card>
      </Grid>
      {checks.length > 0 && (
        <Grid item xs={12}>
          <Card>
            <CardHeader title="自检结果" />
            <CardContent>
              <List>
                {checks.map((check) => (
                  <ListItem key={check.id}>
                    <ListItemIcon>
                      {check.result === 'pass' ? (
                        <CheckCircleRoundedIcon color="success" />
                      ) : (
                        <WarningRoundedIcon color={check.result === 'warn' ? 'warning' : 'error'} />
                      )}
                    </ListItemIcon>
                    <ListItemText primary={check.id} secondary={check.details} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};
