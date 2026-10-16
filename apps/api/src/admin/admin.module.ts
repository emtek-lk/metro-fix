import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity, ServiceRequestEntity, UserEntity, WorkerEntity } from '../entities';
import { AdminController } from './admin.controller';
import { AdminUsersService } from './admin-users.service';
import { SystemService } from './system.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, CustomerEntity, WorkerEntity, ServiceRequestEntity])],
  controllers: [AdminController],
  providers: [AdminUsersService, SystemService],
})
export class AdminModule {}
