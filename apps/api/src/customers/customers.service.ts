import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, SubscriptionTier } from '@metro-fix/core-types';
import { CustomerEntity, UserEntity } from '../entities';
import { CreateCustomerDto } from './dto/create-customer.dto';

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
    // Placeholder returning standard default coordinates for site location
    return {
      latitude: 37.7749,
      longitude: -122.4194,
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
      subscriptionTier: dto.subscriptionTier || SubscriptionTier.BASIC,
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    const savedCustomer = await this.customerRepo.save(customer);
    return this.findOne(savedCustomer.id);
  }
}
