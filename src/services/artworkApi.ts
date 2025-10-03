import type {
  ApiResponse,
  ApiService,
  ApiRequestOptions,
  NetworkError,
  NetworkErrorType,
} from '@/types';
import { API_CONFIG, ERROR_MESSAGES } from '@/types';

/**
 * API service for fetching artwork data from the Art Institute of Chicago API
 */
export class ArtworkApiService implements ApiService {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = API_CONFIG.RETRY_DELAY;
  }

  /**
   * Fetch artworks for a specific page
   */
  async fetchArtworks(page: number, options: ApiRequestOptions = {}): Promise<ApiResponse> {
    const url = this.buildApiUrl(page, options.limit);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.timeout);

    try {
      const response = await this.fetchWithRetry(url, {
        signal: options.signal || controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.handleError(error, url);
    }
  }

  /**
   * Build API URL with page and limit parameters
   */
  buildApiUrl(page: number, limit: number = API_CONFIG.DEFAULT_LIMIT): string {
    const url = new URL(this.baseUrl);
    url.searchParams.set('page', page.toString());
    url.searchParams.set('limit', limit.toString());
    return url.toString();
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<ApiResponse> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.validateApiResponse(data);
    } catch (error) {
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        await this.delay(this.retryDelay * attempt);
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Validate API response structure
   */
  private validateApiResponse(data: any): ApiResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format');
    }

    if (!Array.isArray(data.data)) {
      throw new Error('Invalid data array in response');
    }

    if (!data.pagination || typeof data.pagination !== 'object') {
      throw new Error('Invalid pagination data in response');
    }

    // Validate required pagination fields
    const requiredPaginationFields = ['total', 'limit', 'offset', 'total_pages', 'current_page'];
    for (const field of requiredPaginationFields) {
      if (typeof data.pagination[field] !== 'number') {
        throw new Error(`Invalid pagination field: ${field}`);
      }
    }

    // Validate artwork items
    for (const item of data.data) {
      if (!this.isValidArtworkItem(item)) {
        console.warn('Invalid artwork item found:', item);
        // Continue processing but log the warning
      }
    }

    return data as ApiResponse;
  }

  /**
   * Validate individual artwork item
   */
  private isValidArtworkItem(item: any): boolean {
    return (
      item &&
      typeof item === 'object' &&
      typeof item.id === 'number' &&
      typeof item.title === 'string' &&
      (typeof item.place_of_origin === 'string' || item.place_of_origin === null) &&
      (typeof item.artist_display === 'string' || item.artist_display === null) &&
      (typeof item.inscriptions === 'string' || item.inscriptions === null) &&
      (typeof item.date_start === 'number' || item.date_start === null) &&
      (typeof item.date_end === 'number' || item.date_end === null)
    );
  }

  /**
   * Determine if an error should trigger a retry
   */
  private shouldRetry(error: any): boolean {
    // Don't retry on abort signals
    if (error.name === 'AbortError') {
      return false;
    }

    // Don't retry on client errors (4xx)
    if (error.message && error.message.includes('HTTP 4')) {
      return false;
    }

    // Retry on network errors, timeouts, and server errors (5xx)
    return true;
  }

  /**
   * Handle and categorize errors
   */
  private handleError(error: any, url?: string): NetworkError {
    let errorType: NetworkErrorType;
    let message: string;
    let status: number | undefined;

    if (error.name === 'AbortError') {
      errorType = 'ABORT_ERROR';
      message = ERROR_MESSAGES.TIMEOUT_ERROR;
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorType = 'NETWORK_ERROR';
      message = ERROR_MESSAGES.NETWORK_ERROR;
    } else if (error.message && error.message.includes('HTTP')) {
      errorType = 'HTTP_ERROR';
      message = ERROR_MESSAGES.HTTP_ERROR;
      // Extract status code from error message
      const statusMatch = error.message.match(/HTTP (\d+)/);
      if (statusMatch) {
        status = parseInt(statusMatch[1], 10);
      }
    } else if (error.message && (
      error.message.includes('Invalid') || 
      error.message.includes('JSON')
    )) {
      errorType = 'PARSE_ERROR';
      message = ERROR_MESSAGES.PARSE_ERROR;
    } else {
      errorType = 'UNKNOWN_ERROR';
      message = ERROR_MESSAGES.UNKNOWN_ERROR;
    }

    return {
      type: errorType,
      message,
      status,
      statusText: error.statusText,
      url,
      code: errorType,
    };
  }

  /**
   * Utility function to create a delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create and export a singleton instance
export const artworkApiService = new ArtworkApiService();