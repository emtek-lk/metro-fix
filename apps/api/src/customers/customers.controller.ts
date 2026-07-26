import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UsePipes,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerEntity } from '../entities';
import {
  createCustomerSchema,
  CreateCustomerDto,
} from './dto/create-customer.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(): Promise<CustomerEntity[]> {
    return this.customersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CustomerEntity> {
    return this.customersService.findOne(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createCustomerSchema))
  async createCustomer(
    @Body() dto: CreateCustomerDto,
  ): Promise<CustomerEntity> {
    return this.customersService.createCustomer(dto);
  }
}
