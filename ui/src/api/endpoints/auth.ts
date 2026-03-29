import { resolveApiUrl } from "../client";
import type { AuthResponse, CreateUserRequest, LoginRequest } from "../types";

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_URL || "/auth";

type AuthResponseShape = Partial<AuthResponse> & {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  data?: AuthResponseShape;
};

function normalizeAuthResponse(payload: AuthResponseShape): AuthResponse {
  const source = payload.data ?? payload;
  const token = source.token ?? source.accessToken ?? source.access_token;
  const refreshToken = source.refreshToken ?? source.refresh_token;

  if (!token) {
    throw new Error("Token was not returned by the server");
  }

  return {
    token,
    refreshToken,
    user: source.user,
  };
}

async function authRequest<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(resolveApiUrl(AUTH_BASE_URL, endpoint), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await getAuthErrorMessage(response));
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
}

async function getAuthErrorMessage(response: Response): Promise<string> {
  const fallback = `HTTP ${response.status}: ${response.statusText}`;
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (payload.message || payload.error) {
        return payload.message || payload.error || fallback;
      }
    } catch {
      // ignore malformed error payload and fall back below
    }
  }

  if (response.status === 409) {
    return "Пользователь с таким username или email уже существует";
  }

  return fallback;
}

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await authRequest<AuthResponseShape>("/login", {
      username: data.emailOrUsername.trim(),
      password: data.password,
    });

    return normalizeAuthResponse(response);
  },

  async register(data: CreateUserRequest): Promise<void> {
    await authRequest<void>("/register", {
      username: data.username.trim(),
      email: data.email.trim(),
      firstName: data.firstName?.trim() || undefined,
      lastName: data.lastName?.trim() || undefined,
      password: data.password,
    });
  },
};
