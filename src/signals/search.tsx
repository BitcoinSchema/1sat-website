import { FetchStatus } from "@/constants";
import type { Autofill } from "@/types/search";
import { signal } from "@preact/signals-react";

export const autofillValues = signal<Autofill[] | null>(null);
export const searchLoading = signal<FetchStatus>(FetchStatus.Idle);