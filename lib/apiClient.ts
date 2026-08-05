import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';
const REQUEST_TIMEOUT_MS = 30000;

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
  authenticated?: boolean;
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

// El backend (NestJS) responde con { message, error, statusCode }.
// message puede ser un array (class-validator) o un string.
function extractErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const { message, error } = data as { message?: unknown; error?: unknown };
    if (Array.isArray(message) && message.length > 0) {
      return message.join('. ');
    }
    if (typeof message === 'string' && message.trim()) return message;
    if (typeof error === 'string' && error.trim()) return error;
  }
  return `HTTP ${status}`;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { authenticated = false, headers = {}, ...rest } = options;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (authenticated) {
    const authHeaders = await getAuthHeaders();
    Object.assign(mergedHeaders, authHeaders);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...rest,
      headers: mergedHeaders,
      signal: controller.signal,
    });

    // El body puede ser JSON (NestJS) o texto (HTML 502/503 de Render):
    // nunca asumir que es JSON.
    const text = await response.text();
    let data: unknown = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }
    }

    if (!response.ok) {
      throw new Error(extractErrorMessage(data, response.status));
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        'El servidor tardó demasiado en responder. Intenta nuevamente.',
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export default apiFetch;
