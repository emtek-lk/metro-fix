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
* **Subscription Tiers:** Access, Essential, Plus, Business.

---

## 2. Authentication & Role Access

The web dashboard uses a role-based access control (RBAC) entry shell accessible at `/login`.

### Demo Login Accounts

| Role | Email | Password | Primary Workspace / Route |
| :--- | :--- | :--- | :--- |
| **Customer Care Dispatcher** | `dispatch@demo.local` | `Demo123!` | Dispatch Board (`/dispatch`) |
| **System Administrator** | `admin@demo.local` | `Demo123!` | Customers (`/customers`) |
| **Customer** | `marcus@residences.lk` | `Demo123!` | Customer portal (`/portal/services`) |

### Navigation Structure
* All navigation is unified within the fixed left Sidebar.
* Selecting an item (`Dispatch Board`, `Customers`, `Service Catalog`, `Workers`, `Active Roster`) updates the browser route and loads the corresponding workspace view.
* The top Header displays the active page title alongside dynamic action buttons and user profile details.

---

## 3. Customer Care Dispatcher Workflow

The **Dispatch Board** (`/dispatch`) provides real-time visibility and manual control over all active service requests across their lifecycle.

### The Service Lifecycle (Kanban Workflow)

1. `REQUESTED`: New service job raised by the customer in the web portal.
2. `ASSIGNED`: Customer Care has assigned a worker.
3. `ON_ROUTE`: Worker traveling to facility site (GPS tracking active).
4. `INSPECTION`: Worker arrived on site, generating cost & time estimate quote. A worker who cannot do the job rejects it with a reason and it returns to `REQUESTED`.
5. `IN_PROGRESS`: Service work actively being performed.
6. `COMPLETED`: Work finished; photo proof and customer signature captured.
7. `CLOSED`: Dispatcher reviewed the proof and clicked **Approve & Close**; ticket archived and billed.

### Kanban Drag-and-Drop Operations
* **Updating Status:** Click and hold any service request card, drag it to the desired destination column, and drop it.
* **Real-time Persistence:** Dropping a card triggers an immediate `PATCH /jobs/:id/status` API call to update the database.
* **Optimistic UI & Network Resilience:**
  * **Success:** A toast notification confirms: `✓ Job status updated to "[NEW_STATUS]"`.
  * **Failure/Offline:** If the backend network call fails, the action is automatically rolled back to its previous column and an error toast is displayed: `✕ Failed to persist job status change to backend API. Action reverted.`.

### Finding things on the board
* Search by title, customer, worker or ticket reference (`#K3F9Q2`); filter by **service** and **urgency**; sort by newest, oldest or most urgent. **Refresh** reloads the board (it also updates live).
* **Job card** on a card opens the worker's itemised estimate and the final; you can correct the final until the ticket is closed.

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

### Customers: plans and leads
* The **Plan** column shows each customer's subscription, or **No plan (lead)** for someone who signed up but has not subscribed. **View** opens their details (contact, address, plan, billing, subscribed since); **Edit** changes name, company, email (their login), phone, address, facility and plan. Changing a plan here records no payment, so use it to comp a plan; choosing *No plan* makes them a lead again.
* Customers cannot raise requests without a plan. Use **+ New request** on the Dispatch Board to raise one for them (support cases).

### Worker Directory (`/admin/workers`)
* **Edit** a worker's contact details, internal rating (1–5, which dispatch ranks by), the services they cover, and whether they are on duty.
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


## 6. Customers: subscription and requests

* **Sign-up** (web or mobile): step one saves the account; step two offers the plans with **Skip for now**. Either way you land on the app home.
* **Raising a request needs a plan.** Without one, the apps show *Choose a plan* and link to the plans.
* **Subscription** (web menu, or mobile Profile): see your plan, compare plans, upgrade or downgrade, and see payment history. Payment is a demo card checkout: `4242 4242 4242 4242` with any future date and code works; `4000 0000 0000 0002` is declined. No money moves.
* **Refresh**: every list has a **Refresh** button on the web and pull-to-refresh on mobile.
