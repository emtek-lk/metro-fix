import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRequestEntity, WorkerEntity, CustomerEntity } from '../entities';
import { AuthModule } from '../auth/auth.module';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobsGateway } from './jobs.gateway';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([ServiceRequestEntity, WorkerEntity, CustomerEntity]),
  ],
  providers: [JobsService, JobsGateway],
  controllers: [JobsController],
  exports: [JobsService, JobsGateway],
})
export class JobsModule {}
