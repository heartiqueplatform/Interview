import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  headline: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  headline,
  body,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="card text-center py-8 px-6 flex flex-col items-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3 text-[var(--accent)]"
        style={{ backgroundColor: 'var(--card-subtle)' }}
      >
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>
        {headline}
      </h3>
      <p className="text-sm max-w-xs mb-4" style={{ color: 'var(--muted)' }}>
        {body}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold transition-opacity cursor-pointer"
          style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
