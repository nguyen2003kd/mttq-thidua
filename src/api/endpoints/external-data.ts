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
  GetApiV1ExternalProvincesCodeWardsParams
} from '../models';

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

export const getApiV1ExternalProvincesCodeWards = (
    code: string,
    params?: GetApiV1ExternalProvincesCodeWardsParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/external/provinces/${code}/wards`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetApiV1ExternalProvincesCodeWardsQueryKey = (code: string,
    params?: GetApiV1ExternalProvincesCodeWardsParams,) => {
    return [
    `/api/v1/external/provinces/${code}/wards`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetApiV1ExternalProvincesCodeWardsQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1ExternalProvincesCodeWards>>, TError = unknown>(code: string,
    params?: GetApiV1ExternalProvincesCodeWardsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ExternalProvincesCodeWards>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1ExternalProvincesCodeWardsQueryKey(code,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1ExternalProvincesCodeWards>>> = ({ signal }) => getApiV1ExternalProvincesCodeWards(code,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: code !== null && code !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1ExternalProvincesCodeWards>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1ExternalProvincesCodeWardsQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1ExternalProvincesCodeWards>>>
export type GetApiV1ExternalProvincesCodeWardsQueryError = unknown


export function useGetApiV1ExternalProvincesCodeWards<TData = Awaited<ReturnType<typeof getApiV1ExternalProvincesCodeWards>>, TError = unknown>(
 code: string,
    params: undefined |  GetApiV1ExternalProvincesCodeWardsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ExternalProvincesCodeWards>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ExternalProvincesCodeWards>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ExternalProvincesCodeWards>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ExternalProvincesCodeWards<TData = Awaited<ReturnType<typeof getApiV1ExternalProvincesCodeWards>>, TError = unknown>(
 code: string,
    params?: GetApiV1ExternalProvincesCodeWardsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ExternalProvincesCodeWards>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ExternalProvincesCodeWards>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ExternalProvincesCodeWards>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ExternalProvincesCodeWards<TData = Awaited<ReturnType<typeof getApiV1ExternalProvincesCodeWards>>, TError = unknown>(
 code: string,
    params?: GetApiV1ExternalProvincesCodeWardsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ExternalProvincesCodeWards>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1ExternalProvincesCodeWards<TData = Awaited<ReturnType<typeof getApiV1ExternalProvincesCodeWards>>, TError = unknown>(
 code: string,
    params?: GetApiV1ExternalProvincesCodeWardsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ExternalProvincesCodeWards>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1ExternalProvincesCodeWardsQueryOptions(code,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






