import { useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export type QueryFilterDefaults = Record<string, string>;
export type QueryFilterValidators<T extends QueryFilterDefaults> = Partial<Record<keyof T, (value: string) => boolean>>;

type QueryFilterUpdates<T extends QueryFilterDefaults> = Partial<{ [K in keyof T]: T[K] | undefined }>;
type QueryFilterSetters<T extends QueryFilterDefaults> = { [K in keyof T]: (value: T[K]) => void };

export function useQueryFilters<T extends QueryFilterDefaults>(
  defaults: T,
  validators?: QueryFilterValidators<T>,
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultsRef = useRef(defaults);
  const validatorsRef = useRef(validators);

  const filters = useMemo(() => Object.fromEntries(
    Object.keys(defaultsRef.current).map((key) => {
      const defaultValue = defaultsRef.current[key];
      const value = searchParams.get(key);
      const validate = validatorsRef.current?.[key as keyof T];
      return [key, value !== null && (!validate || validate(value)) ? value : defaultValue];
    }),
  ) as T, [searchParams]);

  const setFilters = useCallback((updates: QueryFilterUpdates<T>) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === defaultsRef.current[key as keyof T]) next.delete(key);
        else next.set(key, value);
      });
      return next.toString() === current.toString() ? current : next;
    }, { replace: true });
  }, [setSearchParams]);

  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters({ [key]: value } as unknown as QueryFilterUpdates<T>);
  }, [setFilters]);

  const setters = useMemo(() => Object.fromEntries(
    Object.keys(defaultsRef.current).map((key) => [
      key,
      (value: string) => setFilter(key as keyof T, value as T[keyof T]),
    ]),
  ) as unknown as QueryFilterSetters<T>, [setFilter]);

  return { filters, setFilter, setFilters, setters };
}
