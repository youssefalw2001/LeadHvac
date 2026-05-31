# JobLeak

JobLeak is a local growth SaaS for home-service businesses.

Promise:

> Stop leaking local jobs to competitors.

The product helps roofers, HVAC companies, plumbers, electricians, pest control companies, and other local service businesses identify missed local-search opportunities, review gaps, competitor advantages, and website fixes that can turn more search demand into calls, quote requests, and booked jobs.

## Current frontend

This repo now uses a Vite + React frontend based on the AI Studio build, cleaned up for the JobLeak brand.

Included:

- Premium SaaS homepage
- Free scan form with simulated scan flow
- Dynamic sample report page
- Client login/demo portal page
- Dashboard demo
- Industry-specific scan data for roofing, HVAC, plumbing, electrical, and pest control
- Render Static Site deployment support

## Stack

- Vite
- React
- TypeScript
- CSS
- Lucide React icons

## Local development

```bash
npm install
npm run dev
```

## Render deploy settings

Use **Static Site**, not Web Service.

```text
Build Command: npm install && npm run build
Publish Directory: dist
```

## Product positioning

JobLeak is not a generic SEO dashboard. It is a plain-English missed-revenue report and lead-capture system for home-service owners.

Core offer:

- Missed local searches
- Competitor gap report
- Review gap tracker
- Lead capture widget
- Local service page ideas
- Monthly action plan

## Next product step

Connect the free scan form to a real backend:

- Supabase `scan_requests` table, or
- Formspree/Tally/Google Sheet for the first MVP

Recommended fields:

- business name
- industry
- city/market
- website
- email
- phone
- growth goal
- status
- created_at
