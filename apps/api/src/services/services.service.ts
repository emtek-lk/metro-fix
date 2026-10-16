import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCatalogEntity } from '../entities';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceCatalogEntity)
    private readonly catalogRepo: Repository<ServiceCatalogEntity>,
  ) {}

  async findAll(): Promise<ServiceCatalogEntity[]> {
    return this.catalogRepo.find({ order: { sortOrder: 'ASC', serviceName: 'ASC' } });
  }

  async create(dto: CreateServiceDto): Promise<ServiceCatalogEntity> {
    const item = this.catalogRepo.create({ ...dto, status: dto.status || 'Active' });
    return this.catalogRepo.save(item);
  }
}
