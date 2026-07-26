/**
 * METRO-FIX: Database Seed Script
 *
 * Clears all existing data and inserts mock records:
 *   - 2 Admin/Dispatcher Users
 *   - 3 Customers (with linked User records)
 *   - 2 Workers (with linked User records)
 *   - 5 Service Requests spread across different Kanban statuses
 *
 * Usage:  npx ts-node -r dotenv/config src/scripts/seed.ts
 */
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import {
  Role,
  FacilityType,
  SubscriptionTier,
  ServicePillar,
  JobStatus,
} from '@metro-fix/core-types';
import {
  UserEntity,
  WorkerEntity,
  CustomerEntity,
  ServiceRequestEntity,
} from '../entities';

// Load environment variables from apps/api/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function seed(): Promise<void> {
  console.log('='.repeat(60));
  console.log('[METRO-FIX] Database Seed Script');
  console.log('='.repeat(60));

  const dataSource = new DataSource({
    type: 'mssql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    username: process.env.DB_USERNAME || 'sa',
    password: process.env.DB_PASSWORD || 'YourPassword123!',
    database: process.env.DB_NAME || 'metrofix_db',
    options: {
      trustServerCertificate: true,
      encrypt: false,
    },
    entities: [UserEntity, WorkerEntity, CustomerEntity, ServiceRequestEntity],
    synchronize: true,
    dropSchema: true,
    logging: ['error', 'warn'],
  });

  try {
    console.log('[1/5] Connecting to database...');
    await dataSource.initialize();
    console.log('  ✓ Connected & schema synchronized.');

    // Obtain repositories
    const userRepo = dataSource.getRepository(UserEntity);
    const customerRepo = dataSource.getRepository(CustomerEntity);
    const workerRepo = dataSource.getRepository(WorkerEntity);
    const jobRepo = dataSource.getRepository(ServiceRequestEntity);

    // Tables are already empty — dropSchema: true in DataSource config
    // drops and recreates all tables on every seed run.
    console.log('[2/5] Schema dropped & recreated (clean slate).');

    // ----- SEED ADMIN & DISPATCHER USERS -----
    console.log('[3/5] Seeding Admin & Dispatcher users...');
    const adminUser = await userRepo.save(
      userRepo.create({
        fullName: 'Rajesh Perera',
        email: 'admin@metro-fix.com',
        phoneNumber: '+94 77 234 5678',
        role: Role.ADMIN,
      }),
    );
    console.log(`  ✓ Admin: ${adminUser.fullName} (${adminUser.email})`);

    const dispatcherUser = await userRepo.save(
      userRepo.create({
        fullName: 'Kavinda Silva',
        email: 'dispatch@metro-fix.com',
        phoneNumber: '+94 77 345 6789',
        role: Role.CUSTOMER_CARE,
      }),
    );
    console.log(`  ✓ Dispatcher: ${dispatcherUser.fullName} (${dispatcherUser.email})`);

    // ----- SEED CUSTOMERS -----
    console.log('[4/5] Seeding Customers & Workers...');

    const cust1User = await userRepo.save(
      userRepo.create({
        fullName: 'Eleanor Vance',
        email: 'eleanor@skylinetowers.com',
        phoneNumber: '+94 71 019 2834',
        role: Role.CUSTOMER,
      }),
    );
    const customer1 = await customerRepo.save(
      customerRepo.create({
        userId: cust1User.id,
        facilityType: FacilityType.COMMERCIAL,
        subscriptionTier: SubscriptionTier.PREMIUM,
        latitude: 6.9271,
        longitude: 79.8612,
      }),
    );
    console.log(`  ✓ Customer: ${cust1User.fullName} (${customer1.facilityType} / ${customer1.subscriptionTier})`);

    const cust2User = await userRepo.save(
      userRepo.create({
        fullName: 'Marcus Wijesinghe',
        email: 'marcus@residences.lk',
        phoneNumber: '+94 71 012 9988',
        role: Role.CUSTOMER,
      }),
    );
    const customer2 = await customerRepo.save(
      customerRepo.create({
        userId: cust2User.id,
        facilityType: FacilityType.RESIDENTIAL,
        subscriptionTier: SubscriptionTier.PLUS,
        latitude: 6.9344,
        longitude: 79.8428,
      }),
    );
    console.log(`  ✓ Customer: ${cust2User.fullName} (${customer2.facilityType} / ${customer2.subscriptionTier})`);

    const cust3User = await userRepo.save(
      userRepo.create({
        fullName: 'Sophia Martinez',
        email: 'sophia@industrialpark.com',
        phoneNumber: '+94 71 018 4421',
        role: Role.CUSTOMER,
      }),
    );
    const customer3 = await customerRepo.save(
      customerRepo.create({
        userId: cust3User.id,
        facilityType: FacilityType.INDUSTRIAL,
        subscriptionTier: SubscriptionTier.BASIC,
        latitude: 6.9147,
        longitude: 79.8773,
      }),
    );
    console.log(`  ✓ Customer: ${cust3User.fullName} (${customer3.facilityType} / ${customer3.subscriptionTier})`);

    // ----- SEED WORKERS -----
    const wrk1User = await userRepo.save(
      userRepo.create({
        fullName: 'Amina Yusuf',
        email: 'amina@metro-fix.com',
        phoneNumber: '+94 77 012 4491',
        role: Role.WORKER,
      }),
    );
    const worker1 = await workerRepo.save(
      workerRepo.create({
        userId: wrk1User.id,
        rating: 4.9,
        servicePillars: [ServicePillar.HARD, ServicePillar.STRATEGIC],
        isAvailable: true,
        activeJobs: 2,
        latitude: 6.9220,
        longitude: 79.8560,
      }),
    );
    console.log(`  ✓ Worker: ${wrk1User.fullName} (Rating: ${worker1.rating})`);

    const wrk2User = await userRepo.save(
      userRepo.create({
        fullName: 'Malik Thompson',
        email: 'malik@metro-fix.com',
        phoneNumber: '+94 77 012 7720',
        role: Role.WORKER,
      }),
    );
    const worker2 = await workerRepo.save(
      workerRepo.create({
        userId: wrk2User.id,
        rating: 4.7,
        servicePillars: [ServicePillar.SOFT],
        isAvailable: true,
        activeJobs: 1,
        latitude: 6.9310,
        longitude: 79.8480,
      }),
    );
    console.log(`  ✓ Worker: ${wrk2User.fullName} (Rating: ${worker2.rating})`);

    // ----- SEED SERVICE REQUESTS -----
    console.log('[5/5] Seeding Service Requests across Kanban stages...');

    const seedJobs = [
      {
        title: 'HVAC Chiller Unit Maintenance',
        description: 'Compressor vibration anomaly detected during routine site audit. Requires immediate triage and replacement scheduling.',
        servicePillar: ServicePillar.HARD,
        facilityType: FacilityType.COMMERCIAL,
        status: JobStatus.REQUESTED,
        customerId: customer1.id,
        workerId: null as string | null,
        latitude: 6.9271,
        longitude: 79.8612,
      },
      {
        title: 'Emergency Main Pipe Water Leak',
        description: 'Burst water pipe in basement storage area requiring urgent shutoff and pipe replacement.',
        servicePillar: ServicePillar.HARD,
        facilityType: FacilityType.RESIDENTIAL,
        status: JobStatus.ASSIGNED,
        customerId: customer2.id,
        workerId: worker1.id,
        latitude: 6.9344,
        longitude: 79.8428,
      },
      {
        title: 'Electrical Substation Compliance Audit',
        description: 'Annual high-voltage switchgear inspection, thermal imaging test and certification renewal.',
        servicePillar: ServicePillar.STRATEGIC,
        facilityType: FacilityType.INDUSTRIAL,
        status: JobStatus.ON_ROUTE,
        customerId: customer3.id,
        workerId: worker1.id,
        latitude: 6.9147,
        longitude: 79.8773,
      },
      {
        title: 'Commercial Deep Sanitization Routine',
        description: 'Post-event deep sanitization and HVAC duct misting for office floors 4-8.',
        servicePillar: ServicePillar.SOFT,
        facilityType: FacilityType.COMMERCIAL,
        status: JobStatus.REQUESTED,
        customerId: customer1.id,
        workerId: null as string | null,
        latitude: 6.9271,
        longitude: 79.8612,
      },
      {
        title: 'Elevator Shaft Safety Inspection',
        description: 'On-site technical evaluation and quote generation for brake pad replacement in service elevator bank.',
        servicePillar: ServicePillar.HARD,
        facilityType: FacilityType.COMMERCIAL,
        status: JobStatus.INSPECTION,
        customerId: customer1.id,
        workerId: worker2.id,
        latitude: 6.9271,
        longitude: 79.8612,
      },
    ];

    for (const jobData of seedJobs) {
      const job = await jobRepo.save(jobRepo.create(jobData));
      console.log(`  ✓ Job: "${job.title}" → ${job.status}`);
    }

    // ----- SUMMARY -----
    const counts = {
      users: await userRepo.count(),
      customers: await customerRepo.count(),
      workers: await workerRepo.count(),
      jobs: await jobRepo.count(),
    };

    console.log('-'.repeat(60));
    console.log('[METRO-FIX] Seed complete! Database summary:');
    console.log(`  Users:             ${counts.users}`);
    console.log(`  Customers:         ${counts.customers}`);
    console.log(`  Workers:           ${counts.workers}`);
    console.log(`  Service Requests:  ${counts.jobs}`);
    console.log('='.repeat(60));
  } catch (error: any) {
    console.error('\n[ERROR] Seed script failed:');
    console.error(`  ${error.message}`);
    if (error.message?.includes('Login failed')) {
      console.error('  → Check your .env DB_USERNAME / DB_PASSWORD credentials.');
    }
    if (error.message?.includes('Could not open a connection')) {
      console.error('  → Is MSSQL running? Have you run `npm run db:init` first?');
    }
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seed();
