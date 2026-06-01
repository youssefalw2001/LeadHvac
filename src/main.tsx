import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AdminBoot } from './AdminBoot';
import { AdminLauncher } from './AdminLauncher';
import { CaptureBoot } from './CaptureBoot';
import { HomeTrustShowcase } from './HomeTrustShowcase';
import './index.css';
import './premium.css';
import './executive.css';
import './mobile-fix.css';
import './admin.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CaptureBoot />
    <AdminBoot />
    <App />
    <HomeTrustShowcase />
    <AdminLauncher />
  </React.StrictMode>
);
