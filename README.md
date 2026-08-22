# Good Weekend Co.

> **GlobeTrotter — personalized, collaborative travel planning for the Odoo Hackathon.**

[![Status](https://img.shields.io/badge/status-hackathon%20prototype-f59e0b)](#current-prototype-status)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.2-000000?logo=next.js)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-5.2.1-000000?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle%20ORM-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-full--stack-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Good Weekend Co. is a full-stack travel-planning and community platform built for the Odoo Hackathon **GlobeTrotter — Empowering Personalized Travel Planning** problem statement. It helps travellers discover destinations, build multi-city itineraries, schedule activities, control budgets, visualize trips, and share plans from one place.

The repository is a standalone web application created for the Odoo Hackathon. It does not require Odoo ERP and is not an Odoo addon.

## At a glance

| Item | Details |
| --- | --- |
| Product | Good Weekend Co. |
| Hackathon challenge | GlobeTrotter — Empowering Personalized Travel Planning |
| Main users | Travellers, travel-community members, and platform administrators |
| Main goal | Replace scattered spreadsheets, notes, messages, and browser tabs with one organized trip workspace |
| Application type | Responsive full-stack web application |
| Frontend | Next.js App Router on `http://localhost:3000` |
| Backend | Express REST API on `http://localhost:5000` |
| Database | PostgreSQL through Drizzle ORM |
| Current stage | Functional hackathon prototype; see [Current prototype status](#current-prototype-status) |

## The problem

Planning a multi-city journey is rarely a single task. Travellers must coordinate dates, destinations, activities, schedules, and costs while information is spread across unrelated tools. It becomes difficult to understand the full itinerary, stay within budget, or share a reusable plan with other people.

The GlobeTrotter brief asks for a user-focused system that makes this process visual, flexible, data-driven, and collaborative.

## The solution

Good Weekend Co. brings the complete planning flow into one experience:

- Discover cities using popularity and cost information.
- Create trips with travel dates and an initial destination.
- Expand a trip into multiple ordered stops.
- Add activities with a day, time, and estimated cost.
- Compare planned budgets with activity spending in a visual chart.
- Review trips as grouped itineraries or on a monthly calendar.
- Publish an itinerary, share its public link, and offer a reusable-trip workflow.
- Share travel experiences through posts, images, likes, and comments.
- Give administrators visibility into users, trips, posts, cities, and activities.

## Who it is for

- **Travellers** who want one structured place for their itinerary, schedule, and budget.
- **Travel explorers** looking for destination ideas, activities, and public itineraries they can reuse.
- **Community members** who want to publish experiences and interact with other travellers.
- **Administrators and hackathon evaluators** who need a clear view of adoption and platform activity.

## How it works

1. A visitor registers or signs in.
2. The dashboard loads the user's recent trips and popular destinations.
3. The user selects a country, city, date range, and trip name.
4. The itinerary builder stores each destination as a trip stop and schedules activities against that stop.
5. Stop budgets and activity costs feed the trip's cost summary and over-budget warning.
6. The same trip can be reviewed from the trip list, itinerary view, or calendar.
7. A user can publish the trip and copy its public link; a signed-in recipient is offered a clone action.
8. Community posts and profile history preserve the social side of the journey.
9. An administrator can open the analytics dashboard to review live totals and popularity rankings.

## Odoo hackathon requirement coverage

The table below maps the GlobeTrotter screens to behavior confirmed in this repository. “Core” means the main workflow is available while some advanced controls from the brief remain on the roadmap.

| Requirement | Coverage | Current implementation |
| --- | --- | --- |
| Login / signup | Implemented | Registration, login, logout, bcrypt password hashing, and a 7-day JWT session in an HTTP-only cookie. Password recovery is not connected yet. |
| Dashboard / home | Implemented | Personalized welcome, recent trips, popular cities, filtering, sorting, grouping, and quick trip actions. |
| Create trip | Core | Trip name, country/city, dates, destination suggestions, automatic first stop, and a destination cover image. Description and manual cover upload are not exposed in this form. |
| My Trips | Core | Search, status filtering, sorting, grouping, date summaries, and itinerary navigation. Trip deletion is not available yet. |
| Itinerary builder | Core | Add stops, create missing cities, add activities, set day/time/cost, edit stop budgets, and publish a trip. Drag reordering and removal controls are still planned. |
| Itinerary view | Implemented | Stops grouped in route order with activity day, time, and cost information. |
| City search | Implemented | Search by city/country with All, Trending, Budget, and Luxury views plus popularity and cost indexes. |
| Activity search | Core | Browse a selected city's catalog with type, cost, duration, description, and image data. The builder currently adds a custom activity rather than selecting an existing catalog item. |
| Budget and cost breakdown | Implemented | Per-stop budgets, category totals, remaining budget, total spend, a Recharts pie chart, and over-budget warnings. |
| Calendar / timeline | Core | Monthly trip calendar with date-span highlighting and itinerary links. Activity drag-to-reorder is not available yet. |
| Shared/public itinerary | Partial | Public read-only route, copyable URL, private/public control, and a “Clone to My Account” flow. Cloning a trip with scheduled activities is not yet reliable because its API fields differ from the current schema. |
| User profile / settings | Core | Name and avatar updates plus trip and post history. Email is read-only; phone, city, and country are currently stored only on the device. |
| Admin analytics (optional) | Implemented for analytics | Role-protected totals, user activity table, content distribution, and popular city/activity rankings. User management is currently read-only, and the monthly trend series is demo data. |

## Main application routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Animated product splash and session-aware redirect | Public |
| `/login`, `/register` | Account access and creation | Public |
| `/dashboard` | Recent trips, destination ideas, and quick actions | Traveller |
| `/discover` | Search cities and inspect activities | Signed in |
| `/trips` | Search, group, and open personal trips | Signed in |
| `/trips/new` | Create a trip and its first stop | Signed in |
| `/trips/[id]` | Build the itinerary and manage its budget | Signed in |
| `/trips/share/[id]` | View and clone a published itinerary | Public view; login required to clone |
| `/calendar` | View trips across a monthly calendar | Signed in |
| `/community` | Browse or create posts, likes, and comments | Public browsing; login required to contribute |
| `/profile` | Profile, avatar, trips, posts, and logout | Signed in |
| `/admin` | Platform analytics and popularity reports | Admin only |
| `/about` | Product purpose and mission | Public |

## Architecture

```mermaid
flowchart LR
    U[Traveller or Admin] --> FE[Next.js 16 Web App]
    FE <-->|REST requests and HTTP-only session cookie| API[Express 5 API]
    API --> ORM[Drizzle ORM]
    ORM --> DB[(PostgreSQL)]
    FE -->|Image uploads| CL[Cloudinary]
    FE -->|Country and city catalog| CN[CountriesNow API]
```

The browser application currently calls the API at `http://localhost:5000`, which makes the present configuration local-development focused.

### Relational data model

The database is organized around three clear relationships:

```text
User -> Trips -> Trip Stops -> Scheduled Activities
City -> Activities
User -> Community Posts -> Likes and Comments
```

The schema contains `users`, `trips`, `cities`, `trip_stops`, `activities`, `trip_activities`, `posts`, `post_likes`, and `post_comments`. Foreign keys and cascade rules preserve the connection between a trip, its stops, and its activity plan.

## Technology stack

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Frontend | Next.js 16.3.2, React 19.2.8, TypeScript | App Router pages, client workflows, and responsive UI |
| Styling | Tailwind CSS 4, shadcn/Base UI, Lucide | Design system, reusable controls, and icons |
| Motion | Framer Motion and CSS animation | Transitions, reveals, and splash experience |
| Visualization | Recharts | Trip-budget and admin analytics charts |
| Backend | Express 5.2.1, TypeScript | REST API, validation flow, auth, and application services |
| Authentication | bcryptjs, JSON Web Tokens, HTTP-only cookies | Password hashing and authenticated sessions |
| Data layer | PostgreSQL, Drizzle ORM, postgres.js | Relational persistence, querying, and schema management |
| Media | Cloudinary | Community and profile image uploads |
| Destination source | CountriesNow API | Country/city choices when creating a trip |

## Getting started

### Prerequisites

- Node.js **20.9.0 or newer**
- npm
- A PostgreSQL connection string; local PostgreSQL or a compatible hosted provider works
- A Cloudinary cloud name and unsigned upload preset if image uploads will be tested

### 1. Clone the repository

```bash
git clone https://github.com/soham04010/OdooxLDCE.git
cd OdooxLDCE
```

### 2. Configure and start the backend

```bash
cd backend
npm ci
```

Copy `backend/.env.example` to `backend/.env`:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```bash
# macOS or Linux
cp .env.example .env
```

Set at least the following values:

```dotenv
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=development
```

Initialize the schema, add the optional demo catalog, and start the API:

```bash
npm run db:push
npx tsx src/seed.ts
npm run dev
```

The catalog seed inserts five cities and eleven activities. Run it only once per fresh database because it is not idempotent.

The API is ready when [http://localhost:5000](http://localhost:5000) returns `GlobeTrotter API is running!`.

### 3. Configure and start the frontend

Open a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The splash screen will send a visitor to login or an existing user to the correct dashboard.

For profile and community image uploads, create `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-upload-preset
```

These variables belong in the frontend environment because the upload requests are made by the browser.

## Admin demo access

After `npm run db:push`, an optional local admin account can be created or reset with:

```bash
cd backend
node seed_admin.js
```

| Field | Local demo value |
| --- | --- |
| Email | `admin@gmail.com` |
| Password | `12345678` |

This account is only for a local hackathon demonstration. Running the script again resets its password. Change the credentials and remove the fixed seed before any shared or production deployment.

## Suggested evaluator walkthrough

1. Seed the catalog and open the API health URL.
2. Sign in with the local admin account and review live totals, users, popular cities, and popular activities at `/admin`.
3. Register a separate traveller account and inspect the personalized dashboard.
4. Create a trip, add another stop, schedule activities, and set section budgets.
5. Confirm that the budget chart and over-budget message respond to the planned costs.
6. Open `/calendar` and verify that the trip spans its selected dates.
7. Publish the trip, copy its share URL, and open it in a private browser window.
8. Review **Clone to My Account** as the intended reuse flow; cloning trips that contain scheduled activities is a documented prototype limitation.
9. Create a community post, then test likes, comments, avatar upload, and profile history.

## REST API overview

| Area | Representative endpoints |
| --- | --- |
| Health | `GET /` |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET/PATCH /api/auth/me` |
| Dashboard and discovery | `GET /api/dashboard`, `GET/POST /api/cities`, `GET/POST /api/activities`, `GET /api/search` |
| Trips | `GET/POST /api/trips`, `GET /api/trips/:id`, stop/activity creation, budget update, visibility update |
| Sharing | `GET /api/trips/:id/public`, `POST /api/trips/:id/clone`, `GET /api/community/trips` |
| Community | Post listing/creation, post detail, like toggle, comments, and personal post history |
| Administration | `GET /api/admin/stats` |

Protected endpoints expect the `token` HTTP-only cookie issued during registration or login.

## Repository structure

```text
OdooxLDCE/
|-- backend/
|   |-- src/
|   |   |-- db/
|   |   |   |-- index.ts        # PostgreSQL connection
|   |   |   `-- schema.ts       # Drizzle relational schema
|   |   |-- index.ts            # Express API and routes
|   |   `-- seed.ts             # Demo city/activity catalog
|   |-- .env.example            # Backend environment template
|   |-- drizzle.config.ts       # Drizzle Kit configuration
|   `-- package.json
|-- frontend/
|   |-- public/                  # Product and destination assets
|   |-- src/
|   |   |-- app/                # Next.js pages and routes
|   |   |-- components/         # Shared UI and feature components
|   |   `-- lib/                # Utilities and display data
|   `-- package.json
`-- README.md
```

## Useful commands

| Location | Command | Purpose |
| --- | --- | --- |
| `backend` | `npm run dev` | Start the API with TypeScript watch mode |
| `backend` | `npm run db:push` | Push the Drizzle schema to PostgreSQL |
| `backend` | `npm run db:generate` | Generate migration artifacts |
| `backend` | `npx tsx src/seed.ts` | Insert the demo destination catalog |
| `frontend` | `npm run dev` | Start the Next.js development server |
| `frontend` | `npm run build` | Create the optimized frontend build |
| `frontend` | `npm start` | Serve a completed frontend build |
| `frontend` | `npm run lint` | Run the frontend ESLint configuration |

## Current prototype status

This repository is suitable for a local hackathon demonstration, but it should not yet be presented as production-ready.

- The optimized frontend build currently completes successfully.
- The backend development workflow is available, but its production TypeScript build currently has schema/field mismatches in public-trip cloning. These must be corrected before `npm start` can be used and before trips with scheduled activities can be cloned reliably.
- Frontend linting currently reports existing type-safety and React-hook findings.
- There is no automated test suite, continuous integration workflow, Docker setup, or production deployment configuration yet.
- Frontend API calls are hard-coded to `http://localhost:5000`; a shared `NEXT_PUBLIC_API_URL` is needed for deployment.
- Some challenge enhancements remain open: password recovery, trip deletion, drag reordering, fully persisted profile preferences, mutable admin controls, and report export.
- Several dashboard/footer links are placeholders for pages that have not been implemented yet.
- The admin totals and popularity tables are database-backed; the monthly growth chart and percentage badges currently use demonstration values.
- External media, avatar, destination-photo, and country/city services require internet access.

## Security notes

Before deploying or publishing a production version:

- Never commit `backend/.env`; rotate any database, JWT, or Cloudinary credentials that may have been shared.
- Replace the fallback JWT secret and the fixed local admin credentials.
- Restrict CORS to the deployed frontend origin and configure secure cross-site cookies deliberately.
- Enforce trip ownership on every read and mutation endpoint, not only authentication.
- Validate and sanitize all request bodies, file uploads, and externally sourced URLs.
- Add rate limiting, centralized error handling, audit logging, and automated security tests.

## Roadmap

- Align the public-trip clone fields with the Drizzle schema and restore a clean backend production build.
- Normalize remaining GlobeTrotter/GlobalTrotter labels under the Good Weekend Co. product brand.
- Centralize the API base URL and add an environment-aware deployment strategy.
- Add edit, delete, and drag-reorder operations for trips, stops, and activities.
- Complete password recovery and server-side profile preferences.
- Replace demonstration admin time-series data with historical aggregate queries and enable report export.
- Add API documentation, unit/integration/end-to-end tests, CI checks, and database migrations.
- Improve accessibility checks, error boundaries, empty states, and offline-friendly behavior.

## Project contact

Questions about the hackathon project can be sent to [OdooEvent5011@gmail.com](mailto:OdooEvent5011@gmail.com).

