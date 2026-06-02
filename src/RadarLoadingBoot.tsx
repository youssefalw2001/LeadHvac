import { useEffect } from 'react';

const LOADER_ID = 'jobleak-safe-radar-loader';

function isRadarRoute() {
  const route = window.location.hash.replace('#', '');
  return route === 'radar' || route === 'report';
}

function shouldShowLoader() {
  if (!isRadarRoute()) return false;
  const text = document.body.textContent || '';
  return text.includes('Loading market forecast') || text.includes('Loading') || text.includes('Loading market');
}

function removeLoader() {
  document.getElementById(LOADER_ID)?.remove();
}

function buildLoader() {
  const node = document.createElement('section');
  node.id = LOADER_ID;
  node.className = 'safe-radar-loader';
  node.innerHTML = `
    <div class="safe-radar-loader-inner">
      <div class="safe-radar-loader-mark">JL</div>
      <div>
        <span>Scanning market</span>
        <strong>Pulling live weather, NWS alerts, and local demand signals.</strong>
        <p>JobLeak is scoring the top 3 opportunities and preparing the campaign path.</p>
      </div>
    </div>
  `;
  return node;
}

function syncLoader() {
  if (!shouldShowLoader()) {
    removeLoader();
    return;
  }

  if (document.getElementById(LOADER_ID)) return;
  const anchor = document.querySelector('.signal-summary') || document.querySelector('.portal-head');
  if (!anchor?.parentElement) return;
  anchor.parentElement.insertBefore(buildLoader(), anchor.nextSibling);
}

export function RadarLoadingBoot() {
  useEffect(() => {
    const sync = () => setTimeout(syncLoader, 80);
    sync();
    window.addEventListener('hashchange', sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      window.removeEventListener('hashchange', sync);
      observer.disconnect();
      removeLoader();
    };
  }, []);

  return null;
}
