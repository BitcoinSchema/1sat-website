"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStackCapabilities, STACK_URL } from "@/lib/stack";
import { createStackFeatureRegistry } from "@/lib/stack-features";

export const stackFeatureRegistryQueryKey = [
	"stack-feature-registry",
	STACK_URL,
] as const;

export function useStackFeatures() {
	return useQuery({
		queryKey: stackFeatureRegistryQueryKey,
		queryFn: async () =>
			createStackFeatureRegistry(await fetchStackCapabilities()),
		staleTime: 60_000,
		refetchInterval: 60_000,
	});
}
