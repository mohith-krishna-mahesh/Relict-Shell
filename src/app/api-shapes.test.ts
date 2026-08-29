import { describe, expect, it } from 'vitest';
import {
  readAuthState,
  readCoreSettings,
  readLatestRun,
  readProjectResponse,
  readProjects,
  readRuns,
} from './api-shapes';

describe('api-shapes', () => {
  describe('readProjects', () => {
    it('parses an array of valid project objects', () => {
      const payload = [
        {
          id: 'proj-1',
          name: 'Mammoth Adaptation',
          species: 'Mammuthus primigenius',
          speciesTaxonomyId: '187135',
          scope: 'De-Extinction',
          objective: 'Cold tolerance screening',
          createdAt: '2026-08-18T00:00:00.000Z',
          _count: { runs: 3 },
        },
      ];
      const projects = readProjects(payload);
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('Mammoth Adaptation');
      expect(projects[0]._count?.runs).toBe(3);
    });

    it('filters out invalid or empty items', () => {
      expect(readProjects(null)).toEqual([]);
      expect(readProjects([null, {}, { name: 'No ID' }])).toEqual([]);
    });
  });

  describe('readProjectResponse', () => {
    it('parses single project object or nested project record', () => {
      const project = readProjectResponse({
        project: {
          id: 'proj-2',
          name: 'Cheetah Diversity',
          species: 'Acinonyx jubatus',
          speciesTaxonomyId: '9694',
          scope: 'Conservation',
          objective: 'MHC diversity analysis',
          createdAt: '2026-08-18T00:00:00.000Z',
        },
      });
      expect(project?.id).toBe('proj-2');
      expect(project?.species).toBe('Acinonyx jubatus');
    });
  });

  describe('readRuns and readLatestRun', () => {
    it('parses runs list and extracts objective from request fallback', () => {
      const payload = [
        {
          id: 'run-1',
          coreRunId: 'core-run-123',
          status: 'complete',
          request: { research_objective: 'Cold tolerance alleles' },
          createdAt: '2026-08-18T00:00:00.000Z',
        },
      ];
      const runs = readRuns(payload);
      expect(runs).toHaveLength(1);
      expect(runs[0].objective).toBe('Cold tolerance alleles');
      expect(runs[0].coreRunId).toBe('core-run-123');
    });

    it('parses latest run response safely', () => {
      const run = readLatestRun({
        run: {
          id: 'run-latest',
          status: 'running',
          objective: 'Active investigation',
          createdAt: '2026-08-18T00:00:00.000Z',
        },
      });
      expect(run?.id).toBe('run-latest');
      expect(run?.status).toBe('running');
    });
  });

  describe('readCoreSettings', () => {
    it('normalizes core settings payload', () => {
      const settings = readCoreSettings({
        connected: true,
        core: {
          baseUrl: 'https://core.example.org',
          coreVersion: '1.2.0',
        },
      });
      expect(settings.connected).toBe(true);
      expect(settings.baseUrl).toBe('https://core.example.org');
      expect(settings.version).toBe('1.2.0');
    });
  });

  describe('readAuthState', () => {
    it('parses valid authenticated auth state', () => {
      const state = readAuthState({
        authenticated: true,
        user: { id: 'usr-1', email: 'test@example.com' },
        hasCoreConnection: true,
      });
      expect(state.authenticated).toBe(true);
      expect(state.hasCoreConnection).toBe(true);
    });
  });
});
