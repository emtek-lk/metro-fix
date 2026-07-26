import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkerEntity, ServiceRequestEntity } from '../entities';

export interface DispatchSearchResult {
  worker: WorkerEntity;
  distanceMeters: number;
  distanceKm: number;
  dispatchScore: number;
}

@Injectable()
export class WorkersService {
  constructor(
    @InjectRepository(WorkerEntity)
    private readonly workerRepo: Repository<WorkerEntity>,
    @InjectRepository(ServiceRequestEntity)
    private readonly jobRepo: Repository<ServiceRequestEntity>,
  ) {}

  async findAll(): Promise<WorkerEntity[]> {
    return this.workerRepo.find({ relations: { user: true } });
  }

  async findOne(id: string): Promise<WorkerEntity> {
    const worker = await this.workerRepo.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!worker) {
      throw new NotFoundException(`Worker with ID "${id}" not found`);
    }
    return worker;
  }

  /**
   * Dispatch Sorting Algorithm:
   * Finds available workers near the specified job location using PostGIS spatial queries.
   * Workers are sorted by a blended score combining Proximity and Worker Internal Rating (1-5).
   * Blended Score Formula: (Internal Rating * 20) - (Distance in KM)
   */
  async getAvailableWorkersForJob(
    jobId: string,
    radiusMeters: number = 50000,
  ): Promise<DispatchSearchResult[]> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Service request with ID "${jobId}" not found`);
    }

    if (!job.location || !job.location.coordinates || job.location.coordinates.length < 2) {
      // Fallback if job lacks location coordinates
      const workers = await this.workerRepo.find({
        where: { isAvailable: true },
        relations: { user: true },
        order: { rating: 'DESC' },
      });
      return workers.map((worker) => ({
        worker,
        distanceMeters: 0,
        distanceKm: 0,
        dispatchScore: worker.rating * 20,
      }));
    }

    const [lon, lat] = job.location.coordinates;

    const queryBuilder = this.workerRepo
      .createQueryBuilder('worker')
      .leftJoinAndSelect('worker.user', 'user')
      .where('worker.isAvailable = :isAvailable', { isAvailable: true })
      .addSelect(
        `ST_Distance(
          worker.location::geography,
          ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
        )`,
        'distance_meters',
      )
      .addSelect(
        `((worker.rating * 20) - (ST_Distance(worker.location::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography) / 1000))`,
        'dispatch_score',
      )
      .setParameters({ lon, lat, radiusMeters });

    if (radiusMeters > 0) {
      queryBuilder.andWhere(
        `ST_DWithin(
          worker.location::geography,
          ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
          :radiusMeters
        )`,
      );
    }

    queryBuilder.orderBy('dispatch_score', 'DESC');

    const { entities, raw } = await queryBuilder.getRawAndEntities();

    return entities.map((worker, index) => {
      const distanceMeters = parseFloat(raw[index]?.distance_meters || '0');
      const dispatchScore = parseFloat(raw[index]?.dispatch_score || `${worker.rating * 20}`);
      return {
        worker,
        distanceMeters: Math.round(distanceMeters),
        distanceKm: parseFloat((distanceMeters / 1000).toFixed(2)),
        dispatchScore: parseFloat(dispatchScore.toFixed(2)),
      };
    });
  }
}
