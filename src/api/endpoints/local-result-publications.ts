/* eslint-disable */
import {
  useQuery
} from '@tanstack/react-query';
import type {
  DataTag,
  DefinedInitialDataOptions,
  DefinedUseQueryResult,
  QueryClient,
  QueryFunction,
  QueryKey,
  UndefinedInitialDataOptions,
  UseQueryOptions,
  UseQueryResult
} from '@tanstack/react-query';

import { mainInstance } from '../mutator/custom-instance.ts';



type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];



const withQueryKey = <T extends object, K>(query: T, queryKey: K): T & { queryKey: K } => {
  const result = { queryKey } as T & { queryKey: K };
  for (const key of Object.keys(query)) {
    // The explicit queryKey always wins, matching the previous
    // `{ ...query, queryKey }` spread where it was set last.
    if (key === 'queryKey') continue;
    Object.defineProperty(result, key, {
      enumerable: true,
      configurable: true,
      get: () => (query as Record<string, unknown>)[key],
    });
  }
  return result;
};

export const getApiV1ResultPublicationsLocal = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/result-publications/local`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1ResultPublicationsLocalQueryKey = () => {
    return [
    `/api/v1/result-publications/local`
    ] as const;
    }


export const getGetApiV1ResultPublicationsLocalQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsLocal>>, TError = unknown>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsLocal>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1ResultPublicationsLocalQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1ResultPublicationsLocal>>> = ({ signal }) => getApiV1ResultPublicationsLocal(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsLocal>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1ResultPublicationsLocalQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1ResultPublicationsLocal>>>
export type GetApiV1ResultPublicationsLocalQueryError = unknown


export function useGetApiV1ResultPublicationsLocal<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsLocal>>, TError = unknown>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsLocal>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ResultPublicationsLocal>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ResultPublicationsLocal>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ResultPublicationsLocal<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsLocal>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsLocal>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ResultPublicationsLocal>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ResultPublicationsLocal>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ResultPublicationsLocal<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsLocal>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsLocal>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1ResultPublicationsLocal<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsLocal>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsLocal>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1ResultPublicationsLocalQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






