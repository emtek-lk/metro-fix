import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { WorkersService, DispatchSearchResult } from './workers.service';
import { WorkerEntity } from '../entities';

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  async findAll(): Promise<WorkerEntity[]> {
    return this.workersService.findAll();
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
