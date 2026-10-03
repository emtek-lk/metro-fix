import { Controller, Get, Post, Body, Req, UsePipes } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { createSubscriptionSchema, CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Role } from '@metro-fix/core-types';
import { Roles } from '../auth/roles.decorator';
import { SubscriptionPlanEntity } from '../entities';

import { Public } from '../auth/public.decorator';
import { checkoutSchema, CheckoutDto } from './dto/checkout.dto';
import type { CustomerSubscription } from '@metro-fix/core-types';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get()
  async findAll(): Promise<SubscriptionPlanEntity[]> {
    return this.subscriptionsService.findAll();
  }

  /** The signed-in customer's plan, address and payment history. */
  @Roles(Role.CUSTOMER)
  @Get('me')
  async mine(@Req() req: { user: { id: string } }): Promise<CustomerSubscription> {
    return this.subscriptionsService.getMine(req.user.id);
  }

  /** Buy or change a plan with a (demo) card. */
  @Roles(Role.CUSTOMER)
  @Post('checkout')
  @UsePipes(new ZodValidationPipe(checkoutSchema))
  async checkout(@Req() req: { user: { id: string } }, @Body() dto: CheckoutDto): Promise<CustomerSubscription> {
    return this.subscriptionsService.checkout(req.user.id, dto);
  }

  @Roles(Role.ADMIN)
  @Post()
  @UsePipes(new ZodValidationPipe(createSubscriptionSchema))
  async create(@Body() dto: CreateSubscriptionDto): Promise<SubscriptionPlanEntity> {
    return this.subscriptionsService.create(dto);
  }
}
