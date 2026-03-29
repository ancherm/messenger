import { MockApiClient } from "./mock/mockClient";
import type { IApiClient } from "./mock/mockClient";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function normalizeRelativeBase(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function joinRelativeUrl(baseUrl: string, endpoint: string): string {
  const normalizedBase = normalizeRelativeBase(baseUrl);
  const normalizedEndpoint = endpoint.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedEndpoint}`;
}

export function resolveApiUrl(
  baseUrl: string,
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const isAbsoluteBase = /^https?:\/\//i.test(baseUrl);
  const rawUrl = isAbsoluteBase
    ? new URL(endpoint.replace(/^\/+/, ""), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString()
    : joinRelativeUrl(baseUrl, endpoint);

  const url = isAbsoluteBase ? new URL(rawUrl) : new URL(rawUrl, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return isAbsoluteBase ? url.toString() : `${url.pathname}${url.search}`;
}

class ApiClient implements IApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  async delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options.params);
    const headers = this.buildHeaders(options.headers, options.body !== undefined);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(await this.getErrorMessage(response));
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        return undefined as T;
      }

      const text = await response.text();
      return (text ? (JSON.parse(text) as T) : undefined) as T;
    } catch (error) {
      console.error(`API Error [${options.method} ${endpoint}]:`, error);
      throw error;
    }
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    return resolveApiUrl(this.baseURL, endpoint, params);
  }

  private async getErrorMessage(response: Response): Promise<string> {
    const fallback = `HTTP ${response.status}: ${response.statusText}`;
    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("application/json")) {
      return fallback;
    }

    try {
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
      };

      return payload.message || payload.error || fallback;
    } catch {
      return fallback;
    }
  }

  private buildHeaders(customHeaders?: HeadersInit, hasBody = false): HeadersInit {
    const headers: Record<string, string> = {};

    if (hasBody) {
      headers["Content-Type"] = "application/json";
    }

    if (customHeaders instanceof Headers) {
      customHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(customHeaders)) {
      customHeaders.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else if (customHeaders) {
      Object.assign(headers, customHeaders);
    }

    const token = localStorage.getItem("authToken");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }
}

const useMock = import.meta.env.VITE_API_MOCK === "true";
export const apiClient: IApiClient = useMock ? new MockApiClient() : new ApiClient();

export type { ApiResponse, RequestOptions };
export default apiClient;
