"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface TanstackProviderProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 min
      gcTime: 10 * 60 * 1000, // 10 minutes - keep unused data in cache for 10 min
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: false, // Don't refetch when component mounts if data exists
      retry: 1, // Retry failed requests once
    },
  },
});

const TanstackProvider = ({ children }: TanstackProviderProps) => {
  return <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
}

export default TanstackProvider;
