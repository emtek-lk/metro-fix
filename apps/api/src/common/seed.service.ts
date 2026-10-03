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
} from '../entities';
import { CATALOG_SEEDS, PLAN_SEEDS } from './seed-data';
import {
  Role,
  ServicePillar,
  FacilityType,
  SubscriptionTier,
  JobStatus,
} from '@metro-fix/core-types';

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
      {
        fullName: 'Carlos Rivera',
        email: 'worker1@demo.local',
        phoneNumber: '+94 77 100 0001',
        role: Role.WORKER,
      },
      {
        fullName: 'Priya Sharma',
        email: 'worker2@demo.local',
        phoneNumber: '+94 77 100 0002',
        role: Role.WORKER,
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
        if (!user.phoneNumber && data.phoneNumber) user.phoneNumber = data.phoneNumber;
        await this.userRepository.save(user);
        this.logger.log(`Updated password for: ${data.email}`);
      }
      users[data.email] = user;
    }

    // Worker profiles are idempotent and must exist for the demo worker logins even when
    // jobs already exist (the demo users may have been added to an older database).
    const worker1Data = {
      user: users['worker1@demo.local'],
      rating: 4.8,
      servicePillars: [ServicePillar.HARD, ServicePillar.STRATEGIC],
      isAvailable: true,
      activeJobs: 2,
      latitude: 6.9220,
      longitude: 79.8560,
    };
    
    let worker1 = await this.workerRepository.findOne({ where: { user: { id: users['worker1@demo.local'].id } } });
    if (!worker1) {
       worker1 = await this.workerRepository.save(this.workerRepository.create(worker1Data as Partial<WorkerEntity>));
    }

    const worker2Data = {
      user: users['worker2@demo.local'],
      rating: 4.5,
      servicePillars: [ServicePillar.SOFT],
      isAvailable: true,
      activeJobs: 0,
      latitude: 6.9310,
      longitude: 79.8480,
    };
    let worker2 = await this.workerRepository.findOne({ where: { user: { id: users['worker2@demo.local'].id } } });
    if (!worker2) {
      worker2 = await this.workerRepository.save(this.workerRepository.create(worker2Data as Partial<WorkerEntity>));
    }

    // Demo customer logins (the customer portal) use the same demo password as staff.
    const demoCustomerPhones: Record<string, string> = {
      'eleanor@skylinetowers.com': '+94 77 200 0001',
      'marcus@residences.lk': '+94 77 200 0002',
      'sophia@industrialpark.com': '+94 77 200 0003',
    };
    for (const [email, phone] of Object.entries(demoCustomerPhones)) {
      const existing = await this.userRepository.findOne({ where: { email } });
      if (existing) {
        existing.password = password;
        if (!existing.phoneNumber) existing.phoneNumber = phone;
        await this.userRepository.save(existing);
      }
    }

    // Demo customers and worker profiles are create-if-missing, so they exist on any database.
    // (The service catalog and plans are reference data, upserted at the top of the boot.)
    // Only the sample jobs further down are skipped once jobs exist.
    const customersData = [
      {
        user: { fullName: 'Eleanor Vance', email: 'eleanor@skylinetowers.com', role: Role.CUSTOMER, password },
        facilityType: FacilityType.COMMERCIAL,
        subscriptionTier: SubscriptionTier.BUSINESS,
        latitude: 6.9271,
        longitude: 79.8612,
      },
      {
        user: { fullName: 'Marcus Wijesinghe', email: 'marcus@residences.lk', role: Role.CUSTOMER, password },
        facilityType: FacilityType.RESIDENTIAL,
        subscriptionTier: SubscriptionTier.PLUS,
        latitude: 6.9344,
        longitude: 79.8428,
      },
      {
        user: { fullName: 'Sophia Martinez', email: 'sophia@industrialpark.com', role: Role.CUSTOMER, password },
        facilityType: FacilityType.INDUSTRIAL,
        subscriptionTier: SubscriptionTier.ACCESS,
        latitude: 6.9147,
        longitude: 79.8773,
      },
    ];

    const customers: Record<string, CustomerEntity> = {};
    for (const data of customersData) {
      let user = await this.userRepository.findOne({ where: { email: data.user.email } });
      if (!user) {
        user = await this.userRepository.save(this.userRepository.create(data.user as Partial<UserEntity>));
      }
      
      let customer = await this.customerRepository.findOne({ where: { user: { id: user.id } } });
      if (!customer) {
        customer = await this.customerRepository.save(this.customerRepository.create({
            user,
            facilityType: data.facilityType,
            subscriptionTier: data.subscriptionTier,
            latitude: data.latitude,
            longitude: data.longitude,
        } as Partial<CustomerEntity>));
      }
      customers[data.user.email] = customer!;
    }

    const jobCount = await this.jobRepository.count();
    if (jobCount > 0) {
      this.logger.log('Data already seeded. Skipping seed process.');
      return;
    }

    const jobsData = [
      {
        title: 'HVAC Chiller Unit Maintenance',
        description: 'Compressor vibration anomaly detected during routine site audit.',
        servicePillar: ServicePillar.HARD,
        facilityType: FacilityType.COMMERCIAL,
        status: JobStatus.REQUESTED,
        customer: customers['eleanor@skylinetowers.com'],
        worker: null,
      },
      {
        title: 'Emergency Main Pipe Water Leak',
        description: 'Burst water pipe in basement storage area requiring urgent shutoff.',
        servicePillar: ServicePillar.HARD,
        facilityType: FacilityType.RESIDENTIAL,
        status: JobStatus.ASSIGNED,
        customer: customers['marcus@residences.lk'],
        worker: worker1,
      },
      {
        title: 'Roof Solar Panel Inverter Service',
        description: 'Replacing faulty String Inverter #3 on commercial rooftop array.',
        servicePillar: ServicePillar.STRATEGIC,
        facilityType: FacilityType.INDUSTRIAL,
        status: JobStatus.IN_PROGRESS,
        customer: customers['sophia@industrialpark.com'],
        worker: worker1,
      },
    ];

    for (const data of jobsData) {
      await this.jobRepository.save(this.jobRepository.create(data as Partial<ServiceRequestEntity>));
    }

    this.logger.log('Seed process completed.');
  }
}
