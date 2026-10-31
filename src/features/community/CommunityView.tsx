import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Plus,
  Heart,
  Flag,
  UserX,
  Share2,
  Image as ImageIcon,
  Send,
  AlertTriangle,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import type { Post, PostCategory, PostReply, ReportReason } from '../../lib/types';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import { PullToRefresh } from '../../components/PullToRefresh';
import { useToast } from '../../lib/toast';
import { containsProfanity, formatRelativeTime, compressAndStripImage } from '../../lib/utils';
import { requireAuth } from '../../lib/authGuard';
import { supabase } from '../../lib/supabase/client';
import {
  listPosts,
  createPost,
  likePost,
  unlikePost,
  listReplies,
  createReply,
  listLikedPostIds,
} from '../../lib/supabase/queries/posts';
import { submitReport, blockUser, listBlockedUserIds } from '../../lib/supabase/queries/reports';

interface CommunityViewProps {
  isSubscribed: boolean;
  onOpenPaywall: () => void;
  onOpenGuidelines: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  isSubscribed,
  onOpenPaywall,
  onOpenGuidelines,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());

  // Create post modal state
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [postCategory, setPostCategory] = useState<PostCategory>('interview-exp');
  const [postBody, setPostBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submittingPost, setSubmittingPost] = useState(false);

  // Report modal state
  const [reportModalData, setReportModalData] = useState<{ type: 'post' | 'post_reply'; id: string } | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>('spam');
  const [reportComment, setReportComment] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Replies expansion state
  const [expandedRepliesPostId, setExpandedRepliesPostId] = useState<string | null>(null);
  const [repliesMap, setRepliesMap] = useState<Record<string, PostReply[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
  const [replyInput, setReplyInput] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const { showToast } = useToast();

  const categories: { key: string; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'interview-exp', label: 'Interview Exp' },
    { key: 'ward-tip', label: 'Ward Tips' },
    { key: 'general', label: 'General' },
    { key: 'job-alert', label: 'Job Alerts' },
  ];

  // Fetch initial posts and liked state
  const fetchFeed = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);

    const [postsRes, likedRes, blockedRes] = await Promise.all([
      listPosts({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        limit: 20,
      }),
      listLikedPostIds(),
      listBlockedUserIds(),
    ]);

    if (postsRes.data) {
      setPosts(postsRes.data.rows);
      setNextCursor(postsRes.data.nextCursor || null);
      setHasMore(Boolean(postsRes.data.nextCursor));
    }

    if (likedRes.data) {
      setLikedPostIds(new Set(likedRes.data));
    }
    if (blockedRes.data) {
      setBlockedUserIds(new Set(blockedRes.data));
    }

    setLoading(false);
  }, [selectedCategory]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Realtime subscription for posts and replies
  useEffect(() => {
    const channel = supabase
      .channel('community_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          const newPost = payload.new as Post;
          setPosts((prev) => {
            if (prev.some((p) => p.id === newPost.id)) return prev;
            return [newPost, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          const updated = payload.new as Post;
          setPosts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Load more posts
  const handleLoadMore = async () => {
    if (loadingMore || !nextCursor) return;
    setLoadingMore(true);

    const res = await listPosts({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      limit: 20,
      cursor: nextCursor,
    });

    if (res.data && res.data.rows.length > 0) {
      setPosts((prev) => [...prev, ...res.data.rows]);
      setNextCursor(res.data.nextCursor || null);
      setHasMore(Boolean(res.data.nextCursor));
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  const handleOpenCreatePost = () => {
    requireAuth('Write a community post', () => {
      if (!isSubscribed) {
        showToast('Posting in the community requires an active subscription', 'warning');
        onOpenPaywall();
        return;
      }
      setCreatePostOpen(true);
    });
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      showToast('JPG, PNG, or WebP only', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB', 'error');
      return;
    }
    try {
      const compressedDataUrl = await compressAndStripImage(file);
      setImagePreview(compressedDataUrl);
      showToast('Image compressed & EXIF metadata stripped', 'info');
    } catch {
      showToast('Image processing failed', 'error');
    }
  };

  const handleCreatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postBody.trim()) return;

    if (containsProfanity(postBody)) {
      showToast('Your post contains inappropriate or prohibited language', 'error');
      return;
    }

    setSubmittingPost(true);
    const res = await createPost({
      body: postBody.trim(),
      category: postCategory,
      is_anonymous: isAnonymous,
      image_url: imagePreview,
    });
    setSubmittingPost(false);

    if (res.error) {
      showToast(typeof res.error === 'string' ? res.error : res.error.message, 'error');
      return;
    }

    if (res.data) {
      setPosts((prev) => [res.data!, ...prev]);
    }

    setPostBody('');
    setImagePreview(null);
    setCreatePostOpen(false);
    showToast('Post published to community', 'success');
  };

  // Toggle Like with optimistic UI and server RPC
  const handleToggleLike = (postId: string) => {
    requireAuth('Like a post', async () => {
      const wasLiked = likedPostIds.has(postId);

      // Optimistic update
      setLikedPostIds((prev) => {
        const copy = new Set(prev);
        if (wasLiked) copy.delete(postId);
        else copy.add(postId);
        return copy;
      });

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, like_count: Math.max(0, p.like_count + (wasLiked ? -1 : 1)) }
            : p
        )
      );

      const res = wasLiked ? await unlikePost(postId) : await likePost(postId);
      if (res.error) {
        // Rollback
        setLikedPostIds((prev) => {
          const copy = new Set(prev);
          if (wasLiked) copy.add(postId);
          else copy.delete(postId);
          return copy;
        });
        showToast(typeof res.error === 'string' ? res.error : res.error.message, 'error');
      }
    });
  };

  // Expand replies and fetch live from Supabase
  const handleToggleReplies = async (postId: string) => {
    if (expandedRepliesPostId === postId) {
      setExpandedRepliesPostId(null);
      return;
    }
    setExpandedRepliesPostId(postId);

    if (!repliesMap[postId]) {
      setLoadingReplies((prev) => ({ ...prev, [postId]: true }));
      const res = await listReplies(postId);
      if (res.data) {
        setRepliesMap((prev) => ({ ...prev, [postId]: res.data }));
      }
      setLoadingReplies((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleSendReply = async (postId: string) => {
    if (!replyInput.trim()) return;
    if (containsProfanity(replyInput)) {
      showToast('Reply contains prohibited language', 'error');
      return;
    }

    requireAuth('Reply to post', async () => {
      setSubmittingReply(true);
      const res = await createReply({ post_id: postId, body: replyInput.trim(), is_anonymous: false });
      setSubmittingReply(false);

      if (res.error) {
        showToast(typeof res.error === 'string' ? res.error : res.error.message, 'error');
        return;
      }

      if (res.data) {
        setRepliesMap((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), res.data!],
        }));
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, reply_count: p.reply_count + 1 } : p))
        );
      }
      setReplyInput('');
      showToast('Reply sent', 'success');
    });
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalData) return;

    requireAuth('Report content', async () => {
      setSubmittingReport(true);
      const res = await submitReport({
        content_type: reportModalData.type,
        content_id: reportModalData.id,
        reason: reportReason,
        comment: reportComment,
      });
      setSubmittingReport(false);

      if (res.error) {
        showToast(typeof res.error === 'string' ? res.error : res.error.message, 'error');
        return;
      }

      setReportModalData(null);
      setReportComment('');
      showToast('Report submitted for moderator review', 'success');
    });
  };

  const handleBlockUserAction = async (userId: string) => {
    requireAuth('Block nurse', async () => {
      const res = await blockUser(userId);
      if (res.error) {
        showToast(typeof res.error === 'string' ? res.error : res.error.message, 'error');
        return;
      }
      setBlockedUserIds((prev) => new Set(prev).add(userId));
      showToast('User blocked. Their content is hidden.', 'info');
    });
  };

  const filteredPosts = posts.filter((p) => {
    if (p.status !== 'published') return false;
    if (blockedUserIds.has(p.user_id)) return false;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    return true;
  });

  return (
    <PullToRefresh onRefresh={() => fetchFeed(true)}>
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 safe-top safe-bottom relative">
        {/* Pinned Community Guidelines Banner */}
        <div
          onClick={onOpenGuidelines}
          className="card p-3 flex items-center justify-between cursor-pointer active:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--card-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--accent)]">
              Be kind. No patient names.
            </span>
          </div>
          <span className="text-xs text-[var(--muted)] underline underline-offset-2">
            Read guidelines
          </span>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => {
            const active = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                style={{
                  backgroundColor: active ? 'var(--card-subtle)' : 'var(--card)',
                  color: active ? 'var(--accent)' : 'var(--muted)',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card space-y-3 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--card-subtle)]" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-28 bg-[var(--card-subtle)] rounded" />
                    <div className="h-2.5 w-16 bg-[var(--card-subtle)] rounded" />
                  </div>
                </div>
                <div className="h-14 bg-[var(--card-subtle)] rounded" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-6 h-6" />}
            headline="No posts yet"
            body="Be the first nurse to share an interview experience or ward tip."
            actionLabel="Write Post"
            onAction={handleOpenCreatePost}
          />
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => {
              const isLiked = likedPostIds.has(post.id);
              const replies = repliesMap[post.id] || [];
              const isRepliesOpen = expandedRepliesPostId === post.id;
              const isLoadingReplies = loadingReplies[post.id];

              return (
                <div key={post.id} className="card space-y-3">
                  {/* Author Header */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text)]">
                        {post.is_anonymous ? 'Anonymous Nurse' : post.author?.name || 'Registered Nurse'}
                      </span>
                      <span aria-hidden="true" className="text-[var(--muted)]">·</span>
                      <span className="text-[var(--muted)] capitalize">
                        {post.category.replace('-', ' ')}
                      </span>
                      {post.county && (
                        <>
                          <span aria-hidden="true" className="text-[var(--muted)]">·</span>
                          <span className="text-[var(--muted)]">{post.county}</span>
                        </>
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--muted)]">
                      {formatRelativeTime(post.created_at)}
                    </span>
                  </div>

                  {/* Body Content */}
                  <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                    {post.body}
                  </p>

                  {/* Optional Image */}
                  {post.image_url && (
                    <div className="rounded-lg overflow-hidden max-h-72 bg-[var(--card-subtle)] flex items-center justify-center">
                      <img
                        src={post.image_url}
                        alt="Community post attachment"
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-1 text-xs text-[var(--muted)]">
                    <div className="flex items-center gap-4">
                      {/* Like button */}
                      <button
                        type="button"
                        onClick={() => handleToggleLike(post.id)}
                        className="flex items-center gap-1.5 min-h-[36px] py-1 transition-colors"
                        style={{ color: isLiked ? 'var(--danger)' : 'var(--muted)' }}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        <span className="font-semibold">{post.like_count}</span>
                      </button>

                      {/* Reply button */}
                      <button
                        type="button"
                        onClick={() => handleToggleReplies(post.id)}
                        className="flex items-center gap-1.5 min-h-[36px] py-1 hover:text-[var(--text)] transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.reply_count}</span>
                      </button>

                      {/* Share */}
                      <button
                        type="button"
                        onClick={async () => {
                          if (navigator.share) {
                            try {
                              await navigator.share({
                                title: 'BOARDPASS Community',
                                text: post.body.slice(0, 100),
                                url: window.location.href,
                              });
                            } catch {
                              // canceled
                            }
                          } else {
                            await navigator.clipboard.writeText(post.body);
                            showToast('Post copied to clipboard', 'info');
                          }
                        }}
                        className="flex items-center gap-1.5 min-h-[36px] py-1 hover:text-[var(--text)]"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Moderation Actions (Report & Block) */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReportModalData({ type: 'post', id: post.id })}
                        className="p-1.5 hover:text-[var(--warning)] transition-colors"
                        title="Report Post"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                      {!post.is_anonymous && (
                        <button
                          type="button"
                          onClick={() => handleBlockUserAction(post.user_id)}
                          className="p-1.5 hover:text-[var(--danger)] transition-colors"
                          title="Block Author"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Replies Thread */}
                  {isRepliesOpen && (
                    <div className="pt-3 mt-2 space-y-3 bg-[var(--card-subtle)] p-3 rounded-lg">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                        Replies ({replies.length})
                      </h4>

                      {isLoadingReplies ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin text-[var(--muted)]" />
                        </div>
                      ) : replies.length === 0 ? (
                        <p className="text-xs text-[var(--muted)]">No replies yet. Start the discussion.</p>
                      ) : (
                        <div className="space-y-2">
                          {replies.map((reply) => (
                            <div key={reply.id} className="space-y-1 text-xs">
                              <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                                <span className="font-semibold text-[var(--text)]">
                                  {reply.is_anonymous ? 'Anonymous Nurse' : reply.author?.name || 'Nurse Colleague'}
                                </span>
                                <span>{formatRelativeTime(reply.created_at)}</span>
                              </div>
                              <p className="text-[var(--text)]">{reply.body}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Input Bar */}
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          value={replyInput}
                          onChange={(e) => setReplyInput(e.target.value)}
                          placeholder="Write a constructive reply..."
                          className="flex-1 px-3 py-2 rounded-lg text-xs bg-[var(--card)] text-[var(--text)] focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSendReply(post.id);
                            }
                          }}
                        />
                        <button
                          type="button"
                          disabled={submittingReply || !replyInput.trim()}
                          onClick={() => handleSendReply(post.id)}
                          className="p-2 rounded-lg bg-[var(--accent)] text-white disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination Button */}
            {hasMore && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={handleLoadMore}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--card)] text-[var(--muted)] hover:text-[var(--text)] transition-colors inline-flex items-center gap-1.5"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Posts</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Floating Action Button (Write Post) */}
        <button
          type="button"
          onClick={handleOpenCreatePost}
          className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform z-30"
          style={{ backgroundColor: 'var(--accent)' }}
          aria-label="Create Post"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Create Post Modal */}
        <Modal
          isOpen={createPostOpen}
          onClose={() => setCreatePostOpen(false)}
          title="Share with Nurse Community"
        >
          <form onSubmit={handleCreatePostSubmit} className="space-y-4">
            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--muted)]">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'interview-exp', label: 'Interview Experience' },
                  { key: 'ward-tip', label: 'Ward Tip' },
                  { key: 'general', label: 'General Advice' },
                  { key: 'job-alert', label: 'Job Alert' },
                ].map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setPostCategory(c.key as PostCategory)}
                    className="p-2.5 rounded-lg text-xs font-medium text-left transition-colors"
                    style={{
                      backgroundColor: postCategory === c.key ? 'var(--card-subtle)' : 'var(--card)',
                      color: postCategory === c.key ? 'var(--accent)' : 'var(--text)',
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Post text */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--muted)]">Experience / Question</label>
              <textarea
                value={postBody}
                onChange={(e) => setPostBody(e.target.value)}
                rows={5}
                required
                placeholder="Describe the clinical interview question, panel dynamics, or practical ward insight..."
                className="w-full p-3 rounded-lg text-xs bg-[var(--card)] text-[var(--text)] focus:outline-none"
              />
            </div>

            {/* Image attachment */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--muted)] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Attach Diagram or Photo (EXIF stripped)</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImagePick}
                className="w-full text-xs text-[var(--muted)] file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:text-xs file:font-semibold file:bg-[var(--card-subtle)] file:text-[var(--text)]"
              />
              {imagePreview && (
                <div className="relative mt-2 rounded-lg overflow-hidden max-h-48 bg-[var(--card-subtle)]">
                  <img src={imagePreview} alt="Preview" className="w-full h-auto object-cover" />
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-[10px]"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--card-subtle)]">
              <div>
                <p className="text-xs font-semibold text-[var(--text)]">Post Anonymously</p>
                <p className="text-[11px] text-[var(--muted)]">Hide your name from other nurses</p>
              </div>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--accent)]"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submittingPost || !postBody.trim()}
              className="w-full py-3 rounded-lg font-bold text-xs text-white bg-[var(--accent)] disabled:opacity-50 transition-opacity"
            >
              {submittingPost ? 'Publishing...' : 'Publish Post'}
            </button>
          </form>
        </Modal>

        {/* Report Modal */}
        <Modal
          isOpen={Boolean(reportModalData)}
          onClose={() => setReportModalData(null)}
          title="Report Clinical Content"
        >
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div className="p-3 rounded-lg bg-[var(--card-subtle)] flex items-start gap-2 text-xs text-[var(--warning)]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                BoardPass strictly enforces Kenyan clinical protocol accuracy and professional etiquette.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--muted)]">Reason for report</label>
              <div className="space-y-1.5">
                {[
                  { key: 'spam', label: 'Spam or Advertising' },
                  { key: 'wrong_info', label: 'Incorrect Clinical Information' },
                  { key: 'harassment', label: 'Harassment or Unprofessional Conduct' },
                  { key: 'other', label: 'Patient Identifiable Information' },
                ].map((r) => (
                  <label
                    key={r.key}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--card)] text-xs text-[var(--text)] cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.key}
                      checked={reportReason === r.key}
                      onChange={() => setReportReason(r.key as ReportReason)}
                      className="accent-[var(--accent)]"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--muted)]">Additional context (Optional)</label>
              <textarea
                value={reportComment}
                onChange={(e) => setReportComment(e.target.value)}
                rows={3}
                placeholder="Provide relevant clinical guidelines or specifics..."
                className="w-full p-2.5 rounded-lg text-xs bg-[var(--card)] text-[var(--text)] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReport}
              className="w-full py-2.5 rounded-lg font-bold text-xs text-white bg-[var(--danger)] disabled:opacity-50"
            >
              {submittingReport ? 'Submitting Report...' : 'Submit Report'}
            </button>
          </form>
        </Modal>
      </div>
    </PullToRefresh>
  );
};
