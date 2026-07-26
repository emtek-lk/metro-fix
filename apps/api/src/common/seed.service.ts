import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Role,
  FacilityType,
  SubscriptionTier,
  ServicePillar,
  JobStatus,
} from '@metro-fix/core-types';
import {
  UserEntity,
  CustomerEntity,
  WorkerEntity,
  ServiceRequestEntity,
} from '../entities';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
    @InjectRepository(WorkerEntity)
    private readonly workerRepo: Repository<WorkerEntity>,
    @InjectRepository(ServiceRequestEntity)
    private readonly jobRepo: Repository<ServiceRequestEntity>,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.seedData();
    } catch (err) {
      this.logger.warn(`Database seed deferred: ${err?.message || err}`);
    }
  }

  async seedData() {
    const existingCount = await this.jobRepo.count();
    if (existingCount > 0) {
      this.logger.log('Database already populated. Skipping initial seed.');
      return;
    }

    this.logger.log('Seeding initial METRO-FIX database records...');

    // 1. Seed Customer Users & Customer Records
    const cust1User = await this.userRepo.save(
      this.userRepo.create({
        fullName: 'Eleanor Vance',
        email: 'eleanor@example.com',
        phoneNumber: '+1 (555) 019-2834',
        role: Role.CUSTOMER,
      }),
    );
    const customer1 = await this.customerRepo.save(
      this.customerRepo.create({
        userId: cust1User.id,
        facilityType: FacilityType.COMMERCIAL,
        subscriptionTier: SubscriptionTier.PREMIUM,
        latitude: 37.7749,
        longitude: -122.4194,
      }),
    );

    const cust2User = await this.userRepo.save(
      this.userRepo.create({
        fullName: 'Marcus Aurelius',
        email: 'marcus@example.com',
        phoneNumber: '+1 (555) 012-9988',
        role: Role.CUSTOMER,
      }),
    );
    const customer2 = await this.customerRepo.save(
      this.customerRepo.create({
        userId: cust2User.id,
        facilityType: FacilityType.RESIDENTIAL,
        subscriptionTier: SubscriptionTier.PLUS,
        latitude: 37.7833,
        longitude: -122.4089,
      }),
    );

    const cust3User = await this.userRepo.save(
      this.userRepo.create({
        fullName: 'Sophia Martinez',
        email: 'sophia@example.com',
        phoneNumber: '+1 (555) 018-4421',
        role: Role.CUSTOMER,
      }),
    );
    const customer3 = await this.customerRepo.save(
      this.customerRepo.create({
        userId: cust3User.id,
        facilityType: FacilityType.INDUSTRIAL,
        subscriptionTier: SubscriptionTier.BASIC,
        latitude: 37.79,
        longitude: -122.399,
      }),
    );

    // 2. Seed Worker Users & Worker Records
    const wrk1User = await this.userRepo.save(
      this.userRepo.create({
        fullName: 'Amina Yusuf',
        email: 'amina@metro-fix.com',
        phoneNumber: '+1 (555) 012-4491',
        role: Role.WORKER,
      }),
    );
    const worker1 = await this.workerRepo.save(
      this.workerRepo.create({
        userId: wrk1User.id,
        rating: 4.9,
        servicePillars: [ServicePillar.HARD, ServicePillar.STRATEGIC],
        isAvailable: true,
        activeJobs: 1,
        latitude: 37.775,
        longitude: -122.418,
      }),
    );

    const wrk2User = await this.userRepo.save(
      this.userRepo.create({
        fullName: 'Malik Thompson',
        email: 'malik@metro-fix.com',
        phoneNumber: '+1 (555) 012-7720',
        role: Role.WORKER,
      }),
    );
    const worker2 = await this.workerRepo.save(
      this.workerRepo.create({
        userId: wrk2User.id,
        rating: 4.7,
        servicePillars: [ServicePillar.SOFT],
        isAvailable: true,
        activeJobs: 1,
        latitude: 37.78,
        longitude: -122.41,
      }),
    );

    // 3. Seed Service Requests (Jobs) across 7 Kanban stages
    const seedJobs = [
      {
        title: 'HVAC Chiller Unit Maintenance',
        description: 'Compressor vibration anomaly detected during routine site audit.',
        servicePillar: ServicePillar.HARD,
        facilityType: FacilityType.COMMERCIAL,
        status: JobStatus.REQUESTED,
        customerId: customer1.id,
        workerId: null,
        latitude: 37.7749,
        longitude: -122.4194,
      },
      {
        title: 'Emergency Main Pipe Water Leak',
        description: 'Burst water pipe in basement storage area requiring urgent shutoff.',
        servicePillar: ServicePillar.HARD,
        facilityType: FacilityType.RESIDENTIAL,
        status: JobStatus.PENDING_ACCEPTANCE,
        customerId: customer2.id,
        workerId: worker1.id,
        latitude: 37.7833,
        longitude: -122.4089,
      },
      {
        title: 'Electrical Substation Compliance Audit',
        description: 'Annual high-voltage switchgear inspection and thermal imaging test.',
        servicePillar: ServicePillar.STRATEGIC,
        facilityType: FacilityType.INDUSTRIAL,
        status: JobStatus.ASSIGNED,
        customerId: customer3.id,
        workerId: worker1.id,
        latitude: 37.79,
        longitude: -122.399,
      },
      {
        title: 'Commercial Deep Sanitization Routine',
        description: 'Post-event deep sanitization and HVAC duct misting for office floors 4-8.',
        servicePillar: ServicePillar.SOFT,
        facilityType: FacilityType.COMMERCIAL,
        status: JobStatus.ON_ROUTE,
        customerId: customer1.id,
        workerId: worker2.id,
        latitude: 37.7749,
        longitude: -122.4194,
      },
      {
        title: 'Elevator Shaft Safety Inspection',
        description: 'On-site technical evaluation to issue quote for brake pad replacement.',
        servicePillar: ServicePillar.HARD,
        facilityType: FacilityType.COMMERCIAL,
        status: JobStatus.INSPECTION,
        customerId: customer1.id,
        workerId: worker1.id,
        latitude: 37.7749,
        longitude: -122.4194,
      },
      {
        title: 'Roof Solar Panel Inverter Service',
        description: 'Replacing faulty String Inverter #3 on commercial rooftop array.',
        servicePillar: ServicePillar.STRATEGIC,
        facilityType: FacilityType.INDUSTRIAL,
        status: JobStatus.IN_PROGRESS,
        customerId: customer3.id,
        workerId: worker1.id,
        latitude: 37.79,
        longitude: -122.399,
      },
      {
        title: 'Plumbing Backflow Preventer Test',
        description: 'Completed annual certification and valve replacement.',
        servicePillar: ServicePillar.HARD,
        facilityType: FacilityType.RESIDENTIAL,
        status: JobStatus.COMPLETED,
        customerId: customer2.id,
        workerId: worker2.id,
        latitude: 37.7833,
        longitude: -122.4089,
      },
    ];

    for (const jobData of seedJobs) {
      await this.jobRepo.save(this.jobRepo.create(jobData));
    }

    this.logger.log('Initial METRO-FIX database seeding complete!');
  }
}
