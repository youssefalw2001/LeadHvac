import { useEffect, useState } from 'react';

type Lead = {
  id: string;
  business_name: string;
  industry: string;
  city: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  goal: string | null;
  status: string;
  lead_score: number | null;
  created_at: string;
};

const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const databaseUrl = env.VITE_SUPABASE_URL;
const publicKey = env.VITE_SUPABASE_ANON_KEY;

async function signIn(email: string, password: string) {
  if (!databaseUrl || !publicKey) throw new Error('Missing Supabase environment variables.');

  const response = await fetch(`${databaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: publicKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<{ access_token: string }>;
}

async function loadLeads(token: string) {
  if (!databaseUrl || !publicKey) throw new Error('Missing Supabase environment variables.');

  const query = 'select=id,business_name,industry,city,website,email,phone,goal,status,lead_score,created_at&order=created_at.desc&limit=50';
  const response = await fetch(`${databaseUrl}/rest/v1/jobleak_leads?${query}`, {
    headers: {
      apikey: publicKey,
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<Lead[]>;
}

async function updateLeadStatus(token: string, id: string, status: string) {
  if (!databaseUrl || !publicKey) throw new Error('Missing Supabase environment variables.');

  const response = await fetch(`${databaseUrl}/rest/v1/jobleak_leads?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: publicKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) throw new Error(await response.text());
}

export function AdminBoot() {
  const [visible, setVisible] = useState(() => window.location.hash === '#admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [message, setMessage] = useState('Sign in with a Supabase Auth user to view leads.');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onHash = () => setVisible(window.location.hash === '#admin');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  async function handleLogin() {
    setBusy(true);
    setMessage('Signing in...');
    try {
      const session = await signIn(email, password);
      setToken(session.access_token);
      const rows = await loadLeads(session.access_token);
      setLeads(rows);
      setMessage(`Loaded ${rows.length} leads.`);
    } catch (error) {
      console.error(error);
      setMessage('Login failed. Check Supabase Auth user, env vars, or RLS policies.');
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(id: string, status: string) {
    if (!token) return;
    setBusy(true);
    try {
      await updateLeadStatus(token, id, status);
      const rows = await loadLeads(token);
      setLeads(rows);
      setMessage(`Lead marked ${status}.`);
    } catch (error) {
      console.error(error);
      setMessage('Could not update lead status.');
    } finally {
      setBusy(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="admin-overlay">
      <div className="admin-shell">
        <div className="admin-header">
          <div>
            <span>JobLeak Admin</span>
            <h1>Lead Inbox</h1>
            <p>{message}</p>
          </div>
          <button onClick={() => { window.location.hash = '#home'; setVisible(false); }}>Close</button>
        </div>

        {!token ? (
          <div className="admin-login-card">
            <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" /></label>
            <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></label>
            <button className="primary full" disabled={busy} onClick={handleLogin}>{busy ? 'Signing in...' : 'Open Lead Inbox'}</button>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <div className="admin-stats">
              <div><strong>{leads.length}</strong><span>Total loaded</span></div>
              <div><strong>{leads.filter((lead) => lead.status === 'new').length}</strong><span>New</span></div>
              <div><strong>{leads.filter((lead) => lead.status === 'contacted').length}</strong><span>Contacted</span></div>
              <div><strong>{leads.filter((lead) => lead.status === 'booked').length}</strong><span>Booked</span></div>
            </div>
            <div className="admin-table">
              {leads.map((lead) => (
                <div className="admin-lead" key={lead.id}>
                  <div>
                    <strong>{lead.business_name}</strong>
                    <span>{lead.industry} • {lead.city} • Score {lead.lead_score ?? 50}</span>
                    <p>{lead.goal || 'No goal provided.'}</p>
                    <small>{lead.email || 'No email'} • {lead.phone || 'No phone'} • {lead.website || 'No website'}</small>
                  </div>
                  <div className="admin-actions">
                    <em>{lead.status}</em>
                    <button onClick={() => changeStatus(lead.id, 'contacted')}>Contacted</button>
                    <button onClick={() => changeStatus(lead.id, 'booked')}>Booked</button>
                    <button onClick={() => changeStatus(lead.id, 'lost')}>Lost</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
