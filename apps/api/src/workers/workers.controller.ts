import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  UsePipes,
} from '@nestjs/common';
import { WorkersService, DispatchSearchResult } from './workers.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { WorkerEntity, UserEntity } from '../entities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { registerPushTokenSchema, RegisterPushTokenDto } from './dto/register-push-token.dto';
import { updateWorkerLocationSchema, UpdateWorkerLocationDto } from './dto/update-worker-location.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

import { Public } from '../auth/public.decorator';

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Public()
  @Get()
  async findAll(): Promise<WorkerEntity[]> {
    return this.workersService.findAll();
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
