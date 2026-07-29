import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRequestEntity } from '../entities';
import { FinancialsService } from './financials.service';
import { FinancialsController } from './financials.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceRequestEntity])],
  providers: [FinancialsService],
  controllers: [FinancialsController],
  exports: [FinancialsService],
})
export class FinancialsModule {}
