/**
 * CREATE CHECKOUT SESSION
 * =======================
 *
 * Turns a free subscription row into a Stripe Checkout redirect.
 *
 * Why hosted Checkout rather than our own card form: no card data ever touches
 * our code, so PCI scope stays with Stripe. It also handles 3DS, wallets, tax
 * and receipts for free.
 *
 * The browser sends only a subscription id and a plan name. It never sends a
 * price or an amount — a client that can name its own price is a client that
 * can pay $0.
 *
 * Deploy:  supabase functions deploy create-checkout
 *
 * Required secrets:
 *   STRIPE_SECRET_KEY
 *   STRIPE_PRICE_ALERTS       price_... for the alerts plan
 *   STRIPE_PRICE_TERRITORY    price_... for the territory plan
 *   PUBLIC_SITE_URL           e.g. https://youssefalw2001.github.io/LeadHvac
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY  (injected)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const PRICE_ALERTS = Deno.env.get('STRIPE_PRICE_ALERTS');
const PRICE_TERRITORY = Deno.env.get('STRIPE_PRICE_TERRITORY');
const PUBLIC_SITE_URL = Deno.env.get('PUBLIC_SITE_URL') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

/** Server-side price lookup. The client picks a plan name, never an amount. */
function priceFor(plan: string): string | null {
  if (plan === 'alerts') return PRICE_ALERTS ?? null;
  if (plan === 'territory') return PRICE_TERRITORY ?? null;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: 'billing is not configured on this deployment' }, 500);
  }

  let body: { subscriptionId?: string; plan?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const { subscriptionId, plan } = body;
  if (!subscriptionId || !plan) return json({ error: 'subscriptionId and plan are required' }, 400);

  const price = priceFor(plan);
  if (!price) return json({ error: `unknown plan "${plan}"` }, 400);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Confirm the row exists before creating a paid session against it.
  const { data: sub, error } = await supabase
    .from('storm_alert_subscriptions')
    .select('id, email, area_label, trade, stripe_customer_id')
    .eq('id', subscriptionId)
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!sub) return json({ error: 'subscription not found' }, 404);

  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('line_items[0][price]', price);
  params.set('line_items[0][quantity]', '1');
  params.set('success_url', `${PUBLIC_SITE_URL}/#billing=success`);
  params.set('cancel_url', `${PUBLIC_SITE_URL}/#billing=cancelled`);
  params.set('allow_promotion_codes', 'true');
  params.set('billing_address_collection', 'auto');
  // Carried through to the webhook so we know which row to upgrade.
  params.set('client_reference_id', sub.id);
  params.set('metadata[subscription_id]', sub.id);
  params.set('metadata[plan]', plan);
  params.set('subscription_data[metadata][subscription_id]', sub.id);
  params.set('subscription_data[metadata][plan]', plan);

  if (sub.stripe_customer_id) params.set('customer', sub.stripe_customer_id);
  else if (sub.email) params.set('customer_email', sub.email);

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      // Retrying this call must not create a second subscription.
      'Idempotency-Key': `checkout-${sub.id}-${plan}`,
    },
    body: params,
  });

  const session = await res.json();
  if (!res.ok) {
    return json({ error: session?.error?.message ?? `stripe ${res.status}` }, 502);
  }

  return json({ url: session.url, id: session.id });
});
