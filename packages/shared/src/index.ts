export type ModuleHealth = {
  commandAvailable: boolean;
  warnings: string[];
};

export type ModuleInfo = {
  id: string;
  description: string;
  group: string;
  enabled: boolean;
  keywords: string[];
  version?: string;
  requires?: string[];
  health?: ModuleHealth;
};

export type RcFileStatus = {
  path: string;
  exists: boolean;
  hasMarker?: boolean;
};

export type StateResponse = {
  configPath: string;
  configValid: boolean;
  rcFiles: RcFileStatus[];
  modules: ModuleInfo[];
  logs: LogEntry[];
};

export type LogEntry = {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: unknown;
};

export type Summary = {
  copied?: string[];
  pruned?: string[];
  removed?: string[];
  rcUpdated?: Array<{ rcPath: string; status: string }>;
};

export type ActionResponse = {
  status: 'completed' | 'failed' | 'enabled' | 'disabled';
  moduleId?: string;
  summary?: Summary;
  error?: ErrorResponse;
};

export type ErrorResponse = {
  code: string;
  message: string;
  details?: unknown;
};

export type DoctorCheck = {
  id: string;
  result: 'pass' | 'warn' | 'fail';
  details?: string;
};

export type DoctorResponse = {
  status: 'ok' | 'warn' | 'fail';
  checks: DoctorCheck[];
};
