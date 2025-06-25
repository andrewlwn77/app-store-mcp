import { describe, expect, it } from '@jest/globals';
import { testClient } from '../helpers/test-server.js';
import { Store } from '../../src/types.js';

describe('Search Integration Tests', () => {
  describe('Apple App Store', () => {
    it('should search for "meditation" apps', async () => {
      const response = await testClient.search({
        store: Store.Apple,
        term: 'meditation',
      });

      expect(response).toBeDefined();
      expect(response.results).toBeInstanceOf(Array);
      expect(response.results.length).toBeGreaterThan(0);

      // Check structure of first result
      if (response.results.length > 0) {
        const firstResult = response.results[0];
        expect(firstResult).toHaveProperty('id');
        expect(firstResult).toHaveProperty('name');
        expect(firstResult).toHaveProperty('developer');
        // Icon might be a string or an object with size properties
        if (typeof firstResult.icon === 'string') {
          expect(typeof firstResult.icon).toBe('string');
        } else if (firstResult.icons) {
          expect(firstResult.icons).toHaveProperty('small');
        }
        
        expect(['string', 'number']).toContain(typeof firstResult.id);
        expect(typeof firstResult.name).toBe('string');
        expect(['string', 'object']).toContain(typeof firstResult.developer);
        
        // Optional fields
        if (firstResult.rating !== undefined) {
          expect(typeof firstResult.rating).toBe('number');
        }
        if (firstResult.price !== undefined) {
          expect(['string', 'object']).toContain(typeof firstResult.price);
        }
      }
    });

    it('should search for "spotify" and find the official app', async () => {
      const response = await testClient.search({
        store: Store.Apple,
        term: 'spotify',
      });

      expect(response.results).toBeInstanceOf(Array);
      expect(response.results.length).toBeGreaterThan(0);
      
      // Should find Spotify
      const spotifyApp = response.results.find(app => {
        const devName = typeof app.developer === 'string' 
          ? app.developer 
          : app.developer.name;
        return app.name.toLowerCase().includes('spotify') &&
               devName.toLowerCase().includes('spotify');
      });
      expect(spotifyApp).toBeDefined();
    });

    it('should return results with language parameter', async () => {
      const response = await testClient.search({
        store: Store.Apple,
        term: 'music',
        language: 'fr', // French
      });

      expect(response).toBeDefined();
      expect(response.results).toBeInstanceOf(Array);
    });
  });

  describe('Google Play Store', () => {
    it('should search for "sleep" apps', async () => {
      const response = await testClient.search({
        store: Store.Google,
        term: 'sleep',
      });

      expect(response).toBeDefined();
      expect(response.results).toBeInstanceOf(Array);
      expect(response.results.length).toBeGreaterThan(0);

      // Verify result structure
      if (response.results.length > 0) {
        const firstResult = response.results[0];
        expect(firstResult).toHaveProperty('id');
        expect(firstResult).toHaveProperty('name');
        expect(firstResult).toHaveProperty('developer');
        // Icon might be a string or an object
        if (typeof firstResult.icon === 'string') {
          expect(typeof firstResult.icon).toBe('string');
        } else if (firstResult.icons) {
          expect(firstResult.icons).toBeDefined();
        }
      }
    });

    it('should find popular apps like WhatsApp', async () => {
      const response = await testClient.search({
        store: Store.Google,
        term: 'whatsapp',
      });

      expect(response.results.length).toBeGreaterThan(0);
      
      const whatsappApp = response.results.find(app => {
        const devName = typeof app.developer === 'string' 
          ? app.developer 
          : app.developer.name;
        return app.id === 'com.whatsapp' || 
               (app.name.toLowerCase().includes('whatsapp') && 
                devName.toLowerCase().includes('whatsapp'));
      });
      expect(whatsappApp).toBeDefined();
    });

    it('should handle special characters in search term', async () => {
      const response = await testClient.search({
        store: Store.Google,
        term: 'photo & video',
      });

      expect(response).toBeDefined();
      expect(response.results).toBeInstanceOf(Array);
      // Should not error out
    });
  });

  describe('Error Cases', () => {
    it('should throw error for invalid store', async () => {
      await expect(
        testClient.search({
          store: 'microsoft' as any,
          term: 'test',
        })
      ).rejects.toThrow('Invalid store: microsoft');
    });

    it('should handle very long search terms', async () => {
      const longTerm = 'a'.repeat(100);
      
      // Should not crash, may return empty results
      const response = await testClient.search({
        store: Store.Apple,
        term: longTerm,
      });

      expect(response).toBeDefined();
      expect(response.results).toBeInstanceOf(Array);
    });
  });
});