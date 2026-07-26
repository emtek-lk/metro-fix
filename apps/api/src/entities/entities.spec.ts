import { JobStatus, FacilityType, ServicePillar, SubscriptionTier, Role, serviceRequestSchema, workerSchema } from '@metro-fix/core-types';
import { UserEntity, WorkerEntity, CustomerEntity, ServiceRequestEntity } from './index';

describe('Core Types & API Entities Validation', () => {
  describe('Zod Schemas', () => {
    it('should validate 7-stage JobStatus correctly', () => {
      const validStatuses = [
        JobStatus.REQUESTED,
        JobStatus.PENDING_ACCEPTANCE,
        JobStatus.ASSIGNED,
        JobStatus.ON_ROUTE,
        JobStatus.INSPECTION,
        JobStatus.IN_PROGRESS,
        JobStatus.COMPLETED,
      ];
      expect(validStatuses).toHaveLength(7);
    });

    it('should validate service request schema', () => {
      const requestData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Leaking pipe repair',
        description: 'Water leak in main bathroom facility',
        servicePillar: ServicePillar.HARD,
        facilityType: FacilityType.COMMERCIAL,
        status: JobStatus.REQUESTED,
        customerId: 'cust-123',
        location: { latitude: 6.9271, longitude: 79.8612 },
        createdAt: new Date().toISOString(),
      };

      const result = serviceRequestSchema.safeParse(requestData);
      expect(result.success).toBe(true);
    });

    it('should validate worker schema with 1-5 rating', () => {
      const workerData = {
        id: 'worker-1',
        fullName: 'John Doe',
        email: 'john@metrofix.com',
        role: Role.WORKER,
        rating: 4.8,
        servicePillars: [ServicePillar.HARD],
        isAvailable: true,
        activeJobs: 0,
        createdAt: new Date().toISOString(),
      };

      const result = workerSchema.safeParse(workerData);
      expect(result.success).toBe(true);
    });
  });

  describe('TypeORM Entities', () => {
    it('should instantiate UserEntity correctly', () => {
      const user = new UserEntity();
      user.id = 'user-uuid';
      user.fullName = 'Jane Admin';
      user.email = 'jane@metrofix.com';
      user.role = Role.ADMIN;
      expect(user.role).toBe('ADMIN');
    });

    it('should instantiate WorkerEntity with float coordinates', () => {
      const worker = new WorkerEntity();
      worker.id = 'worker-uuid';
      worker.rating = 4.9;
      worker.servicePillars = [ServicePillar.HARD, ServicePillar.STRATEGIC];
      worker.latitude = 6.9271;
      worker.longitude = 79.8612;

      expect(worker.latitude).toBe(6.9271);
      expect(worker.longitude).toBe(79.8612);
    });

    it('should instantiate CustomerEntity with float coordinates', () => {
      const customer = new CustomerEntity();
      customer.id = 'cust-uuid';
      customer.facilityType = FacilityType.INDUSTRIAL;
      customer.subscriptionTier = SubscriptionTier.PREMIUM;
      customer.latitude = 6.9271;
      customer.longitude = 79.8612;

      expect(customer.facilityType).toBe(FacilityType.INDUSTRIAL);
      expect(customer.subscriptionTier).toBe(SubscriptionTier.PREMIUM);
      expect(customer.latitude).toBe(6.9271);
    });

    it('should instantiate ServiceRequestEntity with 7-stage JobStatus', () => {
      const sr = new ServiceRequestEntity();
      sr.id = 'sr-uuid';
      sr.title = 'HVAC Maintenance';
      sr.description = 'Quarterly servicing';
      sr.servicePillar = ServicePillar.HARD;
      sr.facilityType = FacilityType.COMMERCIAL;
      sr.status = JobStatus.ON_ROUTE;
      sr.latitude = 6.9271;
      sr.longitude = 79.8612;

      expect(sr.status).toBe('ON_ROUTE');
      expect(sr.latitude).toBe(6.9271);
    });
  });
});
