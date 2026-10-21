import { isSupabaseConfigured, supabase } from './supabaseClient';

export const REALTIME_BULLETIN_CHANNEL = 'realtime:bulletin-live';

/**
 * Robust broadcast emitter for live bulletin events across all connected clients.
 */
export function broadcastLiveEvent(event: string, payload: Record<string, unknown>): void {
  if (!isSupabaseConfigured || !supabase) return;

  const existingChannel = supabase.getChannels().find((c) => c.topic === REALTIME_BULLETIN_CHANNEL);
  const channel = existingChannel || supabase.channel(REALTIME_BULLETIN_CHANNEL);

  if (!existingChannel) {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event,
          payload,
        }).catch(() => {});
      }
    });
  } else {
    channel.send({
      type: 'broadcast',
      event,
      payload,
    }).catch(() => {});
  }
}
