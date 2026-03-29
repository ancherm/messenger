import { apiClient } from "../client";
import type { AuthResponse, CreateUserRequest, LoginRequest } from "../types";

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

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponseShape>("/auth/login", {
      username: data.emailOrUsername.trim(),
      password: data.password,
    });

    return normalizeAuthResponse(response);
  },

  async register(data: CreateUserRequest): Promise<void> {
    await apiClient.post<void>("/auth/register", {
      username: data.username.trim(),
      email: data.email.trim(),
      firstName: data.firstName?.trim() || undefined,
      lastName: data.lastName?.trim() || undefined,
      password: data.password,
    });
  },
};
