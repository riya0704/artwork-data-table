/**
 * Application constants
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://api.artic.edu/api/v1/artworks',
  DEFAULT_LIMIT: 12,
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  SELECTION_STATE: 'artwork-table-selections',
  CURRENT_PAGE: 'artwork-table-current-page',
  USER_PREFERENCES: 'artwork-table-preferences',
} as const;

// Table Configuration
export const TABLE_CONFIG = {
  ROWS_PER_PAGE: 12,
  PAGINATOR_TEMPLATE: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown',
  CURRENT_PAGE_REPORT_TEMPLATE: 'Showing {first} to {last} of {totalRecords} artworks',
} as const;

// Selection Configuration
export const SELECTION_CONFIG = {
  MAX_BULK_SELECTION: 1000,
  STORAGE_EXPIRY_HOURS: 24,
  DEBOUNCE_DELAY: 300,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  HTTP_ERROR: 'Server error occurred. Please try again later.',
  PARSE_ERROR: 'Invalid data received from server.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
  INVALID_BULK_SELECTION: 'Please enter a valid number between 1 and 1000.',
  STORAGE_ERROR: 'Unable to save selections. Using session-only storage.',
} as const;

// Loading Messages
export const LOADING_MESSAGES = {
  FETCHING_ARTWORKS: 'Loading artworks...',
  APPLYING_SELECTION: 'Applying selection...',
  SAVING_PREFERENCES: 'Saving preferences...',
} as const;