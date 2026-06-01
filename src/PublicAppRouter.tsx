import { useEffect, useState } from 'react';
import App from './App';
import { PremiumHome } from './PremiumHome';

function getHashRoute() {
  return window.location.hash.replace('#', '');
}

function isPremiumHomeRoute(route: string) {
  return route === '' || route === 'home';
}

export function PublicAppRouter() {
  const [route, setRoute] = useState(getHashRoute());

  useEffect(() => {
    const sync = () => setRoute(getHashRoute());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  if (isPremiumHomeRoute(route)) return <PremiumHome />;
  return <App />;
}
