import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  UsePipes,
} from '@nestjs/common';
import { WorkersService, DispatchSearchResult, WorkerStats } from './workers.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { updateWorkerSchema, UpdateWorkerDto } from './dto/update-worker.dto';
import { WorkerEntity, UserEntity } from '../entities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { registerPushTokenSchema, RegisterPushTokenDto } from './dto/register-push-token.dto';
import { updateWorkerLocationSchema, UpdateWorkerLocationDto } from './dto/update-worker-location.dto';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

import { Role } from '@metro-fix/core-types';
import { Roles } from '../auth/roles.decorator';

const updateAvailabilitySchema = z.object({ isAvailable: z.boolean() });

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Roles(Role.ADMIN, Role.CUSTOMER_CARE)
  @Get()
  async findAll() {
    return this.workersService.findAll();
  }

  /** The signed-in worker's own profile (rating, service pillars, availability). */
  @Roles(Role.WORKER)
  @Get('me')
  async getMe(@Req() req: any): Promise<WorkerEntity> {
    return this.workersService.findWorkerForUser(req.user?.id);
  }

  /** Counts for the worker's Profile screen. */
  @Roles(Role.WORKER)
  @Get('me/stats')
  async getMyStats(@Req() req: any): Promise<WorkerStats> {
    return this.workersService.getStatsForUser(req.user?.id);
  }

  /** The worker's on-duty switch (Profile screen). */
  @Roles(Role.WORKER)
  @Patch('me/availability')
  @UsePipes(new ZodValidationPipe(updateAvailabilitySchema))
  async setMyAvailability(@Req() req: any, @Body() dto: { isAvailable: boolean }): Promise<WorkerEntity> {
    return this.workersService.setAvailability(req.user?.id, dto.isAvailable);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/jobs')
  async getMyJobs(@Req() req: any) {
    const userId = req.user?.id;
    return this.workersService.findJobsForWorkerUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/location')
  @UsePipes(new ZodValidationPipe(updateWorkerLocationSchema))
  async updateMyLocation(@Req() req: any, @Body() dto: UpdateWorkerLocationDto) {
    const userId = req.user?.id;
    return this.workersService.updateWorkerLocation(userId, dto);
  }

  @Roles(Role.ADMIN)
  @Post()
  async createWorker(@Body() dto: CreateWorkerDto): Promise<WorkerEntity> {
    return this.workersService.createWorker(dto);
  }

  @Roles(Role.ADMIN, Role.CUSTOMER_CARE)
  @Post('ping')
  async pingWorkers() {
    return this.workersService.pingAllWorkers();
  }

  @Roles(Role.ADMIN, Role.CUSTOMER_CARE)
  @Get('dispatch-search')
  async getAvailableWorkersForJob(
    @Query('jobId') jobId: string,
    @Query('radius', new ParseIntPipe({ optional: true })) radius?: number,
    @Query('includeUnavailable') includeUnavailable?: string,
  ): Promise<DispatchSearchResult[]> {
    return this.workersService.getAvailableWorkersForJob(jobId, radius, includeUnavailable === 'true');
  }

  /** Admin edits a worker's details, rating, services and duty status. */
  @Roles(Role.ADMIN)
  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateWorkerSchema))
  async updateWorker(@Param('id') id: string, @Body() dto: UpdateWorkerDto): Promise<WorkerEntity> {
    return this.workersService.updateWorker(id, dto);
  }

  @Roles(Role.ADMIN, Role.CUSTOMER_CARE)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<WorkerEntity> {
    return this.workersService.findOne(id);
  }
}

@Controller('users')
export class UsersController {
  constructor(private readonly workersService: WorkersService) {}

  @Roles(Role.ADMIN)
  @Post()
  async createUser(@Body() dto: CreateWorkerDto): Promise<WorkerEntity> {
    return this.workersService.createWorker(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/push-token')
  @UsePipes(new ZodValidationPipe(registerPushTokenSchema))
  async registerPushToken(
    @Req() req: any,
    @Body() dto: RegisterPushTokenDto,
  ): Promise<UserEntity> {
    const userId = req.user?.id;
    return this.workersService.updatePushToken(userId, dto.pushToken);
  }
}
