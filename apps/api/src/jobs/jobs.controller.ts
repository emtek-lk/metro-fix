import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UsePipes,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { ServiceRequestEntity } from '../entities';
import {
  updateJobStatusSchema,
  UpdateJobStatusDto,
} from './dto/update-job-status.dto';
import { createJobSchema, CreateJobDto } from './dto/create-job.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

import { AssignWorkerDto } from './dto/assign-worker.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async findAll(): Promise<ServiceRequestEntity[]> {
    return this.jobsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ServiceRequestEntity> {
    return this.jobsService.findOne(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createJobSchema))
  async createJob(@Body() dto: CreateJobDto): Promise<ServiceRequestEntity> {
    return this.jobsService.createJob(dto);
  }

  @Patch(':id/status')
  @UsePipes(new ZodValidationPipe(updateJobStatusSchema))
  async updateJobStatus(
    @Param('id') id: string,
    @Body() dto: UpdateJobStatusDto,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.updateJobStatus(id, dto);
  }

  @Patch(':id/assign')
  async assignWorker(
    @Param('id') id: string,
    @Body() dto: AssignWorkerDto,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.assignWorker(id, dto.workerId);
  }
}
