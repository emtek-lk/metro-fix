import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, SubscriptionTier } from '@metro-fix/core-types';
import { CustomerEntity, UserEntity } from '../entities';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findAll(): Promise<CustomerEntity[]> {
    return this.customerRepo.find({
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<CustomerEntity> {
    const customer = await this.customerRepo.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }
    return customer;
  }

  /**
   * Service placeholder for Geocoding text address into PostGIS Point coordinates.
   * In production, this calls Google Maps Geocoding API / Nominatim service.
   */
  async geocodeAddress(
    address: string,
  ): Promise<{ latitude: number; longitude: number }> {
    console.log(`[GeocodingService] Geocoding address: "${address}"`);
    // Placeholder: the centre of Colombo until a geocoding provider is connected.
    return {
      latitude: 6.9271,
      longitude: 79.8612,
    };
  }

  /**
   * Manually creates a new Customer profile (e.g. for phone-in clients).
   * 1. Creates UserEntity (Role = Role.CUSTOMER).
   * 2. Geocodes physicalAddress into PostGIS Point coordinates.
   * 3. Creates CustomerEntity with facilityType & subscriptionTier.
   */
  async createCustomer(dto: CreateCustomerDto): Promise<CustomerEntity> {
    const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existingUser) {
      throw new ConflictException(`User with email "${dto.email}" already exists.`);
    }

    // 1. Create Base User
    const user = this.userRepo.create({
      fullName: dto.fullName,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      role: Role.CUSTOMER,
    });
    const savedUser = await this.userRepo.save(user);

    // 2. Geocode Physical Address to PostGIS Point
    const coords = await this.geocodeAddress(dto.physicalAddress);

    // 3. Create Customer Record
    const customer = this.customerRepo.create({
      userId: savedUser.id,
      user: savedUser,
      facilityType: dto.facilityType,
      subscriptionTier: dto.subscriptionTier || SubscriptionTier.ACCESS,
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    const savedCustomer = await this.customerRepo.save(customer);
    return this.findOne(savedCustomer.id);
  }

  /**
   * Admin edit of a customer's contact details, company, address, facility and plan. Changing the
   * email changes their login, so it must stay unique. Setting a plan here records no payment (it is
   * how support comps a plan); clearing it turns the customer back into a lead.
   */
  async updateCustomer(id: string, dto: UpdateCustomerDto): Promise<CustomerEntity> {
    const customer = await this.findOne(id);

    if (dto.email !== undefined && dto.email !== customer.user.email) {
      const taken = await this.userRepo.findOne({ where: { email: dto.email } });
      if (taken && taken.id !== customer.user.id) {
        throw new ConflictException(`Another account already uses "${dto.email}".`);
      }
      customer.user.email = dto.email;
    }
    if (dto.fullName !== undefined) customer.user.fullName = dto.fullName;
    if (dto.phoneNumber !== undefined) customer.user.phoneNumber = dto.phoneNumber;
    await this.userRepo.save(customer.user);

    if (dto.companyName !== undefined) customer.companyName = dto.companyName || null;
    if (dto.address !== undefined) customer.address = dto.address || null;
    if (dto.facilityType !== undefined) customer.facilityType = dto.facilityType;
    if (dto.subscriptionTier !== undefined) {
      const changed = dto.subscriptionTier !== (customer.subscriptionTier ?? null);
      customer.subscriptionTier = dto.subscriptionTier;
      if (dto.subscriptionTier === null) {
        customer.billingCycle = null;
        customer.subscribedAt = null;
      } else {
        customer.billingCycle = dto.billingCycle ?? customer.billingCycle ?? 'MONTHLY';
        if (changed || !customer.subscribedAt) customer.subscribedAt = new Date();
      }
    } else if (dto.billingCycle !== undefined && customer.subscriptionTier) {
      customer.billingCycle = dto.billingCycle;
    }
    await this.customerRepo.save(customer);
    return this.findOne(id);
  }
}
