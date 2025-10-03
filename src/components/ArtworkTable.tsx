
import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';

import './ArtworkTable.css';

import type {
    ArtworkItem,
    ApiResponse,
    LoadingState,
    ApiError,
} from '@/types';
import type { DataTableStateEvent } from 'primereact/datatable';
import { artworkApiService } from '@/services';
import { formatArtworkField, formatDateRange } from '@/utils/helpers';
import { API_CONFIG, TABLE_CONFIG } from '@/types';
import { useSelectionWithPage } from '@/utils';

interface ArtworkTableState {
    artworks: ArtworkItem[];
    loading: LoadingState;
    error: ApiError | null;
    totalRecords: number;
    currentPage: number;
    first: number; // First record index for pagination
    rows: number; // Number of rows per page
    selectedArtworks: ArtworkItem[]; // Currently selected artworks for DataTable
}

/**
 * Main ArtworkTable component that displays artwork data in a PrimeReact DataTable
 * Handles data fetching, loading states, and error handling
 */
export const ArtworkTable: React.FC = () => {
    const [state, setState] = useState<ArtworkTableState>({
        artworks: [],
        loading: 'idle',
        error: null,
        totalRecords: 0,
        currentPage: 1,
        first: 0,
        rows: API_CONFIG.DEFAULT_LIMIT,
        selectedArtworks: [],
    });

    // Use selection hook with current page context
    const selection = useSelectionWithPage(state.currentPage);

    /**
     * Fetch artworks for a specific page
     */
    const fetchArtworks = useCallback(async (page: number) => {
        setState(prev => ({ ...prev, loading: 'loading', error: null }));

        try {
            const response: ApiResponse = await artworkApiService.fetchArtworks(page);

            // Restore selections for this page
            const pageSelections = selection.getPageSelections();
            const selectedArtworks = response.data.filter(artwork => 
                pageSelections.has(artwork.id)
            );

            setState(prev => ({
                ...prev,
                artworks: response.data,
                totalRecords: response.pagination.total,
                currentPage: response.pagination.current_page,
                selectedArtworks,
                loading: 'success',
                error: null,
            }));
        } catch (error) {
            console.error('Failed to fetch artworks:', error);
            setState(prev => ({
                ...prev,
                loading: 'error',
                error: error as ApiError,
                artworks: [],
            }));
        }
    }, []);

    /**
     * Update URL parameters to reflect current page
     */
    const updateUrlParams = useCallback((page: number) => {
        const url = new URL(window.location.href);
        if (page === 1) {
            url.searchParams.delete('page');
        } else {
            url.searchParams.set('page', page.toString());
        }
        window.history.replaceState({}, '', url.toString());
    }, []);

    /**
     * Handle pagination events
     */
    const handlePageChange = useCallback((event: DataTableStateEvent) => {
        const newPage = (event.page ?? 0) + 1; // PrimeReact uses 0-based indexing, API uses 1-based
        
        setState(prev => ({
            ...prev,
            first: event.first ?? 0,
            rows: event.rows ?? API_CONFIG.DEFAULT_LIMIT,
            currentPage: newPage,
        }));
        
        // Update URL to reflect current page
        updateUrlParams(newPage);
        
        // Fetch data for the new page
        fetchArtworks(newPage);
    }, [fetchArtworks, updateUrlParams]);

    /**
     * Handle row selection events
     */
    const handleSelectionChange = useCallback((e: { value: ArtworkItem[] }) => {
        const newSelection = e.value;
        const currentSelection = state.selectedArtworks;
        
        // Find newly selected items
        const newlySelected = newSelection.filter(
            item => !currentSelection.find(selected => selected.id === item.id)
        );
        
        // Find newly deselected items
        const newlyDeselected = currentSelection.filter(
            item => !newSelection.find(selected => selected.id === item.id)
        );
        
        // Update selection manager
        newlySelected.forEach(artwork => selection.selectRow(artwork));
        newlyDeselected.forEach(artwork => selection.deselectRow(artwork));
        
        // Update local state
        setState(prev => ({
            ...prev,
            selectedArtworks: newSelection,
        }));
    }, [state.selectedArtworks, selection]);

    /**
     * Handle select all for current page
     */
    const handleSelectAll = useCallback(() => {
        const allSelected = state.selectedArtworks.length === state.artworks.length;
        
        if (allSelected) {
            // Deselect all on current page
            selection.deselectAllOnCurrentPage();
            setState(prev => ({
                ...prev,
                selectedArtworks: [],
            }));
        } else {
            // Select all on current page
            selection.selectAllOnCurrentPage(state.artworks);
            setState(prev => ({
                ...prev,
                selectedArtworks: [...state.artworks],
            }));
        }
    }, [state.artworks, state.selectedArtworks, selection]);

    /**
     * Retry fetching data
     */
    const handleRetry = useCallback(() => {
        fetchArtworks(state.currentPage);
    }, [fetchArtworks, state.currentPage]);

    /**
     * Get initial page from URL parameters
     */
    const getInitialPage = useCallback((): number => {
        const urlParams = new URLSearchParams(window.location.search);
        const pageParam = urlParams.get('page');
        const page = pageParam ? parseInt(pageParam, 10) : 1;
        return isNaN(page) || page < 1 ? 1 : page;
    }, []);

    /**
     * Load initial data on component mount
     */
    useEffect(() => {
        const initialPage = getInitialPage();
        
        // Update state to reflect initial page
        if (initialPage !== 1) {
            setState(prev => ({
                ...prev,
                currentPage: initialPage,
                first: (initialPage - 1) * prev.rows,
            }));
        }
        
        fetchArtworks(initialPage);
    }, [fetchArtworks, getInitialPage]);

    /**
     * Render loading state
     */
    const renderLoading = () => (
        <div className="artwork-table-loading">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
            <p>Loading artworks...</p>
        </div>
    );

    /**
     * Render error state
     */
    const renderError = () => (
        <div className="artwork-table-error">
            <Message
                severity="error"
                text={state.error?.message || 'An error occurred while loading artworks'}
            />
            <Button
                label="Retry"
                icon="pi pi-refresh"
                onClick={handleRetry}
                className="p-mt-2"
            />
        </div>
    );

    /**
     * Template for title column
     */
    const titleBodyTemplate = (artwork: ArtworkItem) => (
        <div className="artwork-title">
            <span title={artwork.title}>
                {formatArtworkField(artwork.title)}
            </span>
        </div>
    );

    /**
     * Template for place of origin column
     */
    const placeBodyTemplate = (artwork: ArtworkItem) => (
        <span title={artwork.place_of_origin}>
            {formatArtworkField(artwork.place_of_origin)}
        </span>
    );

    /**
     * Template for artist display column
     */
    const artistBodyTemplate = (artwork: ArtworkItem) => (
        <div className="artwork-artist">
            <span title={artwork.artist_display}>
                {formatArtworkField(artwork.artist_display)}
            </span>
        </div>
    );

    /**
     * Template for inscriptions column
     */
    const inscriptionsBodyTemplate = (artwork: ArtworkItem) => (
        <span title={artwork.inscriptions}>
            {formatArtworkField(artwork.inscriptions)}
        </span>
    );

    /**
     * Template for date range column
     */
    const dateRangeBodyTemplate = (artwork: ArtworkItem) => (
        <span>
            {formatDateRange(artwork.date_start, artwork.date_end)}
        </span>
    );

    // Store loading state before type narrowing
    const isCurrentlyLoading = state.loading === 'loading';

    // Show loading state
    if (isCurrentlyLoading) {
        return renderLoading();
    }

    // Show error state
    if (state.loading === 'error' && state.error) {
        return renderError();
    }

    return (
        <div className="artwork-table-container">
            <div className="artwork-table-header">
                <h2>Artwork Collection</h2>
                <div className="artwork-table-info">
                    <div className="table-stats">
                        <p>
                            Page {state.currentPage} of {Math.ceil(state.totalRecords / state.rows)} • {' '}
                            {state.totalRecords.toLocaleString()} total artworks
                        </p>
                        {selection.selectedCount > 0 && (
                            <p className="selection-info">
                                {selection.selectedCount} artwork{selection.selectedCount !== 1 ? 's' : ''} selected
                            </p>
                        )}
                    </div>
                    <div className="table-actions">
                        {isCurrentlyLoading && (
                            <span className="loading-indicator">
                                <i className="pi pi-spinner pi-spin" /> Loading...
                            </span>
                        )}
                        <Button
                            label={state.selectedArtworks.length === state.artworks.length ? "Deselect All" : "Select All"}
                            icon={state.selectedArtworks.length === state.artworks.length ? "pi pi-check-square" : "pi pi-square"}
                            className="p-button-outlined p-button-sm"
                            onClick={handleSelectAll}
                            disabled={state.artworks.length === 0}
                        />
                        {selection.selectedCount > 0 && (
                            <Button
                                label="Clear All Selections"
                                icon="pi pi-times"
                                className="p-button-text p-button-sm"
                                onClick={selection.clearSelections}
                            />
                        )}
                    </div>
                </div>
            </div>

            <DataTable
                value={state.artworks}
                className="artwork-table"
                stripedRows
                showGridlines
                emptyMessage="No artworks found"
                loading={false}
                loadingIcon="pi pi-spinner"
                lazy
                paginator
                first={state.first}
                rows={state.rows}
                totalRecords={state.totalRecords}
                onPage={handlePageChange}
                paginatorTemplate={TABLE_CONFIG.PAGINATOR_TEMPLATE}
                currentPageReportTemplate={TABLE_CONFIG.CURRENT_PAGE_REPORT_TEMPLATE}
                rowsPerPageOptions={[12, 24, 48]}
                selection={state.selectedArtworks}
                onSelectionChange={handleSelectionChange}
                selectionMode="checkbox"
                dataKey="id"
            >
                <Column
                    selectionMode="multiple"
                    headerStyle={{ width: '3rem' }}
                    header={() => (
                        <div className="select-all-header">
                            <Button
                                icon={state.selectedArtworks.length === state.artworks.length && state.artworks.length > 0 ? "pi pi-check-square" : "pi pi-square"}
                                className="p-button-text p-button-sm select-all-btn"
                                onClick={handleSelectAll}
                                disabled={state.artworks.length === 0}
                                tooltip={state.selectedArtworks.length === state.artworks.length ? "Deselect all on this page" : "Select all on this page"}
                                tooltipOptions={{ position: 'bottom' }}
                            />
                        </div>
                    )}
                />
                
                <Column
                    field="title"
                    header="Title"
                    body={titleBodyTemplate}
                    sortable
                    style={{ minWidth: '200px' }}
                />

                <Column
                    field="place_of_origin"
                    header="Place of Origin"
                    body={placeBodyTemplate}
                    sortable
                    style={{ minWidth: '150px' }}
                />

                <Column
                    field="artist_display"
                    header="Artist"
                    body={artistBodyTemplate}
                    sortable
                    style={{ minWidth: '200px' }}
                />

                <Column
                    field="inscriptions"
                    header="Inscriptions"
                    body={inscriptionsBodyTemplate}
                    style={{ minWidth: '150px' }}
                />

                <Column
                    header="Date Range"
                    body={dateRangeBodyTemplate}
                    style={{ minWidth: '120px' }}
                />
            </DataTable>
        </div>
    );
};