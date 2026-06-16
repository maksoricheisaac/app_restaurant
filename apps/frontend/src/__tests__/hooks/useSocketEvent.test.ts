import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSocketEvent } from '@/hooks/useSocketEvent';

// Mock SocketProvider context
vi.mock('@/components/providers/SocketProvider', () => ({
  useSocket: vi.fn(),
}));

import { useSocket } from '@/components/providers/SocketProvider';

describe('useSocketEvent', () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT attach listener when socket is null', () => {
    vi.mocked(useSocket).mockReturnValue({ socket: null, connected: false });

    const callback = vi.fn();
    renderHook(() => useSocketEvent('test-event', callback));

    expect(mockSocket.on).not.toHaveBeenCalled();
  });

  it('does NOT attach listener when connected is false', () => {
    vi.mocked(useSocket).mockReturnValue({
      socket: mockSocket as any,
      connected: false,
    });

    const callback = vi.fn();
    renderHook(() => useSocketEvent('test-event', callback));

    expect(mockSocket.on).not.toHaveBeenCalled();
  });

  it('attaches listener when socket is available and connected', () => {
    vi.mocked(useSocket).mockReturnValue({
      socket: mockSocket as any,
      connected: true,
    });

    const callback = vi.fn();
    renderHook(() => useSocketEvent('new-order', callback));

    expect(mockSocket.on).toHaveBeenCalledWith('new-order', callback);
  });

  it('removes listener on unmount (cleanup)', () => {
    vi.mocked(useSocket).mockReturnValue({
      socket: mockSocket as any,
      connected: true,
    });

    const callback = vi.fn();
    const { unmount } = renderHook(() => useSocketEvent('new-order', callback));

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith('new-order', callback);
  });

  it('removes old listener and attaches new when event changes', () => {
    vi.mocked(useSocket).mockReturnValue({
      socket: mockSocket as any,
      connected: true,
    });

    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ event }: { event: string }) => useSocketEvent(event, callback),
      { initialProps: { event: 'event-a' } },
    );

    rerender({ event: 'event-b' });

    expect(mockSocket.off).toHaveBeenCalledWith('event-a', callback);
    expect(mockSocket.on).toHaveBeenCalledWith('event-b', callback);
  });
});
