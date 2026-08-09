import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRequestEntity, WorkerEntity, CustomerEntity } from '../entities';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobsGateway } from './jobs.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceRequestEntity, WorkerEntity, CustomerEntity]),
  ],
  providers: [JobsService, JobsGateway],
  controllers: [JobsController],
  exports: [JobsService, JobsGateway],
})
export class JobsModule {}
