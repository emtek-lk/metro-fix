# METRO-FIX: Product Definition

> **Purpose:** Explains *what we are building and why*, for new collaborators and AI agents. Technical rules live in `AGENTS.md`; implementation progress lives in `STATUS.md`.
> Sources: `subscriptions.pdf` (Vanguard FSM "MetroFix – Subscription & Commercial Policy", confidential draft, not in the repo), the services catalogue screenshot, and the lifecycle brief from the product owner.

## 1. The idea

MetroFix is the mobile- and web-based **on-demand facilities maintenance service of Vanguard Facility Services Management (Vanguard FSM)**, Sri Lanka. Think "Uber for MEP / facility services", but with **centralised, partly manual dispatch**: customers request work, **Customer Care dispatches** a technician (by proximity and internal rating), and the technician executes the job in a mobile app. Requests are accepted 24/7; attendance is a *target window*, never a guarantee.

Pilot area: Colombo, Gampaha, Kalutara. Then Kandy, Galle, Matara, Kurunegala, then island-wide.

## 2. Who uses it

| Persona | App | What they do |
|---|---|---|
| **Customer** | Web customer portal (`/portal/*`) | Browse the catalog, raise a request, track it live. |
| **Customer Care / Dispatcher** | Web dashboard | Triage `REQUESTED` tickets, assign workers, watch the roster, review proof and **close** jobs. |
| **Admin** | Web dashboard | Everything above plus workers, customers, catalog, plans, financials. Creates worker accounts and can issue a one-time password, deactivate or unlock a login, but never sets or sees a worker's real password. |
| **Field Worker (technician)** | Mobile app (Expo) | Travel, inspect, quote, reject if out of scope, do the work, capture photo + signature. Cannot self-register: an admin creates the account and hands over a one-time password; at first sign-in the worker must choose their own, and can change it any time from Profile. |

## 3. Subscription plans (indicative launch prices, LKR, pending legal/tax/finance validation)

| Plan | For | Monthly | Annual | Includes |
|---|---|---|---|---|
| **Access** | Occasional residential / small users | 1,500 | 15,000 | Platform access, verified technicians, history + reminders, standard priority, ~5% labour discount |
| **Essential** | Homes, small offices | 3,500 | 35,000 | Priority allocation, 1 visit and 1 labour hr / month, ~10% extra labour discount, no call-out charge, annual inspection |
| **Plus** | Larger homes, villas, SMEs | 7,500 | 75,000 | High priority, 2 visits and 3 labour hrs / month (max 1 month rollover), ~15% discount, no call-out, quarterly inspection, annual condition report |
| **Business** | Commercial property | from 15,000 | custom | SLA-based: dedicated coordination, monthly inspection + PPM, asset register, monthly reporting |

Commercial principles: discounts and allowances apply to **labour only**; materials, specialist works and major repairs are quoted and charged separately with customer approval; fair-use policy applies; fees payable in advance; minimum 3 months for residential monthly plans; Business is a 12-month agreement. Technician revenue share (internal): Standard 60/40, Certified 65/35, Senior 70/30, Specialist 70-80 / 20-30 (labour only).

## 4. Service catalog (16 services, three pillars)

- **Hard (building fabric and machinery):** HVAC, Electrical, Plumbing and Water, Building Automation (BMS), Structural Maintenance, Fire Safety, Vertical Transportation.
- **Soft (operations and workplace comfort):** Janitorial and Cleaning, Waste Management, Security, Groundskeeping and Landscaping, Catering and Hospitality, Space and Mail Management.
- **Strategic:** Energy Management, Compliance and HSE, Asset Lifecycle Tracking.

The PDF's launch scope is *hard* services only (electrical, plumbing, HVAC/refrigeration, mechanical, building, ELV; lifts, chillers, fire and major electrical by quotation). The catalog is seeded with all 16 and categorised for customers (pillar, then group, with icon and description). Whether Soft/Strategic are requestable at launch is an open business decision (see `STATUS.md`).

## 5. Job lifecycle (source of truth)

`REQUESTED -> ASSIGNED -> ON_ROUTE -> INSPECTION -> IN_PROGRESS -> COMPLETED -> CLOSED`

1. **REQUESTED** (customer, web portal): service, details, address, urgency.
2. **ASSIGNED** (dispatcher): proximity + rating algorithm picks the worker.
3. **ON_ROUTE** (worker, mobile): "Start Travel" starts background GPS streaming to the dispatcher map.
4. **INSPECTION** (worker): "Arrive on Site" stops GPS; worker assesses and submits a quote (cost, hours). Worker may **reject** (unserviceable / out of scope) with a reason; the job returns to REQUESTED.
5. **IN_PROGRESS** (worker): "Begin Work" logs the start time.
6. **COMPLETED** (worker + customer): photo of the finished work and the customer's signature.
7. **CLOSED** (dispatcher/admin): reviews proof and hours, approves, triggers billing, archives.

Target customer journey (from the PDF): register and add property -> choose and pay a plan -> request with photos -> classify and dispatch -> technician confirms attendance window -> diagnose -> additional work quoted and approved -> complete and record -> customer confirms digitally -> invoice -> rating and history.

## 6. Out of scope for now / not built yet

See `STATUS.md` backlog: quote approval by the customer, plan allowance tracking and billing, payments (Stripe), ratings, photo upload from the portal, real customer registration, push notifications.
