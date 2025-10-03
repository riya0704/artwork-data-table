import type { ApiResponse, ApiError } from './artwork';

/**
 * API service configuration
 */
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * API request options
 */
export interface ApiRequestOptions {
  page?: number;
  limit?: number;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * API service interface
 */
export interface ApiService {
  fetchArtworks(page: number, options?: ApiRequestOptions): Promise<ApiResponse>;
  buildApiUrl(page: number, limit?: number): string;
}

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Generic API response wrapper
 */
export interface ApiResult<T> {
  data?: T;
  error?: ApiError;
  loading: boolean;
}

/**
 * Network error types
 */
export type NetworkErrorType = 
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'ABORT_ERROR'
  | 'HTTP_ERROR'
  | 'PARSE_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Enhanced error interface with network details
 */
export interface NetworkError extends ApiError {
  type: NetworkErrorType;
  status?: number;
  statusText?: string;
  url?: string;
}