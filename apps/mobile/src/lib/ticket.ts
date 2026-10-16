import { ticketRef } from '@metro-fix/core-types';

/**
 * A short, stable reference for display ("TICKET #K3F9Q2"). The same function is shared with the
 * web dashboard and the API (invoice numbers) so a ticket reads the same everywhere.
 */
export const shortRef = (id: string | null | undefined, length = 6): string => ticketRef(id, length);
