// Authentication API functions (following CV_Online pattern)

import type { AuthTokens, AuthUser } from '../auth';
import { getRefreshToken } from '../auth';

// Get API base URL from environment variables
let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Ensure API_BASE_URL ends with /api if it doesn't already
// This handles cases where the env var is set to just the domain without /api
if (!API_BASE_URL.endsWith('/api')) {
  // Remove trailing slash if present, then add /api
  API_BASE_URL = API_BASE_URL.replace(/\/$/, '') + '/api';
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RegisterInput {
  fullName: string;
  username: string;
  password: string;
  sex?: 'male' | 'female' | 'other';
  preferredLanguage?: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface GoogleAuthPayload {
  idToken: string;
}

export interface FacebookAuthPayload {
  accessToken: string;
}

export interface AppleAuthPayload {
  idToken: string;
}

async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  { method = 'GET', body, token }: { method?: string; body?: TBody; token?: string | null } = {},
): Promise<TResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (response.status === 204) {
    return undefined as unknown as TResponse;
  }

  const data = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message = (data && data.message) || 'Unexpected error';
    throw new Error(message);
  }

  return data as TResponse;
}

export const authApi = {
  register: (payload: RegisterInput) =>
    apiRequest<LoginResponse, RegisterInput>('/auth/register', { method: 'POST', body: payload }),

  login: (payload: LoginInput) =>
    apiRequest<LoginResponse, LoginInput>('/auth/login', { method: 'POST', body: payload }),

  googleAuth: (payload: GoogleAuthPayload) =>
    apiRequest<LoginResponse, GoogleAuthPayload>('/auth/google', { method: 'POST', body: payload }),

  facebookAuth: (payload: FacebookAuthPayload) =>
    apiRequest<LoginResponse, FacebookAuthPayload>('/auth/facebook', { method: 'POST', body: payload }),

  appleAuth: (payload: AppleAuthPayload) =>
    apiRequest<LoginResponse, AppleAuthPayload>('/auth/apple', { method: 'POST', body: payload }),

  refresh: (refreshToken: string) =>
    apiRequest<LoginResponse, { refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    }),

  logout: async (refreshToken: string) => {
    try {
      await apiRequest<void, { refreshToken: string }>('/auth/logout', {
        method: 'POST',
        body: { refreshToken },
      });
    } catch (error) {
      // Ignore errors on logout
    }
  },

  getProfile: async (accessToken: string) => {
    return apiRequest<{ user: AuthUser }>('/auth/me', { token: accessToken });
  },

  profile: async (accessToken: string) => {
    return apiRequest<{ user: AuthUser }>('/auth/me', { token: accessToken });
  },

  updateProfile: async (accessToken: string, payload: {
    fullName?: string;
    password?: string;
    preferredLanguage?: string;
    sex?: 'male' | 'female' | 'other' | null;
  }) => {
    return apiRequest<{ user: AuthUser }>('/auth/me', {
      method: 'PUT',
      body: payload,
      token: accessToken,
    });
  },
};

