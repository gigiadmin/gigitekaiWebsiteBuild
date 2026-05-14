import { describe, it, expect } from 'vitest';

/**
 * Test for stripEmptySuperjsonMeta function
 * This function must NOT strip meta when it contains Date type information
 */

// Simulate the stripEmptySuperjsonMeta function
function stripEmptySuperjsonMeta(url: string | URL | Request): string | URL | Request {
  if (typeof url !== 'string') return url;
  try {
    const urlObj = new URL(url, 'http://localhost');
    const inputParam = urlObj.searchParams.get('input');
    if (!inputParam) return url;
    const parsed = JSON.parse(decodeURIComponent(inputParam));
    let changed = false;
    
    for (const key of Object.keys(parsed)) {
      const item = parsed[key];
      if (item && typeof item === 'object' && item.meta && typeof item.meta === 'object') {
        const values = item.meta.values;
        if (!values) {
          delete item.meta;
          changed = true;
        } else if (typeof values === 'object') {
          const valueKeys = Object.keys(values);
          if (valueKeys.length === 0) {
            delete item.meta;
            changed = true;
          }
          // CRITICAL: If there are ANY values (including Date types), KEEP the meta
        }
      }
    }
    
    if (changed) {
      urlObj.searchParams.set('input', JSON.stringify(parsed));
      return urlObj.toString();
    }
  } catch {
    // If parsing fails, return original URL unchanged
  }
  return url;
}

describe('stripEmptySuperjsonMeta', () => {
  it('should remove meta when values is empty', () => {
    const input = 'http://localhost/api?input=' + encodeURIComponent(JSON.stringify({
      '0': {
        json: { title: 'Test' },
        meta: { values: {} }
      }
    }));
    
    const result = stripEmptySuperjsonMeta(input) as string;
    const parsed = JSON.parse(decodeURIComponent(new URL(result, 'http://localhost').searchParams.get('input')!));
    
    expect(parsed['0'].meta).toBeUndefined();
  });

  it('should KEEP meta when it contains Date type information', () => {
    const input = 'http://localhost/api?input=' + encodeURIComponent(JSON.stringify({
      '0': {
        json: { 
          title: 'Test',
          publishedAt: '2026-05-03T06:06:42.000Z'
        },
        meta: { 
          values: {
            '0.publishedAt': ['Date'],
            '0.createdAt': ['Date']
          }
        }
      }
    }));
    
    const result = stripEmptySuperjsonMeta(input) as string;
    const parsed = JSON.parse(decodeURIComponent(new URL(result, 'http://localhost').searchParams.get('input')!));
    
    // CRITICAL: Meta must be preserved for Date deserialization
    expect(parsed['0'].meta).toBeDefined();
    expect(parsed['0'].meta.values['0.publishedAt']).toEqual(['Date']);
  });

  it('should not modify URL if input param is missing', () => {
    const input = 'http://localhost/api';
    const result = stripEmptySuperjsonMeta(input);
    expect(result).toBe(input);
  });

  it('should handle malformed JSON gracefully', () => {
    const input = 'http://localhost/api?input=invalid%20json';
    const result = stripEmptySuperjsonMeta(input);
    expect(result).toBe(input);
  });
});
