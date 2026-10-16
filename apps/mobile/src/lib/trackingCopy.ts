import { JobStatus } from '@metro-fix/core-types';

/** What the customer should understand about where their request stands. */
export interface TrackingMessage {
  /** A short caption for the current step of the timeline. */
  caption: string;
  /** A sentence for the status card beneath the timeline. */
  detail: string;
}

/**
 * Plain-language status copy for customers. The technician's name is only mentioned once there is
 * one, and nothing here pretends progress that has not happened.
 */
export function trackingMessage(status: JobStatus | string, technician?: string | null): TrackingMessage {
  const who = technician?.trim() || 'Your technician';
  switch (status) {
    case JobStatus.REQUESTED:
      return {
        caption: 'Waiting for dispatch',
        detail: 'Customer Care has your request and is choosing the nearest certified technician.',
      };
    case JobStatus.PENDING_ACCEPTANCE:
      return {
        caption: 'Contacting a technician',
        detail: 'A technician has been asked to take your job. We’ll confirm as soon as they accept.',
      };
    case JobStatus.ASSIGNED:
      return { caption: 'Technician confirmed', detail: `${who} has accepted your job and will head to you soon.` };
    case JobStatus.ON_ROUTE:
      return { caption: 'On the way', detail: `${who} is travelling to your site now.` };
    case JobStatus.INSPECTION:
      return { caption: 'Inspecting on site', detail: `${who} is on site assessing the work and preparing a quote.` };
    case JobStatus.IN_PROGRESS:
      return { caption: 'Work under way', detail: `${who} is carrying out the work.` };
    case JobStatus.COMPLETED:
      return { caption: 'Work finished', detail: 'The work is done. Dispatch is reviewing the completion report.' };
    case JobStatus.CLOSED:
      return { caption: 'Closed', detail: 'This request is complete and has been signed off.' };
    case JobStatus.CANCELLED:
      return { caption: 'Cancelled', detail: 'This request was cancelled.' };
    default:
      return { caption: 'In progress', detail: 'We’re working on your request.' };
  }
}

/**
 * The in-app alert for a customer when one of their requests moves to a new step, or null when
 * nothing changed (or this is the first time the request is seen, so there is nothing to compare).
 */
export function statusChangeAlert(
  previous: string | undefined,
  job: { title: string; status: JobStatus | string; worker?: { user?: { fullName?: string | null } | null } | null },
): { title: string; message: string } | null {
  if (!previous || previous === job.status) return null;
  const { caption, detail } = trackingMessage(job.status, job.worker?.user?.fullName);
  return { title: `${job.title}: ${caption}`, message: detail };
}
