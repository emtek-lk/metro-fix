import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  UserEntity,
  WorkerEntity,
  CustomerEntity,
  ServiceRequestEntity,
  ServiceCatalogEntity,
  SubscriptionPlanEntity,
  SubscriptionPaymentEntity,
} from '../entities';
import { CATALOG_SEEDS, PLAN_SEEDS } from './seed-data';
import {
  Role,
  SubscriptionTier,
  JobStatus,
  JOB_CARD_CURRENCY,
  OFFER_TIMEOUT_SECONDS,
  computeJobCardTotals,
} from '@metro-fix/core-types';
import { DEMO_CUSTOMERS, DEMO_JOBS, DEMO_MARKER_EMAIL, DEMO_WORKERS } from './demo-data';

const DEMO_SIGNATURE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/** A moment `days` days (and `hours` hours) in the past. */
const daysAgo = (days: number, hours = 0): Date => new Date(Date.now() - (days * 24 + hours) * 3600 * 1000);

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(WorkerEntity)
    private readonly workerRepository: Repository<WorkerEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    @InjectRepository(ServiceRequestEntity)
    private readonly jobRepository: Repository<ServiceRequestEntity>,
    @InjectRepository(ServiceCatalogEntity)
    private readonly catalogRepository: Repository<ServiceCatalogEntity>,
    @InjectRepository(SubscriptionPlanEntity)
    private readonly planRepository: Repository<SubscriptionPlanEntity>,
    @InjectRepository(SubscriptionPaymentEntity)
    private readonly paymentRepository: Repository<SubscriptionPaymentEntity>,
  ) {}

  /** Moves rows written under the old tier names onto the current ones. */
  private async migrateLegacyValues() {
    await this.customerRepository.query(
      `UPDATE customers SET subscriptionTier = CASE subscriptionTier
         WHEN 'BASIC' THEN 'ACCESS' WHEN 'PREMIUM' THEN 'BUSINESS' ELSE subscriptionTier END
       WHERE subscriptionTier IN ('BASIC', 'PREMIUM')`,
    );
  }

  /** Pre-spec rows (old Basic/Premium tiers and the three placeholder services) are retired, not deleted. */
  private async retireLegacyReferenceData() {
    await this.planRepository.query(
      `UPDATE subscription_plans SET status = 'Retired' WHERE tierName IN ('BASIC', 'PREMIUM') AND status <> 'Retired'`,
    );
    await this.catalogRepository.query(
      `UPDATE service_catalog SET status = 'Retired'
       WHERE serviceName IN ('HVAC System Maintenance', 'Commercial Deep Sanitization', 'Electrical Compliance Audit', 'HVAC Chiller Maintenance', 'Deep Cleaning')
         AND status <> 'Retired'`,
    );
  }

  /** Catalog and plans are reference data: upsert by name/tier on every boot. */
  private async seedReferenceData() {
    for (const data of CATALOG_SEEDS) {
      const existing = await this.catalogRepository.findOne({ where: { serviceName: data.serviceName } });
      await this.catalogRepository.save(
        this.catalogRepository.create({ ...existing, ...data, status: existing?.status ?? 'Active' }),
      );
    }
    for (const data of PLAN_SEEDS) {
      const existing = await this.planRepository.findOne({ where: { tierName: data.tierName } });
      await this.planRepository.save(
        this.planRepository.create({ ...existing, ...data, status: existing?.status ?? 'Active' }),
      );
    }
  }

  async onApplicationBootstrap() {
    this.logger.log('Starting seed process...');
    await this.migrateLegacyValues();
    await this.seedReferenceData();
    await this.retireLegacyReferenceData();

    const saltRounds = 10;
    const password = await bcrypt.hash('Demo123!', saltRounds);

    const usersData = [
      {
        fullName: 'System Administrator',
        email: 'admin@demo.local',
        role: Role.ADMIN,
      },
      {
        fullName: 'Customer Care Dispatcher',
        email: 'dispatch@demo.local',
        role: Role.CUSTOMER_CARE,
      },
    ];

    const users: Record<string, UserEntity> = {};

    for (const data of usersData) {
      let user = await this.userRepository.findOne({ where: { email: data.email } });
      if (!user) {
        user = this.userRepository.create({
          ...data,
          password,
        });
        await this.userRepository.save(user);
        this.logger.log(`Created user: ${data.email}`);
      } else {
        user.password = password;
        await this.userRepository.save(user);
        this.logger.log(`Updated password for: ${data.email}`);
      }
      users[data.email] = user;
    }

    await this.seedDemoData(password);
  }

  /**
   * Realistic demo people and work (see demo-data.ts). Accounts are upserted by email every boot, so
   * the demo logins keep working and carry proper names; jobs and payments are added once, when the
   * marker customer does not exist yet, so this never duplicates or overwrites real data.
   */
  private async seedDemoData(password: string) {
    const users: Record<string, UserEntity> = {};
    const ensureUser = async (email: string, fullName: string, phoneNumber: string, role: Role) => {
      let user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        user = this.userRepository.create({ email, fullName, phoneNumber, role, password });
      } else {
        user.fullName = fullName;
        user.phoneNumber = phoneNumber;
        // Demo accounts always accept the documented demo password.
        user.password = password;
      }
      users[email] = await this.userRepository.save(user);
      return users[email];
    };

    const workers: Record<string, WorkerEntity> = {};
    for (const data of DEMO_WORKERS) {
      const user = await ensureUser(data.email, data.fullName, data.phone, Role.WORKER);
      let worker = await this.workerRepository.findOne({ where: { user: { id: user.id } } });
      if (!worker) {
        worker = this.workerRepository.create({
          user,
          rating: data.rating,
          servicePillars: data.pillars,
          isAvailable: data.available,
          activeJobs: 0,
          latitude: data.latitude,
          longitude: data.longitude,
        } as Partial<WorkerEntity>);
        worker = await this.workerRepository.save(worker);
      }
      workers[data.email] = worker;
    }

    const customers: Record<string, CustomerEntity> = {};
    for (const data of DEMO_CUSTOMERS) {
      const user = await ensureUser(data.email, data.fullName, data.phone, Role.CUSTOMER);
      let customer = await this.customerRepository.findOne({ where: { user: { id: user.id } } });
      if (!customer) {
        customer = this.customerRepository.create({
          user,
          facilityType: data.facilityType,
          subscriptionTier: data.tier,
          billingCycle: data.billing,
          subscribedAt: data.tier ? daysAgo(data.subscribedDaysAgo) : null,
          latitude: data.latitude,
          longitude: data.longitude,
        } as Partial<CustomerEntity>);
      }
      // Names and addresses stay current; a customer's plan is never touched once it exists.
      customer.companyName = data.companyName;
      customer.address = customer.address ?? data.address;
      customer.latitude = customer.latitude ?? data.latitude;
      customer.longitude = customer.longitude ?? data.longitude;
      customers[data.email] = await this.customerRepository.save(customer);
    }

    const marker = await this.jobRepository.count({ where: { customerId: customers[DEMO_MARKER_EMAIL].id } });
    if (marker > 0) {
      this.logger.log('Demo work already present. Skipping demo jobs.');
      return;
    }

    for (const data of DEMO_JOBS) {
      const customer = customers[data.customer];
      const worker = data.worker ? workers[data.worker] : null;
      const created = daysAgo(data.createdDaysAgo, 2);
      const jitter = (n: number) => ((n % 7) - 3) * 0.0004;
      const seed = data.title.length;

      const patch: Partial<ServiceRequestEntity> = {
        title: data.title,
        description: data.description,
        servicePillar: data.pillar,
        facilityType: customer.facilityType,
        urgency: data.urgency,
        status: data.status,
        customerId: customer.id,
        workerId: worker?.id ?? null,
        latitude: (customer.latitude ?? 6.9271) + jitter(seed),
        longitude: (customer.longitude ?? 79.8612) + jitter(seed * 3),
        createdAt: created,
        updatedAt: data.closedDaysAgo !== undefined ? daysAgo(data.closedDaysAgo) : created,
      };

      if (data.card) {
        const taxRate = data.card.taxRate;
        const section = (lines: typeof data.card.lines, hours: number, notes: string) => {
          const lineItems = lines.map(([kind, description, quantity, unitPrice], i) => ({
            id: `${kind.toLowerCase()}-${i + 1}`,
            kind,
            description,
            quantity,
            unitPrice,
          }));
          return {
            lineItems,
            hours,
            notes,
            ...computeJobCardTotals(lineItems, taxRate),
            savedAt: created.toISOString(),
            savedBy: worker?.userId ?? null,
          };
        };
        const estimate = section(data.card.lines, data.card.hours, data.card.notes);
        const final = data.card.finalLines
          ? section(data.card.finalLines, data.card.finalHours ?? data.card.hours, data.card.finalNotes ?? data.card.notes)
          : data.status === JobStatus.CLOSED
            ? estimate
            : null;
        patch.jobCard = { currency: JOB_CARD_CURRENCY, taxRate, estimate, final };
        patch.quoteAmount = estimate.total;
        patch.estimatedHours = estimate.hours;
        patch.quoteNotes = estimate.notes;
      }
      if (data.status === JobStatus.COMPLETED || data.status === JobStatus.CLOSED) {
        patch.signature = DEMO_SIGNATURE;
        patch.photos = [];
      }
      if (data.status === JobStatus.CLOSED && data.closedDaysAgo !== undefined) {
        patch.closedAt = daysAgo(data.closedDaysAgo);
      }
      if (data.status === JobStatus.CANCELLED) {
        patch.cancelReason = data.cancelReason ?? null;
        patch.cancelledAt = daysAgo(Math.max(0, data.createdDaysAgo - 1));
      }
      if (data.status === JobStatus.PENDING_ACCEPTANCE) {
        patch.offeredAt = new Date();
        patch.offerExpiresAt = new Date(Date.now() + OFFER_TIMEOUT_SECONDS * 1000);
      }
      if (data.declinedBy) {
        patch.offerHistory = [
          { workerId: workers[data.declinedBy].id, outcome: 'DECLINED', at: daysAgo(0, 1).toISOString(), reason: 'Already on another site' },
        ];
      }
      await this.jobRepository.save(this.jobRepository.create(patch as Partial<ServiceRequestEntity>));
    }

    // Subscription payments: one per month for monthly plans, one up-front for annual plans.
    const plans = await this.planRepository.find();
    const fee = (tier: SubscriptionTier, cycle: 'MONTHLY' | 'ANNUAL') => {
      const plan = plans.find((p) => p.tierName === tier);
      return cycle === 'ANNUAL' ? plan?.annualFeeLkr : plan?.monthlyFeeLkr;
    };
    const cards = [
      { brand: 'VISA', last4: '4242' },
      { brand: 'MASTERCARD', last4: '4444' },
    ] as const;
    let n = 0;
    for (const data of DEMO_CUSTOMERS) {
      // Business is custom priced and invoiced outside the card flow.
      if (!data.tier || !data.billing || data.tier === SubscriptionTier.BUSINESS) continue;
      const amount = fee(data.tier, data.billing);
      if (!amount) continue;
      const card = cards[n % cards.length];
      n += 1;
      const charges = data.billing === 'ANNUAL' ? 1 : Math.max(1, Math.floor(data.subscribedDaysAgo / 30));
      for (let i = 0; i < charges; i += 1) {
        await this.paymentRepository.save(
          this.paymentRepository.create({
            customerId: customers[data.email].id,
            tier: data.tier,
            billingCycle: data.billing,
            amountLkr: amount,
            cardBrand: card.brand,
            cardLast4: card.last4,
            status: 'SUCCEEDED',
            reference: `demo_${data.email.split('@')[0]}_${i + 1}`,
            createdAt: daysAgo(data.subscribedDaysAgo - i * 30),
          }),
        );
      }
    }

    this.logger.log(`Seeded demo data: ${DEMO_CUSTOMERS.length} customers, ${DEMO_WORKERS.length} workers, ${DEMO_JOBS.length} jobs.`);
  }
}
