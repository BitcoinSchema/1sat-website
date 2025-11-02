"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface TanstackProviderProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient();

const TanstackProvider = ({ children }: TanstackProviderProps) => {
  return <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
}

export default TanstackProvider;
