import { Controller, Get, Post, Body, UsePipes } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { createSubscriptionSchema, CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Role } from '@metro-fix/core-types';
import { Roles } from '../auth/roles.decorator';
import { SubscriptionPlanEntity } from '../entities';

import { Public } from '../auth/public.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get()
  async findAll(): Promise<SubscriptionPlanEntity[]> {
    return this.subscriptionsService.findAll();
  }

  @Roles(Role.ADMIN)
  @Post()
  @UsePipes(new ZodValidationPipe(createSubscriptionSchema))
  async create(@Body() dto: CreateSubscriptionDto): Promise<SubscriptionPlanEntity> {
    return this.subscriptionsService.create(dto);
  }
}
