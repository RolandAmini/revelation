// src/lib/services/api.ts
const API_BASE_URL = "/api"; // Next.js API Routes base path

interface ApiConfig {
  headers?: HeadersInit;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any; // Consider being more specific with JSON.stringify type
}

async function request<T>(
  endpoint: string,
  config: ApiConfig = {}
): Promise<T> {
  const { headers, method = "GET", body } = config;

  const requestOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

    if (!response.ok) {
      // Attempt to parse JSON error, fallback to status text
      const errorData = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(
        errorData.message || `API request failed with status ${response.status}`
      );
    }

    // Handle no content response (e.g., successful DELETE or PUT with no return body)
    if (
      response.status === 204 ||
      response.headers.get("content-length") === "0"
    ) {
      return {} as T; // Return empty object for successful no-content responses
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`Error during API request to ${endpoint}:`, error);
    // Rethrow to allow consuming hooks/components to handle
    throw error;
  }
}

export const api = {
  get: <T>(endpoint: string, config?: Omit<ApiConfig, "method" | "body">) =>
    request<T>(endpoint, { ...config, method: "GET" }),
  post: <T>(
    endpoint: string,
    data: any,
    config?: Omit<ApiConfig, "method" | "body">
  ) => request<T>(endpoint, { ...config, method: "POST", body: data }),
  put: <T>(
    endpoint: string,
    data: any,
    config?: Omit<ApiConfig, "method" | "body">
  ) => request<T>(endpoint, { ...config, method: "PUT", body: data }),
  delete: <T>(endpoint: string, config?: Omit<ApiConfig, "method" | "body">) =>
    request<T>(endpoint, { ...config, method: "DELETE" }),
};
