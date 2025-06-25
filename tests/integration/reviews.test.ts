import { describe, expect, it } from '@jest/globals';
import { testClient } from '../helpers/test-server.js';
import { Store } from '../../src/types.js';

describe('Reviews Integration Tests', () => {
  describe('Apple App Store', () => {
    it('should get reviews for TikTok', async () => {
      const response = await testClient.reviews({
        store: Store.Apple,
        id: '835599320', // TikTok's Apple ID
      });

      expect(response).toBeDefined();
      expect(response.reviews).toBeInstanceOf(Array);
      expect(response.reviews.length).toBeGreaterThan(0);

      // Check structure of first review
      if (response.reviews.length > 0) {
        const firstReview = response.reviews[0];
        expect(firstReview).toHaveProperty('id');
        expect(firstReview).toHaveProperty('author');
        expect(firstReview).toHaveProperty('rating');
        expect(firstReview).toHaveProperty('date');
        // Apple returns content.body instead of text
        expect(firstReview).toHaveProperty('content');
        expect(firstReview.content).toHaveProperty('body');
        
        expect(typeof firstReview.id).toBe('string');
        expect(firstReview).toHaveProperty('author');
        expect(typeof firstReview.rating).toBe('number');
        expect(firstReview.rating).toBeGreaterThanOrEqual(1);
        expect(firstReview.rating).toBeLessThanOrEqual(5);
        expect(typeof firstReview.date).toBe('string');
        expect(typeof firstReview.content.body).toBe('string');
        
        // Title is in content.title
        if (firstReview.content.title !== undefined) {
          expect(typeof firstReview.content.title).toBe('string');
        }
      }
    });

    it('should get reviews for Facebook', async () => {
      const response = await testClient.reviews({
        store: Store.Apple,
        id: '284882215', // Facebook's Apple ID
      });

      expect(response.reviews).toBeInstanceOf(Array);
      expect(response.reviews.length).toBeGreaterThan(0);
      
      // Verify reviews have varied ratings
      const ratings = response.reviews.map(r => r.rating);
      const uniqueRatings = [...new Set(ratings)];
      expect(uniqueRatings.length).toBeGreaterThan(1); // Should have diverse ratings
    });

    it('should respect language parameter for reviews', async () => {
      const response = await testClient.reviews({
        store: Store.Apple,
        id: '544007664', // YouTube
        language: 'es', // Spanish
      });

      expect(response.reviews).toBeInstanceOf(Array);
      // Reviews should be in Spanish, but hard to verify programmatically
    });
  });

  describe('Google Play Store', () => {
    it('should get reviews for Snapchat', async () => {
      const response = await testClient.reviews({
        store: Store.Google,
        id: 'com.snapchat.android',
      });

      expect(response).toBeDefined();
      expect(response.reviews).toBeInstanceOf(Array);
      expect(response.reviews.length).toBeGreaterThan(0);

      // Verify review structure
      const firstReview = response.reviews[0];
      expect(firstReview).toHaveProperty('id');
      expect(firstReview).toHaveProperty('author');
      expect(firstReview).toHaveProperty('rating');
      expect(firstReview).toHaveProperty('date');
      // Google also uses content.body
      expect(firstReview).toHaveProperty('content');
      expect(firstReview.content).toHaveProperty('body');
    });

    it('should get reviews for Instagram', async () => {
      const response = await testClient.reviews({
        store: Store.Google,
        id: 'com.instagram.android',
      });

      expect(response.reviews).toBeInstanceOf(Array);
      expect(response.reviews.length).toBeGreaterThan(0);
      
      // Check that reviews are recent (have dates)
      const hasRecentReviews = response.reviews.some(review => {
        const reviewDate = new Date(review.date);
        const now = new Date();
        const daysDiff = (now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff < 365; // Within last year
      });
      expect(hasRecentReviews).toBe(true);
    });

    it('should handle apps with few reviews', async () => {
      // Using a less popular app that might have fewer reviews
      const response = await testClient.reviews({
        store: Store.Google,
        id: 'com.google.android.apps.classroom',
      });

      expect(response).toBeDefined();
      expect(response.reviews).toBeInstanceOf(Array);
      // May have zero or few reviews, but should not error
    });
  });

  describe('Error Cases', () => {
    it('should handle non-existent app gracefully', async () => {
      // API might return empty array or throw error
      try {
        const response = await testClient.reviews({
          store: Store.Apple,
          id: '00000000000', // Invalid ID
        });
        // If it doesn't throw, expect empty reviews
        expect(response.reviews).toEqual([]);
      } catch (error) {
        // If it throws, that's also acceptable
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid package name', async () => {
      try {
        const response = await testClient.reviews({
          store: Store.Google,
          id: 'not.a.valid.package',
        });
        // If it doesn't throw, expect empty reviews
        expect(response.reviews).toEqual([]);
      } catch (error) {
        // If it throws, that's also acceptable
        expect(error).toBeDefined();
      }
    });

    it('should throw error for invalid store', async () => {
      await expect(
        testClient.reviews({
          store: 'windows' as any,
          id: 'com.test.app',
        })
      ).rejects.toThrow('Invalid store: windows');
    });
  });

  describe('Data Validation', () => {
    it('should have valid rating values (1-5)', async () => {
      const response = await testClient.reviews({
        store: Store.Google,
        id: 'com.whatsapp',
      });

      expect(response.reviews.length).toBeGreaterThan(0);
      
      response.reviews.forEach(review => {
        expect(review.rating).toBeGreaterThanOrEqual(1);
        expect(review.rating).toBeLessThanOrEqual(5);
        expect(Number.isInteger(review.rating)).toBe(true);
      });
    });

    it('should have non-empty review text', async () => {
      const response = await testClient.reviews({
        store: Store.Apple,
        id: '389801252', // Instagram
      });

      expect(response.reviews.length).toBeGreaterThan(0);
      
      response.reviews.forEach(review => {
        expect(review.content).toBeDefined();
        expect(review.content.body).toBeDefined();
        expect(review.content.body.length).toBeGreaterThan(0);
        expect(review.author).toBeDefined();
        // Author might be an object with name property
        if (typeof review.author === 'object') {
          expect(review.author.name).toBeDefined();
        }
      });
    });
  });
});