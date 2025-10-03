import type {
  SelectionManagerState,
  StoredSelectionData,
} from '@/types';
import { STORAGE_KEYS, SELECTION_CONFIG } from '@/types';

/**
 * SelectionManager handles cross-page selection persistence
 * Manages selected artwork IDs across different pages without storing full artwork data
 */
export class SelectionManager {
  private state: SelectionManagerState;
  private storageKey: string;

  constructor(storageKey: string = STORAGE_KEYS.SELECTION_STATE) {
    this.storageKey = storageKey;
    this.state = {
      selectedIds: new Set<number>(),
      pageSelections: new Map<number, Set<number>>(),
      totalSelected: 0,
    };
    
    this.loadFromStorage();
  }

  /**
   * Select a row on a specific page
   */
  selectRow(pageNumber: number, rowId: number): void {
    // Add to global selected IDs
    this.state.selectedIds.add(rowId);
    
    // Add to page-specific selections
    if (!this.state.pageSelections.has(pageNumber)) {
      this.state.pageSelections.set(pageNumber, new Set<number>());
    }
    this.state.pageSelections.get(pageNumber)!.add(rowId);
    
    this.updateTotalSelected();
    this.saveToStorage();
  }

  /**
   * Deselect a row on a specific page
   */
  deselectRow(pageNumber: number, rowId: number): void {
    // Remove from global selected IDs
    this.state.selectedIds.delete(rowId);
    
    // Remove from page-specific selections
    const pageSelections = this.state.pageSelections.get(pageNumber);
    if (pageSelections) {
      pageSelections.delete(rowId);
      
      // Clean up empty page selections
      if (pageSelections.size === 0) {
        this.state.pageSelections.delete(pageNumber);
      }
    }
    
    this.updateTotalSelected();
    this.saveToStorage();
  }

  /**
   * Select all rows on a specific page
   */
  selectAllOnPage(pageNumber: number, rowIds: number[]): void {
    // Add all IDs to global selected IDs
    rowIds.forEach(id => this.state.selectedIds.add(id));
    
    // Set page-specific selections
    this.state.pageSelections.set(pageNumber, new Set(rowIds));
    
    this.updateTotalSelected();
    this.saveToStorage();
  }

  /**
   * Deselect all rows on a specific page
   */
  deselectAllOnPage(pageNumber: number): void {
    const pageSelections = this.state.pageSelections.get(pageNumber);
    if (pageSelections) {
      // Remove all page IDs from global selected IDs
      pageSelections.forEach(id => this.state.selectedIds.delete(id));
      
      // Remove page selections
      this.state.pageSelections.delete(pageNumber);
    }
    
    this.updateTotalSelected();
    this.saveToStorage();
  }

  /**
   * Bulk select a specified number of rows starting from a given page
   * This method handles selection across multiple pages
   */
  bulkSelect(startPage: number, count: number, getPageData: (page: number) => Promise<number[]>): Promise<void> {
    if (count <= 0 || count > SELECTION_CONFIG.MAX_BULK_SELECTION) {
      throw new Error(`Invalid bulk selection count: ${count}`);
    }

    return this.performBulkSelection(startPage, count, getPageData);
  }

  /**
   * Perform the actual bulk selection logic
   */
  private async performBulkSelection(
    startPage: number,
    count: number,
    getPageData: (page: number) => Promise<number[]>
  ): Promise<void> {
    let remainingCount = count;
    let currentPage = startPage;
    
    // Store bulk selection metadata
    this.state.lastBulkSelection = {
      count,
      startPage,
      timestamp: Date.now(),
    };

    while (remainingCount > 0) {
      try {
        const pageIds = await getPageData(currentPage);
        
        if (pageIds.length === 0) {
          // No more data available
          break;
        }

        const idsToSelect = pageIds.slice(0, remainingCount);
        this.selectAllOnPage(currentPage, idsToSelect);
        
        remainingCount -= idsToSelect.length;
        currentPage++;
        
        // Safety check to prevent infinite loops
        if (currentPage > 1000) {
          console.warn('Bulk selection stopped: too many pages');
          break;
        }
      } catch (error) {
        console.error(`Error fetching page ${currentPage} for bulk selection:`, error);
        break;
      }
    }

    this.saveToStorage();
  }

