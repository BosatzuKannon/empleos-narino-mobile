import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

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

  const response = await fetch(url, {
    ...rest,
    headers: mergedHeaders,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  return data as T;
}

export default apiFetch;
