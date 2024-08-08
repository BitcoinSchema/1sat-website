import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const removeNullKeys = (obj: Record<string, any>): Record<string, any> =>
	Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== null));
