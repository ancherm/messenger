import { resolveApiUrl } from "../client";
import type { LoginRequest, LoginResponse, RegisterRequest, UserProfile } from "../types";

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_URL || "/auth";

async function authRequest<T>(
  endpoint: string,
  method: "POST",
  body: unknown
): Promise<T> {
  const response = await fetch(resolveApiUrl(AUTH_BASE_URL, endpoint), {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const authApi = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await authRequest<LoginResponse>("/login", "POST", data);

    if (response.token) {
      localStorage.setItem("authToken", response.token);
    }

    return response;
  },

  register(data: RegisterRequest): Promise<UserProfile> {
    return authRequest<UserProfile>("/register", "POST", data);
  },

  logout(): void {
    localStorage.removeItem("authToken");
  },
};
