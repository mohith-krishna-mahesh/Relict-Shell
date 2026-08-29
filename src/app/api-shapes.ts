import type { CoreSettings, Project, RunRecord, UserProfile } from './types';
import { asNumber, asRecord, asString } from './utils';

export interface AuthState {
  authenticated: boolean;
  user: UserProfile | null;
  hasCoreConnection: boolean;
}

export function readAuthState(payload: unknown): AuthState {
  const record = asRecord(payload);
  if (record && typeof record.authenticated === 'boolean') {
    return { authenticated: record.authenticated, user: asRecord(record.user) as UserProfile | null, hasCoreConnection: record.hasCoreConnection === true };
  }
  return { authenticated: Boolean(record), user: record as UserProfile | null, hasCoreConnection: false };
}

function readProject(value: unknown): Project | null {
  const item = asRecord(value);
  const id = asString(item?.id);
  if (!item || !id) return null;
  const count = asNumber(asRecord(item._count)?.runs) ?? asNumber(item.runCount);
  return { ...item, id, name: asString(item.name) ?? 'Untitled project', species: asString(item.species) ?? 'Unknown species', speciesTaxonomyId: asString(item.speciesTaxonomyId) ?? '', scope: asString(item.scope) ?? '', objective: asString(item.objective) ?? '', createdAt: asString(item.createdAt) ?? new Date(0).toISOString(), _count: count === undefined ? undefined : { runs: count } };
}

export function readProjects(payload: unknown): Project[] {
  const record = asRecord(payload);
  const values = Array.isArray(payload) ? payload : Array.isArray(record?.projects) ? record.projects : [];
  return values.map(readProject).filter((project): project is Project => project !== null);
}

export function readProjectResponse(payload: unknown): Project | null {
  const record = asRecord(payload);
  return readProject(record?.project ?? payload);
}

function readRun(value: unknown): RunRecord | null {
  const item = asRecord(value);
  const id = asString(item?.id);
  if (!item || !id) return null;
  const request = asRecord(item.request);
  return { id, coreRunId: asString(item.coreRunId) ?? '', status: asString(item.status) ?? 'unknown', objective: asString(item.objective) ?? asString(request?.research_objective) ?? asString(request?.objective) ?? 'Untitled investigation', result: item.result, createdAt: asString(item.createdAt) ?? new Date(0).toISOString() };
}

export function readRuns(payload: unknown): RunRecord[] {
  const record = asRecord(payload);
  const values = Array.isArray(payload) ? payload : Array.isArray(record?.runs) ? record.runs : [];
  return values.map(readRun).filter((run): run is RunRecord => run !== null);
}

export function readLatestRun(payload: unknown): RunRecord | null {
  const record = asRecord(payload);
  return readRun(record && 'run' in record ? record.run : payload);
}

export function readCoreSettings(payload: unknown): CoreSettings {
  const record = asRecord(payload);
  const core = asRecord(record?.core) ?? record;
  return { baseUrl: asString(core?.baseUrl), connected: record?.connected === true, version: asString(core?.coreVersion) ?? asString(core?.version), apiKeyConfigured: record?.connected === true };
}
