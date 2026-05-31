import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { CaptureBoot } from './CaptureBoot';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CaptureBoot />
    <App />
  </React.StrictMode>
);
