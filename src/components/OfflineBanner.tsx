import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  pendingCount?: number;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, pendingCount = 0 }) => {
  if (isOnline && pendingCount === 0) return null;

  if (!isOnline) {
    return (
      <div
        role="status"
        className="w-full px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 safe-top"
        style={{ backgroundColor: 'var(--warning)', color: '#0d1117' }}
      >
        <WifiOff className="w-4 h-4 shrink-0" />
        <span>Offline — showing saved content.</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="w-full px-4 py-1.5 text-xs font-medium flex items-center justify-center gap-2 safe-top"
      style={{ backgroundColor: 'var(--card-subtle)', color: 'var(--accent)' }}
    >
      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      <span>Syncing {pendingCount} offline update{pendingCount > 1 ? 's' : ''}...</span>
    </div>
  );
};
