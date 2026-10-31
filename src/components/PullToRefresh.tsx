import React from 'react';
import { ArrowDown, RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const { pullDistance, isRefreshing } = usePullToRefresh(onRefresh);

  return (
    <div className="relative">
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="absolute left-0 right-0 top-0 flex justify-center items-center py-2 z-20 pointer-events-none transition-transform"
          style={{ transform: `translateY(${Math.min(pullDistance, 48)}px)` }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
            style={{ backgroundColor: 'var(--card-subtle)', color: 'var(--accent)' }}
          >
            {isRefreshing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowDown
                className="w-4 h-4 transition-transform"
                style={{ transform: pullDistance >= 70 ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            )}
          </div>
        </div>
      )}
      <div
        style={{
          transform: isRefreshing ? 'translateY(40px)' : `translateY(${pullDistance * 0.4}px)`,
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};
