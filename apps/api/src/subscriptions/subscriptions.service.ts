import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlanEntity } from '../entities';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlanEntity)
    private readonly planRepo: Repository<SubscriptionPlanEntity>,
  ) {}

  async findAll(): Promise<SubscriptionPlanEntity[]> {
    return this.planRepo.find({ order: { monthlyFeeLkr: 'ASC' } });
  }

  async create(dto: CreateSubscriptionDto): Promise<SubscriptionPlanEntity> {
    const item = this.planRepo.create({
      ...dto,
      includedServices: dto.includedServices || 'Comprehensive Facility Service Tier',
      activeAccounts: 0,
      status: dto.status || 'Active',
    });
    return this.planRepo.save(item);
  }
}
