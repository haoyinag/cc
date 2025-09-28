import {
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Typography
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ModuleInfo, StateResponse } from '@shared';
import { disableModule, enableModule, fetchState } from '@/api/client';

export const Modules = () => {
  const queryClient = useQueryClient();
  const stateQuery = useQuery<StateResponse>({ queryKey: ['state'], queryFn: fetchState });

  const enableMutation = useMutation({
    mutationFn: (id: string) => enableModule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['state'] })
  });

  const disableMutation = useMutation({
    mutationFn: (id: string) => disableModule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['state'] })
  });

  const modules: ModuleInfo[] = stateQuery.data?.modules ?? [];
  const isMutating = enableMutation.isPending || disableMutation.isPending;

  return (
    <Grid container spacing={3}>
      {modules.map((module) => (
        <Grid item xs={12} md={6} key={module.id}>
          <Card variant="outlined">
            <CardHeader
              title={module.id}
              subheader={module.description}
              action={
                <Tooltip title={module.health?.warnings?.join('\n') || '状态良好'}>
                  <IconButton color={module.health?.commandAvailable === false ? 'warning' : 'default'}>
                    <InfoOutlinedIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Switch
                  checked={module.enabled}
                  onChange={(_, checked) =>
                    checked ? enableMutation.mutate(module.id) : disableMutation.mutate(module.id)
                  }
                  disabled={isMutating}
                />
                <Typography>{module.enabled ? '已启用' : '未启用'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                <Chip label={module.group} size="small" />
                {module.requires?.map((req) => (
                  <Chip key={req} label={`依赖: ${req}`} size="small" variant="outlined" />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
