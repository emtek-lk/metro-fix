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
   * Calculate distance between two lat/long points in kilometers using Haversine formula
   */
  private calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Dispatch Sorting Algorithm:
   * Finds available workers near the specified job location.
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

    const workers = await this.workerRepo.find({
      where: { isAvailable: true },
      relations: { user: true },
    });

    const jobLat = job.latitude ?? 37.7749;
    const jobLon = job.longitude ?? -122.4194;

    const results: DispatchSearchResult[] = workers.map((worker) => {
      const wLat = worker.latitude ?? jobLat;
      const wLon = worker.longitude ?? jobLon;
      const distanceKm = this.calculateHaversineKm(jobLat, jobLon, wLat, wLon);
      const distanceMeters = Math.round(distanceKm * 1000);
      const dispatchScore = worker.rating * 20 - distanceKm;

      return {
        worker,
        distanceMeters,
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        dispatchScore: parseFloat(dispatchScore.toFixed(2)),
      };
    });

    return results
      .filter((res) => radiusMeters <= 0 || res.distanceMeters <= radiusMeters)
      .sort((a, b) => b.dispatchScore - a.dispatchScore);
  }
}
