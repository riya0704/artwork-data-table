import type { ArtworkItem } from '@/types';

/**
 * Debounce function to limit the rate of function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function to limit function calls to once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Format artwork display text for table cells
 */
export function formatArtworkField(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  return value;
}

/**
 * Format date range for artwork
 */
export function formatDateRange(dateStart: number | null, dateEnd: number | null): string {
  if (dateStart === null && dateEnd === null) {
    return 'Unknown';
  }
  
  if (dateStart === dateEnd) {
    return dateStart?.toString() || 'Unknown';
  }
  
  const start = dateStart?.toString() || '?';
  const end = dateEnd?.toString() || '?';
  
  return `${start} - ${end}`;
}

/**
 * Truncate long text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generate a unique key for artwork items
 */
export function getArtworkKey(artwork: ArtworkItem): string {
  return `artwork-${artwork.id}`;
}

/**
 * Validate if a number is a valid page number
 */
export function isValidPageNumber(page: number): boolean {
  return Number.isInteger(page) && page > 0;
}

/**
 * Calculate total pages from total records and page size
 */
export function calculateTotalPages(totalRecords: number, pageSize: number): number {
  return Math.ceil(totalRecords / pageSize);
}

/**
 * Get page range for pagination display
 */
export function getPageRange(currentPage: number, totalPages: number, maxVisible: number = 5): number[] {
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  // Adjust start if we're near the end
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Create a delay promise for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Generate a random ID for temporary use
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if two arrays of artwork items are equal (by ID)
 */
export function areArtworkArraysEqual(arr1: ArtworkItem[], arr2: ArtworkItem[]): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }
  
  const ids1 = arr1.map(item => item.id).sort();
  const ids2 = arr2.map(item => item.id).sort();
  
  return ids1.every((id, index) => id === ids2[index]);
}