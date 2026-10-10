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
| **Customer** | `marcus@residences.lk` | `Demo123!` | Customer website (`/portal/services`), on the customer address |
| **Technician** | `worker1@demo.local` | `Demo123!` | Mobile app only |

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
* **Updating Status:** Click and hold any service request card, drag it to the desired destination column, and drop it. The card does not move yet: a **Confirm stage change** box names the job, shows `From -> To` and says what will happen (for example that the customer and worker are notified, or that closing archives the ticket). Choose the stage button to go ahead, or **Keep as is** (focused by default, so a stray Enter changes nothing) / Esc / click outside to leave the job where it was. The **Withdraw offer**, **Cancel job** and **Approve & Close** buttons ask the same way. If another dispatcher moved the job while the box was open, nothing is changed and you are told.
* **Real-time Persistence:** Confirming sends the change to the API (`PATCH /jobs/:id/status`, or `/close` for Approve & Close).
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
* **Adding a worker:** the new technician gets a generated one-time password, shown once in the dialog (with a Copy button). Give it to them privately. At first sign-in the mobile app makes them choose their own password, so you never need to know it.
* **Login access** (inside Edit): *Issue new one-time password* (forgotten password; they must choose a new one again), *Unlock* (after too many wrong attempts), *Deactivate / Reactivate account*. Workers change their own password in the app under Profile > Change password.
* **Customers see the itemised quote** once the technician has submitted it: every labour, material and other line with quantity, rate and amount, tax, total, estimated time and the technician's note (web My requests and the mobile request screen; it becomes the *Final bill* after completion).

---

## 5. Running the system

Everything needed to run the API, the customer website, the staff website and the mobile apps (iOS, Android and the browser preview) is in **[SETUP.md](SETUP.md)**: prerequisites, first-time setup, Docker, the local addresses for the two websites, the mobile apps, demo accounts, environment variables, tests and troubleshooting.

In short: `docker compose up -d`, then open `http://metrofix.localhost:5173` (customers) or `http://admin.metrofix.localhost:5173` (staff) and sign in with a demo account (password `Demo123!`). The API creates the tables and the demo data itself when it starts; there is nothing to seed by hand.

## 5a. Settings (sidebar, bottom)

* **My account** (everyone): your name and phone, change your password, theme, and sign out.
* **Company** (admin): name, support email and phone (shown on sign-in and in the apps), address, time zone and tax registration number (printed on invoice exports).
* **Dispatch**: the offer window, max active jobs per worker, the rating and proximity weights that rank workers (score = rating × rating weight − distance km × proximity weight), and the default search radius.
* **Billing & tax**: invoice number prefix, default tax rate, default hourly labour rate (pre-filled in the technician's quote form), and payment terms (sets invoice due dates).
* **Requests & plans**: require a subscription to raise requests; let customers cancel their own requests.
* **Security**: minimum password length, failed sign-ins before lockout and how long the lock lasts.
* **Team & access**: add Admin or Customer Care staff with a temporary password, change a role, deactivate or reactivate, reset a password, unlock a locked account. You cannot deactivate yourself or the last active admin.
* **Audit log**: who changed what and when (settings, accounts, lockouts, exports). Passwords are never recorded.
* **Data & system**: download customers, workers, jobs and invoices as CSV; see database status, uptime and record counts.

Changes take effect immediately. Each save is recorded in the audit log.

## 5b. Two websites

Customers use the **customer website** (for example `metrofix.<your-domain>`); staff use the **staff website** (`admin.metrofix.<your-domain>`). Signing in on the wrong one shows a page with a link to the right one. On a phone the customer website has a tab bar along the bottom (Services, Requests, Plan, Account); on a computer it has links along the top. Technicians use the mobile app, not the website.

## 6. Customers: subscription and requests

* **Sign-up** (web or mobile): step one saves the account; step two offers the plans with **Skip for now**. Either way you land on the app home.
* **Raising a request needs a plan.** Without one, the apps show *Choose a plan* and link to the plans.
* **Subscription** (web menu, or mobile Profile): see your plan, compare plans, upgrade or downgrade, and see payment history. Payment is a demo card checkout: `4242 4242 4242 4242` with any future date and code works; `4000 0000 0000 0002` is declined. No money moves.
* **Refresh**: every list has a **Refresh** button on the web and pull-to-refresh on mobile.
