import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  UserEntity,
  WorkerEntity,
  CustomerEntity,
  ServiceRequestEntity,
} from './entities';
import { WorkersModule } from './workers/workers.module';
import { JobsModule } from './jobs/jobs.module';
import { CustomersModule } from './customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'metrofix',
      entities: [
        UserEntity,
        WorkerEntity,
        CustomerEntity,
        ServiceRequestEntity,
      ],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    WorkersModule,
    JobsModule,
    CustomersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
