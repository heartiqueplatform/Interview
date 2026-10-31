const ANALYTICS_OPT_OUT_KEY = 'boardpass_analytics_enabled';

export function isAnalyticsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const val = localStorage.getItem(ANALYTICS_OPT_OUT_KEY);
  return val === null ? true : val === 'true';
}

export function setAnalyticsEnabled(enabled: boolean): void {
  localStorage.setItem(ANALYTICS_OPT_OUT_KEY, String(enabled));
}

export function trackEvent(name: string, props?: Record<string, unknown>): void {
  if (!isAnalyticsEnabled()) return;
  if (typeof window !== 'undefined' && (window as unknown as { posthog?: { capture: (ev: string, p?: Record<string, unknown>) => void } }).posthog) {
    (window as unknown as { posthog: { capture: (ev: string, p?: Record<string, unknown>) => void } }).posthog.capture(name, props);
  }
}
