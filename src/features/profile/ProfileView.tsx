import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Crown,
  Flame,
  CheckCircle2,
  Bookmark,
  Coins,
  Globe,
  Moon,
  Sun,
  Shield,
  Trash2,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Building,
  Edit2,
  MapPin,
  Award,
} from 'lucide-react';
import type { User, Theme, Language, Scenario, FacilityLevel } from '../../lib/types';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Modal } from '../../components/Modal';
import { PWAInstallButton } from '../../components/PWAInstallButton';
import { COUNTIES } from '../../lib/constants';
import { formatDate } from '../../lib/utils';
import { useToast } from '../../lib/toast';
import { updateMe } from '../../lib/supabase/queries/users';
import { listUserProgress } from '../../lib/supabase/queries/progress';

interface ProfileViewProps {
  user: User;
  theme: Theme;
  language: Language;
  savedScenarios: Scenario[];
  isSubscribed: boolean;
  onUpdateTheme: (theme: Theme) => void;
  onUpdateLanguage: (lang: Language) => void;
  onUpdateUser: (updates: Partial<User>) => void;
  onOpenPaywall: () => void;
  onSelectScenario: (scenario: Scenario) => void;
  onNavigateLegal: (slug: string) => void;
  onOpenAdmin: () => void;
  onDeleteAccount: () => void;
  onLogout: () => void;
  onOpenAuthModal?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  theme,
  language,
  savedScenarios,
  isSubscribed,
  onUpdateTheme,
  onUpdateLanguage,
  onUpdateUser,
  onOpenPaywall,
  onSelectScenario,
  onNavigateLegal,
  onOpenAdmin,
  onDeleteAccount,
  onLogout,
  onOpenAuthModal,
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  // Live profile stats
  const [readCount, setReadCount] = useState<number>(0);
  const [masteredCount, setMasteredCount] = useState<number>(0);
  const [activeDaysSet, setActiveDaysSet] = useState<Set<number>>(new Set());

  // Edit form state
  const [editName, setEditName] = useState(user.name || '');
  const [editCounty, setEditCounty] = useState(user.county || 'Nairobi');
  const [editLevel, setEditLevel] = useState<FacilityLevel>(user.target_facility_level || '5');
  const [savingProfile, setSavingProfile] = useState(false);

  const { showToast } = useToast();
  const isAdmin = user.metadata?.is_admin === true;
  const isGuest = user.id.startsWith('guest_') || !user.email || user.email.includes('@guest.local');

  // Load live progress statistics from Supabase
  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      const { data } = await listUserProgress();
      if (cancelled || !data) return;

      const reads = data.filter((p) => p.status === 'read' || p.status === 'revised' || p.status === 'mastered').length;
      const mastered = data.filter((p) => p.status === 'mastered').length;
      setReadCount(reads);
      setMasteredCount(mastered);

