import { Controller, Get, Post, Body } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceCatalogEntity } from '../entities';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async findAll(): Promise<ServiceCatalogEntity[]> {
    return this.servicesService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateServiceDto): Promise<ServiceCatalogEntity> {
    return this.servicesService.create(dto);
  }
}
