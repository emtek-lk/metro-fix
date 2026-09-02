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
} from '../entities';
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
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Starting seed process...');

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
        role: Role.WORKER,
      },
      {
        fullName: 'Priya Sharma',
        email: 'worker2@demo.local',
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
        await this.userRepository.save(user);
        this.logger.log(`Updated password for: ${data.email}`);
      }
      users[data.email] = user;
    }

    const jobCount = await this.jobRepository.count();
    if (jobCount > 0) {
      this.logger.log('Data already seeded. Skipping seed process.');
      return;
    }

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

    const customersData = [
      {
        user: { fullName: 'Eleanor Vance', email: 'eleanor@skylinetowers.com', role: Role.CUSTOMER, password },
        facilityType: FacilityType.COMMERCIAL,
        subscriptionTier: SubscriptionTier.PREMIUM,
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
        subscriptionTier: SubscriptionTier.BASIC,
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

    const catalogData = [
      {
        serviceName: 'HVAC System Maintenance',
        pillarCategory: ServicePillar.HARD,
        basePrice: '$850.00',
        requiredSubscriptionTier: SubscriptionTier.BASIC,
      },
      {
        serviceName: 'Commercial Deep Sanitization',
        pillarCategory: ServicePillar.SOFT,
        basePrice: '$450.00',
        requiredSubscriptionTier: SubscriptionTier.PLUS,
      },
      {
        serviceName: 'Electrical Compliance Audit',
        pillarCategory: ServicePillar.STRATEGIC,
        basePrice: '$1,200.00',
        requiredSubscriptionTier: SubscriptionTier.PREMIUM,
      },
    ];

    for (const data of catalogData) {
       let catalog = await this.catalogRepository.findOne({ where: { serviceName: data.serviceName } });
       if (!catalog) {
           await this.catalogRepository.save(this.catalogRepository.create(data as Partial<ServiceCatalogEntity>));
       }
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
