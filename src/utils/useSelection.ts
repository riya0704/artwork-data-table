import { useState, useCallback, useEffect } from 'react';
import type { ArtworkItem, UseSelectionReturn } from '@/types';
import { selectionManager } from './SelectionManager';

/**
 * Custom hook for managing artwork selections with cross-page persistence
 */
export function useSelection(): UseSelectionReturn {
  const [selectedRows, setSelectedRows] = useState<ArtworkItem[]>([]);
  const [selectedCount, setSelectedCount] = useState<number>(0);

  // Update selected count when component mounts or selection changes
  useEffect(() => {
    const updateCount = () => {
      setSelectedCount(selectionManager.getTotalSelected());
    };

    updateCount();
    
    // Set up a periodic check for selection changes
    // This handles cases where selections are modified outside this hook
    const interval = setInterval(updateCount, 1000);
    
    return () => clearInterval(interval);
  }, []);

  /**
   * Check if a specific artwork is selected
   */
  const isRowSelected = useCallback((artwork: ArtworkItem): boolean => {
    return selectionManager.isRowSelected(artwork.id);
  }, []);

  /**
   * Select a specific artwork row
   */
  const selectRow = useCallback((artwork: ArtworkItem) => {
    // We need the current page number - this will be provided by the component
    // For now, we'll use page 1 as default, but this should be passed as parameter
    const currentPage = 1; // TODO: Get actual current page from context
    selectionManager.selectRow(currentPage, artwork.id);
    setSelectedCount(selectionManager.getTotalSelected());
  }, []);

  /**
   * Deselect a specific artwork row
   */
  const deselectRow = useCallback((artwork: ArtworkItem) => {
    const currentPage = 1; // TODO: Get actual current page from context
    selectionManager.deselectRow(currentPage, artwork.id);
    setSelectedCount(selectionManager.getTotalSelected());
  }, []);

  /**
   * Select all artworks on current page
   */
  const selectAll = useCallback((artworks: ArtworkItem[]) => {
    const currentPage = 1; // TODO: Get actual current page from context
    const artworkIds = artworks.map(artwork => artwork.id);
    selectionManager.selectAllOnPage(currentPage, artworkIds);
    setSelectedCount(selectionManager.getTotalSelected());
  }, []);

  /**
   * Deselect all artworks
   */
  const deselectAll = useCallback(() => {
    selectionManager.clearAllSelections();
    setSelectedRows([]);
    setSelectedCount(0);
  }, []);

  /**
   * Bulk select a specified number of rows
   */
  const bulkSelect = useCallback(async (count: number) => {
    // This function needs to be implemented with actual page data fetching
    // For now, it's a placeholder that will be completed when integrating with the API
    const getPageData = async (_page: number): Promise<number[]> => {
      // TODO: Implement actual API call to get artwork IDs for a page
      // This is a placeholder that should be replaced with real API integration
      return [];
    };

    try {
      await selectionManager.bulkSelect(1, count, getPageData);
      setSelectedCount(selectionManager.getTotalSelected());
    } catch (error) {
      console.error('Bulk selection failed:', error);
      throw error;
    }
  }, []);

  /**
   * Clear all selections
   */
  const clearSelections = useCallback(() => {
    selectionManager.clearAllSelections();
    setSelectedRows([]);
    setSelectedCount(0);
  }, []);

  return {
    selectedRows,
    selectedCount,
    isRowSelected,
    selectRow,
    deselectRow,
    selectAll,
    deselectAll,
    bulkSelect,
    clearSelections,
  };
}

/**
 * Enhanced version of useSelection that accepts current page context
 */
export function useSelectionWithPage(currentPage: number): UseSelectionReturn & {
  getPageSelections: () => Set<number>;
  selectAllOnCurrentPage: (artworks: ArtworkItem[]) => void;
  deselectAllOnCurrentPage: () => void;
} {
  const baseSelection = useSelection();

  /**
   * Get selections for the current page
   */
  const getPageSelections = useCallback((): Set<number> => {
    return selectionManager.getPageSelections(currentPage);
  }, [currentPage]);

  /**
   * Select all artworks on the current page
   */
  const selectAllOnCurrentPage = useCallback((artworks: ArtworkItem[]) => {
    const artworkIds = artworks.map(artwork => artwork.id);
    selectionManager.selectAllOnPage(currentPage, artworkIds);
    baseSelection.selectAll(artworks);
  }, [currentPage, baseSelection]);

  /**
   * Deselect all artworks on the current page
   */
  const deselectAllOnCurrentPage = useCallback(() => {
    selectionManager.deselectAllOnPage(currentPage);
    baseSelection.deselectAll();
  }, [currentPage, baseSelection]);

  /**
   * Enhanced select row with current page context
   */
  const selectRow = useCallback((artwork: ArtworkItem) => {
    selectionManager.selectRow(currentPage, artwork.id);
    baseSelection.selectRow(artwork);
  }, [currentPage, baseSelection]);

  /**
   * Enhanced deselect row with current page context
   */
  const deselectRow = useCallback((artwork: ArtworkItem) => {
    selectionManager.deselectRow(currentPage, artwork.id);
    baseSelection.deselectRow(artwork);
  }, [currentPage, baseSelection]);

  return {
    ...baseSelection,
    selectRow,
    deselectRow,
    getPageSelections,
    selectAllOnCurrentPage,
    deselectAllOnCurrentPage,
  };
}