#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosError } from 'axios';
import * as dotenv from 'dotenv';
import {
  Store,
  AutocompleteParams,
  SearchParams,
  DetailsParams,
  ReviewsParams,
  ApiError
} from './types.js';
import { CacheManager, paginateResults } from './cache.js';

dotenv.config();

const API_KEY = process.env.APP_STORE_API_KEY;
if (!API_KEY) {
  console.error('Error: APP_STORE_API_KEY environment variable is required');
  console.error('Please set it in your .env file or environment');
  console.error('Get your API key from: https://rapidapi.com/apimaker/api/app-stores');
  process.exit(1);
}
const API_HOST = 'app-stores.p.rapidapi.com';

class AppStoreMcpServer {
  private server: Server;
  private cache: CacheManager;
  private cacheEnabled: boolean;

  constructor() {
    this.cache = new CacheManager();
    this.cacheEnabled = process.env.CACHE_ENABLED !== 'false';
    this.server = new Server(
      {
        name: 'app-store-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: this.getTools(),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'app_store_autocomplete':
            return await this.handleAutocomplete(args as unknown as AutocompleteParams);
          case 'app_store_search':
            return await this.handleSearch(args as unknown as SearchParams);
          case 'app_store_details':
            return await this.handleDetails(args as unknown as DetailsParams);
          case 'app_store_reviews':
            return await this.handleReviews(args as unknown as ReviewsParams);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const apiError = this.handleError(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${apiError.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'app_store_autocomplete',
        description: 'Get app name suggestions based on a search term',
        inputSchema: {
          type: 'object',
          properties: {
            store: {
              type: 'string',
              enum: ['apple', 'google'],
              description: 'App store platform',
            },
            term: {
              type: 'string',
              description: 'Search term for autocomplete',
            },
            language: {
              type: 'string',
              description: 'Language code (e.g., "en")',
              default: 'en',
            },
            page: {
              type: 'number',
              description: 'Page number (1-based)',
              default: 1,
            },
            pageSize: {
              type: 'number',
              description: 'Number of results per page',
            },
          },
          required: ['store', 'term'],
        },
      },
      {
        name: 'app_store_search',
        description: 'Search for apps in the app store',
        inputSchema: {
          type: 'object',
          properties: {
            store: {
              type: 'string',
              enum: ['apple', 'google'],
              description: 'App store platform',
            },
            term: {
              type: 'string',
              description: 'Search term',
            },
            language: {
              type: 'string',
              description: 'Language code (e.g., "en")',
              default: 'en',
            },
            page: {
              type: 'number',
              description: 'Page number (1-based)',
              default: 1,
            },
            pageSize: {
              type: 'number',
              description: 'Number of results per page',
            },
          },
          required: ['store', 'term'],
        },
      },
      {
        name: 'app_store_details',
        description: 'Get detailed information about a specific app',
        inputSchema: {
          type: 'object',
          properties: {
            store: {
              type: 'string',
              enum: ['apple', 'google'],
              description: 'App store platform',
            },
            id: {
              type: 'string',
              description: 'App ID (bundle ID for iOS, package name for Android)',
            },
            language: {
              type: 'string',
              description: 'Language code (e.g., "en")',
              default: 'en',
            },
          },
          required: ['store', 'id'],
        },
      },
      {
        name: 'app_store_reviews',
        description: 'Get reviews for a specific app',
        inputSchema: {
          type: 'object',
          properties: {
            store: {
              type: 'string',
              enum: ['apple', 'google'],
              description: 'App store platform',
            },
            id: {
              type: 'string',
              description: 'App ID (bundle ID for iOS, package name for Android)',
            },
            language: {
              type: 'string',
              description: 'Language code (e.g., "en")',
              default: 'en',
            },
            page: {
              type: 'number',
              description: 'Page number (1-based)',
              default: 1,
            },
            pageSize: {
              type: 'number',
              description: 'Number of results per page',
            },
          },
          required: ['store', 'id'],
        },
      },
    ];
  }

  private validateStore(store: string): Store {
    if (store !== 'apple' && store !== 'google') {
      throw new Error(`Invalid store: ${store}. Must be "apple" or "google"`);
    }
    return store as Store;
  }

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

  private async handleAutocomplete(params: AutocompleteParams) {
    const store = this.validateStore(params.store);
    const cacheKey = this.cache.generateKey('autocomplete', { store, term: params.term, language: params.language });
    
    // Try cache first
    let allSuggestions: any[] = [];
    if (this.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        allSuggestions = cached.suggestions || [];
        const paginated = paginateResults(allSuggestions, { page: params.page, pageSize: params.pageSize });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                suggestions: paginated.data,
                pagination: paginated.pagination,
                cached: true
              }, null, 2),
            },
          ],
        };
      }
    }

    // Make API request
    const data = await this.makeApiRequest('autocomplete', {
      store,
      term: params.term,
      language: params.language || 'en',
    });

    allSuggestions = data.suggestions || data || [];
    
    // Cache the full results
    if (this.cacheEnabled && allSuggestions.length > 0) {
      this.cache.set(cacheKey, { suggestions: allSuggestions });
    }

    // Return paginated results
    const paginated = paginateResults(allSuggestions, { page: params.page, pageSize: params.pageSize });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            suggestions: paginated.data,
            pagination: paginated.pagination,
            cached: false
          }, null, 2),
        },
      ],
    };
  }

  private async handleSearch(params: SearchParams) {
    const store = this.validateStore(params.store);
    const cacheKey = this.cache.generateKey('search', { store, term: params.term, language: params.language });
    
    // Try cache first
    let allResults: any[] = [];
    if (this.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        allResults = cached.results || [];
        const paginated = paginateResults(allResults, { page: params.page, pageSize: params.pageSize });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                results: paginated.data,
                pagination: paginated.pagination,
                cached: true
              }, null, 2),
            },
          ],
        };
      }
    }

    // Make API request
    const data = await this.makeApiRequest('search', {
      store,
      term: params.term,
      language: params.language || 'en',
    });

    allResults = data.results || data || [];
    
    // Cache the full results
    if (this.cacheEnabled && allResults.length > 0) {
      this.cache.set(cacheKey, { results: allResults });
    }

    // Return paginated results
    const paginated = paginateResults(allResults, { page: params.page, pageSize: params.pageSize });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            results: paginated.data,
            pagination: paginated.pagination,
            cached: false
          }, null, 2),
        },
      ],
    };
  }

  private async handleDetails(params: DetailsParams) {
    const store = this.validateStore(params.store);
    const cacheKey = this.cache.generateKey('details', { store, id: params.id, language: params.language });
    
    // Try cache first
    if (this.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                app: cached.app,
                cached: true
              }, null, 2),
            },
          ],
        };
      }
    }

    // Make API request
    const data = await this.makeApiRequest('details', {
      store,
      id: params.id,
      language: params.language || 'en',
    });

    // Cache the result
    if (this.cacheEnabled) {
      this.cache.set(cacheKey, { app: data });
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            app: data,
            cached: false
          }, null, 2),
        },
      ],
    };
  }

  private async handleReviews(params: ReviewsParams) {
    const store = this.validateStore(params.store);
    const cacheKey = this.cache.generateKey('reviews', { store, id: params.id, language: params.language });
    
    // Try cache first
    let allReviews: any[] = [];
    if (this.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        allReviews = cached.reviews || [];
        const paginated = paginateResults(allReviews, { page: params.page, pageSize: params.pageSize });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                reviews: paginated.data,
                pagination: paginated.pagination,
                cached: true
              }, null, 2),
            },
          ],
        };
      }
    }

    // Make API request
    const data = await this.makeApiRequest('reviews', {
      store,
      id: params.id,
      language: params.language || 'en',
    });

    allReviews = data.reviews || data || [];
    
    // Cache the full results
    if (this.cacheEnabled && allReviews.length > 0) {
      this.cache.set(cacheKey, { reviews: allReviews });
    }

    // Return paginated results
    const paginated = paginateResults(allReviews, { page: params.page, pageSize: params.pageSize });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            reviews: paginated.data,
            pagination: paginated.pagination,
            cached: false
          }, null, 2),
        },
      ],
    };
  }

  private handleError(error: unknown): ApiError {
    if (error instanceof AxiosError) {
      return {
        error: 'API Error',
        message: error.response?.data?.message || error.message,
        statusCode: error.response?.status,
      };
    }
    
    if (error instanceof Error) {
      return {
        error: 'Server Error',
        message: error.message,
      };
    }

    return {
      error: 'Unknown Error',
      message: 'An unexpected error occurred',
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('App Store MCP server running on stdio');
  }
}

const server = new AppStoreMcpServer();
server.run().catch(console.error);