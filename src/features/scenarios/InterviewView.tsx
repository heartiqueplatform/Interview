import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, HelpCircle, Loader2 } from 'lucide-react';
import type { Scenario, Facility } from '../../lib/types';
import { ScenarioCard } from '../../components/ScenarioCard';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { Modal } from '../../components/Modal';
import { PullToRefresh } from '../../components/PullToRefresh';
import { useToast } from '../../lib/toast';
import { useDebounce } from '../../hooks/useDebounce';
import { searchScenarios } from '../../lib/supabase/queries/scenarios';
import { createFacility } from '../../lib/supabase/queries/facilities';

interface InterviewViewProps {
  isSubscribed: boolean;
  bookmarkedIds: Set<string>;
  freeScenariosRead: number;
  onSelectScenario: (scenario: Scenario, isLocked: boolean) => void;
  onBookmarkScenario: (id: string, next: boolean) => Promise<boolean> | boolean;
  onRequireAuth: (cb: () => void) => void;
  language?: 'en' | 'sw';
}

export const InterviewView: React.FC<InterviewViewProps> = ({
  isSubscribed,
  bookmarkedIds,
  freeScenariosRead,
  onSelectScenario,
  onBookmarkScenario,
  onRequireAuth,
  language = 'en',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedTrap, setSelectedTrap] = useState<string>('all');

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [addFacilityOpen, setAddFacilityOpen] = useState(false);

  // New facility form state
  const [facName, setFacName] = useState('');
  const [facLevel, setFacLevel] = useState('4');
  const [facCounty, setFacCounty] = useState('Nairobi');
  const [facNotes, setFacNotes] = useState('');

  const { showToast } = useToast();

  const fetchScenariosList = useCallback(
    async (reset = true) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const res = await searchScenarios({
        limit: 20,
        cursor: reset ? undefined : nextCursor,
        facility_level: selectedLevel,
        department: selectedDept,
        trap_type: selectedTrap,
        query: debouncedQuery,
      });

      if (reset) {
        setScenarios(res.data.rows);
      } else {
        setScenarios((prev) => [...prev, ...res.data.rows]);
      }
      setNextCursor(res.data.nextCursor);
      setLoading(false);
      setLoadingMore(false);
    },
    [selectedLevel, selectedDept, selectedTrap, debouncedQuery, nextCursor]
  );

  useEffect(() => {
    fetchScenariosList(true);
  }, [selectedLevel, selectedDept, selectedTrap, debouncedQuery]);

  const handleFacilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facName.trim()) return;

    onRequireAuth(async () => {
      const res = await createFacility({
        name: facName.trim(),
        level: facLevel,
        county: facCounty,
        wards: ['Casualty', 'Maternity', 'General'],
        notes: facNotes.trim() || null,
      });

      if (res.data) {
        setFacName('');
        setFacNotes('');
        setAddFacilityOpen(false);
        showToast('Facility submitted for community review', 'success');
      } else {
        showToast('Failed to save facility', 'error');
      }
    });
  };

  const levelOptions = ['all', '3', '4', '5', '6', 'private', 'faith'];
  const deptOptions = ['all', 'Maternity', 'Medical', 'Surgical', 'Pediatrics', 'ICU', 'Theatre'];
  const trapOptions = ['all', 'Prioritization', 'Clinical judgment', 'Policy', 'Ethical dilemma'];

  return (
    <PullToRefresh onRefresh={() => fetchScenariosList(true)}>
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 safe-top safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--text)]">Interview Scenarios</h1>
            <p className="text-xs text-[var(--muted)]">Real hospital panel questions & clinical traps</p>
          </div>

          <button
            type="button"
            onClick={() => setAddFacilityOpen(true)}
            aria-label="Add facility"
            className="min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            style={{ backgroundColor: 'var(--card-subtle)', color: 'var(--accent)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Facility</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <label htmlFor="scenario-search" className="sr-only">
            Search questions, clinical traps, departments
          </label>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--muted)]">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="scenario-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions, clinical traps, departments..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-lg text-sm bg-[var(--card)] text-[var(--text)] placeholder-[var(--muted)] focus:outline-2 focus:outline-[var(--accent)]"
          />
        </div>

        {/* Filter Segmented Bars (Single line horizontal scrollable) */}
        <div className="space-y-2">
          {/* Level Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-semibold text-[var(--muted)] shrink-0 pl-1">Level:</span>
            {levelOptions.map((lvl) => {
              const active = selectedLevel === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className="min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--card-subtle)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {lvl === 'all' ? 'All Levels' : lvl.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-semibold text-[var(--muted)] shrink-0 pl-1">Dept:</span>
            {deptOptions.map((dept) => {
              const active = selectedDept === dept;
              return (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDept(dept)}
                  className="min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--card-subtle)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {dept === 'all' ? 'All Departments' : dept}
                </button>
              );
            })}
          </div>

          {/* Trap Type Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-semibold text-[var(--muted)] shrink-0 pl-1">Trap:</span>
            {trapOptions.map((trap) => {
              const active = selectedTrap === trap;
              return (
                <button
                  key={trap}
                  type="button"
                  onClick={() => setSelectedTrap(trap)}
                  className="min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--card-subtle)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {trap === 'all' ? 'All Traps' : trap}
                </button>
              );
            })}
          </div>
        </div>

        {/* Count indicator */}
        <div className="text-xs text-[var(--muted)] px-1">
          <span>{scenarios.length} scenarios loaded</span>
        </div>

        {/* Scenario List */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : scenarios.length === 0 ? (
          <EmptyState
            icon={<HelpCircle className="w-6 h-6" />}
            headline="No scenarios found"
            body="No scenarios matched your search or filters. Try adjusting your parameters or clear search."
            actionLabel="Reset filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedLevel('all');
              setSelectedDept('all');
              setSelectedTrap('all');
            }}
          />
        ) : (
          <div className="space-y-3">
            {scenarios.map((scenario, index) => {
              const isLocked = !isSubscribed && freeScenariosRead >= 5 && index >= 5;
              return (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  isLocked={isLocked}
                  isBookmarked={bookmarkedIds.has(scenario.id)}
                  onBookmark={(next) => onBookmarkScenario(scenario.id, next)}
                  onSelect={() => onSelectScenario(scenario, isLocked)}
                  language={language}
                />
              );
            })}

            {/* Load more cursor button */}
            {nextCursor && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => fetchScenariosList(false)}
                  disabled={loadingMore}
                  className="min-h-[44px] px-5 py-2.5 rounded-lg text-xs font-semibold bg-[var(--card-subtle)] text-[var(--text)] disabled:opacity-50"
                >
                  {loadingMore ? 'Loading more...' : 'Load more scenarios'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add Facility Modal */}
        <Modal
          isOpen={addFacilityOpen}
          onClose={() => setAddFacilityOpen(false)}
          title="Add Interview Hospital"
        >
          <form onSubmit={handleFacilitySubmit} className="space-y-3">
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Interviewing at a hospital not listed? Add it here to request verified interview questions.
            </p>

            <div>
              <label htmlFor="fac-name" className="block text-xs font-medium text-[var(--muted)] mb-1">
                Hospital / Facility Name
              </label>
              <input
                id="fac-name"
                type="text"
                required
                value={facName}
                onChange={(e) => setFacName(e.target.value)}
                placeholder="e.g. Machakos Level 5 Hospital"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[var(--card-subtle)] text-[var(--text)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="fac-lvl" className="block text-xs font-medium text-[var(--muted)] mb-1">
                  Level
                </label>
                <input
                  id="fac-lvl"
                  type="text"
                  value={facLevel}
                  onChange={(e) => setFacLevel(e.target.value)}
                  placeholder="Level 4 / 5 / 6"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[var(--card-subtle)] text-[var(--text)]"
                />
              </div>

              <div>
                <label htmlFor="fac-county" className="block text-xs font-medium text-[var(--muted)] mb-1">
                  County
                </label>
                <input
                  id="fac-county"
                  type="text"
                  value={facCounty}
                  onChange={(e) => setFacCounty(e.target.value)}
                  placeholder="e.g. Machakos"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[var(--card-subtle)] text-[var(--text)]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="fac-notes" className="block text-xs font-medium text-[var(--muted)] mb-1">
                Notes / What questions did they ask you?
              </label>
              <textarea
                id="fac-notes"
                value={facNotes}
                onChange={(e) => setFacNotes(e.target.value)}
                placeholder="Share any questions the board asked..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[var(--card-subtle)] text-[var(--text)] resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAddFacilityOpen(false)}
                className="flex-1 min-h-[44px] rounded-lg text-sm font-medium bg-[var(--card-subtle)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 min-h-[44px] rounded-lg text-sm font-semibold text-white bg-[var(--accent)]"
              >
                Submit Facility
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </PullToRefresh>
  );
};
