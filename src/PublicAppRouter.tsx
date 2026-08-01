import { useEffect, useState } from 'react';
import App from './App';
import { PremiumHome } from './PremiumHome';
import { StormRadar } from './StormRadar';

function getHashRoute() {
  return window.location.hash.replace('#', '');
}

export function PublicAppRouter() {
  const [route, setRoute] = useState(getHashRoute());

  useEffect(() => {
    const sync = () => setRoute(getHashRoute());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  // Storm Intelligence is the product. It is the default route.
  if (route === '' || route === 'storm') return <StormRadar />;
  // Previous marketing home, kept for reference at #home
  if (route === 'home') return <PremiumHome />;
  return <App />;
}
