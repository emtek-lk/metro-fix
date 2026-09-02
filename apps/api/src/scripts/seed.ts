import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

import {
  UserEntity,
  WorkerEntity,
  CustomerEntity,
  ServiceRequestEntity,
  ServiceCatalogEntity,
  SubscriptionPlanEntity,
} from '../entities';

import {
  Role,
  ServicePillar,
  FacilityType,
  SubscriptionTier,
  JobStatus
} from '@metro-fix/core-types';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const AppDataSource = new DataSource({
  type: 'mssql',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 1433,
  username: process.env.DB_USERNAME || 'sa',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'metrofix',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  synchronize: true,
  dropSchema: true,
  entities: [
    UserEntity,
    WorkerEntity,
    CustomerEntity,
    ServiceRequestEntity,
    ServiceCatalogEntity,
    SubscriptionPlanEntity,
  ],
});

async function run() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Database connected, schema synchronized.');

    const userRepo = AppDataSource.getRepository(UserEntity);
    const workerRepo = AppDataSource.getRepository(WorkerEntity);
    const customerRepo = AppDataSource.getRepository(CustomerEntity);
    const catalogRepo = AppDataSource.getRepository(ServiceCatalogEntity);
    const jobRepo = AppDataSource.getRepository(ServiceRequestEntity);

    console.log('Generating seed data...');

    const defaultPassword = await bcrypt.hash('Demo123!', 10);

    // 1. Users
    const usersData = [
      {
        fullName: 'System Administrator',
        email: 'admin@demo.local',
        role: Role.ADMIN,
        password: defaultPassword,
      },
      {
        fullName: 'Customer Care Dispatcher',
        email: 'dispatch@demo.local',
        role: Role.CUSTOMER_CARE,
        password: defaultPassword,
      },
      {
        fullName: 'Carlos Rivera',
        email: 'worker1@demo.local',
        role: Role.WORKER,
        password: defaultPassword,
      },
      {
        fullName: 'Priya Sharma',
        email: 'worker2@demo.local',
        role: Role.WORKER,
        password: defaultPassword,
      },
      {
        fullName: 'Eleanor Vance',
        email: 'eleanor@skylinetowers.com',
        role: Role.CUSTOMER,
        password: defaultPassword,
      },
      {
        fullName: 'Marcus Wijesinghe',
        email: 'marcus@residences.lk',
        role: Role.CUSTOMER,
        password: defaultPassword,
      },
      {
        fullName: 'Sophia Martinez',
        email: 'sophia@industrialpark.com',
        role: Role.CUSTOMER,
        password: defaultPassword,
      },
    ];

    const savedUsers: UserEntity[] = [];
    for (const u of usersData) {
      const user = userRepo.create(u);
      savedUsers.push(await userRepo.save(user));
    }
    
    const worker1User = savedUsers.find(u => u.email === 'worker1@demo.local')!;
    const worker2User = savedUsers.find(u => u.email === 'worker2@demo.local')!;
    const cust1User = savedUsers.find(u => u.email === 'eleanor@skylinetowers.com')!;
    const cust2User = savedUsers.find(u => u.email === 'marcus@residences.lk')!;
    const cust3User = savedUsers.find(u => u.email === 'sophia@industrialpark.com')!;

    // 2. Workers
    const worker1 = workerRepo.create({
      user: worker1User,
      rating: 4.8,
      servicePillars: [ServicePillar.HARD, ServicePillar.STRATEGIC],
      isAvailable: true,
      activeJobs: 2,
      latitude: 6.9220,
      longitude: 79.8560,
    } as Partial<WorkerEntity>);
    
    const worker2 = workerRepo.create({
      user: worker2User,
      rating: 4.5,
      servicePillars: [ServicePillar.SOFT],
      isAvailable: true,
      activeJobs: 0,
      latitude: 6.9310,
      longitude: 79.8480,
    } as Partial<WorkerEntity>);

    await workerRepo.save([worker1, worker2]);

    // 3. Customers
    const customer1 = customerRepo.create({
      user: cust1User,
      facilityType: FacilityType.COMMERCIAL,
      subscriptionTier: SubscriptionTier.PREMIUM,
      latitude: 6.9271,
      longitude: 79.8612,
    } as Partial<CustomerEntity>);

    const customer2 = customerRepo.create({
      user: cust2User,
      facilityType: FacilityType.RESIDENTIAL,
      subscriptionTier: SubscriptionTier.PLUS,
      latitude: 6.9344,
      longitude: 79.8428,
    } as Partial<CustomerEntity>);

    const customer3 = customerRepo.create({
      user: cust3User,
      facilityType: FacilityType.INDUSTRIAL,
      subscriptionTier: SubscriptionTier.BASIC,
      latitude: 6.9147,
      longitude: 79.8773,
    } as Partial<CustomerEntity>);

    await customerRepo.save([customer1, customer2, customer3]);

    // 4. Service Catalog
    const catalog1 = catalogRepo.create({
      serviceName: 'HVAC System Maintenance',
      pillarCategory: ServicePillar.HARD,
      basePrice: '$850.00',
      requiredSubscriptionTier: SubscriptionTier.BASIC,
    });

    const catalog2 = catalogRepo.create({
      serviceName: 'Commercial Deep Sanitization',
      pillarCategory: ServicePillar.SOFT,
      basePrice: '$450.00',
      requiredSubscriptionTier: SubscriptionTier.PLUS,
    });

    const catalog3 = catalogRepo.create({
      serviceName: 'Electrical Compliance Audit',
      pillarCategory: ServicePillar.STRATEGIC,
      basePrice: '$1,200.00',
      requiredSubscriptionTier: SubscriptionTier.PREMIUM,
    });

    await catalogRepo.save([catalog1, catalog2, catalog3]);

    // 5. Jobs
    const job1 = jobRepo.create({
      title: 'HVAC Chiller Unit Maintenance',
      description: 'Compressor vibration anomaly detected during routine site audit.',
      servicePillar: ServicePillar.HARD,
      facilityType: FacilityType.COMMERCIAL,
      status: JobStatus.REQUESTED,
      customer: customer1,
    } as Partial<ServiceRequestEntity>);

    const job2 = jobRepo.create({
      title: 'Emergency Main Pipe Water Leak',
      description: 'Burst water pipe in basement storage area requiring urgent shutoff.',
      servicePillar: ServicePillar.HARD,
      facilityType: FacilityType.RESIDENTIAL,
      status: JobStatus.ASSIGNED,
      customer: customer2,
      worker: worker1,
    } as Partial<ServiceRequestEntity>);

    const job3 = jobRepo.create({
      title: 'Roof Solar Panel Inverter Service',
      description: 'Replacing faulty String Inverter #3 on commercial rooftop array.',
      servicePillar: ServicePillar.STRATEGIC,
      facilityType: FacilityType.INDUSTRIAL,
      status: JobStatus.IN_PROGRESS,
      customer: customer3,
      worker: worker1,
    } as Partial<ServiceRequestEntity>);

    await jobRepo.save([job1, job2, job3]);

    console.log('\n--- Seed Summary ---');
    console.table([
      { Entity: 'Users', Count: savedUsers.length },
      { Entity: 'Workers', Count: 2 },
      { Entity: 'Customers', Count: 3 },
      { Entity: 'Service Catalog', Count: 3 },
      { Entity: 'Jobs', Count: 3 },
    ]);
    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error during seed:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed.');
    }
  }
}

run();
