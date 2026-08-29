import { describe, expect, it } from 'vitest';
import {
  asNumber,
  asRecord,
  asString,
  formatDate,
  formatRelativeDate,
  getErrorMessage,
  statusTone,
} from './utils';

describe('utils', () => {
  describe('statusTone', () => {
    it('returns green emerald tone for completed/complete/succeeded', () => {
      expect(statusTone('COMPLETE')).toContain('emerald');
      expect(statusTone('completed')).toContain('emerald');
      expect(statusTone('succeeded')).toContain('emerald');
    });

    it('returns red tone for failed/error', () => {
      expect(statusTone('FAILED')).toContain('red');
      expect(statusTone('error')).toContain('red');
    });

    it('returns amber yellow tone for running', () => {
      expect(statusTone('RUNNING')).toContain('amber');
    });

    it('returns blue tone for queued', () => {
      expect(statusTone('QUEUED')).toContain('blue');
    });

    it('returns neutral tone for unknown status', () => {
      expect(statusTone('UNKNOWN')).toContain('ring-');
    });
  });

  describe('formatRelativeDate', () => {
    it('formats recent timestamps as "Just now"', () => {
      expect(formatRelativeDate(new Date().toISOString())).toBe('Just now');
    });

    it('formats minutes ago correctly', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60_000).toISOString();
      expect(formatRelativeDate(tenMinutesAgo)).toBe('10m ago');
    });

    it('formats hours ago correctly', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600_000).toISOString();
      expect(formatRelativeDate(twoHoursAgo)).toBe('2h ago');
    });

    it('formats days ago correctly', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400_000).toISOString();
      expect(formatRelativeDate(threeDaysAgo)).toBe('3d ago');
    });

    it('handles invalid dates gracefully', () => {
      expect(formatRelativeDate('invalid-date-string')).toBe('Unknown');
    });
  });

  describe('formatDate', () => {
    it('formats valid ISO dates', () => {
      const date = '2026-08-18T00:00:00.000Z';
      const formatted = formatDate(date, { month: 'short', day: 'numeric', year: 'numeric' });
      expect(formatted).toContain('2026');
    });

    it('handles invalid dates gracefully', () => {
      expect(formatDate('invalid')).toBe('Unknown date');
    });
  });

  describe('getErrorMessage', () => {
    it('extracts error message from Error instances', () => {
      expect(getErrorMessage(new Error('Network error'))).toBe('Network error');
    });

    it('uses fallback message for non-Error types', () => {
      expect(getErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
      expect(getErrorMessage('some string error', 'Default error')).toBe('Default error');
    });
  });

  describe('type cast helpers', () => {
    it('asRecord returns record for objects and null for non-objects', () => {
      expect(asRecord({ key: 'val' })).toEqual({ key: 'val' });
      expect(asRecord([1, 2, 3])).toBeNull();
      expect(asRecord(null)).toBeNull();
      expect(asRecord('string')).toBeNull();
    });

    it('asString returns string or undefined', () => {
      expect(asString('hello')).toBe('hello');
      expect(asString(123)).toBeUndefined();
      expect(asString(null)).toBeUndefined();
    });

    it('asNumber returns finite number or undefined', () => {
      expect(asNumber(42)).toBe(42);
      expect(asNumber(0)).toBe(0);
      expect(asNumber(NaN)).toBeUndefined();
      expect(asNumber(Infinity)).toBeUndefined();
      expect(asNumber('42')).toBeUndefined();
    });
  });
});
