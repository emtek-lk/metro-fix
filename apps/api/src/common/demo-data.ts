import { FacilityType, JobStatus, ServicePillar, SubscriptionTier } from '@metro-fix/core-types';
import type { BillingCycle, JobCardLineKind } from '@metro-fix/core-types';

/**
 * Realistic demo data: Colombo businesses, households and technicians. Everything here is
 * fictional, and every account's password is `Demo123!` (see SeedService). The seeder only adds it
 * when the marker customer below does not exist, so it never duplicates or overwrites real data.
 */
export const DEMO_MARKER_EMAIL = 'dilshan.perera@demo.local';

export interface DemoCustomer {
  email: string;
  fullName: string;
  phone: string;
  companyName: string;
  address: string;
  facilityType: FacilityType;
  /** Null = signed up but not subscribed yet (a lead). */
  tier: SubscriptionTier | null;
  billing: BillingCycle | null;
  /** Days ago the subscription started. */
  subscribedDaysAgo: number;
  latitude: number;
  longitude: number;
}

export const DEMO_CUSTOMERS: DemoCustomer[] = [
  {
    email: 'eleanor@skylinetowers.com',
    fullName: 'Nimali Fernando',
    phone: '+94 77 481 2205',
    companyName: 'Skyline Towers (Pvt) Ltd',
    address: 'Level 14, 77 Galle Road, Colombo 03',
    facilityType: FacilityType.COMMERCIAL,
    tier: SubscriptionTier.BUSINESS,
    billing: 'MONTHLY',
    subscribedDaysAgo: 160,
    latitude: 6.9147,
    longitude: 79.8497,
  },
  {
    email: 'marcus@residences.lk',
    fullName: 'Kasun Wijesinghe',
    phone: '+94 71 332 7710',
    companyName: 'Havelock Residencies',
    address: '42/3 Havelock Road, Colombo 05',
    facilityType: FacilityType.RESIDENTIAL,
    tier: SubscriptionTier.PLUS,
    billing: 'MONTHLY',
    subscribedDaysAgo: 120,
    latitude: 6.8903,
    longitude: 79.8668,
  },
  {
    email: 'sophia@industrialpark.com',
    fullName: 'Priyanka Jayawardena',
    phone: '+94 76 905 4412',
    companyName: 'Biyagama Precision Components',
    address: 'Unit 14, Export Processing Zone, Biyagama',
    facilityType: FacilityType.INDUSTRIAL,
    tier: SubscriptionTier.ESSENTIAL,
    billing: 'ANNUAL',
    subscribedDaysAgo: 95,
    latitude: 6.95,
    longitude: 79.984,
  },
  {
    email: DEMO_MARKER_EMAIL,
    fullName: 'Dilshan Perera',
    phone: '+94 77 214 6638',
    companyName: 'Perera & Sons Hardware',
    address: '118 Main Street, Pettah, Colombo 11',
    facilityType: FacilityType.COMMERCIAL,
    tier: SubscriptionTier.ACCESS,
    billing: 'ANNUAL',
    subscribedDaysAgo: 70,
    latitude: 6.9386,
    longitude: 79.8501,
  },
  {
    email: 'shanika.rajapaksa@demo.local',
    fullName: 'Shanika Rajapaksa',
    phone: '+94 75 618 9024',
    companyName: 'Lotus Wellness Spa',
    address: '23 Sri Jayawardenepura Mawatha, Rajagiriya',
    facilityType: FacilityType.COMMERCIAL,
    tier: SubscriptionTier.ESSENTIAL,
    billing: 'MONTHLY',
    subscribedDaysAgo: 110,
    latitude: 6.91,
    longitude: 79.895,
  },
  {
    email: 'mohamed.rizwan@demo.local',
    fullName: 'Mohamed Rizwan',
    phone: '+94 77 702 3316',
    companyName: 'Crescent Medical Centre',
    address: '9 Galle Road, Dehiwala',
    facilityType: FacilityType.COMMERCIAL,
    tier: SubscriptionTier.BUSINESS,
    billing: 'MONTHLY',
    subscribedDaysAgo: 150,
    latitude: 6.8512,
    longitude: 79.8654,
  },
  {
    email: 'tharindu.gunasekara@demo.local',
    fullName: 'Tharindu Gunasekara',
    phone: '+94 71 540 8821',
    companyName: 'Gunasekara Residence',
    address: '17 High Level Road, Nugegoda',
    facilityType: FacilityType.RESIDENTIAL,
    tier: SubscriptionTier.ACCESS,
    billing: 'MONTHLY',
    subscribedDaysAgo: 55,
    latitude: 6.8649,
    longitude: 79.8997,
  },
  {
    email: 'anjali.desilva@demo.local',
    fullName: 'Anjali de Silva',
    phone: '+94 76 223 4507',
    companyName: 'Ceylon Tea Traders (Pvt) Ltd',
    address: '5 Chatham Street, Colombo 01',
    facilityType: FacilityType.COMMERCIAL,
    tier: SubscriptionTier.PLUS,
    billing: 'MONTHLY',
    subscribedDaysAgo: 100,
    latitude: 6.9344,
    longitude: 79.8428,
  },
  {
    email: 'sachini.abeywickrama@demo.local',
    fullName: 'Sachini Abeywickrama',
    phone: '+94 77 836 1190',
    companyName: 'Abeywickrama Residence',
    address: '31 Hill Street, Mount Lavinia',
    facilityType: FacilityType.RESIDENTIAL,
    tier: null,
    billing: null,
    subscribedDaysAgo: 0,
    latitude: 6.8389,
    longitude: 79.8653,
  },
  {
    email: 'ibrahim.hussain@demo.local',
    fullName: 'Ibrahim Hussain',
    phone: '+94 72 410 5573',
    companyName: 'Hussain Bakery',
    address: '64 Maradana Road, Colombo 10',
    facilityType: FacilityType.COMMERCIAL,
    tier: null,
    billing: null,
    subscribedDaysAgo: 0,
    latitude: 6.9271,
    longitude: 79.8736,
  },
];

