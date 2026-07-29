import { Controller, Get, Post, Body } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionPlanEntity } from '../entities';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  async findAll(): Promise<SubscriptionPlanEntity[]> {
    return this.subscriptionsService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateSubscriptionDto): Promise<SubscriptionPlanEntity> {
    return this.subscriptionsService.create(dto);
  }
}
