import { useEffect, useState } from 'react';
import { TrustShowcaseBundle } from './TrustShowcase';

function isHomeRoute() {
  const hash = window.location.hash.replace('#', '');
  return hash === '' || hash === 'home';
}

export function HomeTrustShowcase() {
  const [visible, setVisible] = useState(isHomeRoute());

  useEffect(() => {
    const onHashChange = () => setVisible(isHomeRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (!visible) return null;
  return <TrustShowcaseBundle />;
}
