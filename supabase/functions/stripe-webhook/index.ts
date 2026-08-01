/**
 * STRIPE WEBHOOK
 * ==============
 *
 * The ONLY thing in the system allowed to set `plan` to a paid value.
 *
 * Two non-negotiables:
 *   1. Verify the signature. Without it, anyone who finds this URL can POST a
 *      fake "payment succeeded" and get a free subscription.
 *   2. Be idempotent. Stripe retries, and a retry must not double-apply.
 *
 * Deploy WITHOUT JWT verification, because Stripe cannot send a Supabase JWT:
 *   supabase functions deploy stripe-webhook --no-verify-jwt
 *
 * Required secrets:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET      whsec_... from the Stripe dashboard
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY  (injected)
 *
 * Events handled:
 *   checkout.session.completed          -> activate the paid plan
 *   customer.subscription.updated       -> track renewal / cancel-at-period-end
 *   customer.subscription.deleted       -> drop back to free
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

/** Constant-time compare so we don't leak signature bytes via timing. */
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacSha256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verifies Stripe's `Stripe-Signature` header.
 * Format: t=<unix>,v1=<hex>[,v1=<hex>...]
 * The signed payload is `${t}.${rawBody}`.
 */
async function verifySignature(rawBody: string, header: string, secret: string) {
  const parts = header.split(',').map((p) => p.trim());
  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2);
  const signatures = parts.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!timestamp || !signatures.length) return false;

  // Reject anything older than 5 minutes to blunt replay attempts.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return signatures.some((s) => timingSafeEqual(s, expected));
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  if (!STRIPE_SECRET_KEY || !WEBHOOK_SECRET || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response('not configured', { status: 500 });
  }

  const signature = req.headers.get('Stripe-Signature');
  if (!signature) return new Response('missing signature', { status: 400 });

  // Must read the RAW body — re-serialising JSON changes the bytes and breaks
  // the signature.
  const rawBody = await req.text();

  if (!(await verifySignature(rawBody, signature, WEBHOOK_SECRET))) {
    return new Response('invalid signature', { status: 400 });
  }

  let event: { id: string; type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Idempotency gate: if this insert conflicts we've already handled the event.
  const { error: dupeError } = await supabase
    .from('stripe_events')
    .insert({ id: event.id, type: event.type, payload: event as unknown as Record<string, unknown> });

  if (dupeError) {
    // Unique violation means a duplicate delivery. Ack so Stripe stops retrying.
    if (dupeError.code === '23505' || /duplicate key/i.test(dupeError.message)) {
      return new Response(JSON.stringify({ ok: true, duplicate: true }), { status: 200 });
    }
    return new Response(dupeError.message, { status: 500 });
  }

  const obj = event.data.object as Record<string, any>;

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const subscriptionId =
          obj.metadata?.subscription_id ?? obj.client_reference_id ?? null;
        const plan = obj.metadata?.plan ?? 'alerts';
        if (!subscriptionId) break;

        await supabase
          .from('storm_alert_subscriptions')
          .update({
            plan,
            active: true,
            stripe_customer_id: obj.customer ?? null,
            stripe_subscription_id: obj.subscription ?? null,
          })
          .eq('id', subscriptionId);
        break;
      }

      case 'customer.subscription.updated': {
        const stripeSubId = obj.id as string;
        const status = obj.status as string;
        // Anything not actively paying drops back to free so the scanner stops
        // sending. Stripe treats past_due/unpaid as non-paying.
        const paying = status === 'active' || status === 'trialing';
        await supabase
          .from('storm_alert_subscriptions')
          .update({
            plan: paying ? (obj.metadata?.plan ?? 'alerts') : 'free',
            cancel_at_period_end: Boolean(obj.cancel_at_period_end),
            current_period_end: obj.current_period_end
              ? new Date(obj.current_period_end * 1000).toISOString()
              : null,
          })
          .eq('stripe_subscription_id', stripeSubId);
        break;
      }

      case 'customer.subscription.deleted': {
        await supabase
          .from('storm_alert_subscriptions')
          .update({ plan: 'free', cancel_at_period_end: false })
          .eq('stripe_subscription_id', obj.id as string);
        break;
      }

      default:
        // Acknowledged and recorded, no action needed.
        break;
    }
  } catch (e) {
    return new Response(String(e).slice(0, 400), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, type: event.type }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
