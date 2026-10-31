import type { Scenario } from './types';

const OFFLINE_SCENARIOS_KEY = 'boardpass_offline_scenarios';
const PROGRESS_QUEUE_KEY = 'boardpass_progress_queue';
const RECENT_VIEWED_KEY = 'boardpass_recent_viewed';

export interface QueuedWrite {
  id: string;
  type: 'progress' | 'bookmark' | 'post_like' | 'post_bookmark';
  payload: Record<string, unknown>;
  timestamp: number;
}

export function getOfflineScenarios(): Scenario[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_SCENARIOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isScenarioDownloaded(scenarioId: string): boolean {
  const list = getOfflineScenarios();
  return list.some((s) => s.id === scenarioId);
}

export function saveScenarioOffline(scenario: Scenario): void {
  const list = getOfflineScenarios();
  if (!list.some((s) => s.id === scenario.id)) {
    list.unshift(scenario);
    localStorage.setItem(OFFLINE_SCENARIOS_KEY, JSON.stringify(list.slice(0, 100)));
  }
}

export function removeScenarioOffline(scenarioId: string): void {
  const list = getOfflineScenarios().filter((s) => s.id !== scenarioId);
  localStorage.setItem(OFFLINE_SCENARIOS_KEY, JSON.stringify(list));
}

export function trackRecentViewed(scenario: Scenario): void {
  try {
    const raw = localStorage.getItem(RECENT_VIEWED_KEY);
    let list: Scenario[] = raw ? JSON.parse(raw) : [];
    list = [scenario, ...list.filter((s) => s.id !== scenario.id)].slice(0, 50);
    localStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function getRecentViewed(): Scenario[] {
  try {
    const raw = localStorage.getItem(RECENT_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function queueProgressWrite(write: Omit<QueuedWrite, 'id' | 'timestamp'>): void {
  try {
    const raw = localStorage.getItem(PROGRESS_QUEUE_KEY);
    const queue: QueuedWrite[] = raw ? JSON.parse(raw) : [];
    const item: QueuedWrite = {
      ...write,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    queue.push(item);
    localStorage.setItem(PROGRESS_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore
  }
}

export function getQueuedWrites(): QueuedWrite[] {
  try {
    const raw = localStorage.getItem(PROGRESS_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function flushQueuedProgress(
  syncHandler: (item: QueuedWrite) => Promise<boolean>
): Promise<number> {
  const queue = getQueuedWrites();
  if (queue.length === 0) return 0;
  const remaining: QueuedWrite[] = [];
  let synced = 0;
  for (const item of queue) {
    try {
      const ok = await syncHandler(item);
      if (ok) {
        synced++;
      } else {
        remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }
  localStorage.setItem(PROGRESS_QUEUE_KEY, JSON.stringify(remaining));
  return synced;
}
