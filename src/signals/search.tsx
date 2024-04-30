import type { Autofill } from "@/types/search";
import { signal } from "@preact/signals-react";

export const autofillValues = signal<Autofill[] | null>(null);
