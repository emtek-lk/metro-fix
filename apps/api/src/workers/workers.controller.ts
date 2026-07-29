import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { WorkersService, DispatchSearchResult } from './workers.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { WorkerEntity } from '../entities';

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  async findAll(): Promise<WorkerEntity[]> {
    return this.workersService.findAll();
  }

  @Post()
  async createWorker(@Body() dto: CreateWorkerDto): Promise<WorkerEntity> {
    return this.workersService.createWorker(dto);
  }

  @Post('ping')
  async pingWorkers() {
    return this.workersService.pingAllWorkers();
  }

  @Get('dispatch-search')
  async getAvailableWorkersForJob(
    @Query('jobId') jobId: string,
    @Query('radius', new DefaultValuePipe(50000), ParseIntPipe) radius: number,
  ): Promise<DispatchSearchResult[]> {
    return this.workersService.getAvailableWorkersForJob(jobId, radius);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<WorkerEntity> {
    return this.workersService.findOne(id);
  }
}

@Controller('users')
export class UsersController {
  constructor(private readonly workersService: WorkersService) {}

  @Post()
  async createUser(@Body() dto: CreateWorkerDto): Promise<WorkerEntity> {
    return this.workersService.createWorker(dto);
  }
}
