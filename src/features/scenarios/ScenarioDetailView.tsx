import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Volume2,
  Bookmark,
  Share2,
  Download,
  ChevronDown,
  ChevronUp,
  Lock,
  Flag,
  UserX,
  Send,
  ExternalLink,
  Crown,
} from 'lucide-react';
import type { Scenario, ProgressStatus, ScenarioComment, ReportReason } from '../../lib/types';
import { ToggleButton } from '../../components/ToggleButton';
import { Modal } from '../../components/Modal';
import { useToast } from '../../lib/toast';
import { supabase } from '../../lib/supabase/client';
import { listScenarioComments, createScenarioComment, likeScenarioComment } from '../../lib/supabase/queries/comments';
import { upsertProgress, saveBookmark, removeBookmark } from '../../lib/supabase/queries/progress';
import { submitReport, blockUser } from '../../lib/supabase/queries/reports';

interface ScenarioDetailViewProps {
  scenario: Scenario;
  isSubscribed: boolean;
  isBookmarked: boolean;
  isDownloaded: boolean;
  progressStatus: ProgressStatus;
  freeScenariosRead: number;
  userId?: string | null;
  language: 'en' | 'sw';
  onBack: () => void;
  onBookmarkChanged: (val: boolean) => void;
  onToggleDownload: () => void;
  onOpenPaywall: () => void;
  onRequireAuth: (cb: () => void) => void;
}

