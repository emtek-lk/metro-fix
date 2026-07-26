import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkerEntity, ServiceRequestEntity } from '../entities';
import { WorkersService } from './workers.service';
import { WorkersController } from './workers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WorkerEntity, ServiceRequestEntity])],
  providers: [WorkersService],
  controllers: [WorkersController],
  exports: [WorkersService],
})
export class WorkersModule {}
