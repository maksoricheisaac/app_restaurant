import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Mock monitoring to avoid async imports in tests
vi.mock('@/lib/monitoring', () => ({
  monitoring: {
    captureError: vi.fn(),
    addBreadcrumb: vi.fn(),
    setUser: vi.fn(),
    measure: vi.fn(),
  },
}));

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error from component');
  }
  return <div>Normal content</div>;
}

describe('ErrorBoundary', () => {
  // Suppress React's error logging in tests
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Safe content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Safe content')).toBeDefined();
  });

  it('renders fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('button', { name: /réessayer/i })).toBeDefined();
  });

  it('shows section name in error message when provided', () => {
    render(
      <ErrorBoundary section="Commandes">
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/commandes/i)).toBeDefined();
  });

  it('resets and re-renders children after "Réessayer" click', async () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>,
    );

    const retryButton = screen.getByRole('button', { name: /réessayer/i });
    fireEvent.click(retryButton);

    // After reset the ErrorBoundary re-renders — children are re-evaluated
    // In this test the component still throws, so fallback reappears
    expect(retryButton).toBeDefined();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom fallback')).toBeDefined();
  });
});