export const ScenarioDetailView: React.FC<ScenarioDetailViewProps> = ({
  scenario,
  isSubscribed,
  isBookmarked,
  isDownloaded,
  progressStatus: initialProgress,
  freeScenariosRead,
  userId,
  language: initialLang,
  onBack,
  onBookmarkChanged,
  onToggleDownload,
  onOpenPaywall,
  onRequireAuth,
}) => {
  const [contentLang, setContentLang] = useState<'en' | 'sw'>(initialLang);
  const [showWhatBoardTests, setShowWhatBoardTests] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<ProgressStatus>(initialProgress);

  const [comments, setComments] = useState<ScenarioComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [reportModalCommentId, setReportModalCommentId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>('spam');
  const [blockUserTarget, setBlockUserTarget] = useState<string | null>(null);

  const { showToast } = useToast();

  const isScenarioPaywalled = !isSubscribed && freeScenariosRead >= 5 && currentProgress === 'unread';

  // Mark as read debounced 1s after mount if user is authenticated
  useEffect(() => {
    if (!userId) return;
    const timer = setTimeout(() => {
      if (currentProgress === 'unread') {
        upsertProgress({ scenario_id: scenario.id, status: 'read' });
        setCurrentProgress('read');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [scenario.id, userId, currentProgress]);

  // Load comments & set up realtime listener
  useEffect(() => {
    let isMounted = true;
    const fetchComments = async () => {
      setLoadingComments(true);
      const res = await listScenarioComments(scenario.id);
      if (isMounted) {
        setComments(res.data);
        setLoadingComments(false);
      }
    };
    fetchComments();

    // Supabase Realtime Channel
    const channel = supabase
      .channel(`scenario_comments_${scenario.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scenario_comments', filter: `scenario_id=eq.${scenario.id}` },
        (payload) => {
          const newRow = payload.new as ScenarioComment;
          if (newRow.status === 'published') {
            setComments((prev) => [newRow, ...prev.filter((c) => c.id !== newRow.id)]);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [scenario.id]);

  const title =
    contentLang === 'sw' && scenario.swahili_title ? scenario.swahili_title : scenario.title;
  const scenarioText =
    contentLang === 'sw' && scenario.swahili_scenario_text
      ? scenario.swahili_scenario_text
      : scenario.scenario_text;
  const wrongAnswer =
    contentLang === 'sw' && scenario.swahili_wrong_answer
      ? scenario.swahili_wrong_answer
      : scenario.wrong_answer;
  const rightAnswer =
    contentLang === 'sw' && scenario.swahili_right_answer
      ? scenario.swahili_right_answer
      : scenario.right_answer;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: scenario.title,
          text: `Review this Kenyan nursing board scenario: ${scenario.title}`,
          url: window.location.href,
        });
      } catch {
        // cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard', 'info');
    }
  };

  const handleAudioTap = () => {
    if (!isSubscribed) {
      onOpenPaywall();
      return;
    }
    if (!userId) {
      onRequireAuth(() => handleAudioTap());
      return;
    }

    setIsPlayingAudio(!isPlayingAudio);
    // Log scenario play
    supabase.from('scenario_plays').insert({
      user_id: userId,
      scenario_id: scenario.id,
      play_type: contentLang === 'sw' ? 'swahili_audio' : 'english_audio',
    });
    showToast(isPlayingAudio ? 'Audio paused' : 'Playing clinical audio breakdown', 'info');
  };

  const handleProgressChange = async (status: ProgressStatus) => {
    if (!userId) {
      onRequireAuth(() => handleProgressChange(status));
      return;
    }
    setCurrentProgress(status);
    await upsertProgress({ scenario_id: scenario.id, status });
    showToast(`Marked as ${status}`, 'success');
  };

  const handleBookmarkToggle = async (next: boolean) => {
    if (!userId) {
      onRequireAuth(() => handleBookmarkToggle(next));
      return false;
    }
    onBookmarkChanged(next);
    if (next) {
      await saveBookmark(scenario.id);
    } else {
      await removeBookmark(scenario.id);
    }
    return true;
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentBody.trim()) return;

    if (!userId) {
      onRequireAuth(() => handleAddComment(e));
      return;
    }

    if (isScenarioPaywalled) {
      onOpenPaywall();
      return;
    }

    const res = await createScenarioComment({
      scenario_id: scenario.id,
      body: newCommentBody.trim(),
      is_anonymous: isAnonymous,
    });

    if (res.data) {
      setComments([res.data, ...comments]);
      setNewCommentBody('');
      showToast('Comment posted', 'success');
    } else {
      showToast('Could not post comment', 'error');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!userId) {
      onRequireAuth(() => handleLikeComment(commentId));
      return;
    }
    await likeScenarioComment(commentId);
    showToast('Liked comment', 'success');
  };

  const handleReportCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalCommentId) return;
    await submitReport({
      content_type: 'scenario_comment',
      content_id: reportModalCommentId,
      reason: reportReason,
    });
    setReportModalCommentId(null);
    showToast('Report submitted for nurse review', 'success');
  };

  const handleBlockUserAction = async (targetUserId: string) => {
    await blockUser(targetUserId);
    setComments(comments.filter((c) => c.user_id !== targetUserId));
    setBlockUserTarget(null);
    showToast('User blocked. Comments hidden.', 'info');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 safe-top safe-bottom">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to scenarios"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Language switch button */}
        <div className="flex items-center rounded-lg p-1" style={{ backgroundColor: 'var(--card)' }}>
          <button
            type="button"
            onClick={() => setContentLang('en')}
            className="px-2.5 py-1 text-xs font-semibold rounded-md transition-colors"
            style={{
              backgroundColor: contentLang === 'en' ? 'var(--card-subtle)' : 'transparent',
              color: contentLang === 'en' ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setContentLang('sw')}
            className="px-2.5 py-1 text-xs font-semibold rounded-md transition-colors"
            style={{
              backgroundColor: contentLang === 'sw' ? 'var(--card-subtle)' : 'transparent',
              color: contentLang === 'sw' ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            SW
          </button>
        </div>
      </div>

      {/* Main Title & Metadata Card */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)] flex-wrap">
          <span>Level {scenario.facility_level}</span>
          <span aria-hidden="true">·</span>
          <span>{scenario.department}</span>
          <span aria-hidden="true">·</span>
          <span>{scenario.trap_type}</span>
          <span aria-hidden="true">·</span>
          <span className="capitalize">{scenario.experience_level}</span>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-[var(--text)] leading-snug">
          {title}
        </h1>

        <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-1">
          <span>Verified by: {scenario.verified_by || 'Senior Nurse Specialist'}</span>
          <span>v{scenario.version}</span>
        </div>
      </div>

      {/* Clinical Scenario Question Card */}
      <div className="card space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          {contentLang === 'sw' ? 'Tukio Halisi la Wadi / Mahojiano' : 'Clinical Scenario & Question'}
        </h2>
        <p className="text-base text-[var(--text)] leading-relaxed whitespace-pre-line">
          {scenarioText}
        </p>

        {/* Audio Player Strip */}
        <div
          onClick={handleAudioTap}
          className="p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
          style={{ backgroundColor: 'var(--card-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: isPlayingAudio ? 'var(--success)' : 'var(--accent)' }}
            >
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text)]">
                {contentLang === 'sw' ? 'Sikiliza Sauti ya Tukio' : 'Audio Breakdown & Clinical Debrief'}
              </p>
              <p className="text-[11px] text-[var(--muted)]">
                {!isSubscribed ? 'Premium subscriber feature' : isPlayingAudio ? 'Playing...' : 'Tap to listen (2 min)'}
              </p>
            </div>
          </div>
          {!isSubscribed && <Lock className="w-4 h-4 text-[var(--warning)]" />}
        </div>
      </div>

      {/* Expandable "What They're Testing" */}
      <div className="card space-y-2">
        <button
          type="button"
          onClick={() => setShowWhatBoardTests(!showWhatBoardTests)}
          aria-expanded={showWhatBoardTests}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <span className="text-sm font-semibold text-[var(--text)]">
            {contentLang === 'sw' ? 'Wanachopima Kwenye Bodi' : "What They're Testing (The Board Trap)"}
          </span>
          {showWhatBoardTests ? (
            <ChevronUp className="w-4 h-4 text-[var(--muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--muted)]" />
          )}
        </button>

        {showWhatBoardTests && (
          <p className="text-sm text-[var(--muted)] leading-relaxed pt-2">
            {scenario.what_board_tests}
          </p>
        )}
      </div>

      {/* WRONG ANSWER CARD - ZERO BORDER, RED TINT ONLY (Always visible to hook user) */}
      <div className="wrong-block space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--danger)]">
          {contentLang === 'sw' ? 'Jibu Lisilo Sahihi (Kosa Kubwa)' : 'Wrong Answer (Common Fatal Trap)'}
        </span>
        <p className="text-sm text-[var(--text)] leading-relaxed">{wrongAnswer}</p>
      </div>

      {/* RIGHT ANSWER CARD OR PAYWALL CARD */}
      {isScenarioPaywalled ? (
        <div className="card text-center p-5 space-y-3" style={{ backgroundColor: 'var(--card-subtle)' }}>
          <div
            className="w-10 h-10 rounded-full mx-auto flex items-center justify-center text-[var(--warning)]"
            style={{ backgroundColor: 'var(--card)' }}
          >
            <Crown className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--text)]">Unlock the Verified Board Standard Answer</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed max-w-sm mx-auto">
              You've read 5 free scenarios. Subscribe from KES 299/mo to unlock this clinical answer, audio breakdown, and full question bank.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenPaywall}
            className="w-full min-h-[44px] rounded-lg text-xs font-bold text-white bg-[var(--accent)]"
          >
            Unlock All 200+ Scenarios with M-Pesa
          </button>
        </div>
      ) : (
        <div className="right-block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--success)]">
            {contentLang === 'sw' ? 'Jibu Sahihi (Kiwango cha Bodi)' : 'Right Answer (Board Standard)'}
          </span>
          <p className="text-sm text-[var(--text)] leading-relaxed font-medium">{rightAnswer}</p>
        </div>
      )}

      {/* Progress & Actions Strip */}
      <div className="card flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleProgressChange('read')}
            className={`min-h-[44px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              currentProgress === 'read' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--card-subtle)] text-[var(--muted)]'
            }`}
          >
            Read
          </button>
          <button
            type="button"
            onClick={() => handleProgressChange('revised')}
            className={`min-h-[44px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              currentProgress === 'revised' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--card-subtle)] text-[var(--muted)]'
            }`}
          >
            Revised
          </button>
          <button
            type="button"
            onClick={() => handleProgressChange('mastered')}
            className={`min-h-[44px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              currentProgress === 'mastered' ? 'bg-[var(--success)] text-white' : 'bg-[var(--card-subtle)] text-[var(--muted)]'
            }`}
          >
            Mastered
          </button>
        </div>

        <div className="flex items-center gap-1">
          <ToggleButton
            isActive={isBookmarked}
            onToggle={handleBookmarkToggle}
            ariaLabel="Save bookmark"
            icon={<Bookmark className="w-4 h-4" />}
            activeIcon={<Bookmark className="w-4 h-4 fill-current text-[var(--accent)]" />}
          />
          <button
            type="button"
            onClick={() => {
              if (!userId) {
                onRequireAuth(() => onToggleDownload());
              } else {
                onToggleDownload();
              }
            }}
            aria-label="Download for offline"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--text)]"
            style={{ color: isDownloaded ? 'var(--success)' : 'var(--muted)' }}
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share scenario"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--text)]"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* External Resources */}
      {scenario.external_resources && scenario.external_resources.length > 0 && (
        <div className="card space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            External Ministry & Council References
          </h3>
          <div className="space-y-1.5">
            {scenario.external_resources.map((res, idx) => (
              <a
                key={idx}
                href={res.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg text-xs font-medium bg-[var(--card-subtle)] text-[var(--text)] hover:text-[var(--accent)] transition-colors"
              >
                <span className="truncate pr-2">{res.title}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[var(--muted)]" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Peer Discussions & Live Comments */}
      <div className="card space-y-4">
        <h3 className="text-sm font-bold tracking-tight text-[var(--text)]">
          Nurse Discussions ({comments.length})
        </h3>

        {/* Comment input form */}
        <form onSubmit={handleAddComment} className="space-y-2">
          <textarea
            value={newCommentBody}
            onChange={(e) => setNewCommentBody(e.target.value)}
            placeholder="Share your clinical perspective or question..."
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[var(--card-subtle)] text-[var(--text)] resize-none"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-[var(--muted)] cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded bg-[var(--card-subtle)]"
              />
              <span>Post anonymously</span>
            </label>
            <button
              type="submit"
              disabled={!newCommentBody.trim()}
              className="min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[var(--accent)] disabled:opacity-40"
            >
              Post Comment
            </button>
          </div>
        </form>

        {/* Comments list */}
        <div className="space-y-3 pt-1">
          {loadingComments ? (
            <div className="text-xs text-[var(--muted)] py-2">Loading discussions...</div>
          ) : comments.length === 0 ? (
            <div className="text-xs text-[var(--muted)] py-2">No comments yet. Be the first to share your experience.</div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-3 rounded-lg bg-[var(--card-subtle)] space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span className="font-semibold text-[var(--text)]">
                    {comment.is_anonymous ? 'Anonymous Nurse' : comment.author?.name || 'Registered Nurse'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleLikeComment(comment.id)}
                      className="p-1 hover:text-[var(--accent)]"
                    >
                      ♡
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportModalCommentId(comment.id)}
                      aria-label="Report comment"
                      className="p-1 text-[var(--muted)] hover:text-[var(--danger)]"
                    >
                      <Flag className="w-3 h-3" />
                    </button>
                    {!comment.is_anonymous && comment.user_id && comment.user_id !== userId && (
                      <button
                        type="button"
                        onClick={() => setBlockUserTarget(comment.user_id)}
                        aria-label="Block nurse"
                        className="p-1 text-[var(--muted)] hover:text-[var(--danger)]"
                      >
                        <UserX className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[var(--text)] leading-relaxed">{comment.body}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Report Modal */}
      <Modal
        isOpen={reportModalCommentId !== null}
        onClose={() => setReportModalCommentId(null)}
        title="Report Comment"
      >
        <form onSubmit={handleReportCommentSubmit} className="space-y-3 text-xs">
          <p className="text-[var(--muted)]">Why are you reporting this comment?</p>
          {(['spam', 'harassment', 'wrong_info', 'other'] as ReportReason[]).map((r) => (
            <label key={r} className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--card-subtle)] cursor-pointer">
              <input
                type="radio"
                name="repReason"
                checked={reportReason === r}
                onChange={() => setReportReason(r)}
              />
              <span className="capitalize">{r.replace('_', ' ')}</span>
            </label>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setReportModalCommentId(null)}
              className="flex-1 min-h-[44px] rounded-lg bg-[var(--card-subtle)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] rounded-lg bg-[var(--danger)] text-white font-semibold"
            >
              Submit Report
            </button>
          </div>
        </form>
      </Modal>

      {/* Block User Modal */}
      {blockUserTarget && (
        <Modal
          isOpen={true}
          onClose={() => setBlockUserTarget(null)}
          title="Block User"
        >
          <div className="space-y-4 text-xs">
            <p className="text-[var(--muted)]">
              You will no longer see comments or posts created by this user.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setBlockUserTarget(null)}
                className="flex-1 min-h-[44px] rounded-lg bg-[var(--card-subtle)] font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleBlockUserAction(blockUserTarget)}
                className="flex-1 min-h-[44px] rounded-lg bg-[var(--danger)] text-white font-semibold"
              >
                Block
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
