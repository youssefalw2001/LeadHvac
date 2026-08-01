/**
 * Client-side subscribe. Uses the Supabase anon key, which is safe to expose —
 * RLS allows INSERT only, and there is no SELECT policy, so the browser can
 * never read the subscriber list back out.
 */
import type { Trade } from './stormIntel';

const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

export interface AlertSignupInput {
  email?: string;
  phone?: string;
  businessName?: string;
  trade: Trade;
  areaLabel: string;
  latitude: number;
  longitude: number;
  radiusMiles: number;
  minHailInches: number;
  minWindMph: number;
}

export type SignupFailureReason = 'not_configured' | 'no_contact' | 'failed';

/**
 * The success branch declares `reason`/`detail` as optionally undefined so the
 * union narrows cleanly on `ok` at call sites. Without them, TypeScript treats
 * property access on the narrowed type as an error.
 */
export type SignupResult =
  | { ok: true; reason?: undefined; detail?: undefined }
  | { ok: false; reason: SignupFailureReason; detail?: string };

export function alertsConfigured() {
  return Boolean(SUPABASE_URL && ANON_KEY);
}

export async function subscribeToAlerts(input: AlertSignupInput): Promise<SignupResult> {
  if (!SUPABASE_URL || !ANON_KEY) return { ok: false, reason: 'not_configured' };
  if (!input.email && !input.phone) return { ok: false, reason: 'no_contact' };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/storm_alert_subscriptions`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        email: input.email || null,
        phone: input.phone || null,
        business_name: input.businessName || null,
        trade: input.trade,
        area_label: input.areaLabel,
        latitude: input.latitude,
        longitude: input.longitude,
        radius_miles: input.radiusMiles,
        min_hail_inches: input.minHailInches,
        min_wind_mph: input.minWindMph,
        plan: 'free',
        active: true,
      }),
    });
    if (!res.ok) {
      return { ok: false, reason: 'failed', detail: `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'failed', detail: String(e).slice(0, 120) };
  }
}