export interface DemoWorker {
  email: string;
  fullName: string;
  phone: string;
  rating: number;
  pillars: ServicePillar[];
  available: boolean;
  latitude: number;
  longitude: number;
}

/** worker1@demo.local and worker2@demo.local keep their logins and get these names and details. */
export const DEMO_WORKERS: DemoWorker[] = [
  { email: 'worker1@demo.local', fullName: 'Ruwan Kumara', phone: '+94 77 100 0001', rating: 4.8, pillars: [ServicePillar.HARD, ServicePillar.STRATEGIC], available: true, latitude: 6.922, longitude: 79.856 },
  { email: 'worker2@demo.local', fullName: 'Nadeesha Rathnayake', phone: '+94 77 100 0002', rating: 4.5, pillars: [ServicePillar.SOFT], available: true, latitude: 6.931, longitude: 79.848 },
  { email: 'asanka.jayasuriya@demo.local', fullName: 'Asanka Jayasuriya', phone: '+94 77 318 4420', rating: 4.9, pillars: [ServicePillar.HARD], available: true, latitude: 6.873, longitude: 79.889 },
  { email: 'chaminda.bandara@demo.local', fullName: 'Chaminda Bandara', phone: '+94 71 645 2087', rating: 4.7, pillars: [ServicePillar.HARD], available: true, latitude: 6.906, longitude: 79.865 },
  { email: 'mohamed.fazil@demo.local', fullName: 'Mohamed Fazil', phone: '+94 76 129 7743', rating: 4.6, pillars: [ServicePillar.HARD], available: true, latitude: 6.929, longitude: 79.865 },
  { email: 'kumari.wickramasinghe@demo.local', fullName: 'Kumari Wickramasinghe', phone: '+94 75 884 3016', rating: 4.8, pillars: [ServicePillar.SOFT], available: true, latitude: 6.914, longitude: 79.878 },
  { email: 'sampath.dissanayake@demo.local', fullName: 'Sampath Dissanayake', phone: '+94 77 460 9981', rating: 4.9, pillars: [ServicePillar.STRATEGIC], available: true, latitude: 6.908, longitude: 79.902 },
  { email: 'lakmal.herath@demo.local', fullName: 'Lakmal Herath', phone: '+94 72 357 6612', rating: 4.5, pillars: [ServicePillar.HARD, ServicePillar.SOFT], available: true, latitude: 6.856, longitude: 79.865 },
  { email: 'ishara.ranasinghe@demo.local', fullName: 'Ishara Ranasinghe', phone: '+94 76 702 1158', rating: 4.7, pillars: [ServicePillar.SOFT, ServicePillar.STRATEGIC], available: true, latitude: 6.899, longitude: 79.919 },
  { email: 'thushara.mendis@demo.local', fullName: 'Thushara Mendis', phone: '+94 71 288 9034', rating: 4.4, pillars: [ServicePillar.HARD], available: false, latitude: 6.89, longitude: 79.906 },
];

