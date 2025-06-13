import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  
  // Add authorization header for admin API requests
  if (url.includes('/api/admin/')) {
    const storedSession = localStorage.getItem('admin_session');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        if (session.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      } catch (error) {
        console.error('Error parsing session for API request:', error);
      }
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get the stored session for admin API requests
    const storedSession = localStorage.getItem('admin_session');
    const headers: HeadersInit = {
      credentials: "include",
    };
    
    if (storedSession && queryKey[0]?.toString().includes('/api/admin/')) {
      try {
        const session = JSON.parse(storedSession);
        if (session.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      } catch (error) {
        console.error('Error parsing session for API request:', error);
      }
    }

    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
