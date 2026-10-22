import { StorageService } from './storageService';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error?: any;
}

export class ApiError extends Error {
  statusCode: number;
  data?: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorizedCallback: UnauthorizedHandler | null = null;

export const setOnUnauthorizedCallback = (cb: UnauthorizedHandler | null) => {
  onUnauthorizedCallback = cb;
};

export const ApiClient = {
  async request<T = any>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      body?: any;
      headers?: Record<string, string>;
      isFormData?: boolean;
      isUrlEncoded?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> {
    const baseUrl = await StorageService.getApiUrl();
    const token = await StorageService.getAuthToken();

    const url = `${baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    let body = options.body;

    if (options.isFormData) {
      delete headers['Content-Type'];
    } else if (options.isUrlEncoded) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      if (typeof body === 'object' && !(body instanceof URLSearchParams)) {
        const params = new URLSearchParams();
        Object.entries(body).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
        body = params.toString();
      }
    } else if (body && typeof body === 'object') {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const json = await response.json().catch(() => null);

      if (response.status === 401) {
        // Clear invalid or expired session immediately
        await StorageService.clearSession();
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
        const errorMsg = json?.message || 'Sesi autentikasi telah berakhir. Silakan masuk kembali.';
        throw new ApiError(errorMsg, 401, json);
      }

      if (!response.ok) {
        const errorMsg = json?.message || `HTTP Error ${response.status}: ${response.statusText}`;
        throw new ApiError(errorMsg, response.status, json);
      }

      return json as ApiResponse<T>;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new ApiError('Permintaan melebihi batas waktu (timeout). Periksa server backend.', 408);
      }
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(err.message || 'Gagal terhubung ke server backend.', 0);
    }
  },

  get<T = any>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'GET', headers });
  },

  post<T = any>(endpoint: string, body?: any, isUrlEncoded = false) {
    return this.request<T>(endpoint, { method: 'POST', body, isUrlEncoded });
  },

  postFormData<T = any>(endpoint: string, formData: FormData) {
    return this.request<T>(endpoint, { method: 'POST', body: formData, isFormData: true });
  },

  put<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, { method: 'PUT', body });
  },

  delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  },
};
