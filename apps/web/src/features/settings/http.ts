import { API_BASE_URL } from '../../lib/api';

/** An API error with the server's message and, for validation failures, one message per field. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('metrofix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function failure(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => null);
  const fields: Record<string, string> = {};
  if (body?.errors && typeof body.errors === 'object') {
    for (const [key, value] of Object.entries(body.errors)) {
      fields[key] = Array.isArray(value) ? String(value[0]) : String(value);
    }
  }
  const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;
  return new ApiError(message || `Request failed (HTTP ${response.status}).`, response.status, fields);
}

/** JSON request with the signed-in user's token; throws ApiError on any failure. */
export async function apiJson<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: init.method ?? 'GET',
    headers: { ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...authHeaders() },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!response.ok) throw await failure(response);
  return (await response.json().catch(() => ({}))) as T;
}

/** Downloads a file the API produces (a CSV export) through the browser. */
export async function downloadFile(path: string, fallbackName: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: authHeaders() });
  if (!response.ok) throw await failure(response);
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
