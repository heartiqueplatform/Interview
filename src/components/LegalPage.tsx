import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { LegalPage as LegalPageType } from '../lib/types';
import { formatDate } from '../lib/utils';
import { LegalFooter } from './LegalFooter';

interface LegalPageProps {
  page: LegalPageType;
  onBack: () => void;
  onNavigateSlug?: (slug: string) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ page, onBack, onNavigateSlug }) => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 safe-top safe-bottom">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text)]">{page.title}</h1>
          <div className="flex items-center gap-2 text-xs text-[var(--muted)] mt-0.5">
            <span>Version {page.version}</span>
            <span aria-hidden="true">·</span>
            <span>Updated {formatDate(page.last_updated)}</span>
          </div>
        </div>
      </div>

      {/* Main Legal Content Card */}
      <div className="card space-y-4">
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-[var(--text)] leading-relaxed whitespace-pre-line">
          {page.content_md}
        </div>
      </div>

      {/* Legal Footer Links */}
      <LegalFooter currentSlug={page.slug} onNavigate={onNavigateSlug} />
    </div>
  );
};
