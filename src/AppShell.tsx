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
          <span className="jl-nav__dot" aria-hidden="true" />
          JobLeak
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
