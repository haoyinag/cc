import { Card, CardContent, CardHeader, List, ListItem, ListItemText, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import type { LogEntry } from '@shared';
import { fetchLogs } from '@/api/client';

export const Logs = () => {
  const logsQuery = useQuery<LogEntry[]>({ queryKey: ['logs'], queryFn: fetchLogs, refetchInterval: 10_000 });
  const logs = logsQuery.data ?? [];

  return (
    <Card>
      <CardHeader title="操作日志" subheader="最近 50 条" />
      <CardContent>
        {logs.length === 0 ? (
          <Typography variant="body2">暂无日志</Typography>
        ) : (
          <List>
            {logs.map((entry, index) => (
              <ListItem key={`${entry.timestamp}-${index}`}>
                <ListItemText
                  primary={`${entry.timestamp} — ${entry.level.toUpperCase()}`}
                  secondary={entry.message}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
