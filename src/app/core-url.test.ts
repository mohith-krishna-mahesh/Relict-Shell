import { describe, expect, it } from 'vitest';
import { normalizeCoreBaseUrl } from '../../server/src/lib/validation';

describe('normalizeCoreBaseUrl', () => {
  it('accepts https URLs', () => {
    expect(normalizeCoreBaseUrl('https://core.example.com/')).toBe('https://core.example.com');
    expect(normalizeCoreBaseUrl('https://api.relict.bio/v1')).toBe('https://api.relict.bio/v1');
  });

  it('accepts http URLs for local and remote hosts', () => {
    expect(normalizeCoreBaseUrl('http://localhost:8000')).toBe('http://localhost:8000');
    expect(normalizeCoreBaseUrl('http://127.0.0.1:8000')).toBe('http://127.0.0.1:8000');
    expect(normalizeCoreBaseUrl('http://core.internal:8000/')).toBe('http://core.internal:8000');
    expect(normalizeCoreBaseUrl('http://192.168.1.100:8000')).toBe('http://192.168.1.100:8000');
    expect(normalizeCoreBaseUrl('http://custom-core-server.com:3000')).toBe('http://custom-core-server.com:3000');
  });

  it('rejects non-http/https protocols', () => {
    expect(() => normalizeCoreBaseUrl('ftp://core.example.com')).toThrow('Core URL must use HTTP or HTTPS');
    expect(() => normalizeCoreBaseUrl('ws://core.example.com')).toThrow('Core URL must use HTTP or HTTPS');
  });

  it('rejects URLs with credentials, search queries, or fragments', () => {
    expect(() => normalizeCoreBaseUrl('http://user:pass@core.example.com')).toThrow('credentials');
    expect(() => normalizeCoreBaseUrl('http://core.example.com?query=1')).toThrow('query');
    expect(() => normalizeCoreBaseUrl('http://core.example.com#fragment')).toThrow('fragment');
  });
});
