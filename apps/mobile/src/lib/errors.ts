/**
 * A message fit to show a person for a failed request. Prefers what the API said (it validates
 * input and explains conflicts in plain words); otherwise explains the common network cases,
 * instead of axios's "Request failed with status code 409".
 */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = error as any;

  const body = e?.response?.data;
  const message = body?.message;
  if (Array.isArray(message) && message.length > 0) return message.join(' ');
  if (typeof message === 'string' && message.trim()) return message;

  // The validation pipe returns { errors: { field: ['…'] } }.
  if (body?.errors && typeof body.errors === 'object') {
    const first = Object.values(body.errors as Record<string, string[]>).flat()[0];
    if (typeof first === 'string' && first) return first;
  }

  // The request never got an answer: offline, DNS, timeout, or the server is down.
  if (e?.request && !e?.response) {
    return 'Can’t reach METRO-FIX. Check your connection and try again.';
  }

  if (typeof e?.message === 'string' && e.message && !/status code/i.test(e.message)) {
    return e.message;
  }
  return fallback;
}

/** HTTP status of a failed request, if there was a response. */
export function getErrorStatus(error: unknown): number | undefined {
  return (error as any)?.response?.status;
}

/** True when the API refused because the customer has no paid plan yet. */
export function isSubscriptionRequired(error: unknown): boolean {
  const e = error as any;
  return e?.response?.status === 402 && e?.response?.data?.code === 'SUBSCRIPTION_REQUIRED';
}
