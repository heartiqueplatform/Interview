import React, { useState, useEffect } from 'react';
import { Flame, Play, Sparkles, Check, RefreshCw } from 'lucide-react';
import type { Scenario, DrugCalc, WardTip, Post, User } from '../../lib/types';
import { ScenarioCard } from '../../components/ScenarioCard';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../lib/toast';
import { getTodaysScenario, getResumeScenario } from '../../lib/supabase/queries/scenarios';
import { getRandomDrill, recordAttempt } from '../../lib/supabase/queries/drugCalcs';
import { getRandomTip } from '../../lib/supabase/queries/wardTips';
import { listPosts } from '../../lib/supabase/queries/posts';
import { recordActiveToday } from '../../lib/supabase/queries/users';

interface TodayViewProps {
  user: User | null;
  bookmarkedIds: Set<string>;
  onSelectScenario: (scenario: Scenario) => void;
  onBookmarkScenario: (id: string, next: boolean) => Promise<boolean> | boolean;
  onNavigateTab: (tab: 'interview' | 'community' | 'profile') => void;
  onRequireAuth: (cb: () => void) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  user,
  bookmarkedIds,
  onSelectScenario,
  onBookmarkScenario,
  onNavigateTab,
  onRequireAuth,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [todaysScenario, setTodaysScenario] = useState<Scenario | null>(null);
  const [resumeScenario, setResumeScenario] = useState<Scenario | null>(null);
  const [activeDrill, setActiveDrill] = useState<DrugCalc | null>(null);
  const [activeTip, setActiveTip] = useState<WardTip | null>(null);
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);

  const [selectedCalcOption, setSelectedCalcOption] = useState<number | null>(null);
  const [isCalcAnswered, setIsCalcAnswered] = useState(false);

  const loadTodayData = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [todayRes, drillRes, tipRes, postsRes] = await Promise.all([
        getTodaysScenario(signal),
        getRandomDrill(signal),
        getRandomTip(signal),
        listPosts({ limit: 3, signal }),
      ]);

      setTodaysScenario(todayRes.data);
      setActiveDrill(drillRes.data);
      setActiveTip(tipRes.data);
      setCommunityPosts(postsRes.data.rows);

      if (user) {
        const resumeRes = await getResumeScenario(user.id, signal);
        setResumeScenario(resumeRes.data);
        // Record active streak for today
        await recordActiveToday();
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadTodayData(controller.signal);
    return () => controller.abort();
  }, [user]);

  const handleSelectDrillOption = async (index: number) => {
    if (isCalcAnswered || !activeDrill) return;

    if (!user) {
      onRequireAuth(() => handleSelectDrillOption(index));
      return;
    }

    setSelectedCalcOption(index);
    setIsCalcAnswered(true);

    const isCorrect = index === activeDrill.correct_index;
    await recordAttempt({
      calc_id: activeDrill.id,
      selected_index: index,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      showToast('Correct! +5 Coins awarded to your account', 'success');
    } else {
      showToast('Incorrect — review the clinical formula below', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 safe-top safe-bottom">
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-44 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 safe-top safe-bottom">
      {/* Top Header with Streak */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text)]">Today</h1>
          <p className="text-xs text-[var(--muted)]">Shift readiness & daily clinical drill</p>
        </div>

        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ backgroundColor: 'var(--card)', color: 'var(--warning)' }}
        >
          <Flame className="w-4 h-4 fill-current" />
          <span>{user?.streak_count ?? 0} Day streak</span>
        </div>
      </div>

      {/* Resume Card (if user has an in-progress scenario) */}
      {resumeScenario && (
        <div
          onClick={() => onSelectScenario(resumeScenario)}
          className="card flex items-center justify-between cursor-pointer active:opacity-90"
          style={{ backgroundColor: 'var(--card-subtle)' }}
        >
          <div className="space-y-0.5 pr-2">
            <span className="text-[11px] font-semibold text-[var(--accent)] uppercase tracking-wider">
              Continue where you left off
            </span>
            <h3 className="text-sm font-semibold text-[var(--text)] line-clamp-1">
              {resumeScenario.title}
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Level {resumeScenario.facility_level} · {resumeScenario.department}
            </p>
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      )}

      {/* Today's Featured Scenario */}
      {todaysScenario ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--muted)] px-1">
            <span>Today's Scenario</span>
            <button
              type="button"
              onClick={() => onNavigateTab('interview')}
              className="text-[var(--accent)] lowercase hover:underline"
            >
              all scenarios →
            </button>
          </div>
          <ScenarioCard
            scenario={todaysScenario}
            isLocked={false}
            isBookmarked={bookmarkedIds.has(todaysScenario.id)}
            onBookmark={(next) => onBookmarkScenario(todaysScenario.id, next)}
            onSelect={() => onSelectScenario(todaysScenario)}
          />
        </div>
      ) : (
        <EmptyState
          icon={<Sparkles className="w-6 h-6" />}
          headline="No scenarios available"
          body="New interview scenarios will be seeded by hospital board specialists shortly."
          actionLabel="Refresh"
          onAction={() => loadTodayData()}
        />
      )}

      {/* Drug Calculation Drill Card */}
      {activeDrill ? (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Drug Calculation Drill</span>
            </div>
            <span className="text-[11px] text-[var(--accent)] font-semibold">+5 Coins</span>
          </div>

          <p className="text-sm text-[var(--text)] leading-relaxed font-medium">
            {activeDrill.question}
          </p>

          {/* Options */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {activeDrill.options.map((opt, idx) => {
              const isSelected = selectedCalcOption === idx;
              const isCorrect = idx === activeDrill.correct_index;

              let bgColor = 'var(--card-subtle)';
              let textColor = 'var(--text)';

              if (isCalcAnswered) {
                if (isCorrect) {
                  bgColor = 'var(--right-tint)';
                  textColor = 'var(--success)';
                } else if (isSelected) {
                  bgColor = 'var(--wrong-tint)';
                  textColor = 'var(--danger)';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDrillOption(idx)}
                  disabled={isCalcAnswered}
                  className="min-h-[44px] px-3 py-2.5 rounded-lg text-xs font-medium text-left flex items-center justify-between transition-colors"
                  style={{ backgroundColor: bgColor, color: textColor }}
                >
                  <span>{opt}</span>
                  {isCalcAnswered && isCorrect && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation if answered */}
          {isCalcAnswered && (
            <div className="pt-2 text-xs leading-relaxed text-[var(--muted)]">
              <span className="font-semibold text-[var(--text)]">Clinical Math Breakdown: </span>
              {activeDrill.explanation}
            </div>
          )}
        </div>
      ) : null}

      {/* Ward Tip Card */}
      {activeTip && (
        <div className="card space-y-1.5" style={{ backgroundColor: 'var(--card)' }}>
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span className="font-bold uppercase tracking-wider">Ward Tip · {activeTip.department || 'Clinical'}</span>
            <span>Senior Sister Advice</span>
          </div>
          <p className="text-sm text-[var(--text)] leading-relaxed italic">
            "{activeTip.tip}"
          </p>
        </div>
      )}

      {/* Community Preview */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--muted)] px-1">
          <span>From the Community</span>
          <button
            type="button"
            onClick={() => onNavigateTab('community')}
            className="text-[var(--accent)] lowercase hover:underline"
          >
            see feed →
          </button>
        </div>

        {communityPosts.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="w-6 h-6" />}
            headline="No posts yet"
            body="Be the first nurse to share an interview experience."
            actionLabel="View Community"
            onAction={() => onNavigateTab('community')}
          />
        ) : (
          <div className="space-y-2">
            {communityPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => onNavigateTab('community')}
                className="card p-3 space-y-1.5 cursor-pointer active:opacity-90 transition-opacity"
              >
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span className="font-semibold text-[var(--text)]">
                    {post.is_anonymous ? 'Anonymous Nurse' : post.author?.name || 'Registered Nurse'}
                  </span>
                  <span className="capitalize">{post.category.replace('-', ' ')}</span>
                </div>
                <p className="text-xs text-[var(--text)] line-clamp-2 leading-relaxed">
                  {post.body}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-[var(--muted)] pt-0.5">
                  <span>{post.like_count} likes</span>
                  <span>{post.reply_count} replies</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
