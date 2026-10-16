import { ServicePillar } from '@metro-fix/core-types';

export class CreateWorkerDto {
  fullName!: string;
  email!: string;
  phoneNumber?: string;
  servicePillars?: ServicePillar[];
  coverageZone?: string;
  /** Optional. When omitted the API generates a one-time password and returns it once. */
  temporaryPassword?: string;
}
