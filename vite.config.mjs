import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this repo from a subpath (/LeadHvac/), so asset URLs need
// a base prefix. Local dev and other hosts (Netlify, Render, a custom domain at
// the root) should stay at "/". The deploy workflow sets VITE_BASE_PATH.
const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
