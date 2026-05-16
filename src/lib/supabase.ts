/**
 * Supabase browser client.
 *
 * Uses the public ANON key — safe to ship to the browser. The subscribers
 * table has Row Level Security on with no anon policies, so this client can
 * ONLY call the `subscribe` / `unsubscribe` RPC functions (see
 * supabase/schema.sql). It cannot read the subscriber list.
 *
 * Env vars (set in `.env` locally and in Vercel project settings):
 *   VITE_SUPABASE_URL       — project URL, e.g. https://abcd.supabase.co
 *   VITE_SUPABASE_ANON_KEY  — the public anon/publishable key
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True once Supabase env vars are present — gates the signup UI. */
export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = supabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;

/** Add an email to the alert list (idempotent; reactivates prior unsubscribes). */
export async function subscribeEmail(email: string): Promise<'ok' | 'invalid' | 'error'> {
  if (!supabase) return 'error';
  const { data, error } = await supabase.rpc('subscribe', { addr: email });
  if (error) return 'error';
  return data === 'ok' ? 'ok' : 'invalid';
}

/** Deactivate a subscriber via the token from an alert email's footer link. */
export async function unsubscribeToken(token: string): Promise<'ok' | 'error'> {
  if (!supabase) return 'error';
  const { error } = await supabase.rpc('unsubscribe', { token });
  return error ? 'error' : 'ok';
}
