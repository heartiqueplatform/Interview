import React from 'react';

interface LegalFooterProps {
  currentSlug?: string;
  onNavigate?: (slug: string) => void;
}

export const LegalFooter: React.FC<LegalFooterProps> = ({ currentSlug, onNavigate }) => {
  const links = [
    { slug: 'privacy', label: 'Privacy' },
    { slug: 'terms', label: 'Terms' },
    { slug: 'guidelines', label: 'Guidelines' },
    { slug: 'data-deletion', label: 'Data Deletion' },
    { slug: 'cookies', label: 'Cookies' },
  ];

  return (
    <footer className="text-center py-6 px-4 space-y-2">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
        {links.map((link) => {
          const isCurrent = link.slug === currentSlug;
          return (
            <button
              key={link.slug}
              type="button"
              onClick={() => onNavigate && onNavigate(link.slug)}
              className="hover:text-[var(--text)] transition-colors underline-offset-4 hover:underline"
              style={{
                color: isCurrent ? 'var(--accent)' : 'var(--muted)',
                fontWeight: isCurrent ? 600 : 400,
              }}
            >
              {link.label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-[var(--muted)]">
        BOARDPASS © 2026. Made with respect for every Kenyan nurse.
      </p>
    </footer>
  );
};