      // Determine active days in the last 7 days from last_opened timestamps
      const activeDays = new Set<number>();
      const now = new Date();
      data.forEach((p) => {
        if (p.last_opened) {
          const d = new Date(p.last_opened);
          const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays < 7) {
            // Day of week index 0-6 where 0 is Monday
            const dayOfWeek = (d.getDay() + 6) % 7;
            activeDays.add(dayOfWeek);
          }
        }
      });
      // If today is active
      if (user.last_active_date) {
        const d = new Date(user.last_active_date);
        const dayOfWeek = (d.getDay() + 6) % 7;
        activeDays.add(dayOfWeek);
      }
      setActiveDaysSet(activeDays);
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [user.id, user.last_active_date]);

  // Days of week starting Monday
  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    const updates: Partial<User> = {
      name: editName.trim() || null,
      county: editCounty,
      target_facility_level: editLevel,
    };

    const res = await updateMe(updates);
    setSavingProfile(false);

    if (res.error) {
      showToast(String(res.error), 'error');
      return;
    }

    onUpdateUser(updates);
    setEditProfileOpen(false);
    showToast('Nurse profile updated successfully', 'success');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 safe-top safe-bottom">
      {/* Profile Header */}
      <div className="card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base text-white shrink-0"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {user.name ? user.name.slice(0, 2).toUpperCase() : 'RN'}
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[var(--text)] truncate">
                {user.name || (isGuest ? 'Guest Nurse' : 'Kenyan Nurse')}
              </h2>
              {isGuest && (
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[var(--card-subtle)] text-[var(--muted)]">
                  Guest
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--muted)] truncate">
              {isGuest ? 'Sign in to save your clinical records' : user.email}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
              <span>{user.county || 'Nairobi County'}</span>
              <span aria-hidden="true">·</span>
              <span>Level {user.target_facility_level || '5'} Nurse</span>
            </div>
          </div>
        </div>

        {isGuest ? (
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[var(--accent)] shrink-0"
          >
            Sign In
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditName(user.name || '');
              setEditCounty(user.county || 'Nairobi');
              setEditLevel(user.target_facility_level || '5');
              setEditProfileOpen(true);
            }}
            className="p-2 rounded-lg bg-[var(--card-subtle)] text-[var(--muted)] hover:text-[var(--text)] shrink-0 transition-colors"
            title="Edit Profile"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Subscription Card */}
      <div className="card space-y-3" style={{ backgroundColor: 'var(--card)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-[var(--warning)]" />
            <span className="text-sm font-bold capitalize text-[var(--text)]">
              {user.subscription_status} Plan
            </span>
          </div>
          {isSubscribed ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[var(--success)]/15 text-[var(--success)]">
              Active
            </span>
          ) : (
            <button
              type="button"
              onClick={onOpenPaywall}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[var(--accent)]"
            >
              Go Unlimited
            </button>
          )}
        </div>

        <p className="text-xs text-[var(--muted)] leading-relaxed">
          {isSubscribed
            ? `Your subscription is active until ${formatDate(user.subscription_expires_at)}.`
            : 'Upgrade for unlimited scenarios, clinical audio breakdowns, and full community access.'}
        </p>
      </div>

      {/* Stats Grid with Live Database Metrics */}
      <div className="grid grid-cols-4 gap-2">
        <div className="card p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-[var(--warning)]">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <p className="text-base font-bold text-[var(--text)]">{user.streak_count}</p>
          <p className="text-[10px] text-[var(--muted)] uppercase font-semibold">Streak</p>
        </div>

        <div className="card p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-[var(--accent)]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-base font-bold text-[var(--text)]">{readCount}</p>
          <p className="text-[10px] text-[var(--muted)] uppercase font-semibold">Read</p>
        </div>

        <div className="card p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-[var(--success)]">
            <Award className="w-4 h-4" />
          </div>
          <p className="text-base font-bold text-[var(--text)]">{masteredCount}</p>
          <p className="text-[10px] text-[var(--muted)] uppercase font-semibold">Mastered</p>
        </div>

        <div className="card p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-[var(--warning)]">
            <Coins className="w-4 h-4" />
          </div>
          <p className="text-base font-bold text-[var(--text)]">{user.coins}</p>
          <p className="text-[10px] text-[var(--muted)] uppercase font-semibold">Coins</p>
        </div>
      </div>

      {/* Streak Calendar (Live 7-Day Activity) */}
      <div className="card space-y-2">
        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
          <span className="font-semibold text-[var(--text)]">Weekly Clinical Activity</span>
          <span>{user.streak_count} Days Consecutive</span>
        </div>
        <div className="grid grid-cols-7 gap-1 pt-1">
          {daysOfWeek.map((day, idx) => {
            const isActive = activeDaysSet.has(idx);
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-[var(--muted)]">{day}</span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold"
                  style={{
                    backgroundColor: isActive ? 'var(--accent)' : 'var(--card-subtle)',
                    color: isActive ? '#ffffff' : 'var(--muted)',
                  }}
                >
                  {isActive ? '✓' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bookmarked / Saved Scenarios */}
      {savedScenarios.length > 0 && (
        <div className="card space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Saved Scenarios ({savedScenarios.length})
          </h3>
          <div className="space-y-1.5">
            {savedScenarios.map((sc) => (
              <div
                key={sc.id}
                onClick={() => onSelectScenario(sc)}
                className="p-2.5 rounded-lg flex items-center justify-between bg-[var(--card-subtle)] cursor-pointer hover:opacity-90"
              >
                <div className="truncate pr-2">
                  <p className="text-xs font-semibold text-[var(--text)] truncate">{sc.title}</p>
                  <p className="text-[11px] text-[var(--muted)]">Level {sc.facility_level} · {sc.department}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--muted)] shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PWA App Install CTA */}
      <div className="card space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Offline Device Access</h3>
        <PWAInstallButton label="Install BOARDPASS on Phone" />
      </div>

      {/* Settings Section */}
      <div className="card space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Settings</h3>

        {/* Language switch */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 text-sm text-[var(--text)]">
            <Globe className="w-4 h-4 text-[var(--muted)]" />
            <span>Language</span>
          </div>
          <div className="flex items-center rounded-lg p-0.5 bg-[var(--card-subtle)]">
            <button
              type="button"
              onClick={() => {
                onUpdateLanguage('en');
                updateMe({ preferred_language: 'en' });
              }}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                language === 'en' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateLanguage('sw');
                updateMe({ preferred_language: 'sw' });
              }}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                language === 'sw' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'
              }`}
            >
              Kiswahili
            </button>
          </div>
        </div>

        {/* Theme switch */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 text-sm text-[var(--text)]">
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-[var(--muted)]" />
            ) : (
              <Sun className="w-4 h-4 text-[var(--muted)]" />
            )}
            <span>Theme</span>
          </div>
          <div className="flex items-center rounded-lg p-0.5 bg-[var(--card-subtle)]">
            {(['light', 'dark', 'system'] as Theme[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  onUpdateTheme(t);
                  updateMe({ theme: t });
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition-colors ${
                  theme === t ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legal & Regulatory Compliance */}
      <div className="card space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Legal & Compliance</h3>
        {[
          { slug: 'privacy', label: 'Privacy Policy (Kenya DPA 2019)' },
          { slug: 'terms', label: 'Terms of Service' },
          { slug: 'medical-disclaimer', label: 'Medical Disclaimer' },
          { slug: 'cookies', label: 'Cookie Policy' },
          { slug: 'guidelines', label: 'Community Guidelines' },
        ].map((item) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => onNavigateLegal(item.slug)}
            className="w-full flex items-center justify-between py-2 text-xs text-[var(--text)] hover:text-[var(--accent)] transition-colors"
          >
            <span>{item.label}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--muted)]" />
          </button>
        ))}
      </div>

      {/* Admin Panel Gateway (if admin) */}
      {isAdmin && (
        <div className="card space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--warning)]">Administrator</h3>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="w-full py-2.5 px-3 rounded-lg text-xs font-bold text-white bg-[var(--warning)] flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            <span>Open Nurse Moderator & Admin Console</span>
          </button>
        </div>
      )}

      {/* Account Actions */}
      <div className="space-y-2 pt-2">
        {!isGuest && (
          <button
            type="button"
            onClick={() => setLogoutModalOpen(true)}
            className="w-full py-3 rounded-lg text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] bg-[var(--card)] flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          className="w-full py-3 rounded-lg text-xs font-semibold text-[var(--danger)] bg-[var(--card)] flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Account (Kenya DPA Erasure)</span>
        </button>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        title="Edit Nurse Profile"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--muted)]">Full Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g., Sister Faith Wangari"
              className="w-full p-2.5 rounded-lg text-xs bg-[var(--card)] text-[var(--text)] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--muted)]">Target Facility Level</label>
            <select
              value={editLevel}
              onChange={(e) => setEditLevel(e.target.value as FacilityLevel)}
              className="w-full p-2.5 rounded-lg text-xs bg-[var(--card)] text-[var(--text)] focus:outline-none"
            >
              <option value="2">Level 2 (Dispensary)</option>
              <option value="3">Level 3 (Health Centre)</option>
              <option value="4">Level 4 (Sub-County Hospital)</option>
              <option value="5">Level 5 (County Referral Hospital)</option>
              <option value="6">Level 6 (National Referral: KNH, MTRH, KUTRRH)</option>
              <option value="private">Private Hospital (Aga Khan, Nairobi Hosp, etc.)</option>
              <option value="faith">Faith-Based (Mission Hospital)</option>
              <option value="ngo">NGO / Humanitarian</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--muted)]">Kenyan County</label>
            <select
              value={editCounty}
              onChange={(e) => setEditCounty(e.target.value)}
              className="w-full p-2.5 rounded-lg text-xs bg-[var(--card)] text-[var(--text)] focus:outline-none"
            >
              {COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full py-2.5 rounded-lg font-bold text-xs text-white bg-[var(--accent)] disabled:opacity-50"
          >
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </Modal>

      {/* Confirm Sign Out */}
      <ConfirmDialog
        isOpen={logoutModalOpen}
        title="Sign Out"
        message="Are you sure you want to sign out from BOARDPASS?"
        confirmLabel="Sign Out"
        onConfirm={() => {
          setLogoutModalOpen(false);
          onLogout();
        }}
        onCancel={() => setLogoutModalOpen(false)}
      />

      {/* Confirm Delete Account (DPA Erasure) */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        title="Delete Account & Erase Data"
        message="Pursuant to Kenya Data Protection Act 2019 Section 40, your account, streaks, comments, and payment records will be permanently erased. This cannot be undone."
        confirmLabel="Erase Everything"
        variant="danger"
        onConfirm={() => {
          setDeleteModalOpen(false);
          onDeleteAccount();
        }}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};
