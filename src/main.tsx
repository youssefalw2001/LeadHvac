import React from 'react';
import { createRoot } from 'react-dom/client';
import { AdminBoot } from './AdminBoot';
import { AdminLauncher } from './AdminLauncher';
import { CaptureBoot } from './CaptureBoot';
import { PublicAppRouter } from './PublicAppRouter';
import './tailwind.css';
import './index.css';
import './premium.css';
import './executive.css';
import './showcase.css';
import './mobile-fix.css';
import './admin.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CaptureBoot />
    <AdminBoot />
    <PublicAppRouter />
    <AdminLauncher />
  </React.StrictMode>
);
