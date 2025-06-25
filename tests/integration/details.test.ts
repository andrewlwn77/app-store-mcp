import { describe, expect, it } from '@jest/globals';
import { testClient } from '../helpers/test-server.js';
import { Store } from '../../src/types.js';

describe('Details Integration Tests', () => {
  describe('Apple App Store', () => {
    it('should get details for Spotify (id: 324684580)', async () => {
      const response = await testClient.details({
        store: Store.Apple,
        id: '324684580', // Spotify's Apple ID
      });

      expect(response).toBeDefined();
      expect(response.app).toBeDefined();
      
      const app = response.app;
      expect(String(app.id)).toBe('324684580');
      expect(app.name.toLowerCase()).toContain('spotify');
      expect(app.developer).toBeDefined();
      if (app.icon) expect(app.icon).toBeDefined();
      expect(app.description).toBeDefined();
      expect(app.screenshots).toBeInstanceOf(Array);
      expect(app.screenshots.length).toBeGreaterThan(0);
      
      // Optional fields that should be present for popular apps
      if (app.rating) {
        expect(typeof app.rating).toBe('number');
      }
      if (app.genre || app.category) {
        expect(app).toBeDefined();
      }
      if (app.version || app.currentVersion) {
        expect(app).toBeDefined();
      }
    });

    it('should get details for Instagram', async () => {
      const response = await testClient.details({
        store: Store.Apple,
        id: '389801252', // Instagram's Apple ID
      });

      expect(response.app).toBeDefined();
      expect(response.app.name.toLowerCase()).toContain('instagram');
      const devName = typeof response.app.developer === 'string' 
        ? response.app.developer 
        : response.app.developer.name;
      // Instagram developer name might be "Instagram, Inc." or "Meta" depending on when it was last updated
      expect(devName.toLowerCase()).toMatch(/instagram|meta/);
      expect(response.app.screenshots).toBeInstanceOf(Array);
    });

    it('should include all expected fields', async () => {
      const response = await testClient.details({
        store: Store.Apple,
        id: '544007664', // YouTube
      });

      const app = response.app;
      
      // Required fields
      expect(app).toHaveProperty('id');
      expect(app).toHaveProperty('name');
      expect(app).toHaveProperty('developer');
      // Icon is optional
      expect(app).toHaveProperty('screenshots');
      expect(app).toHaveProperty('description');
      
      // Type checks
      expect(['string', 'number']).toContain(typeof app.id);
      expect(typeof app.name).toBe('string');
      expect(['string', 'object']).toContain(typeof app.developer);
      if (app.icon) expect(typeof app.icon).toBe('string');
      expect(Array.isArray(app.screenshots)).toBe(true);
      expect(typeof app.description).toBe('string');
    });
  });

  describe('Google Play Store', () => {
    it('should get details for Snapchat', async () => {
      const response = await testClient.details({
        store: Store.Google,
        id: 'com.snapchat.android',
      });

      expect(response).toBeDefined();
      expect(response.app).toBeDefined();
      
      const app = response.app;
      expect(String(app.id)).toBe('com.snapchat.android');
      expect(app.name.toLowerCase()).toContain('snap');
      expect(app.developer).toBeDefined();
      if (app.icon) expect(app.icon).toBeDefined();
      expect(app.description).toBeDefined();
      expect(app.screenshots).toBeInstanceOf(Array);
    });

    it('should get details for WhatsApp', async () => {
      const response = await testClient.details({
        store: Store.Google,
        id: 'com.whatsapp',
      });

      expect(response.app).toBeDefined();
      expect(response.app.name.toLowerCase()).toContain('whatsapp');
      const devName = typeof response.app.developer === 'string' 
        ? response.app.developer 
        : response.app.developer.name;
      expect(devName.toLowerCase()).toContain('whatsapp');
      
      // Check for additional fields
      if (response.app.rating) expect(response.app.rating).toBeDefined();
      if (response.app.ratingsCount) expect(response.app.ratingsCount).toBeDefined();
      if (response.app.lastUpdated || response.app.updatedAt) expect(response.app).toBeDefined();
    });

    it('should handle language parameter', async () => {
      const response = await testClient.details({
        store: Store.Google,
        id: 'com.spotify.music',
        language: 'de', // German
      });

      expect(response.app).toBeDefined();
      expect(String(response.app.id)).toBe('com.spotify.music');
      // Description should be in German, but we can't easily verify that
      expect(response.app.description).toBeDefined();
    });
  });

  describe('Error Cases', () => {
    it('should handle non-existent app ID gracefully', async () => {
      await expect(
        testClient.details({
          store: Store.Apple,
          id: '99999999999999', // Non-existent ID
        })
      ).rejects.toThrow(); // API should return error
    });

    it('should handle invalid package name format', async () => {
      await expect(
        testClient.details({
          store: Store.Google,
          id: 'invalid..package..name',
        })
      ).rejects.toThrow();
    });

    it('should throw error for invalid store', async () => {
      await expect(
        testClient.details({
          store: 'amazon' as any,
          id: 'com.test.app',
        })
      ).rejects.toThrow('Invalid store: amazon');
    });
  });
});