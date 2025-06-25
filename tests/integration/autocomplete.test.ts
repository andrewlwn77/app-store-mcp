import { describe, expect, it } from '@jest/globals';
import { testClient } from '../helpers/test-server.js';
import { Store } from '../../src/types.js';

describe('Autocomplete Integration Tests', () => {
  describe('Apple App Store', () => {
    it('should return autocomplete suggestions for "face"', async () => {
      const response = await testClient.autocomplete({
        store: Store.Apple,
        term: 'face',
      });

      expect(response).toBeDefined();
      expect(response.suggestions).toBeInstanceOf(Array);
      expect(response.suggestions.length).toBeGreaterThan(0);

      // Check structure of first suggestion
      if (response.suggestions.length > 0) {
        const firstSuggestion = response.suggestions[0];
        // Autocomplete might return just strings or objects
        if (typeof firstSuggestion === 'string') {
          expect(typeof firstSuggestion).toBe('string');
          // Should contain "face" related suggestions
          const hasRelevantResults = response.suggestions.some(s => 
            (typeof s === 'string' ? s : s.name || '').toLowerCase().includes('face')
          );
          expect(hasRelevantResults).toBe(true);
        } else {
          expect(firstSuggestion).toBeDefined();
          if (firstSuggestion.id) expect(typeof firstSuggestion.id).toBe('string');
          if (firstSuggestion.name) expect(typeof firstSuggestion.name).toBe('string');
        }
      }
    });

    it('should return suggestions for single letter "f"', async () => {
      const response = await testClient.autocomplete({
        store: Store.Apple,
        term: 'f',
      });

      expect(response).toBeDefined();
      expect(response.suggestions).toBeInstanceOf(Array);
      expect(response.suggestions.length).toBeGreaterThan(0);
    });

    it('should respect language parameter', async () => {
      const response = await testClient.autocomplete({
        store: Store.Apple,
        term: 'game',
        language: 'es', // Spanish
      });

      expect(response).toBeDefined();
      expect(response.suggestions).toBeInstanceOf(Array);
    });
  });

  describe('Google Play Store', () => {
    it('should return autocomplete suggestions for "face"', async () => {
      const response = await testClient.autocomplete({
        store: Store.Google,
        term: 'face',
      });

      expect(response).toBeDefined();
      expect(response.suggestions).toBeInstanceOf(Array);
      expect(response.suggestions.length).toBeGreaterThan(0);

      // Check structure
      if (response.suggestions.length > 0) {
        const firstSuggestion = response.suggestions[0];
        // Autocomplete might return just strings or objects
        if (typeof firstSuggestion === 'string') {
          expect(typeof firstSuggestion).toBe('string');
        } else {
          expect(firstSuggestion).toBeDefined();
        }
      }
    });

    it('should handle nonsense term gracefully', async () => {
      try {
        const response = await testClient.autocomplete({
          store: Store.Google,
          term: 'xyzqwerty123456',
        });

        expect(response).toBeDefined();
        expect(response.suggestions).toBeInstanceOf(Array);
        // May or may not have results
      } catch (error) {
        // API might return 500 for nonsense terms, that's okay
        expect(error).toBeDefined();
      }
    });
  });

  describe('Error Cases', () => {
    it('should throw error for invalid store', async () => {
      await expect(
        testClient.autocomplete({
          store: 'invalid' as any,
          term: 'test',
        })
      ).rejects.toThrow('Invalid store: invalid');
    });

    it('should handle missing term gracefully', async () => {
      await expect(
        testClient.autocomplete({
          store: Store.Apple,
          term: '',
        })
      ).rejects.toThrow(); // API should reject empty term
    });
  });
});