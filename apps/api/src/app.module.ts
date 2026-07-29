import * as dotenv from 'dotenv';
dotenv.config();

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  UserEntity,
  WorkerEntity,
  CustomerEntity,
  ServiceRequestEntity,
  ServiceCatalogEntity,
  SubscriptionPlanEntity,
} from './entities';
import { WorkersModule } from './workers/workers.module';
import { JobsModule } from './jobs/jobs.module';
import { CustomersModule } from './customers/customers.module';
import { ServicesModule } from './services/services.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { FinancialsModule } from './financials/financials.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { SeedService } from './common/seed.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '1433', 10),
      username: process.env.DB_USERNAME || 'sa',
      password: process.env.DB_PASSWORD || 'YourPassword123!',
      database: process.env.DB_NAME || 'metrofix_db',
      options: {
        trustServerCertificate: true,
        encrypt: false,
      },
      entities: [
        UserEntity,
        WorkerEntity,
        CustomerEntity,
        ServiceRequestEntity,
        ServiceCatalogEntity,
        SubscriptionPlanEntity,
      ],
      synchronize: process.env.DB_SYNCHRONIZE === 'true' || process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      WorkerEntity,
      CustomerEntity,
      ServiceRequestEntity,
      ServiceCatalogEntity,
      SubscriptionPlanEntity,
    ]),
    AuthModule,
    WorkersModule,
    JobsModule,
    CustomersModule,
    ServicesModule,
    SubscriptionsModule,
    FinancialsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SeedService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
