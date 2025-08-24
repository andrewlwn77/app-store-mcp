export enum Store {
  Apple = 'apple',
  Google = 'google'
}

export interface BaseParams {
  store: Store;
  language?: string;
  page?: number;
  pageSize?: number;
}

export interface AutocompleteParams extends BaseParams {
  term: string;
}

export interface SearchParams extends BaseParams {
  term: string;
}

export interface DetailsParams extends BaseParams {
  id: string;
}

export interface ReviewsParams extends BaseParams {
  id: string;
}

export interface AppSuggestion {
  id?: string;
  name?: string;
  icon?: string;
  // Autocomplete might return just strings
  [key: string]: any;
}

export interface AppSearchResult {
  id: string | number;
  name: string;
  developer: string | { id: number; name: string; url: string };
  icon?: string;
  icons?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  rating?: number;
  price?: string | { display: string; raw: number; currency: string };
  description?: string;
  ratings?: {
    average: number;
    total: number;
  };
}

export interface AppDetails {
  id: string | number;
  name: string;
  developer: string | { id: number; name: string; url: string };
  icon?: string;
  screenshots: string[];
  description: string;
  rating?: number;
  ratingsCount?: number;
  price?: string | { display: string; raw: number; currency: string };
  genre?: string;
  category?: string;
  lastUpdated?: string;
  updatedAt?: string;
  version?: string;
  currentVersion?: string;
  size?: string;
  appSize?: string;
  contentRating?: string;
  url?: string;
}

export interface Review {
  id: string;
  author: string | { name: string; url?: string; image?: string };
  rating: number;
  date: string;
  content: {
    title?: string | null;
    body: string;
  };
  link?: string;
}

export interface AutocompleteResponse {
  suggestions: AppSuggestion[];
}

export interface SearchResponse {
  results: AppSearchResult[];
}

export interface DetailsResponse {
  app: AppDetails;
}

export interface ReviewsResponse {
  reviews: Review[];
}

export interface ApiError {
  error: string;
  message: string;
  statusCode?: number;
}