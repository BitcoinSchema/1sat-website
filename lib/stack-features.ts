import type { Capability } from "@1sat/types";

export const STACK_FEATURE_REQUIREMENTS = {
	activity: ["market", "ordfs"],
	bsv21: ["bsv21"],
	identity: ["bap"],
	inscribe: ["ordfs"],
	opns: ["opns"],
	ordinalMarket: ["market", "ordfs"],
	ordinals: ["ordfs"],
	social: ["bsocial"],
} as const satisfies Record<string, readonly Capability[]>;

export type StackFeature = keyof typeof STACK_FEATURE_REQUIREMENTS;

export interface StackFeatureRegistry {
	capabilities: ReadonlySet<Capability>;
	features: Record<StackFeature, boolean>;
}

export function createStackFeatureRegistry(
	capabilities: readonly Capability[],
): StackFeatureRegistry {
	const available = new Set(capabilities);
	return {
		capabilities: available,
		features: Object.fromEntries(
			Object.entries(STACK_FEATURE_REQUIREMENTS).map(
				([feature, requirements]) => [
					feature,
					requirements.every((capability) => available.has(capability)),
				],
			),
		) as Record<StackFeature, boolean>,
	};
}
