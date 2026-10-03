import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UsePipes,
  ForbiddenException,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { ServiceRequestEntity, UserEntity } from '../entities';
import {
  updateJobStatusSchema,
  UpdateJobStatusDto,
} from './dto/update-job-status.dto';
import { createJobSchema, CreateJobDto } from './dto/create-job.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

import { AssignWorkerDto } from './dto/assign-worker.dto';
import { submitQuoteSchema, SubmitQuoteDto } from './dto/submit-quote.dto';
import { submitProofSchema, SubmitProofDto } from './dto/submit-proof.dto';

import { Role } from '@metro-fix/core-types';
import { rejectJobSchema, RejectJobDto } from './dto/reject-job.dto';
import { Roles } from '../auth/roles.decorator';

type AuthedRequest = { user: UserEntity };

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Roles(Role.ADMIN, Role.CUSTOMER_CARE, Role.WORKER)
  @Get()
  async findAll(): Promise<ServiceRequestEntity[]> {
    return this.jobsService.findAll();
  }

  /** Jobs raised by the logged-in customer (customer portal "My requests"). */
  @Roles(Role.CUSTOMER)
  @Get('mine')
  async findMine(@Req() req: AuthedRequest): Promise<ServiceRequestEntity[]> {
    return this.jobsService.findForCustomerUser(req.user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthedRequest,
  ): Promise<ServiceRequestEntity> {
    const job = await this.jobsService.findOne(id);
    if (req.user.role === Role.CUSTOMER && job.customer?.userId !== req.user.id) {
      throw new ForbiddenException('You do not have access to this request.');
    }
    return job;
  }

  /** Customers always create jobs for themselves; staff may raise one on behalf of a customer. */
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.CUSTOMER_CARE)
  @Post()
  @UsePipes(new ZodValidationPipe(createJobSchema))
  async createJob(
    @Body() dto: CreateJobDto,
    @Req() req: AuthedRequest,
  ): Promise<ServiceRequestEntity> {
    if (req.user.role === Role.CUSTOMER) {
      return this.jobsService.createJob({ ...dto, customerId: req.user.id });
    }
    return this.jobsService.createJob(dto);
  }

  @Roles(Role.ADMIN, Role.CUSTOMER_CARE, Role.WORKER)
  @Patch(':id/status')
  @UsePipes(new ZodValidationPipe(updateJobStatusSchema))
  async updateJobStatus(
    @Param('id') id: string,
    @Body() dto: UpdateJobStatusDto,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.updateJobStatus(id, dto);
  }

  @Roles(Role.ADMIN, Role.CUSTOMER_CARE)
  @Patch(':id/assign')
  async assignWorker(
    @Param('id') id: string,
    @Body() dto: AssignWorkerDto,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.assignWorker(id, dto.workerId);
  }

  @Roles(Role.WORKER, Role.ADMIN)
  @Post(':id/quote')
  @UsePipes(new ZodValidationPipe(submitQuoteSchema))
  async submitQuote(
    @Param('id') id: string,
    @Body() dto: SubmitQuoteDto,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.submitJobQuote(id, dto);
  }

  @Roles(Role.WORKER, Role.ADMIN)
  @Post(':id/proof')
  @UsePipes(new ZodValidationPipe(submitProofSchema))
  async submitProof(
    @Param('id') id: string,
    @Body() dto: SubmitProofDto,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.submitJobProof(id, dto);
  }

  @Roles(Role.WORKER, Role.ADMIN)
  @Post(':id/reject')
  @UsePipes(new ZodValidationPipe(rejectJobSchema))
  async rejectJob(
    @Param('id') id: string,
    @Body() dto: RejectJobDto,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.rejectJob(id, dto);
  }

  @Roles(Role.ADMIN, Role.CUSTOMER_CARE)
  @Post(':id/close')
  async closeJob(@Param('id') id: string): Promise<ServiceRequestEntity> {
    return this.jobsService.closeJob(id);
  }
}
