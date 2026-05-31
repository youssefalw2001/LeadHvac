export type LeadCaptureInput = {
  businessName: string;
  industry: string;
  city: string;
  website: string;
  email: string;
  phone: string;
  goal: string;
};

const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const databaseUrl = env.VITE_SUPABASE_URL;
const publicKey = env.VITE_SUPABASE_ANON_KEY;

export async function saveLead(input: LeadCaptureInput) {
  if (!databaseUrl || !publicKey) {
    return { saved: false, reason: 'missing_env' };
  }

  const response = await fetch(`${databaseUrl}/rest/v1/jobleak_leads`, {
    method: 'POST',
    headers: {
      apikey: publicKey,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({
      business_name: input.businessName,
      industry: input.industry,
      city: input.city,
      website: input.website,
      email: input.email,
      phone: input.phone,
      goal: input.goal,
      status: 'new'
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Lead capture failed: ${response.status} ${message}`);
  }

  return { saved: true };
}
