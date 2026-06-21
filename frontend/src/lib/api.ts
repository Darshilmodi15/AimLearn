const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
  }
}

interface RequestOptions extends RequestInit {
  retryAuth?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });

  if (response.status === 401 && options.retryAuth !== false && path !== "/auth/refresh") {
    const refresh = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include"
    });
    if (refresh.ok) return apiFetch<T>(path, { ...options, retryAuth: false });
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
      errors?: Record<string, string[]>;
    };
    throw new ApiError(body.message ?? "The request could not be completed.", response.status, body.errors);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
