import { useEffect, useRef } from 'react';
import type { ReadonlySignal } from '@preact/signals-react';

/**
 * A custom hook that properly handles signal dependencies in React.
 * This extracts signal values and uses them as dependencies to satisfy exhaustive-deps.
 */
export function useSignalEffect(
  effect: () => undefined | (() => void),
  signals: ReadonlySignal<unknown>[]
) {
  // Extract current values from signals
  const values = signals.map(signal => signal.value);
  
  // Store previous values to detect changes
  const prevValuesRef = useRef(values);
  
  useEffect(() => {
    // Check if any values changed
    const hasChanged = values.some((value, index) => 
      value !== prevValuesRef.current[index]
    );
    
    if (hasChanged) {
      prevValuesRef.current = values;
      return effect();
    }
  }, values);
}

/**
 * Extract signal values for use in dependency arrays
 */
export function useSignalValues<T extends ReadonlySignal<unknown>[]>(
  ...signals: T
): { [K in keyof T]: T[K] extends ReadonlySignal<infer V> ? V : never } {
  return signals.map(signal => signal.value) as any;
}