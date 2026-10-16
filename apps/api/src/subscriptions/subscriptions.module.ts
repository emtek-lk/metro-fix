import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity, SubscriptionPaymentEntity, SubscriptionPlanEntity } from '../entities';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { CARD_PAYMENT_GATEWAY, DemoCardGateway } from '../payments/demo-card-gateway';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPlanEntity, CustomerEntity, SubscriptionPaymentEntity])],
  providers: [SubscriptionsService, { provide: CARD_PAYMENT_GATEWAY, useClass: DemoCardGateway }],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
