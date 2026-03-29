/**
 * API Client Configuration
 * Центральное место для конфигурации HTTP-клиента
 */

import { MockApiClient } from "./mock/mockClient";
import type { IApiClient } from "./mock/mockClient";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient implements IApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Выполнить GET запрос
   */
  async get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  /**
   * Выполнить POST запрос
   */
  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * Выполнить PUT запрос
   */
  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  /**
   * Выполнить DELETE запрос
   */
  async delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  /**
   * Основной метод для выполнения запросов
   */
  private async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options.params);
    const headers = this.buildHeaders(options.headers);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error(`API Error [${options.method} ${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * Построить полный URL с параметрами
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(endpoint, this.baseURL);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        // Пропустить undefined значения
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Построить заголовки запроса
   */
  private buildHeaders(customHeaders?: HeadersInit): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Добавить пользовательские заголовки
    if (customHeaders && typeof customHeaders === "object" && !(customHeaders instanceof Headers)) {
      Object.assign(headers, customHeaders);
    }

    // Добавить токен авторизации если он есть
    const token = localStorage.getItem("authToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }
}

// Создать глобальный экземпляр API клиента (независимо от типа)
const useMock = import.meta.env.VITE_API_MOCK === "true";
export const apiClient: IApiClient = useMock ? new MockApiClient() : new ApiClient();

export type { ApiResponse, RequestOptions };
export default apiClient;
