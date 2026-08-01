import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminBoot } from './AdminBoot';
import { AdminLauncher } from './AdminLauncher';
import { CaptureBoot } from './CaptureBoot';
import { FourTradeModeBoot } from './FourTradeModeBoot';
import { PublicAppRouter } from './PublicAppRouter';
import { RadarLoadingBoot } from './RadarLoadingBoot';
import { RadarSourcePanelBoot } from './RadarSourcePanelBoot';
import './tailwind.css';
import './index.css';
import './premium.css';
import './executive.css';
import './showcase.css';
import './safe-source-panel.css';
import './radar-polish.css';
import './mobile-fix.css';
import './admin.css';

/**
 * WHY THESE ARE GATED
 * ===================
 *
 * FourTradeModeBoot, RadarLoadingBoot, RadarSourcePanelBoot and CaptureBoot are
 * DOM-patching scripts written for the original static marketing page. They:
 *
 *   - run `document.querySelectorAll('select')` and rewrite every <select>
 *   - rewrite text inside every `strong, span, p, h2`
 *   - inject <section> elements via innerHTML
 *   - attach a capture-phase global click listener
 *   - and re-run all of the above from a MutationObserver on document.body
 *
 * Mounted globally, they fight React on every render: they mutate the Storm
 * Radar trade/radius dropdowns, rewrite headings, and inject panels into pages
 * that were never designed for them.
 *
 * They are still needed by the legacy routes (#home, #app), so rather than
 * deleting them we only mount them there.
 */
const LEGACY_ROUTES = new Set(['home', 'app']);

function currentRoute() {
  return window.location.hash.replace(/^#\/?/, '');
}

function Root() {
  const [route, setRoute] = useState(currentRoute);

  useEffect(() => {
    const sync = () => setRoute(currentRoute());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const isLegacy = LEGACY_ROUTES.has(route);

  return (
    <>
      {/* Legacy DOM patchers — only on the pages they were written for. */}
      {isLegacy && <CaptureBoot />}
      {isLegacy && <FourTradeModeBoot />}
      {isLegacy && <RadarLoadingBoot />}
      {isLegacy && <RadarSourcePanelBoot />}

      <PublicAppRouter />

      {/* The lead inbox stays reachable at #admin, but the floating launcher is
          no longer shown to the public. Customers should never see an "Admin
          Inbox" button on a marketing site. */}
      <AdminBoot />
      {route === 'admin' && <AdminLauncher />}
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
