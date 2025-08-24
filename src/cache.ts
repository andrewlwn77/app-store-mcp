interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  key: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxSize: number;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;
  private stats: CacheStats;

  constructor(
    private maxSize: number = parseInt(process.env.CACHE_MAX_ENTRIES || '100'),
    private defaultTtl: number = parseInt(process.env.CACHE_TTL_SECONDS || '300')
  ) {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      maxSize: this.maxSize
    };
  }

  generateKey(endpoint: string, params: Record<string, any>): string {
    const keyParts = [endpoint];
    
    // Add common parameters in consistent order
    if (params.store) keyParts.push(params.store);
    if (params.term) keyParts.push(params.term);
    if (params.id) keyParts.push(params.id);
    if (params.language) keyParts.push(params.language);
    
    return keyParts.join(':');
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL expiration
    const now = Date.now();
    const age = (now - entry.timestamp) / 1000;
    
    if (age > entry.ttl) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.stats.size--;
      this.stats.misses++;
      return null;
    }

    // Update access order for LRU
    this.accessOrder.set(key, ++this.accessCounter);
    this.stats.hits++;
    
    return entry.data;
  }

  set(key: string, data: any, customTtl?: number): void {
    const ttl = customTtl || this.defaultTtl;
    
    // If key already exists, update it
    if (this.cache.has(key)) {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
        key
      });
      this.accessOrder.set(key, ++this.accessCounter);
      return;
    }

    // Check if we need to evict (LRU)
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    // Add new entry
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      key
    });
    
    this.accessOrder.set(key, ++this.accessCounter);
    this.stats.size++;
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestAccess = Number.MAX_SAFE_INTEGER;

    for (const [key, accessTime] of this.accessOrder) {
      if (accessTime < oldestAccess) {
        oldestAccess = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
      this.stats.size--;
      this.stats.evictions++;
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
    this.stats.size = 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Cleanup expired entries (can be called periodically)
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      const age = (now - entry.timestamp) / 1000;
      if (age > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.stats.size--;
    }
  }
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function paginateResults<T>(
  data: T[], 
  params: PaginationParams = {}
): PaginatedResponse<T> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, params.pageSize || parseInt(process.env.RESULTS_PER_PAGE || '10'));
  
  const total = data.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  const pageData = data.slice(startIndex, endIndex);
  
  return {
    data: pageData,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}