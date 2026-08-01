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
  if (route === 'admin' || route === 'app') return <App />;

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
