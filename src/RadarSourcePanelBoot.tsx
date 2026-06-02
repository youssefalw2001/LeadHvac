import { useEffect } from 'react';

const PANEL_ID = 'jobleak-safe-source-panel';

function isRadarRoute() {
  const route = window.location.hash.replace('#', '');
  return route === 'radar' || route === 'report';
}

function removePanel() {
  document.getElementById(PANEL_ID)?.remove();
}

function buildPanel() {
  const panel = document.createElement('section');
  panel.id = PANEL_ID;
  panel.className = 'safe-source-panel';
  panel.innerHTML = `
    <div class="safe-source-panel-head">
      <div>
        <span>Signal Sources</span>
        <h2>Live, estimated, and configurable layers stay separate.</h2>
      </div>
      <p>JobLeak only marks a source live when it can actually load it. Other layers are clearly marked so the product stays honest.</p>
    </div>
    <div class="safe-source-grid">
      ${[
        ['Weather Forecast', 'Live', 'Open-Meteo forecast powers heat, cold, rain, and wind triggers.'],
        ['NWS Alerts', 'Live', 'National Weather Service alerts are checked for severe weather context.'],
        ['Search Intent', 'Estimated', 'Commercial demand estimate until Google Ads data is connected through a secure backend.'],
        ['Permits', 'Configurable', 'Ready for city/county permit feeds one market at a time.'],
        ['Business Openings', 'Configurable', 'Ready for approved local business/listing APIs when configured.'],
        ['Public Bids', 'Configurable', 'Ready for public bid and contract opportunity feeds when configured.']
      ].map(([name, status, detail]) => `
        <article class="safe-source-row">
          <div class="safe-source-icon">${name.charAt(0)}</div>
          <div><strong>${name}</strong><p>${detail}</p></div>
          <em class="safe-source-status ${status.toLowerCase()}">${status}</em>
        </article>
      `).join('')}
    </div>
  `;
  return panel;
}

function mountPanel() {
  if (!isRadarRoute()) {
    removePanel();
    return;
  }

  if (document.getElementById(PANEL_ID)) return;

  const anchor = document.querySelector('.signal-summary') || document.querySelector('.portal-head');
  if (!anchor?.parentElement) return;

  const panel = buildPanel();
  anchor.parentElement.insertBefore(panel, anchor.nextSibling);
}

export function RadarSourcePanelBoot() {
  useEffect(() => {
    const sync = () => setTimeout(mountPanel, 80);
    sync();
    window.addEventListener('hashchange', sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener('hashchange', sync);
      observer.disconnect();
      removePanel();
    };
  }, []);

  return null;
}
