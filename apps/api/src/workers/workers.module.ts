import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkerEntity, ServiceRequestEntity, UserEntity } from '../entities';
import { WorkersService } from './workers.service';
import { WorkersController, UsersController } from './workers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WorkerEntity, ServiceRequestEntity, UserEntity])],
  providers: [WorkersService],
  controllers: [WorkersController, UsersController],
  exports: [WorkersService],
})
export class WorkersModule {}
