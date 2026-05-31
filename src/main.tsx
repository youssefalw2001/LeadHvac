import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AdminBoot } from './AdminBoot';
import { CaptureBoot } from './CaptureBoot';
import './index.css';
import './admin.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CaptureBoot />
    <AdminBoot />
    <App />
  </React.StrictMode>
);
