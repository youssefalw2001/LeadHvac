import React from 'react';
import { createRoot } from 'react-dom/client';
import { AdminBoot } from './AdminBoot';
import { AdminLauncher } from './AdminLauncher';
import { CaptureBoot } from './CaptureBoot';
import { PublicAppRouter } from './PublicAppRouter';
import { RadarSourcePanelBoot } from './RadarSourcePanelBoot';
import './tailwind.css';
import './index.css';
import './premium.css';
import './executive.css';
import './showcase.css';
import './safe-source-panel.css';
import './mobile-fix.css';
import './admin.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CaptureBoot />
    <AdminBoot />
    <RadarSourcePanelBoot />
    <PublicAppRouter />
    <AdminLauncher />
  </React.StrictMode>
);
