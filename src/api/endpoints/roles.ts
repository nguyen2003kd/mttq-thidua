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

import type {
  GetApiV1RolesParams
} from '../models';

import { mainInstance } from '../mutator/custom-instance.ts';
import { apiQueryKey } from '../mutator/query-keys.ts';



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

export const getApiV1Roles = (
    params?: GetApiV1RolesParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/roles`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetApiV1RolesQueryKey = (params?: GetApiV1RolesParams,) =>
    apiQueryKey({ params }, { url: `/api/v1/roles` });


export const useGetApiV1RolesQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1Roles>>, TError = unknown>(params?: GetApiV1RolesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Roles>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  apiQueryKey({ params }, { url: `/api/v1/roles`, queryOptions });



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1Roles>>> = ({ signal }) => getApiV1Roles(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1Roles>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1RolesQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1Roles>>>
export type GetApiV1RolesQueryError = unknown


export function useGetApiV1Roles<TData = Awaited<ReturnType<typeof getApiV1Roles>>, TError = unknown>(
 params: undefined |  GetApiV1RolesParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Roles>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1Roles>>,
          TError,
          Awaited<ReturnType<typeof getApiV1Roles>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1Roles<TData = Awaited<ReturnType<typeof getApiV1Roles>>, TError = unknown>(
 params?: GetApiV1RolesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Roles>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1Roles>>,
          TError,
          Awaited<ReturnType<typeof getApiV1Roles>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1Roles<TData = Awaited<ReturnType<typeof getApiV1Roles>>, TError = unknown>(
 params?: GetApiV1RolesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Roles>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1Roles<TData = Awaited<ReturnType<typeof getApiV1Roles>>, TError = unknown>(
 params?: GetApiV1RolesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Roles>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = useGetApiV1RolesQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






