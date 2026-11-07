import { ConvexReactClient } from 'convex/react';
import { api } from '../../convex/_generated/api';

const CONVEX_URL =
  process.env.EXPO_PUBLIC_CONVEX_URL || 'https://prestigious-anteater-117.convex.cloud';

/**
 * Single websocket client shared by the whole app. Used both for reactive
 * `useQuery` subscriptions (live seat maps, bookings, tracking) and for
 * imperative calls from the service layer.
 */
export const convexClient = new ConvexReactClient(CONVEX_URL, {
  unsavedChangesWarning: false,
});

export { api };

/** Convex wraps thrown server errors; surface just the human message. */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const raw = (err as any)?.data ?? (err as any)?.message ?? '';
  if (typeof raw !== 'string' || !raw) return fallback;
  const m = raw.match(/Uncaught Error:\s*(.*?)(?:\n|\s+at\s|$)/);
  return (m ? m[1] : raw).trim() || fallback;
}
