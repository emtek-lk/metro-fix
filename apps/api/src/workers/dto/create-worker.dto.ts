import { ServicePillar } from '@metro-fix/core-types';

export class CreateWorkerDto {
  fullName!: string;
  email!: string;
  phoneNumber?: string;
  servicePillars?: ServicePillar[];
  coverageZone?: string;
}
