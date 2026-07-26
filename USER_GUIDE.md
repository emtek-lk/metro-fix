# METRO-FIX Platform: User & Operator Guide

Welcome to the **METRO-FIX** Managed Dispatch Facility Management Platform documentation. This guide details system architecture, user role access, dispatcher operations, and system administration workflows.

---

## 1. Platform Overview

**METRO-FIX** operates an "Uber-for-services" managed dispatch model designed for facility management across Residential, Commercial, and Industrial properties. Centralized Customer Care dispatchers allocate field technicians (workers) based on geographic proximity, service specialization, and quality ratings.

### Key Architecture Components
* **Web Portal (`apps/web`):** React 18 + Vite dashboard featuring drag-and-drop Kanban dispatch and responsive administration data grids.
* **Backend API (`apps/api`):** NestJS RESTful API connected to a Microsoft SQL Server (`mssql`) relational database.
* **Shared Types (`packages/core-types`):** Monorepo TypeScript contract containing Zod validation schemas and shared domain enums.
* **UI Component Library (`packages/ui`):** Modern dark-mode UI system (`#2b435f` dark base, `#f38808` primary accent) adhering to fixed viewport layouts (`100vh` outer Shell).

### Service Pillars & Facility Types
* **Hard Services:** Electrical, Mechanical, HVAC Chiller, Emergency Plumbing.
* **Soft Services:** Commercial Deep Sanitization, Janitorial, Waste Management.
* **Strategic Services:** Compliance Audits, High-Voltage Switchgear Inspection, Elevator Safety.
* **Facility Types:** Residential, Commercial, Industrial.
* **Subscription Tiers:** Basic, Plus, Premium.

---

## 2. Authentication & Role Access

The web dashboard uses a role-based access control (RBAC) entry shell accessible at `/login`.

### Demo Login Accounts

| Role | Email | Password | Primary Workspace / Route |
| :--- | :--- | :--- | :--- |
| **Customer Care Dispatcher** | `dispatch@metro-fix.com` | `password123` (or any 8+ chars) | Dispatch Board (`/dispatch`) |
| **System Administrator** | `admin@metro-fix.com` | `password123` (or any 8+ chars) | Customer Directory (`/admin/customers`) |

### Navigation Structure
* All navigation is unified within the fixed left Sidebar.
* Selecting an item (`Dispatch Board`, `Customers`, `Service Catalog`, `Workers`, `Active Roster`) updates the browser route and loads the corresponding workspace view.
* The top Header displays the active page title alongside dynamic action buttons and user profile details.

---

## 3. Customer Care Dispatcher Workflow

The **Dispatch Board** (`/dispatch`) provides real-time visibility and manual control over all active service requests across their lifecycle.

### The 7-Stage Service Lifecycle (Kanban Workflow)

1. `REQUESTED`: New service job logged by customer or system.
2. `PENDING_ACCEPTANCE`: Worker pinged by Customer Care; awaiting acceptance.
3. `ASSIGNED`: Worker has accepted the job assignment.
4. `ON_ROUTE`: Worker traveling to facility site (GPS tracking active).
5. `INSPECTION`: Worker arrived on site, generating cost & time estimate quote.
6. `IN_PROGRESS`: Service work actively being performed.
7. `COMPLETED`: Work finalized, payment cleared, invoice generated.

### Kanban Drag-and-Drop Operations
* **Updating Status:** Click and hold any service request card, drag it to the desired destination column, and drop it.
* **Real-time Persistence:** Dropping a card triggers an immediate `PATCH /jobs/:id/status` API call to update the database.
* **Optimistic UI & Network Resilience:**
  * **Success:** A toast notification confirms: `✓ Job status updated to "[NEW_STATUS]"`.
  * **Failure/Offline:** If the backend network call fails, the action is automatically rolled back to its previous column and an error toast is displayed: `✕ Failed to persist job status change to backend API. Action reverted.`.

### Worker Dispatch Algorithm & Modal
1. Click **"Assign Worker"** on any unassigned card in the `REQUESTED` column.
2. A dispatch modal opens showing worker candidates ranked by the internal dispatch algorithm:
   $$\text{Score} = (\text{Proximity Score} \times W_A) + (\text{Internal Rating} \times W_B)$$
3. Review worker proximity, quality rating (1–5 stars), and active job load.
4. Select a worker and confirm assignment.

---

## 4. System Administrator Workflow

Administrators manage system entities, customer profiles, service catalogs, and technician rosters.

### Customer Directory (`/admin/customers`)
* Displays active customer accounts, facility classifications (Residential, Commercial, Industrial), subscription tiers, and contact numbers.
* Live API Integration: Automatically fetches data from `GET /customers`.
* **Adding a Customer:** Click the **"+ Add New Customer"** button in the top header action area to launch the creation modal. Fill in Customer Name, Email, Facility Type, and Subscription Tier.

### Service Catalog (`/admin/services`)
* View all defined service offerings, assigned service pillars (Hard, Soft, Strategic), SLA response targets, and base rate pricing.

### Worker Directory (`/admin/workers`)
* Monitor technician profiles, internal 1-5 quality ratings, current availability status, and active job loads.

---

## 5. Local Development & Operational Commands

### Database Setup & Seeding (MSSQL)
Navigate to `apps/api` and execute:

```bash
# 1. Initialize Database (Creates metrofix_db in MSSQL if absent)
npm run db:init

# 2. Seed Mock Data (Drops schema, recreates tables, seeds 2 Admins, 3 Customers, 2 Workers, 5 Jobs)
npm run seed

# 3. Start Backend API Server (NestJS at http://localhost:3000)
npm run start:dev
```

### Web Application Development
Navigate to root directory:

```bash
# Start Vite Development Server (React UI at http://localhost:5173)
npm run dev

# Build for Production Verification
npm run build --workspace=apps/web
```
