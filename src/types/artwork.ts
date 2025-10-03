/**
 * Core artwork item interface representing a single artwork from the API
 * Contains only the fields required by the assignment
 */
export interface ArtworkItem {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

/**
 * API response structure from the Art Institute of Chicago API
 */
export interface ApiResponse {
  data: ArtworkItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
  };
  info: {
    license_text: string;
    license_links: string[];
    version: string;
  };
}

/**
 * Selection state interface for managing cross-page selections
 */
export interface SelectionState {
  selectedIds: Set<number>;
  pageSelections: Map<number, Set<number>>;
  totalSelected: number;
}

/**
 * Error types for API and application errors
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Loading states for different operations
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Pagination event data from PrimeReact DataTable
 */
export interface PaginationEvent {
  first: number;
  rows: number;
  page: number;
  pageCount: number;
}

/**
 * Row selection event data from PrimeReact DataTable
 */
export interface SelectionEvent {
  originalEvent: Event;
  value: ArtworkItem | ArtworkItem[];
  type: 'row' | 'all' | 'checkbox';
}