  /**
   * Get selected row IDs for a specific page
   */
  getPageSelections(pageNumber: number): Set<number> {
    return this.state.pageSelections.get(pageNumber) || new Set<number>();
  }

  /**
   * Check if a specific row is selected
   */
  isRowSelected(rowId: number): boolean {
    return this.state.selectedIds.has(rowId);
  }

  /**
   * Get total number of selected rows across all pages
   */
  getTotalSelected(): number {
    return this.state.totalSelected;
  }

  /**
   * Get all selected row IDs
   */
  getAllSelectedIds(): Set<number> {
    return new Set(this.state.selectedIds);
  }

  /**
   * Clear all selections
   */
  clearAllSelections(): void {
    this.state.selectedIds.clear();
    this.state.pageSelections.clear();
    this.state.totalSelected = 0;
    this.state.lastBulkSelection = undefined;
    
    this.saveToStorage();
  }

  /**
   * Get selection statistics
   */
  getSelectionStats(): {
    totalSelected: number;
    pagesWithSelections: number;
    lastBulkSelection?: {
      count: number;
      startPage: number;
      timestamp: number;
    };
  } {
    return {
      totalSelected: this.state.totalSelected,
      pagesWithSelections: this.state.pageSelections.size,
      lastBulkSelection: this.state.lastBulkSelection,
    };
  }

  /**
   * Update the total selected count
   */
  private updateTotalSelected(): void {
    this.state.totalSelected = this.state.selectedIds.size;
  }

  /**
   * Save selection state to localStorage
   */
  private saveToStorage(): void {
    try {
      const dataToStore: StoredSelectionData = {
        selectedIds: Array.from(this.state.selectedIds),
        pageSelections: Object.fromEntries(
          Array.from(this.state.pageSelections.entries()).map(([page, ids]) => [
            page,
            Array.from(ids),
          ])
        ),
        totalSelected: this.state.totalSelected,
        timestamp: Date.now(),
      };

      localStorage.setItem(this.storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.warn('Failed to save selections to localStorage:', error);
      // Continue without localStorage - selections will be session-only
    }
  }

  /**
   * Load selection state from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;

      const data: StoredSelectionData = JSON.parse(stored);
      
      // Check if data is expired (older than configured hours)
      const expiryTime = SELECTION_CONFIG.STORAGE_EXPIRY_HOURS * 60 * 60 * 1000;
      if (Date.now() - data.timestamp > expiryTime) {
        localStorage.removeItem(this.storageKey);
        return;
      }

      // Restore state from stored data
      this.state.selectedIds = new Set(data.selectedIds);
      this.state.pageSelections = new Map(
        Object.entries(data.pageSelections).map(([page, ids]) => [
          parseInt(page, 10),
          new Set(ids),
        ])
      );
      this.state.totalSelected = data.totalSelected;

    } catch (error) {
      console.warn('Failed to load selections from localStorage:', error);
      // Continue with empty state
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Export current selection state (for debugging or backup)
   */
  exportState(): StoredSelectionData {
    return {
      selectedIds: Array.from(this.state.selectedIds),
      pageSelections: Object.fromEntries(
        Array.from(this.state.pageSelections.entries()).map(([page, ids]) => [
          page,
          Array.from(ids),
        ])
      ),
      totalSelected: this.state.totalSelected,
      timestamp: Date.now(),
    };
  }

  /**
   * Import selection state (for restoring from backup)
   */
  importState(data: StoredSelectionData): void {
    this.state.selectedIds = new Set(data.selectedIds);
    this.state.pageSelections = new Map(
      Object.entries(data.pageSelections).map(([page, ids]) => [
        parseInt(page, 10),
        new Set(ids),
      ])
    );
    this.state.totalSelected = data.totalSelected;
    
    this.saveToStorage();
  }
}

// Create and export a singleton instance
export const selectionManager = new SelectionManager();