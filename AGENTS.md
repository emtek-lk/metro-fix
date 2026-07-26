# METRO-FIX Platform: Agent Directives & Architecture

## 1. System Overview
METRO-FIX is a Managed Dispatch Facility Management platform (an "Uber-for-services" model with centralized dispatch). 
- **Business Model:** Customers request maintenance, Customer Care manually dispatches workers based on proximity and internal ratings, and Workers execute the job via a mobile app.
- **Facility Types:** Residential, Commercial, Industrial.
- **Service Pillars:** Hard, Soft, Strategic. Tied to Subscription Tiers (Basic, Plus, Premium).

## 2. Tech Stack & Monorepo Architecture
- **Environment:** Turborepo, Node v22, NPM v9.
- **Shared Packages (`packages/`):** 
  - `@metro-fix/core-types`: MUST be used for all interfaces, Zod schemas, and Enums.
  - `@metro-fix/ui`: Shared React components and assets (e.g., Brand Logo).
- **Web App (`apps/web`):** React + Vite. 
  - Libraries: `@hello-pangea/dnd` (Kanban), `@tanstack/react-table` (Data Grids).
- **Mobile Apps (`apps/mobile`):** React Native (Expo). 
  - Libraries: `expo-location`, `expo-linking`, React Hook Form + Zod.
- **Backend API (`apps/api`):** NestJS.
  - Database: PostgreSQL with PostGIS (for geospatial distance sorting).
  - Real-time: WebSockets (Web UI updates), FCM (Mobile Push Notifications).

## 3. UI/UX & CSS Design System
Agents modifying `apps/web` must strictly adhere to the following layout and styling constraints:
- **Layout:** Fixed App Shell. Outer wrapper is `100vh`/`overflow: hidden`. Sidebar and Top Ribbon are fixed. Only the middle canvas scrolls (`overflow-y: auto` with scrollbars visually hidden using `scrollbar-width: none`).
- **Alignment:** Sidebar uses a strict "Vertical Snap-Track". All menu rows have a `36x36px` icon box and share identical left-margins.
- **Brand Colors (CSS Variables):**
  - Dark Background (Sidebar/Dark Mode base): `#2b435f`
  - Primary Accent (Buttons, Highlights): `#f38808`
  - Primary Hover (Active states): `#d37105`
  - Text on Primary Accents: `#ffffff`
- **Logo:** Located at `@metro-fix/ui/src/assets/logo.png`. Must be imported and rendered dynamically.

## 4. The Core State Machine (Job Lifecycle)
All service requests strictly follow these 7 stages. Agents building the Kanban board or backend controllers must use these exact states:
1. `REQUESTED`: New job raised by Customer.
2. `PENDING_ACCEPTANCE`: Worker pinged by Customer Care. (If rejected/ignored, auto-reverts to `REQUESTED`).
3. `ASSIGNED`: Worker accepts the job.
4. `ON_ROUTE`: Worker begins travel (GPS tracking starts).
5. `INSPECTION`: Worker arrives (GPS stops), provides quote/time estimate.
6. `IN_PROGRESS`: Work is actively being executed.
7. `COMPLETED`: Work finished, payment cleared, invoice generated.

## 5. Security & Workflows
- **Workers:** Cannot self-register. Profiles are created by Admins. They log in via mobile and are assigned an internal 1-5 quality rating.
- **Customer Care Dispatch:** Workers are sorted in the UI based on a backend algorithm: `(Proximity to site * Weight A) + (Internal Rating * Weight B)`.
- **Customers:** Register via mobile app. App uses native GPS to establish the primary facility location. Payment is tokenized (e.g., Stripe) upfront or on the first request.