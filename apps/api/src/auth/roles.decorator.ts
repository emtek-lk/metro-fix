import { SetMetadata } from '@nestjs/common';
import { Role } from '@metro-fix/core-types';

export const ROLES_KEY = 'roles';
/** Restricts a route (or controller) to the listed roles. Routes without it allow any authenticated user. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
