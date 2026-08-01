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
  | { ok: true; subscriptionId: string | null; reason?: undefined; detail?: undefined }
  | { ok: false; subscriptionId?: undefined; reason: SignupFailureReason; detail?: string };

export type PaidPlan = 'alerts' | 'territory';

/**
 * Sends the user to Stripe Checkout.
 *
 * Note what is NOT sent: any price or amount. The Edge Function looks the price
 * up server-side from the plan name, because a client that can name its own
 * price is a client that can pay nothing.
 */
export type CheckoutResult =
  | { ok: true; url: string; detail?: undefined }
  | { ok: false; url?: undefined; detail: string };

export async function startCheckout(
  subscriptionId: string,
  plan: PaidPlan
): Promise<CheckoutResult> {
  if (!SUPABASE_URL || !ANON_KEY) return { ok: false, detail: 'Billing is not configured yet.' };
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscriptionId, plan }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.url) {
      return { ok: false, detail: body?.error ?? `Checkout failed (${res.status}).` };
    }
    return { ok: true, url: body.url as string };
  } catch (e) {
    return { ok: false, detail: String(e).slice(0, 140) };
  }
}

export function alertsConfigured() {
  return Boolean(SUPABASE_URL && ANON_KEY);
}

/**
 * Client-generated id, so we know the row's primary key without reading it back
 * (RLS grants INSERT only — see the Prefer header below).
 *
 * Older Safari lacks crypto.randomUUID, so fall back to a v4 built from
 * getRandomValues, and to Math.random only if the Web Crypto API is absent
 * entirely. Collision risk on the fallback is irrelevant here: the id is a row
 * key, not a secret or a capability.
 */
function makeUuid(): string {
  const webCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;

  if (webCrypto && typeof webCrypto.randomUUID === 'function') {
    return webCrypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (webCrypto && typeof webCrypto.getRandomValues === 'function') {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function subscribeToAlerts(input: AlertSignupInput): Promise<SignupResult> {
  if (!SUPABASE_URL || !ANON_KEY) return { ok: false, reason: 'not_configured' };
  if (!input.email && !input.phone) return { ok: false, reason: 'no_contact' };

  const newId = makeUuid();

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/storm_alert_subscriptions`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        // Deliberately `minimal`. Asking Postgres to return the inserted row
        // requires SELECT permission, and RLS grants anon INSERT only — the
        // subscriber list must never be readable with a public key. We generate
        // the id client-side instead, so we already know it.
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        id: newId,
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
    return { ok: true, subscriptionId: newId };
  } catch (e) {
    return { ok: false, reason: 'failed', detail: String(e).slice(0, 120) };
  }
}
