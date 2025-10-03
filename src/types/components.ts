import type { ReactNode } from 'react';

/**
 * Props for the SelectionOverlay component
 */
export interface SelectionOverlayProps {
  visible: boolean;
  onHide: () => void;
  onSubmit: (count: number) => void;
  target: React.RefObject<HTMLElement>;
}

/**
 * Props for the ArtworkTable component
 */
export interface ArtworkTableProps {
  // Currently no props needed as it's self-contained
  // This interface is prepared for future extensibility
}

/**
 * Props for error boundary component
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Props for loading spinner component
 */
export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

/**
 * Props for error message component
 */
export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}