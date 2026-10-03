import { Controller, Get, Post, Body, UsePipes } from '@nestjs/common';
import { ServicesService } from './services.service';
import { createServiceSchema, CreateServiceDto } from './dto/create-service.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Role } from '@metro-fix/core-types';
import { Roles } from '../auth/roles.decorator';
import { ServiceCatalogEntity } from '../entities';

import { Public } from '../auth/public.decorator';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Public()
  @Get()
  async findAll(): Promise<ServiceCatalogEntity[]> {
    return this.servicesService.findAll();
  }

  @Roles(Role.ADMIN)
  @Post()
  @UsePipes(new ZodValidationPipe(createServiceSchema))
  async create(@Body() dto: CreateServiceDto): Promise<ServiceCatalogEntity> {
    return this.servicesService.create(dto);
  }
}
