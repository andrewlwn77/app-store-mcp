import { describe, expect, it } from '@jest/globals';
import { AppStoreTestClient } from '../helpers/test-server.js';

describe('Validation Tests', () => {
  const client = new AppStoreTestClient();

  describe('validateStore', () => {
    it('should accept "apple" as a valid store', () => {
      expect(() => client.validateStore('apple')).not.toThrow();
      expect(client.validateStore('apple')).toBe('apple');
    });

    it('should accept "google" as a valid store', () => {
      expect(() => client.validateStore('google')).not.toThrow();
      expect(client.validateStore('google')).toBe('google');
    });

    it('should throw error for invalid store "amazon"', () => {
      expect(() => client.validateStore('amazon')).toThrow(
        'Invalid store: amazon. Must be "apple" or "google"'
      );
    });

    it('should throw error for invalid store "windows"', () => {
      expect(() => client.validateStore('windows')).toThrow(
        'Invalid store: windows. Must be "apple" or "google"'
      );
    });

    it('should throw error for empty string', () => {
      expect(() => client.validateStore('')).toThrow(
        'Invalid store: . Must be "apple" or "google"'
      );
    });

    it('should throw error for null/undefined', () => {
      expect(() => client.validateStore(null as any)).toThrow();
      expect(() => client.validateStore(undefined as any)).toThrow();
    });

    it('should be case sensitive', () => {
      expect(() => client.validateStore('Apple')).toThrow(
        'Invalid store: Apple. Must be "apple" or "google"'
      );
      expect(() => client.validateStore('GOOGLE')).toThrow(
        'Invalid store: GOOGLE. Must be "apple" or "google"'
      );
    });
  });
});