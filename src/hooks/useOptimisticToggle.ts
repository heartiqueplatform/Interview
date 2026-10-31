import { useState, useRef, useCallback } from 'react';
import { useToast } from '../lib/toast';

interface UseOptimisticToggleOptions {
  initialState: boolean;
  onCommit: (nextState: boolean) => Promise<boolean>;
  errorMessage?: string;
  debounceMs?: number;
}

export function useOptimisticToggle({
  initialState,
  onCommit,
  errorMessage = 'Failed to update. Reverted.',
  debounceMs = 300,
}: UseOptimisticToggleOptions) {
  const [isActive, setIsActive] = useState<boolean>(initialState);
  const lastTapRef = useRef<number>(0);
  const { showToast } = useToast();

  const toggle = useCallback(async () => {
    const now = Date.now();
    // Debounce double-taps
    if (now - lastTapRef.current < debounceMs) return;
    lastTapRef.current = now;

    const previousState = isActive;
    const nextState = !previousState;

    // Instant optimistic update
    setIsActive(nextState);

    try {
      const success = await onCommit(nextState);
      if (!success) {
        // Revert and toast
        setIsActive(previousState);
        showToast(errorMessage, 'error');
      }
    } catch {
      setIsActive(previousState);
      showToast(errorMessage, 'error');
    }
  }, [isActive, onCommit, errorMessage, debounceMs, showToast]);

  return { isActive, setIsActive, toggle };
}
