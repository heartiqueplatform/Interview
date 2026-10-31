import React from 'react';
import { Bookmark, Lock, Volume2, CheckCircle2 } from 'lucide-react';
import type { Scenario, ProgressStatus } from '../lib/types';
import { ToggleButton } from './ToggleButton';

interface ScenarioCardProps {
  scenario: Scenario;
  isLocked: boolean;
  isBookmarked: boolean;
  progressStatus?: ProgressStatus;
  isDownloaded?: boolean;
  onBookmark: (next: boolean) => Promise<boolean> | boolean;
  onSelect: () => void;
  language?: 'en' | 'sw';
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  isLocked,
  isBookmarked,
  progressStatus,
  isDownloaded,
  onBookmark,
  onSelect,
  language = 'en',
}) => {
  const displayTitle =
    language === 'sw' && scenario.swahili_title ? scenario.swahili_title : scenario.title;

  return (
    <div
      onClick={onSelect}
      className="card flex flex-col gap-3 transition-opacity cursor-pointer active:opacity-90"
      style={{ backgroundColor: 'var(--card)' }}
    >
      {/* Top unboxed metadata */}
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>Level {scenario.facility_level}</span>
          <span aria-hidden="true">·</span>
          <span>{scenario.department}</span>
          <span aria-hidden="true">·</span>
          <span>{scenario.trap_type}</span>
        </div>

        <div className="flex items-center gap-1">
          {scenario.english_audio_url && (
            <span title="Audio available" className="p-1 text-[var(--muted)]">
              <Volume2 className="w-3.5 h-3.5" />
            </span>
          )}
          {isDownloaded && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--card-subtle)] text-[var(--success)]">
              Offline
            </span>
          )}
          {isLocked && (
            <span className="p-1 text-[var(--warning)]" title="Locked - Premium">
              <Lock className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold leading-snug tracking-tight text-[var(--text)]">
        {displayTitle}
      </h3>

      {/* Snippet preview */}
      <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
        {language === 'sw' && scenario.swahili_scenario_text
          ? scenario.swahili_scenario_text
          : scenario.scenario_text}
      </p>

      {/* Footer bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {progressStatus && progressStatus !== 'unread' && (
            <span
              className="text-[11px] font-medium flex items-center gap-1"
              style={{
                color:
                  progressStatus === 'mastered'
                    ? 'var(--success)'
                    : progressStatus === 'revised'
                    ? 'var(--accent)'
                    : 'var(--muted)',
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="capitalize">{progressStatus}</span>
            </span>
          )}
          <span className="text-[11px] text-[var(--muted)]">
            Stickiness: {scenario.memory_stickiness}%
          </span>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <ToggleButton
            isActive={isBookmarked}
            onToggle={onBookmark}
            ariaLabel="Bookmark scenario"
            icon={<Bookmark className="w-4 h-4" />}
            activeIcon={<Bookmark className="w-4 h-4 fill-current text-[var(--accent)]" />}
          />
        </div>
      </div>
    </div>
  );
};
