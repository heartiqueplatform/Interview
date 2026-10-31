import { supabase } from './supabase/client';
import { getRecentViewed } from './offline';

const GUEST_MERGED_KEY = 'boardpass_guest_merged_for_';

export async function mergeGuestStateToServer(userId: string): Promise<number> {
  try {
    const key = `${GUEST_MERGED_KEY}${userId}`;
    if (localStorage.getItem(key)) return 0; // Already merged for this user

    let mergedCount = 0;

    // 1. Merge locally viewed scenarios into progress table
    const recent = getRecentViewed();
    if (recent.length > 0) {
      for (const sc of recent) {
        await supabase.from('progress').upsert(
          {
            user_id: userId,
            scenario_id: sc.id,
            status: 'read',
            last_opened: new Date().toISOString(),
          },
          { onConflict: 'user_id,scenario_id' }
        );
        mergedCount++;
      }
    }

    // 2. Merge local bookmarks
    try {
      const rawBookmarks = localStorage.getItem('boardpass_bookmarks');
      if (rawBookmarks) {
        const ids: string[] = JSON.parse(rawBookmarks);
        for (const id of ids) {
          await supabase
            .from('bookmarks')
            .insert({ user_id: userId, scenario_id: id })
            .select();
          mergedCount++;
        }
      }
    } catch {
      // ignore
    }

    localStorage.setItem(key, 'true');
    return mergedCount;
  } catch {
    return 0;
  }
}
