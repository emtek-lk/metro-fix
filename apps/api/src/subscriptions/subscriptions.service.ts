import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionTier, type CustomerSubscription } from '@metro-fix/core-types';
import { CustomerEntity, SubscriptionPaymentEntity, SubscriptionPlanEntity } from '../entities';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { CARD_PAYMENT_GATEWAY, type CardPaymentGateway } from '../payments/demo-card-gateway';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlanEntity)
    private readonly planRepo: Repository<SubscriptionPlanEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
    @InjectRepository(SubscriptionPaymentEntity)
    private readonly paymentRepo: Repository<SubscriptionPaymentEntity>,
    @Inject(CARD_PAYMENT_GATEWAY)
    private readonly gateway: CardPaymentGateway,
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

  private async customerForUser(userId: string): Promise<CustomerEntity> {
    const customer = await this.customerRepo.findOne({ where: { userId } });
    if (!customer) throw new NotFoundException('No customer profile for this account.');
    return customer;
  }

  /** The signed-in customer's plan (null tier = not subscribed yet), address and recent payments. */
  async getMine(userId: string): Promise<CustomerSubscription> {
    const customer = await this.customerForUser(userId);
    const payments = await this.paymentRepo.find({
      where: { customerId: customer.id },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    return {
      tier: customer.subscriptionTier ?? null,
      billingCycle: customer.billingCycle ?? null,
      subscribedAt: customer.subscribedAt ? customer.subscribedAt.toISOString() : null,
      address: customer.address ?? null,
      payments: payments.map((payment) => ({
        id: payment.id,
        tier: payment.tier,
        billingCycle: payment.billingCycle,
        amountLkr: payment.amountLkr,
        cardBrand: payment.cardBrand,
        cardLast4: payment.cardLast4,
        status: payment.status,
        reference: payment.reference,
        createdAt: payment.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Buys or changes a plan with a (demo) card. Upgrades and downgrades are the same call: the new
   * plan applies at once and the card is charged the new plan's price.
   */
  async checkout(userId: string, dto: CheckoutDto): Promise<CustomerSubscription> {
    const customer = await this.customerForUser(userId);
    const plan = await this.planRepo.findOne({ where: { tierName: dto.tier, status: 'Active' } });
    if (!plan) throw new NotFoundException('That plan is not available.');
    if (plan.isCustomPriced) {
      throw new BadRequestException(`${plan.tierName} is custom priced. Please contact us for a quote.`);
    }
    const amount = dto.billingCycle === 'ANNUAL' ? plan.annualFeeLkr : plan.monthlyFeeLkr;
    if (amount === null || amount === undefined) {
      throw new BadRequestException('That plan is not offered with this billing cycle.');
    }
    if (customer.subscriptionTier === dto.tier && customer.billingCycle === dto.billingCycle) {
      throw new BadRequestException('You are already on this plan.');
    }

    const result = await this.gateway.charge({
      amountLkr: amount,
      card: dto.card,
      description: `MetroFix ${plan.tierName} (${dto.billingCycle.toLowerCase()})`,
    });

    await this.paymentRepo.save(
      this.paymentRepo.create({
        customerId: customer.id,
        tier: dto.tier,
        billingCycle: dto.billingCycle,
        amountLkr: amount,
        cardBrand: result.brand,
        cardLast4: result.last4,
        status: result.ok ? 'SUCCEEDED' : 'DECLINED',
        reference: result.reference,
      }),
    );

    if (!result.ok) {
      throw new HttpException({ statusCode: HttpStatus.PAYMENT_REQUIRED, message: result.reason }, HttpStatus.PAYMENT_REQUIRED);
    }

    customer.subscriptionTier = dto.tier as SubscriptionTier;
    customer.billingCycle = dto.billingCycle;
    customer.subscribedAt = new Date();
    await this.customerRepo.save(customer);
    return this.getMine(userId);
  }
}
