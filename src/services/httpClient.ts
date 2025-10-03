import type { NetworkError, NetworkErrorType } from '@/types';
import { ERROR_MESSAGES } from '@/types';

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  defaultHeaders?: Record<string, string>;
}

/**
 * HTTP request options
 */
export interface HttpRequestOptions extends RequestInit {
  timeout?: number;
  retryAttempts?: number;
  params?: Record<string, string | number>;
}

/**
 * Generic HTTP client with retry logic and error handling
 */
export class HttpClient {
  private config: Required<HttpClientConfig>;

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      baseUrl: '',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      defaultHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      ...config,
    };
  }

  /**
   * Perform a GET request
   */
  async get<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * Perform a POST request
   */
  async post<T>(url: string, data?: any, options: HttpRequestOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Generic request method with retry logic
   */
  private async request<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    const fullUrl = this.buildUrl(url, options.params);
    const controller = new AbortController();
    const timeout = options.timeout || this.config.timeout;
    const retryAttempts = options.retryAttempts || this.config.retryAttempts;

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await this.requestWithRetry<T>(fullUrl, {
        ...options,
        signal: options.signal || controller.signal,
        headers: {
          ...this.config.defaultHeaders,
          ...options.headers,
        },
      }, retryAttempts);

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.handleError(error, fullUrl);
    }
  }

  /**
   * Request with retry logic
   */
  private async requestWithRetry<T>(
    url: string,
    options: RequestInit,
    maxAttempts: number,
    attempt: number = 1
  ): Promise<T> {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text() as unknown as T;
      }
    } catch (error) {
      if (attempt < maxAttempts && this.shouldRetry(error)) {
        await this.delay(this.config.retryDelay * attempt);
        return this.requestWithRetry<T>(url, options, maxAttempts, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(url: string, params?: Record<string, string | number>): string {
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseUrl}${url}`;
    
    if (!params || Object.keys(params).length === 0) {
      return fullUrl;
    }

    const urlObj = new URL(fullUrl);
    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value.toString());
    });

    return urlObj.toString();
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
      errorType = 'TIMEOUT_ERROR';
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

// Create and export a default HTTP client instance
export const httpClient = new HttpClient();