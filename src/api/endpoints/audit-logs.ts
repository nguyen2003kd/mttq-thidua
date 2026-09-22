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
  GetApiV1AuditLogsParams
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

export const getApiV1AuditLogs = (
    params?: GetApiV1AuditLogsParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/audit-logs`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetApiV1AuditLogsQueryKey = (params?: GetApiV1AuditLogsParams,) => {
    return [
    `/api/v1/audit-logs`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetApiV1AuditLogsQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1AuditLogs>>, TError = unknown>(params?: GetApiV1AuditLogsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1AuditLogs>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1AuditLogsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1AuditLogs>>> = ({ signal }) => getApiV1AuditLogs(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1AuditLogs>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1AuditLogsQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1AuditLogs>>>
export type GetApiV1AuditLogsQueryError = unknown


export function useGetApiV1AuditLogs<TData = Awaited<ReturnType<typeof getApiV1AuditLogs>>, TError = unknown>(
 params: undefined |  GetApiV1AuditLogsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1AuditLogs>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1AuditLogs>>,
          TError,
          Awaited<ReturnType<typeof getApiV1AuditLogs>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1AuditLogs<TData = Awaited<ReturnType<typeof getApiV1AuditLogs>>, TError = unknown>(
 params?: GetApiV1AuditLogsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1AuditLogs>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1AuditLogs>>,
          TError,
          Awaited<ReturnType<typeof getApiV1AuditLogs>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1AuditLogs<TData = Awaited<ReturnType<typeof getApiV1AuditLogs>>, TError = unknown>(
 params?: GetApiV1AuditLogsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1AuditLogs>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1AuditLogs<TData = Awaited<ReturnType<typeof getApiV1AuditLogs>>, TError = unknown>(
 params?: GetApiV1AuditLogsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1AuditLogs>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1AuditLogsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






