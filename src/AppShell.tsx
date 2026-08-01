import type { ReactNode } from 'react';

export interface NavItem {
  route: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { route: '', label: 'Storm Radar' },
  { route: 'claim', label: 'Claim Report' },
  { route: 'ads', label: 'Ad Playbook' },
];

export function AppShell({
  route,
  children,
}: {
  route: string;
  children: ReactNode;
}) {
  return (
    <div className="jl-shell">
      <nav className="jl-nav" aria-label="Main">
        <a className="jl-nav__brand" href="#">
          {/* The real brand mark from components/brand/JobLeakMark, reduced to a
              nav-scale lockup. Radar rings + the orange signal ping. */}
          <span className="jl-navmark" aria-hidden="true">
            <svg viewBox="0 0 44 44">
              <defs>
                <linearGradient id="jlNavBlue" x1="6" y1="6" x2="38" y2="38">
                  <stop stopColor="#2f6df6" />
                  <stop offset="1" stopColor="#0b3b9e" />
                </linearGradient>
              </defs>
              <circle cx="22" cy="20" r="13" fill="none" stroke="url(#jlNavBlue)" strokeWidth="2.8" />
              <circle cx="22" cy="20" r="7.4" fill="none" stroke="#2f6df6" strokeWidth="2.2" opacity="0.7" />
              <circle cx="22" cy="20" r="3.2" fill="#2f6df6" />
              <path d="M22 20 33 9" stroke="#eaf2ff" strokeWidth="2.6" strokeLinecap="round" />
              <circle cx="34.2" cy="7.8" r="3.4" fill="#ff7a1a" />
            </svg>
          </span>
          <span className="jl-brandtext">
            <b>JobLeak</b>
            <span>Storm Intelligence</span>
          </span>
        </a>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.route}
            href={`#${item.route}`}
            className={`jl-nav__link${route === item.route ? ' jl-nav__link--active' : ''}`}
            aria-current={route === item.route ? 'page' : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <main>{children}</main>

      <footer className="jl-footer">
        <div className="jl-footer__inner">
          <p>
            <strong style={{ color: '#fff' }}>JobLeak</strong> — storm intelligence for the trades.
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            Data: NOAA/NWS Storm Prediction Center, National Weather Service, and Open-Meteo.
            Weather observations are reproduced as filed and may be preliminary or revised.
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            Nothing here is legal, insurance or financial advice. Storm reports document weather
            only and do not confirm damage to any structure. Check your state rules before
            soliciting after a storm — many restrict contractor solicitation following a declared
            disaster, and discussing a claim on a homeowner's behalf can require a public adjuster
            licence.
          </p>
        </div>
      </footer>
    </div>
  );
}
