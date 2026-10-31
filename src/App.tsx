import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './lib/toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BottomNav, TabType } from './components/BottomNav';
import { OfflineBanner } from './components/OfflineBanner';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { useLanguage } from './hooks/useLanguage';
import { useSubscription } from './hooks/useSubscription';
import { useOffline } from './hooks/useOffline';
import type { Scenario, ProgressStatus, LegalPage, Post } from './lib/types';
import { TodayView } from './features/scenarios/TodayView';
import { InterviewView } from './features/scenarios/InterviewView';
import { ScenarioDetailView } from './features/scenarios/ScenarioDetailView';
import { CommunityView } from './features/community/CommunityView';
import { ProfileView } from './features/profile/ProfileView';
import { PaywallModal } from './features/payments/PaywallModal';
import { AuthView } from './features/auth/AuthView';
import { AdminView } from './features/admin/AdminView';
import { LegalPage as LegalPageComponent } from './components/LegalPage';
import {
  isScenarioDownloaded,
  saveScenarioOffline,
  removeScenarioOffline,
  trackRecentViewed,
} from './lib/offline';
import {
  registerAuthModalHandler,
  requireAuth,
} from './lib/authGuard';
import { mergeGuestStateToServer } from './lib/guestMigration';
import {
  listBookmarkIds,
  listSavedScenarios,
  saveBookmark,
  removeBookmark,
  listUserProgress,
} from './lib/supabase/queries/progress';
import { getLegalPage } from './lib/supabase/queries/legal';
import { Sparkles, User as UserIcon } from 'lucide-react';

