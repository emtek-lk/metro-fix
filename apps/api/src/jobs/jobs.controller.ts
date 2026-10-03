import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UsePipes,
} from '@nestjs/common';
import { JobsService, type Actor } from './jobs.service';
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
import { cancelJobSchema, CancelJobDto } from './dto/cancel-job.dto';
import { declineOfferSchema, DeclineOfferDto } from './dto/decline-offer.dto';
import { Roles } from '../auth/roles.decorator';
import { jobCardSectionSchema, type JobCardSectionInput } from './dto/job-card.dto';

type AuthedRequest = { user: UserEntity };

const actorOf = (req: AuthedRequest): Actor => ({ id: req.user.id, role: req.user.role });

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /** The full job list is for dispatch. Workers read their own queue from /workers/me/jobs. */
  @Roles(Role.ADMIN, Role.CUSTOMER_CARE)
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
    return this.jobsService.findOneFor(id, actorOf(req));
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
    @Req() req: AuthedRequest,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.updateJobStatus(id, dto, actorOf(req));
  }

  /** Dispatch offers a job to one worker (REQUESTED -> PENDING_ACCEPTANCE), starting the countdown. */
  @Roles(Role.ADMIN, Role.CUSTOMER_CARE)
  @Post(':id/offer')
  async offerWorker(
    @Param('id') id: string,
    @Body() dto: AssignWorkerDto,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.offerWorker(id, dto.workerId);
  }

  /** Same as POST :id/offer; the original name, kept so existing clients keep working. */
  @Roles(Role.ADMIN, Role.CUSTOMER_CARE)
  @Patch(':id/assign')
  async assignWorker(
    @Param('id') id: string,
    @Body() dto: AssignWorkerDto,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.offerWorker(id, dto.workerId);
  }

  /** The offered worker accepts (PENDING_ACCEPTANCE -> ASSIGNED). */
  @Roles(Role.WORKER)
  @Post(':id/accept')
  async acceptOffer(
    @Param('id') id: string,
    @Req() req: AuthedRequest,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.acceptOffer(id, actorOf(req));
  }

  /** The offered worker declines (PENDING_ACCEPTANCE -> REQUESTED). */
  @Roles(Role.WORKER)
  @Post(':id/decline')
  @UsePipes(new ZodValidationPipe(declineOfferSchema))
  async declineOffer(
    @Param('id') id: string,
    @Body() dto: DeclineOfferDto,
    @Req() req: AuthedRequest,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.declineOffer(id, dto, actorOf(req));
  }

  @Roles(Role.WORKER, Role.ADMIN)
  @Post(':id/quote')
  @UsePipes(new ZodValidationPipe(submitQuoteSchema))
  async submitQuote(
    @Param('id') id: string,
    @Body() dto: SubmitQuoteDto,
    @Req() req: AuthedRequest,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.submitJobQuote(id, dto, actorOf(req));
  }

  @Roles(Role.WORKER, Role.ADMIN)
  @Post(':id/proof')
  @UsePipes(new ZodValidationPipe(submitProofSchema))
  async submitProof(
    @Param('id') id: string,
    @Body() dto: SubmitProofDto,
    @Req() req: AuthedRequest,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.submitJobProof(id, dto, actorOf(req));
  }

  /** Dispatch corrects the final job card before closing (hours, items, prices). */
  @Roles(Role.ADMIN, Role.CUSTOMER_CARE)
  @Patch(':id/job-card')
  @UsePipes(new ZodValidationPipe(jobCardSectionSchema))
  async updateJobCard(
    @Param('id') id: string,
    @Body() dto: JobCardSectionInput,
    @Req() req: AuthedRequest,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.updateFinalCard(id, dto, actorOf(req));
  }

  /** A worker who already accepted hands the job back. */
  @Roles(Role.WORKER, Role.ADMIN)
  @Post(':id/reject')
  @UsePipes(new ZodValidationPipe(rejectJobSchema))
  async rejectJob(
    @Param('id') id: string,
    @Body() dto: RejectJobDto,
    @Req() req: AuthedRequest,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.rejectJob(id, dto, actorOf(req));
  }

  @Roles(Role.ADMIN, Role.CUSTOMER_CARE)
  @Post(':id/close')
  async closeJob(@Param('id') id: string): Promise<ServiceRequestEntity> {
    return this.jobsService.closeJob(id);
  }

  /** Cancels a job before work starts. Customers can cancel their own; dispatch can cancel any. */
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.CUSTOMER_CARE)
  @Post(':id/cancel')
  @UsePipes(new ZodValidationPipe(cancelJobSchema))
  async cancelJob(
    @Param('id') id: string,
    @Body() dto: CancelJobDto,
    @Req() req: AuthedRequest,
  ): Promise<ServiceRequestEntity> {
    return this.jobsService.cancelJob(id, dto, actorOf(req));
  }
}
