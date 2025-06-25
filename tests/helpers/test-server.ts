import axios from 'axios';
import * as dotenv from 'dotenv';
import {
  Store,
  AutocompleteParams,
  SearchParams,
  DetailsParams,
  ReviewsParams,
  AutocompleteResponse,
  SearchResponse,
  DetailsResponse,
  ReviewsResponse,
} from '../../src/types.js';

dotenv.config();

const API_KEY = process.env.APP_STORE_API_KEY || 'YOUR_API_KEY_HERE';
const API_HOST = 'app-stores.p.rapidapi.com';

export class AppStoreTestClient {
  private async makeApiRequest(endpoint: string, params: Record<string, string>) {
    const response = await axios.get(`https://${API_HOST}/${endpoint}`, {
      params,
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': API_HOST,
      },
    });
    return response.data;
  }

  validateStore(store: string): Store {
    if (store !== 'apple' && store !== 'google') {
      throw new Error(`Invalid store: ${store}. Must be "apple" or "google"`);
    }
    return store as Store;
  }

  async autocomplete(params: AutocompleteParams): Promise<AutocompleteResponse> {
    const store = this.validateStore(params.store);
    const data = await this.makeApiRequest('autocomplete', {
      store,
      term: params.term,
      language: params.language || 'en',
    });

    return {
      suggestions: data.suggestions || data || [],
    };
  }

  async search(params: SearchParams): Promise<SearchResponse> {
    const store = this.validateStore(params.store);
    const data = await this.makeApiRequest('search', {
      store,
      term: params.term,
      language: params.language || 'en',
    });

    return {
      results: data.results || data || [],
    };
  }

  async details(params: DetailsParams): Promise<DetailsResponse> {
    const store = this.validateStore(params.store);
    const data = await this.makeApiRequest('details', {
      store,
      id: params.id,
      language: params.language || 'en',
    });

    return {
      app: data,
    };
  }

  async reviews(params: ReviewsParams): Promise<ReviewsResponse> {
    const store = this.validateStore(params.store);
    const data = await this.makeApiRequest('reviews', {
      store,
      id: params.id,
      language: params.language || 'en',
    });

    return {
      reviews: data.reviews || data || [],
    };
  }
}

export const testClient = new AppStoreTestClient();