type Line = [JobCardLineKind, string, number, number];

export interface DemoJob {
  title: string;
  description: string;
  pillar: ServicePillar;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: JobStatus;
  customer: string;
  worker?: string;
  /** Days ago the request was raised. */
  createdDaysAgo: number;
  /** Days ago it was approved and closed (CLOSED jobs). */
  closedDaysAgo?: number;
  /** Priced lines and hours: the estimate (and the final for COMPLETED / CLOSED jobs). */
  card?: { lines: Line[]; hours: number; notes: string; taxRate: number; finalLines?: Line[]; finalHours?: number; finalNotes?: string };
  cancelReason?: string;
  declinedBy?: string;
}

const L = (kind: JobCardLineKind, description: string, qty: number, price: number): Line => [kind, description, qty, price];

export const DEMO_JOBS: DemoJob[] = [
  // ── Closed and billed (spread across the last months so revenue has a shape) ──
  {
    title: 'Chiller unit tripping on high pressure',
    description: 'Plant room chiller CH-2 trips within 20 minutes of starting. Level 14 tenants report warm air since Monday.',
    pillar: ServicePillar.HARD, urgency: 'CRITICAL', status: JobStatus.CLOSED, customer: 'eleanor@skylinetowers.com', worker: 'chaminda.bandara@demo.local',
    createdDaysAgo: 142, closedDaysAgo: 140,
    card: { taxRate: 18, hours: 3, notes: 'Low refrigerant and a failing pressure switch.', lines: [L('LABOUR', 'HVAC technician', 3, 3500), L('MATERIAL', 'R410A refrigerant (kg)', 2, 4800), L('MATERIAL', 'High-pressure switch', 1, 12500)] },
  },
  {
    title: 'Recurring tap leak in kitchen',
    description: 'Mixer tap in unit 4B drips constantly and the cupboard below is damp.',
    pillar: ServicePillar.HARD, urgency: 'LOW', status: JobStatus.CLOSED, customer: 'marcus@residences.lk', worker: 'lakmal.herath@demo.local',
    createdDaysAgo: 118, closedDaysAgo: 117,
    card: { taxRate: 0, hours: 1.5, notes: 'Replaced the cartridge and resealed the base.', lines: [L('LABOUR', 'Plumber', 1.5, 2000), L('MATERIAL', 'Mixer tap cartridge', 1, 3200)] },
  },
  {
    title: 'Deep clean after tenant move-out',
    description: 'Three-bedroom apartment needs a full clean, including carpets and balcony, before the next tenant on Friday.',
    pillar: ServicePillar.SOFT, urgency: 'MEDIUM', status: JobStatus.CLOSED, customer: 'marcus@residences.lk', worker: 'kumari.wickramasinghe@demo.local',
    createdDaysAgo: 96, closedDaysAgo: 95,
    card: { taxRate: 0, hours: 6, notes: 'Two-person team, carpets shampooed.', lines: [L('LABOUR', 'Cleaning crew (2 people)', 6, 3600), L('MATERIAL', 'Carpet shampoo and consumables', 1, 2800)] },
  },
  {
    title: 'Quarterly fire alarm panel inspection',
    description: 'Scheduled inspection and functional test of the fire alarm panel and all detector loops in Block A.',
    pillar: ServicePillar.STRATEGIC, urgency: 'MEDIUM', status: JobStatus.CLOSED, customer: 'sophia@industrialpark.com', worker: 'sampath.dissanayake@demo.local',
    createdDaysAgo: 88, closedDaysAgo: 86,
    card: { taxRate: 18, hours: 4, notes: 'All loops pass. Three detector heads replaced.', lines: [L('LABOUR', 'Fire safety inspector', 4, 3500), L('MATERIAL', 'Smoke detector head', 3, 2400)] },
  },
  {
    title: 'Generator failed to auto-start during outage',
    description: 'The 250 kVA standby generator did not start during last night’s power cut. ICU backup was on UPS only.',
    pillar: ServicePillar.HARD, urgency: 'CRITICAL', status: JobStatus.CLOSED, customer: 'mohamed.rizwan@demo.local', worker: 'asanka.jayasuriya@demo.local',
    createdDaysAgo: 74, closedDaysAgo: 73,
    card: { taxRate: 18, hours: 5, notes: 'Starter motor seized, battery below threshold. Tested under load.', lines: [L('LABOUR', 'Electrician', 5, 3000), L('MATERIAL', 'Starter motor', 1, 38000), L('MATERIAL', '12V 100Ah battery', 1, 24500)] },
  },
  {
    title: 'Switchboard overheating, burning smell',
    description: 'Main distribution board in the rear store smells of burning and the casing is hot to touch.',
    pillar: ServicePillar.HARD, urgency: 'HIGH', status: JobStatus.CLOSED, customer: DEMO_MARKER_EMAIL, worker: 'asanka.jayasuriya@demo.local',
    createdDaysAgo: 62, closedDaysAgo: 61,
    card: { taxRate: 18, hours: 3, notes: 'Loose neutral at the busbar. Re-terminated and thermal-scanned.', lines: [L('LABOUR', 'Electrician', 3, 3000), L('MATERIAL', '63A MCB', 2, 4200), L('OTHER', 'Thermal scan report', 1, 3500)] },
  },
  {
    title: 'Lift stuck between floors (Block B)',
    description: 'Passenger lift B2 stopped between floors 6 and 7 with no passengers. Please attend before the evening peak.',
    pillar: ServicePillar.HARD, urgency: 'CRITICAL', status: JobStatus.CLOSED, customer: 'eleanor@skylinetowers.com', worker: 'worker1@demo.local',
    createdDaysAgo: 51, closedDaysAgo: 50,
    card: { taxRate: 18, hours: 4, notes: 'Door interlock fault cleared; cables lubricated.', lines: [L('LABOUR', 'Lift technician', 4, 4500), L('MATERIAL', 'Door interlock switch', 1, 18500)] },
  },
  {
    title: 'Monthly pest control and sanitisation',
    description: 'Routine monthly treatment of treatment rooms, reception and the staff pantry.',
    pillar: ServicePillar.SOFT, urgency: 'LOW', status: JobStatus.CLOSED, customer: 'shanika.rajapaksa@demo.local', worker: 'worker2@demo.local',
    createdDaysAgo: 33, closedDaysAgo: 32,
    card: { taxRate: 18, hours: 2.5, notes: 'Gel baiting and surface sanitising.', lines: [L('LABOUR', 'Pest control operator', 2.5, 2800), L('MATERIAL', 'Treatment chemicals', 1, 4200)] },
  },
  {
    title: 'Roof leaking into the third floor',
    description: 'Water stains and dripping on the third-floor ceiling after yesterday’s rain. Roof slab near the parapet looks cracked.',
    pillar: ServicePillar.HARD, urgency: 'MEDIUM', status: JobStatus.CLOSED, customer: 'anjali.desilva@demo.local', worker: 'thushara.mendis@demo.local',
    createdDaysAgo: 24, closedDaysAgo: 22,
    card: { taxRate: 18, hours: 7, notes: 'Cracks routed and sealed; two coats of membrane.', lines: [L('LABOUR', 'Waterproofing crew', 7, 3200), L('MATERIAL', 'Polyurethane membrane (20 L)', 2, 21500)] },
  },
  {
    title: 'Garden and landscaping maintenance',
    description: 'Lawn mowing, hedge trimming and clearing fallen branches after the monsoon.',
    pillar: ServicePillar.SOFT, urgency: 'LOW', status: JobStatus.CLOSED, customer: 'tharindu.gunasekara@demo.local', worker: 'ishara.ranasinghe@demo.local',
    createdDaysAgo: 12, closedDaysAgo: 10,
    card: { taxRate: 0, hours: 4, notes: 'Green waste removed.', lines: [L('LABOUR', 'Gardener', 4, 1800), L('OTHER', 'Green waste disposal', 1, 2500)] },
  },
  // ── Work finished, waiting for dispatch to approve ──
  {
    title: 'Server room AC not cooling',
    description: 'Both precision AC units in the server room are blowing warm air; rack temperatures are climbing.',
    pillar: ServicePillar.HARD, urgency: 'HIGH', status: JobStatus.COMPLETED, customer: 'eleanor@skylinetowers.com', worker: 'chaminda.bandara@demo.local',
    createdDaysAgo: 4,
    card: {
      taxRate: 18, hours: 3, notes: 'Condenser fan motor failing.', lines: [L('LABOUR', 'HVAC technician', 3, 3500), L('MATERIAL', 'Condenser fan motor', 1, 29000)],
      finalHours: 4, finalNotes: 'Motor replaced; extra hour to recharge and balance both units.', finalLines: [L('LABOUR', 'HVAC technician', 4, 3500), L('MATERIAL', 'Condenser fan motor', 1, 29000)],
    },
  },
  {
    title: 'Replace faulty CCTV power supplies',
    description: 'Four cameras in the basement car park keep dropping offline; the power supply units are overheating.',
    pillar: ServicePillar.STRATEGIC, urgency: 'MEDIUM', status: JobStatus.COMPLETED, customer: 'mohamed.rizwan@demo.local', worker: 'ishara.ranasinghe@demo.local',
    createdDaysAgo: 3,
    card: {
      taxRate: 18, hours: 2, notes: 'Four 12V supplies replaced.', lines: [L('LABOUR', 'Security systems technician', 2, 3200), L('MATERIAL', '12V 5A CCTV power supply', 4, 2900)],
      finalHours: 2, finalNotes: 'Done as quoted; cabling re-dressed.', finalLines: [L('LABOUR', 'Security systems technician', 2, 3200), L('MATERIAL', '12V 5A CCTV power supply', 4, 2900), L('OTHER', 'Cable ties and conduit', 1, 1200)],
    },
  },
  // ── In progress ──
  {
    title: 'Water leakage in basement car park',
    description: 'Seepage along the north wall of the basement car park, pooling near the ramp after rain.',
    pillar: ServicePillar.HARD, urgency: 'HIGH', status: JobStatus.IN_PROGRESS, customer: 'mohamed.rizwan@demo.local', worker: 'lakmal.herath@demo.local',
    createdDaysAgo: 2,
    card: { taxRate: 18, hours: 6, notes: 'Injection grouting along the joint, then a sump pump check.', lines: [L('LABOUR', 'Plumber and mason', 6, 2800), L('MATERIAL', 'Injection grout', 3, 6500)] },
  },
  {
    title: 'Replace corroded water pump',
    description: 'The process water pump has corroded and is leaking at the seal. Production line 2 is running on the standby pump.',
    pillar: ServicePillar.HARD, urgency: 'HIGH', status: JobStatus.IN_PROGRESS, customer: 'sophia@industrialpark.com', worker: 'worker1@demo.local',
    createdDaysAgo: 2,
    card: { taxRate: 18, hours: 5, notes: 'Like-for-like 3 HP pump with new isolation valves.', lines: [L('LABOUR', 'Mechanical technician', 5, 3500), L('MATERIAL', '3 HP centrifugal pump', 1, 84500), L('MATERIAL', 'Isolation valve', 2, 5400)] },
  },
  {
    title: 'Fire extinguisher refill and tagging',
    description: 'Annual refill and inspection tagging of 22 extinguishers across the office and warehouse.',
    pillar: ServicePillar.STRATEGIC, urgency: 'LOW', status: JobStatus.IN_PROGRESS, customer: 'anjali.desilva@demo.local', worker: 'sampath.dissanayake@demo.local',
    createdDaysAgo: 1,
    card: { taxRate: 18, hours: 4, notes: 'Includes 22 tags and a compliance register.', lines: [L('LABOUR', 'Fire safety technician', 4, 3500), L('MATERIAL', 'Extinguisher refill (kg)', 44, 750), L('OTHER', 'Compliance register', 1, 4000)] },
  },
  // ── Earlier stages ──
  {
    title: 'Intermittent power trips on floor 5',
    description: 'The floor 5 breaker trips two or three times a day, usually mid-morning. Sensitive equipment has been affected.',
    pillar: ServicePillar.HARD, urgency: 'HIGH', status: JobStatus.INSPECTION, customer: 'eleanor@skylinetowers.com', worker: 'asanka.jayasuriya@demo.local', createdDaysAgo: 1,
  },
  {
    title: 'Blocked drain in the staff canteen',
    description: 'Floor drain in the canteen kitchen is blocked and backing up at lunchtime.',
    pillar: ServicePillar.HARD, urgency: 'MEDIUM', status: JobStatus.ON_ROUTE, customer: 'sophia@industrialpark.com', worker: 'mohamed.fazil@demo.local', createdDaysAgo: 0,
  },
  {
    title: 'Air conditioner not cooling in master bedroom',
    description: 'Split AC runs but the room never gets below 28 degrees. The indoor unit drips water.',
    pillar: ServicePillar.HARD, urgency: 'MEDIUM', status: JobStatus.ON_ROUTE, customer: 'marcus@residences.lk', worker: 'chaminda.bandara@demo.local', createdDaysAgo: 0,
  },
  {
    title: 'Deep clean ahead of the health inspection',
    description: 'Full deep clean of treatment rooms and the sauna area before the public health inspector visits on Thursday.',
    pillar: ServicePillar.SOFT, urgency: 'HIGH', status: JobStatus.ASSIGNED, customer: 'shanika.rajapaksa@demo.local', worker: 'kumari.wickramasinghe@demo.local', createdDaysAgo: 1,
  },
  {
    title: 'Gate motor not responding',
    description: 'The sliding gate motor hums but the gate does not move. The remote and the wall switch both fail.',
    pillar: ServicePillar.HARD, urgency: 'MEDIUM', status: JobStatus.ASSIGNED, customer: 'tharindu.gunasekara@demo.local', worker: 'asanka.jayasuriya@demo.local', createdDaysAgo: 0,
  },
  {
    title: 'Emergency light batteries failed the test',
    description: 'Six of the emergency exit lights failed their monthly discharge test and need new batteries.',
    pillar: ServicePillar.HARD, urgency: 'MEDIUM', status: JobStatus.PENDING_ACCEPTANCE, customer: DEMO_MARKER_EMAIL, worker: 'mohamed.fazil@demo.local', createdDaysAgo: 0,
  },
  // ── Waiting for dispatch ──
  {
    title: 'Peeling paint and damp patch on the ceiling',
    description: 'A damp patch about one metre wide has appeared on the living room ceiling and the paint is peeling.',
    pillar: ServicePillar.HARD, urgency: 'LOW', status: JobStatus.REQUESTED, customer: 'tharindu.gunasekara@demo.local', createdDaysAgo: 0,
  },
  {
    title: 'Elevator door sensor misaligned',
    description: 'The lift door closes on people before the sensor reacts. Two complaints from tenants this week.',
    pillar: ServicePillar.HARD, urgency: 'HIGH', status: JobStatus.REQUESTED, customer: 'eleanor@skylinetowers.com', createdDaysAgo: 0,
    declinedBy: 'worker1@demo.local',
  },
  {
    title: 'Rodent sighting in the storeroom',
    description: 'Droppings found behind the shelving in the supply storeroom. Needs inspection and treatment.',
    pillar: ServicePillar.SOFT, urgency: 'MEDIUM', status: JobStatus.REQUESTED, customer: 'shanika.rajapaksa@demo.local', createdDaysAgo: 0,
  },
  {
    title: 'Noisy exhaust fan in the kitchen',
    description: 'The kitchen exhaust fan rattles loudly and barely pulls air.',
    pillar: ServicePillar.HARD, urgency: 'LOW', status: JobStatus.REQUESTED, customer: 'marcus@residences.lk', createdDaysAgo: 1,
  },
  {
    title: 'Annual fire safety audit',
    description: 'Book the annual fire safety audit and evacuation plan review for the head office.',
    pillar: ServicePillar.STRATEGIC, urgency: 'LOW', status: JobStatus.REQUESTED, customer: 'anjali.desilva@demo.local', createdDaysAgo: 2,
  },
  {
    title: 'Solar inverter showing fault code E02',
    description: 'The rooftop solar inverter shows E02 and has stopped exporting power since this morning.',
    pillar: ServicePillar.HARD, urgency: 'MEDIUM', status: JobStatus.REQUESTED, customer: 'mohamed.rizwan@demo.local', createdDaysAgo: 0,
  },
  // ── Cancelled ──
  {
    title: 'Replace the reception carpet',
    description: 'Replace worn carpet in the ground-floor reception with carpet tiles.',
    pillar: ServicePillar.SOFT, urgency: 'LOW', status: JobStatus.CANCELLED, customer: 'eleanor@skylinetowers.com', createdDaysAgo: 9,
    cancelReason: 'Postponed to next quarter by the building manager.',
  },
  {
    title: 'Window cleaning, front shopfront',
    description: 'Clean the front shopfront windows and signage.',
    pillar: ServicePillar.SOFT, urgency: 'LOW', status: JobStatus.CANCELLED, customer: DEMO_MARKER_EMAIL, createdDaysAgo: 6,
    cancelReason: 'Raised by mistake.',
  },
];
