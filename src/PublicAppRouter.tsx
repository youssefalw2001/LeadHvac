import { useEffect, useState } from 'react';
import './shell.css';
import App from './App';
import { AppShell } from './AppShell';
import { AdsPanel } from './AdsPanel';
import { ClaimReport } from './ClaimReport';
import { PremiumHome } from './PremiumHome';
import { StormRadar } from './StormRadar';

function getHashRoute() {
  return window.location.hash.replace(/^#\/?/, '');
}

export function PublicAppRouter() {
  const [route, setRoute] = useState(getHashRoute());

  useEffect(() => {
    const sync = () => {
      setRoute(getHashRoute());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  // Legacy screens keep their own full-page layout, outside the shell.
  if (route === 'home') return <PremiumHome />;
  if (route === 'app') return <App />;

  // NOTE: '#admin' is deliberately NOT routed here. AdminBoot renders the lead
  // inbox as an overlay on top of whatever page you were on. Routing it would
  // swap the whole page out to the old app underneath the overlay, which is
  // what made the Admin Inbox button appear to "take you to the old site".

  return (
    <AppShell route={route}>
      {route === 'claim' ? (
        <ClaimReport />
      ) : route === 'ads' ? (
        <AdsPanel />
      ) : (
        <StormRadar />
      )}
    </AppShell>
  );
}
