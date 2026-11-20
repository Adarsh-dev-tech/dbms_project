export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3003';

const TOKEN_KEY = 'exhibition_app_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

interface ApiEnvelope<T> {
  statusCode?: number;
  message: T;
  error?: string | null;
}

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const errMsg =
      typeof data === 'object' && data !== null
        ? Array.isArray(data.message)
          ? data.message.join(', ')
          : data.error || data.message || `Request failed (${res.status})`
        : String(data || `Request failed (${res.status})`);
    throw new ApiError(errMsg, res.status);
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    'statusCode' in data &&
    'message' in data
  ) {
    const envelope = data as ApiEnvelope<T>;
    if (envelope.statusCode && envelope.statusCode >= 400) {
      throw new ApiError(
        String(envelope.error || envelope.message || 'Request failed'),
        envelope.statusCode,
      );
    }
    return envelope.message;
  }

  return data as T;
}

export async function downloadExcelFile(path: string, filename: string) {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new ApiError('Failed to download Excel report', res.status);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
