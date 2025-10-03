import type { ArtworkItem, ApiError, LoadingState } from './artwork';

/**
 * Main application state interface
 */
export interface AppState {
  artworks: ArtworkItem[];
  loading: LoadingState;
  error: ApiError | null;
  currentPage: number;
  totalRecords: number;
  totalPages: number;
  selectedRows: ArtworkItem[];
  overlayVisible: boolean;
}

/**
 * Selection manager state for cross-page persistence
 */
export interface SelectionManagerState {
  selectedIds: Set<number>;
  pageSelections: Map<number, Set<number>>;
  totalSelected: number;
  lastBulkSelection?: {
    count: number;
    startPage: number;
    timestamp: number;
  };
}

/**
 * Local storage data structure for persisting selections
 */
export interface StoredSelectionData {
  selectedIds: number[];
  pageSelections: Record<number, number[]>;
  totalSelected: number;
  timestamp: number;
}

/**
 * Action types for state management (if using useReducer)
 */
export type AppAction =
  | { type: 'SET_LOADING'; payload: LoadingState }
  | { type: 'SET_ARTWORKS'; payload: { artworks: ArtworkItem[]; totalRecords: number; totalPages: number } }
  | { type: 'SET_ERROR'; payload: ApiError }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_SELECTED_ROWS'; payload: ArtworkItem[] }
  | { type: 'TOGGLE_OVERLAY'; payload?: boolean }
  | { type: 'CLEAR_ERROR' };

/**
 * Hook return types for custom hooks
 */
export interface UseArtworkDataReturn {
  artworks: ArtworkItem[];
  loading: LoadingState;
  error: ApiError | null;
  currentPage: number;
  totalRecords: number;
  totalPages: number;
  fetchPage: (page: number) => Promise<void>;
  retry: () => Promise<void>;
}

export interface UseSelectionReturn {
  selectedRows: ArtworkItem[];
  selectedCount: number;
  isRowSelected: (artwork: ArtworkItem) => boolean;
  selectRow: (artwork: ArtworkItem) => void;
  deselectRow: (artwork: ArtworkItem) => void;
  selectAll: (artworks: ArtworkItem[]) => void;
  deselectAll: () => void;
  bulkSelect: (count: number) => void;
  clearSelections: () => void;
}