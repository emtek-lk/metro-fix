import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
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
    const defaultPassword = await bcrypt.hash('Password123!', 10);

    // Ensure all seed users exist with valid hashed passwords
    const usersToSeed = [
      {
        fullName: 'Omar Hassan',
        email: 'omar@metro-fix.com',
        phoneNumber: '+1 (555) 019-9988',
        role: Role.WORKER,
        isWorkerProfile: true,
      },
      {
        fullName: 'System Administrator',
        email: 'admin@metro-fix.com',
        phoneNumber: '+1 (555) 000-0000',
        role: Role.ADMIN,
        isWorkerProfile: false,
      },
      {
        fullName: 'Amina Yusuf',
        email: 'amina@metro-fix.com',
        phoneNumber: '+1 (555) 012-4491',
        role: Role.WORKER,
        isWorkerProfile: true,
      },
      {
        fullName: 'Malik Thompson',
        email: 'malik@metro-fix.com',
        phoneNumber: '+1 (555) 012-7720',
        role: Role.WORKER,
        isWorkerProfile: true,
      },
    ];

    for (const u of usersToSeed) {
      let user = await this.userRepo.findOne({ where: { email: u.email } });
      if (!user) {
        user = await this.userRepo.save(
          this.userRepo.create({
            fullName: u.fullName,
            email: u.email,
            password: defaultPassword,
            phoneNumber: u.phoneNumber,
            role: u.role,
          }),
        );
      } else {
        user.password = defaultPassword;
        await this.userRepo.save(user);
      }

      if (u.isWorkerProfile) {
        const existingWorker = await this.workerRepo.findOne({ where: { userId: user.id } });
        if (!existingWorker) {
          await this.workerRepo.save(
            this.workerRepo.create({
              userId: user.id,
              rating: 5.0,
              servicePillars: [ServicePillar.HARD, ServicePillar.SOFT, ServicePillar.STRATEGIC],
              isAvailable: true,
              activeJobs: 1,
              latitude: 37.7749,
              longitude: -122.4194,
            }),
          );
        }
      }
    }

    const omarUser = await this.userRepo.findOne({ where: { email: 'omar@metro-fix.com' } });
    const omarWorker = await this.workerRepo.findOne({ where: { userId: omarUser?.id } });

    const existingCount = await this.jobRepo.count();
    if (existingCount > 0) {
      if (omarWorker) {
        // Re-assign all jobs to Omar worker so his mobile dashboard shows active tasks
        const unassignedJobs = await this.jobRepo.find();
        for (const j of unassignedJobs) {
          if (!j.workerId) {
            j.workerId = omarWorker.id;
            await this.jobRepo.save(j);
          }
        }
      }
      this.logger.log('Database users synced & jobs assigned. Skipping initial job seed.');
      return;
    }

    this.logger.log('Seeding initial METRO-FIX database records...');

    // Seed Customer Users & Customer Records
    const cust1User = await this.userRepo.save(
      this.userRepo.create({
        fullName: 'Eleanor Vance',
        email: 'eleanor@example.com',
        password: defaultPassword,
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
        password: defaultPassword,
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
        password: defaultPassword,
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

    const aminaUser = await this.userRepo.findOne({ where: { email: 'amina@metro-fix.com' } });
    const aminaWorker = await this.workerRepo.findOne({ where: { userId: aminaUser?.id } });

    // Seed Service Requests (Jobs)
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
        workerId: omarWorker?.id || null,
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
        workerId: omarWorker?.id || null,
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
        workerId: aminaWorker?.id || null,
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
        workerId: omarWorker?.id || null,
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
        workerId: omarWorker?.id || null,
        latitude: 37.79,
        longitude: -122.399,
      },
    ];

    for (const jobData of seedJobs) {
      await this.jobRepo.save(this.jobRepo.create(jobData));
    }

    this.logger.log('Initial METRO-FIX database seeding complete!');
  }
}