function MainApp() {
  const { user, updateUser, refreshUser, logout, deleteAccount } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage(user.preferred_language || 'en');
  const { isSubscribed, canAccessScenario, initiatePayment } = useSubscription(user, refreshUser);
  const { showToast } = useToast();

  const handleSyncComplete = useCallback(
    (count: number) => {
      showToast(`Synced ${count} offline updates`, 'success');
    },
    [showToast]
  );

  const { isOnline, pendingWritesCount } = useOffline(handleSyncComplete);

  // App routing and view state
  const [currentTab, setCurrentTab] = useState<TabType>('today');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [activeLegalSlug, setActiveLegalSlug] = useState<string | null>(null);
  const [legalPageData, setLegalPageData] = useState<LegalPage | null>(null);
  const [loadingLegal, setLoadingLegal] = useState(false);

  // Auth Modal State (Facebook-style guest prompt resumption)
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string | null>(null);
  const [pendingAuthCallback, setPendingAuthCallback] = useState<(() => void) | null>(null);

  // Live collections from database
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [savedScenariosList, setSavedScenariosList] = useState<Scenario[]>([]);
  const [freeScenariosRead, setFreeScenariosRead] = useState<number>(0);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  const isGuest = user.id.startsWith('guest_') || !user.email || user.email.includes('@guest.local');

  // Register Auth Guard modal handler
  useEffect(() => {
    registerAuthModalHandler((options) => {
      setAuthReason(options.message || null);
      if (options.resume) {
        setPendingAuthCallback(() => options.resume!);
      }
      setAuthModalOpen(true);
    });
  }, []);

  // Fetch bookmarks, saved scenarios, and read progress from live database
  const refreshUserData = useCallback(async () => {
    const [bmRes, savedRes, progRes] = await Promise.all([
      listBookmarkIds(),
      listSavedScenarios(),
      listUserProgress(),
    ]);

    if (bmRes.data) {
      setBookmarkedIds(new Set(bmRes.data));
    }
    if (savedRes.data) {
      setSavedScenariosList(savedRes.data);
    }
    if (progRes.data) {
      const readCount = progRes.data.filter(
        (p) => p.status === 'read' || p.status === 'revised' || p.status === 'mastered'
      ).length;
      setFreeScenariosRead(readCount);
    }
  }, []);

  useEffect(() => {
    refreshUserData();
  }, [user.id, refreshUserData]);

  // Fetch legal page when slug changes
  useEffect(() => {
    if (!activeLegalSlug) return;
    let cancelled = false;
    setLoadingLegal(true);

    getLegalPage(activeLegalSlug).then((res) => {
      if (cancelled) return;
      if (res.data) {
        setLegalPageData(res.data);
      }
      setLoadingLegal(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeLegalSlug]);

  // Handler for auth success
  const handleAuthSuccess = async () => {
    setAuthModalOpen(false);
    showToast('Signed in successfully', 'success');

    // Migrate any cached guest state to authenticated user
    if (user.id && !user.id.startsWith('guest_')) {
      await mergeGuestStateToServer(user.id);
    }

    await refreshUserData();

    // Execute pending interactive action
    if (pendingAuthCallback) {
      pendingAuthCallback();
      setPendingAuthCallback(null);
    }
    setAuthReason(null);
  };

  // Handler for bookmarking scenario with live Supabase query
  const handleBookmarkScenario = async (scenarioId: string, next: boolean): Promise<boolean> => {
    // Optimistic state
    setBookmarkedIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(scenarioId);
      else copy.delete(scenarioId);
      return copy;
    });

    const res = next ? await saveBookmark(scenarioId) : await removeBookmark(scenarioId);
    if (res.error) {
      // Rollback
      setBookmarkedIds((prev) => {
        const copy = new Set(prev);
        if (next) copy.delete(scenarioId);
        else copy.add(scenarioId);
        return copy;
      });
      showToast(res.error.message, 'error');
      return false;
    }

    refreshUserData();
    return true;
  };

  // Handler for selecting scenario
  const handleSelectScenario = (scenario: Scenario, isLocked?: boolean) => {
    if (isLocked) {
      setPaywallOpen(true);
      return;
    }
    trackRecentViewed(scenario);
    setSelectedScenario(scenario);
  };

  // Handler for toggling offline download
  const handleToggleDownload = (scenario: Scenario) => {
    const isDownloaded = downloadedIds.has(scenario.id) || isScenarioDownloaded(scenario.id);
    if (isDownloaded) {
      removeScenarioOffline(scenario.id);
      setDownloadedIds((prev) => {
        const copy = new Set(prev);
        copy.delete(scenario.id);
        return copy;
      });
      showToast('Removed from offline cache', 'info');
    } else {
      saveScenarioOffline(scenario);
      setDownloadedIds((prev) => {
        const copy = new Set(prev);
        copy.add(scenario.id);
        return copy;
      });
      showToast('Scenario cached for offline access', 'success');
    }
  };

  // If Auth modal is requested
  if (authModalOpen) {
    return (
      <AuthView
        promptMessage={authReason || undefined}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingAuthCallback(null);
          setAuthReason(null);
        }}
        onSuccess={handleAuthSuccess}
        onNavigateLegal={(slug) => {
          setActiveLegalSlug(slug);
          setAuthModalOpen(false);
        }}
      />
    );
  }

  // If a Legal statutory page is active
  if (activeLegalSlug) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <OfflineBanner isOnline={isOnline} pendingCount={pendingWritesCount} />
        {loadingLegal || !legalPageData ? (
          <div className="max-w-2xl mx-auto px-4 py-8 space-y-4 animate-pulse">
            <div className="h-6 w-48 bg-[var(--card)] rounded" />
            <div className="h-40 bg-[var(--card)] rounded-lg" />
          </div>
        ) : (
          <LegalPageComponent
            page={legalPageData}
            onBack={() => {
              setActiveLegalSlug(null);
              setLegalPageData(null);
            }}
            onNavigateSlug={(slug) => setActiveLegalSlug(slug)}
          />
        )}
      </div>
    );
  }

  // If Admin panel is open
  if (adminOpen) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <AdminView onClose={() => setAdminOpen(false)} />
      </div>
    );
  }

  // If a Scenario Detail is open
  if (selectedScenario) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <OfflineBanner isOnline={isOnline} pendingCount={pendingWritesCount} />
        <ScenarioDetailView
          scenario={selectedScenario}
          isSubscribed={isSubscribed}
          isBookmarked={bookmarkedIds.has(selectedScenario.id)}
          isDownloaded={downloadedIds.has(selectedScenario.id) || isScenarioDownloaded(selectedScenario.id)}
          progressStatus="unread"
          freeScenariosRead={freeScenariosRead}
          userId={user.id}
          language={language}
          onBack={() => {
            setSelectedScenario(null);
            refreshUserData();
          }}
          onBookmarkChanged={(val) => handleBookmarkScenario(selectedScenario.id, val)}
          onToggleDownload={() => handleToggleDownload(selectedScenario)}
          onOpenPaywall={() => setPaywallOpen(true)}
          onRequireAuth={(cb) => requireAuth(cb, { message: 'Access clinical discussion' })}
        />
        <PaywallModal
          isOpen={paywallOpen}
          onClose={() => setPaywallOpen(false)}
          onInitiatePayment={initiatePayment}
          userPhone={(user.metadata?.phone as string) || '254712345678'}
        />
      </div>
    );
  }

  // Main Tabs View
  return (
    <div className="min-h-screen pb-20 bg-[var(--bg)] text-[var(--text)]">
      {/* Offline Connectivity Banner */}
      <OfflineBanner isOnline={isOnline} pendingCount={pendingWritesCount} />

      {/* Facebook-style Guest Browsing Notice Banner (Zero borders) */}
      {isGuest && (
        <div className="px-4 py-2.5 bg-[var(--card)] text-xs flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-4 h-4 text-[var(--accent)] shrink-0" />
            <span className="text-[var(--text)] truncate">
              Browsing as guest. Sign in to save progress and interact with fellow Kenyan nurses.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="px-3 py-1 rounded-md text-xs font-bold text-white bg-[var(--accent)] shrink-0 transition-opacity hover:opacity-90"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1}>
        {currentTab === 'today' && (
          <TodayView
            user={user}
            bookmarkedIds={bookmarkedIds}
            onSelectScenario={handleSelectScenario}
            onBookmarkScenario={handleBookmarkScenario}
            onNavigateTab={(tab) => setCurrentTab(tab as TabType)}
            onRequireAuth={(cb) => requireAuth(cb, { message: 'Track clinical streak' })}
          />
        )}

        {currentTab === 'interview' && (
          <InterviewView
            isSubscribed={isSubscribed}
            bookmarkedIds={bookmarkedIds}
            freeScenariosRead={freeScenariosRead}
            onSelectScenario={handleSelectScenario}
            onBookmarkScenario={handleBookmarkScenario}
            onRequireAuth={(cb) => requireAuth(cb, { message: 'Access interview scenario' })}
            language={language}
          />
        )}

        {currentTab === 'community' && (
          <CommunityView
            isSubscribed={isSubscribed}
            onOpenPaywall={() => setPaywallOpen(true)}
            onOpenGuidelines={() => setActiveLegalSlug('guidelines')}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            user={user}
            theme={theme}
            language={language}
            savedScenarios={savedScenariosList}
            isSubscribed={isSubscribed}
            onUpdateTheme={setTheme}
            onUpdateLanguage={setLanguage}
            onUpdateUser={updateUser}
            onOpenPaywall={() => setPaywallOpen(true)}
            onSelectScenario={(sc) => setSelectedScenario(sc)}
            onNavigateLegal={(slug) => setActiveLegalSlug(slug)}
            onOpenAdmin={() => setAdminOpen(true)}
            onOpenAuthModal={() => setAuthModalOpen(true)}
            onDeleteAccount={async () => {
              await deleteAccount();
              showToast('Account deleted. Personal data cleared.', 'info');
            }}
            onLogout={async () => {
              await logout();
              showToast('Logged out', 'info');
            }}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation (No borders) */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedScenario(null);
          setCurrentTab(tab);
        }}
        labels={{
          today: t('nav.today'),
          interview: t('nav.interview'),
          community: t('nav.community'),
          profile: t('nav.profile'),
        }}
      />

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onInitiatePayment={initiatePayment}
        userPhone={(user.metadata?.phone as string) || '254712345678'}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </ErrorBoundary>
  );
}
