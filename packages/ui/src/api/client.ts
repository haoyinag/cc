import axios from 'axios';
import type { ActionResponse, DoctorResponse, LogEntry, StateResponse } from '@shared';

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000
});

export const fetchState = async (): Promise<StateResponse> => {
  const { data } = await instance.get<StateResponse>('/state');
  return data;
};

export const enableModule = async (id: string): Promise<ActionResponse> => {
  const { data } = await instance.post<ActionResponse>(`/modules/${id}/enable`);
  return data;
};

export const disableModule = async (id: string): Promise<ActionResponse> => {
  const { data } = await instance.post<ActionResponse>(`/modules/${id}/disable`);
  return data;
};

export const runSetup = async (): Promise<ActionResponse> => {
  const { data } = await instance.post<ActionResponse>('/actions/setup');
  return data;
};

export const runDoctor = async (): Promise<DoctorResponse> => {
  const { data } = await instance.post<DoctorResponse>('/actions/doctor');
  return data;
};

export const fetchLogs = async (): Promise<LogEntry[]> => {
  const { data } = await instance.get<{ logs: LogEntry[] }>('/logs');
  return data.logs;
};
