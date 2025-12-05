import { signal } from "@preact/signals-react";
import { FetchStatus } from "@/constants";
import type { Autofill } from "@/types/search";

export const autofillValues = signal<Autofill[] | null>(null);
export const searchLoading = signal<FetchStatus>(FetchStatus.Idle);
