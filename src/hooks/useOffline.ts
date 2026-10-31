import { useState, useEffect, useCallback } from 'react';
import { flushQueuedProgress, getQueuedWrites } from '../lib/offline';

export function useOffline(onSync?: (syncedCount: number) => void) {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingWritesCount, setPendingWritesCount] = useState<number>(0);

  const checkQueue = useCallback(() => {
    const list = getQueuedWrites();
    setPendingWritesCount(list.length);
  }, []);

  useEffect(() => {
    checkQueue();
    const handleOnline = async () => {
      setIsOnline(true);
      const synced = await flushQueuedProgress(async () => {
        // silent write simulation/remote sync
        return true;
      });
      if (synced > 0 && onSync) {
        onSync(synced);
      }
      checkQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onSync, checkQueue]);

  return { isOnline, pendingWritesCount, checkQueue };
}
