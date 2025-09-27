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
import { disableModule, enableModule, fetchState } from '../api/client';

export const Modules = () => {
  const queryClient = useQueryClient();
  const stateQuery = useQuery({ queryKey: ['state'], queryFn: fetchState });

  const enableMutation = useMutation({
    mutationFn: enableModule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['state'] })
  });
  const disableMutation = useMutation({
    mutationFn: disableModule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['state'] })
  });

  const modules = stateQuery.data?.modules ?? [];

  return (
    <Grid container spacing={3}>
      {modules.map((module) => {
        const disabled = enableMutation.isLoading || disableMutation.isLoading;
        const toggle = module.enabled
          ? () => disableMutation.mutate(module.id)
          : () => enableMutation.mutate(module.id);
        const health = module.health;
        return (
          <Grid item xs={12} md={6} key={module.id}>
            <Card variant="outlined">
              <CardHeader
                title={module.id}
                subheader={module.description}
                action={
                  <Tooltip title={health?.warnings?.join('\n') || '状态良好'}>
                    <IconButton color={health?.commandAvailable === false ? 'warning' : 'default'}>
                      <InfoOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                }
              />
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Switch
                    checked={module.enabled}
                    onChange={toggle}
                    disabled={disabled}
                  />
                  <Typography>
                    {module.enabled ? '已启用' : '未启用'}
                  </Typography>
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
        );
      })}
    </Grid>
  );
};
