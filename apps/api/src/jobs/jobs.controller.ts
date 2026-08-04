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
import { submitQuoteSchema, SubmitQuoteDto } from './dto/submit-quote.dto';
import { submitProofSchema, SubmitProofDto } from './dto/submit-proof.dto';

import { Public } from '../auth/public.decorator';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Public()
  @Get()
  async findAll(): Promise<ServiceRequestEntity[]> {
    return this.jobsService.findAll();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ServiceRequestEntity> {
    return this.jobsService.findOne(id);
  }

  @Public()
  @Post()
  @UsePipes(new ZodValidationPipe(createJobSchema))
  async createJob(@Body() dto: CreateJobDto): Promise<ServiceRequestEntity> {
    return this.jobsService.createJob(dto);
  }

  @Public()
  @Patch(':id/status')
  @UsePipes(new ZodValidationPipe(updateJobStatusSchema))
  async updateJobStatus(
    @Param('id') id: string,
    @Body() dto: UpdateJobStatusDto,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.updateJobStatus(id, dto);
  }

  @Public()
  @Patch(':id/assign')
  async assignWorker(
    @Param('id') id: string,
    @Body() dto: AssignWorkerDto,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.assignWorker(id, dto.workerId);
  }

  @Public()
  @Post(':id/quote')
  @UsePipes(new ZodValidationPipe(submitQuoteSchema))
  async submitQuote(
    @Param('id') id: string,
    @Body() dto: SubmitQuoteDto,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.submitJobQuote(id, dto);
  }

  @Public()
  @Post(':id/proof')
  @UsePipes(new ZodValidationPipe(submitProofSchema))
  async submitProof(
    @Param('id') id: string,
    @Body() dto: SubmitProofDto,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.submitJobProof(id, dto);
  }
}
