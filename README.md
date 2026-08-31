<div align="center">

# TaraFix - Philippines' First Freelance Mechanics Network

<img src="/mascot-waving.gif" alt="TaraFix Mascot" width="180" style="border-radius: 24px; margin: 20px 0;" />

### *Get trusted, expert mechanics for home service or on-site repairs in minutes.*

<br/>

![Next.js](https://img.shields.io/badge/Next.js-000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=for-the-badge&logo=radix-ui&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide-FDE047?style=for-the-badge&logo=lucide&logoColor=black)
![Zod](https://img.shields.io/badge/Zod-3068B7?style=for-the-badge&logo=zod&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![PNPM](https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=for-the-badge&logo=pnpm&logoColor=f69220)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Upstash](https://img.shields.io/badge/Upstash-00E9A3?style=for-the-badge&logo=upstash&logoColor=black)

</div>

---

## Overview

TaraFix is a mobile-first web platform connecting car and motorcycle owners directly with independent freelance mechanics and mobile repair technicians. Drivers can locate nearby technicians, request on-demand emergency repairs or scheduled home maintenance, review transparent quotes, and track job progress in real time.

---

## Key Features

### For Vehicle Owners

- **Interactive Map Search (`/map`)**: Locate nearby freelance mechanics, vulcanizing services, and mobile repair technicians using live GPS coordinates.
- **Live Activity Tracking**: View technicians' presence timestamps (e.g. Active Now, Active 5 mins ago, or Offline) to find available help quickly.
- **Direct Service Booking**: Submit service requests with vehicle specifications, issue descriptions, and photo attachments.
- **In-App Messaging & Media Sharing**: Chat directly with assigned technicians, send photos of vehicle issues, and receive progress updates.
- **Digital Estimates & Receipts**: Review itemized parts and labor breakdowns before approving repairs, with downloadable receipts upon completion.
- **Expandable Photo Viewer**: View and zoom profile images and car inspection photos up to 3.5x with pan controls.
- **System Push Notifications**: Receive audio chimes and lockscreen push alerts for appointment updates and incoming chat messages.

---

### For Freelance Mechanics

- **Independent Schedule & Direct Earnings**: Receive direct service bookings from nearby motorists without intermediary agency commissions.
- **Role Switching**: Switch between Car Owner and Freelance Mechanic modes within the same account.
- **Real-Time Job Dispatch**: Receive instant sound chimes and lockscreen push notifications when a nearby driver requests assistance.
- **Automated Presence**: System status updates automatically while using the app without requiring manual online/offline switches.
- **Optimized WebP Avatar Uploads**: Profile photos are compressed directly in the browser to lightweight WebP format (<50ms) before storage upload.
- **Job Management Suite**: Issue digital quotations, update service milestones (Accepted, En Route, Arrived, In Progress, Completed), and generate receipts.

---

### Trust & Quality Management

- **Credential Verification**: Strict review of submitted mechanic credentials, valid identification, and GPS-verified service bases before marketplace approval.
- **Dispute Resolution & Safety**: Customer and technician report investigation with account suspension protocols for fraudulent behavior.
- **Automated Notifications**: System-wide notification dispatch for registration events and platform updates.

---

## Service Workflow

```mermaid
graph LR
    A[Open Map] --> B[Select Active Mechanic]
    B --> C[Submit Service Request]
    C --> D[Chat & Approve Estimate]
    D --> E[Technician Dispatched & Repairs Completed]
    E --> F[Receipt & Review]
```

### 1. Requesting Assistance
1. Open TaraFix on any mobile or desktop browser.
2. Open the Map view to find active mechanics nearby.
3. Review technician profiles, customer ratings, and specializations.
4. Select Book Professional, choose the required service, and submit.

### 2. Service Execution
- Monitor status updates in the Appointments tab on your Profile.
- Use the built-in Chat to communicate, share inspection photos, and confirm quotes.

### 3. Mechanic Registration
1. Navigate to Profile and choose Join Network.
2. Fill out experience, specialties (e.g. Engine, Brakes, Electrical, PMS), contact details, and pin service base location.
3. Once reviewed and verified by administration, the profile becomes active for nearby bookings.

---

## Architecture & Technology Stack

- **Frontend Framework**: Next.js 15 (Turbopack), React 19
- **Styling**: Tailwind CSS 4, shadcn/ui, Radix UI
- **Database & Storage**: Supabase (PostgreSQL with Row Level Security and PostGIS Geospatial extensions)
- **Realtime Layer**: Supabase Realtime WebSockets & Web Push Service Worker (`public/sw.js`)
- **Geospatial Mapping**: React Leaflet, OpenStreetMap, CartoDB Dark Matter
- **Image Optimization**: Client-Side HTML5 Canvas WebP compression engine
- **Authentication**: NextAuth.js & Supabase Auth with Google OAuth provider
- **Rate Limiting & Caching**: Upstash Redis (@upstash/ratelimit)

---

## Installation & Progressive Web App (PWA)

TaraFix can be installed as a standalone PWA on mobile devices:

- **Android (Chrome)**: Tap the install prompt banner or select `Menu (⋮) > Add to Home screen`.
- **iOS (Safari)**: Tap `Share > Add to Home Screen`.

---

<div align="center">

TaraFix &copy; 2026. All rights reserved.

</div>
