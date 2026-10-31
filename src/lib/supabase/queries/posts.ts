import { supabase } from '../client';
import type { Post, PostCategory, PostReply } from '../../types';

export interface PostFilterParams {
  limit?: number;
  cursor?: string;
  category?: string;
  signal?: AbortSignal;
}

export interface PostQueryResult {
  rows: Post[];
  nextCursor?: string;
}

const POST_COLUMNS =
  'id, user_id, body, image_url, category, is_anonymous, facility_level, county, like_count, reply_count, status, created_at, users!left(name)';

export async function listPosts(
  params: PostFilterParams = {}
): Promise<{ data: PostQueryResult; error: Error | null }> {
  try {
    const limit = params.limit ?? 20;
    let query = supabase
      .from('posts')
      .select('id, user_id, body, image_url, category, is_anonymous, facility_level, county, like_count, reply_count, status, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (params.cursor) {
      query = query.lt('created_at', params.cursor);
    }
    if (params.category && params.category !== 'all') {
      query = query.eq('category', params.category);
    }
    if (params.signal) {
      query = query.abortSignal(params.signal);
    }

    const { data, error } = await query;
    if (error) {
      return { data: { rows: [] }, error: new Error(error.message) };
    }

    const items = (data as unknown as Post[]) || [];
    let nextCursor: string | undefined = undefined;
    let rows = items;

    if (items.length > limit) {
      rows = items.slice(0, limit);
      nextCursor = rows[rows.length - 1].created_at;
    }

    return { data: { rows, nextCursor }, error: null };
  } catch (err: unknown) {
    return { data: { rows: [] }, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function createPost(postData: {
  body: string;
  category: PostCategory;
  image_url?: string | null;
  is_anonymous?: boolean;
  facility_level?: string | null;
  county?: string | null;
}): Promise<{ data: Post | null; error: Error | null }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      return { data: null, error: new Error('not_authenticated') };
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: authData.user.id,
        body: postData.body,
        category: postData.category,
        image_url: postData.image_url || null,
        is_anonymous: postData.is_anonymous || false,
        facility_level: postData.facility_level || null,
        county: postData.county || null,
        status: 'published',
      })
      .select()
      .single();

    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as Post, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function likePost(postId: string): Promise<{ ok: boolean; error: Error | null }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { ok: false, error: new Error('not_authenticated') };

    const { error: insErr } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: authData.user.id });
    if (insErr && !insErr.message.includes('unique')) {
      return { ok: false, error: new Error(insErr.message) };
    }

    await supabase.rpc('increment_post_likes', { p_post_id: postId });
    return { ok: true, error: null };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function unlikePost(postId: string): Promise<{ ok: boolean; error: Error | null }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { ok: false, error: new Error('not_authenticated') };

    await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', authData.user.id);

    await supabase.rpc('decrement_post_likes', { p_post_id: postId });
    return { ok: true, error: null };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function listReplies(
  postId: string,
  signal?: AbortSignal
): Promise<{ data: PostReply[]; error: Error | null }> {
  try {
    let query = supabase
      .from('post_replies')
      .select('id, post_id, user_id, body, is_anonymous, status, created_at')
      .eq('post_id', postId)
      .eq('status', 'published')
      .order('created_at', { ascending: true });

    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query;
    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data as PostReply[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function createReply(replyData: {
  post_id: string;
  body: string;
  is_anonymous?: boolean;
}): Promise<{ data: PostReply | null; error: Error | null }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { data: null, error: new Error('not_authenticated') };

    const { data, error } = await supabase
      .from('post_replies')
      .insert({
        post_id: replyData.post_id,
        user_id: authData.user.id,
        body: replyData.body,
        is_anonymous: replyData.is_anonymous || false,
        status: 'published',
      })
      .select()
      .single();

    if (error) return { data: null, error: new Error(error.message) };

    await supabase.rpc('increment_post_replies', { p_post_id: replyData.post_id });
    return { data: data as PostReply, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function listLikedPostIds(
  userId?: string
): Promise<{ data: string[]; error: Error | null }> {
  try {
    let targetUid = userId;
    if (!targetUid) {
      const { data: authData } = await supabase.auth.getUser();
      targetUid = authData?.user?.id;
    }
    if (!targetUid) return { data: [], error: null };

    const { data, error } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', targetUid);

    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data || []).map((r) => r.post_id), error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}
