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
  GetApiV1CriteriaGroupsGroupIdSubmissionsParams,
  GetApiV1MySubmissionsParams,
  SubmitPointsRequest
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

export const getApiV1SubmissionsId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/submissions/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1SubmissionsIdQueryKey = (id: string,) => {
    return [
    `/api/v1/submissions/${id}`
    ] as const;
    }


export const getGetApiV1SubmissionsIdQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1SubmissionsId>>, TError = unknown>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1SubmissionsIdQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1SubmissionsId>>> = ({ signal }) => getApiV1SubmissionsId(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionsId>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type GetApiV1SubmissionsIdQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1SubmissionsId>>>
export type GetApiV1SubmissionsIdQueryError = unknown


export function useGetApiV1SubmissionsId<TData = Awaited<ReturnType<typeof getApiV1SubmissionsId>>, TError = unknown>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionsId>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1SubmissionsId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1SubmissionsId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1SubmissionsId<TData = Awaited<ReturnType<typeof getApiV1SubmissionsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionsId>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1SubmissionsId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1SubmissionsId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1SubmissionsId<TData = Awaited<ReturnType<typeof getApiV1SubmissionsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1SubmissionsId<TData = Awaited<ReturnType<typeof getApiV1SubmissionsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1SubmissionsIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}
export const getApiV1CriteriaGroupsGroupIdSubmissions = (
    groupId: string,
    params?: GetApiV1CriteriaGroupsGroupIdSubmissionsParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/criteria-groups/${groupId}/submissions`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetApiV1CriteriaGroupsGroupIdSubmissionsQueryKey = (groupId: string,
    params?: GetApiV1CriteriaGroupsGroupIdSubmissionsParams,) => {
    return [
    `/api/v1/criteria-groups/${groupId}/submissions`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetApiV1CriteriaGroupsGroupIdSubmissionsQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdSubmissions>>, TError = unknown>(groupId: string,
    params?: GetApiV1CriteriaGroupsGroupIdSubmissionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdSubmissions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1CriteriaGroupsGroupIdSubmissionsQueryKey(groupId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdSubmissions>>> = ({ signal }) => getApiV1CriteriaGroupsGroupIdSubmissions(groupId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: groupId !== null && groupId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdSubmissions>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type GetApiV1CriteriaGroupsGroupIdSubmissionsQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdSubmissions>>>
export type GetApiV1CriteriaGroupsGroupIdSubmissionsQueryError = unknown


export function useGetApiV1CriteriaGroupsGroupIdSubmissions<TData = Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdSubmissions>>, TError = unknown>(
 groupId: string,
    params: undefined |  GetApiV1CriteriaGroupsGroupIdSubmissionsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdSubmissions>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdSubmissions>>,
          TError,
          Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdSubmissions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1CriteriaGroupsGroupIdSubmissions<TData = Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdSubmissions>>, TError = unknown>(
 groupId: string,
    params?: GetApiV1CriteriaGroupsGroupIdSubmissionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdSubmissions>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdSubmissions>>,
          TError,
          Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdSubmissions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1CriteriaGroupsGroupIdSubmissions<TData = Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdSubmissions>>, TError = unknown>(
 groupId: string,
    params?: GetApiV1CriteriaGroupsGroupIdSubmissionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdSubmissions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1CriteriaGroupsGroupIdSubmissions<TData = Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdSubmissions>>, TError = unknown>(
 groupId: string,
    params?: GetApiV1CriteriaGroupsGroupIdSubmissionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdSubmissions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1CriteriaGroupsGroupIdSubmissionsQueryOptions(groupId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}
export const getApiV1MySubmissions = (
    params?: GetApiV1MySubmissionsParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/my-submissions`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetApiV1MySubmissionsQueryKey = (params?: GetApiV1MySubmissionsParams,) => {
    return [
    `/api/v1/my-submissions`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetApiV1MySubmissionsQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1MySubmissions>>, TError = unknown>(params?: GetApiV1MySubmissionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1MySubmissions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1MySubmissionsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1MySubmissions>>> = ({ signal }) => getApiV1MySubmissions(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1MySubmissions>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type GetApiV1MySubmissionsQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1MySubmissions>>>
export type GetApiV1MySubmissionsQueryError = unknown


export function useGetApiV1MySubmissions<TData = Awaited<ReturnType<typeof getApiV1MySubmissions>>, TError = unknown>(
 params: undefined |  GetApiV1MySubmissionsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1MySubmissions>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1MySubmissions>>,
          TError,
          Awaited<ReturnType<typeof getApiV1MySubmissions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1MySubmissions<TData = Awaited<ReturnType<typeof getApiV1MySubmissions>>, TError = unknown>(
 params?: GetApiV1MySubmissionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1MySubmissions>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1MySubmissions>>,
          TError,
          Awaited<ReturnType<typeof getApiV1MySubmissions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1MySubmissions<TData = Awaited<ReturnType<typeof getApiV1MySubmissions>>, TError = unknown>(
 params?: GetApiV1MySubmissionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1MySubmissions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1MySubmissions<TData = Awaited<ReturnType<typeof getApiV1MySubmissions>>, TError = unknown>(
 params?: GetApiV1MySubmissionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1MySubmissions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1MySubmissionsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}




export const postApiV1SubmissionsSubmitPoints = (
    submitPointsRequest?: SubmitPointsRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/submissions/submit-points`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: submitPointsRequest, signal
    },
      options);
    }




export const getPostApiV1SubmissionsSubmitPointsQueryKey = (submitPointsRequest?: SubmitPointsRequest,) => {
    return [
    'POST', `/api/v1/submissions/submit-points`, submitPointsRequest
    ] as const;
    }


export const getPostApiV1SubmissionsSubmitPointsQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1SubmissionsSubmitPoints>>, TError = unknown>(submitPointsRequest?: SubmitPointsRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsSubmitPoints>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1SubmissionsSubmitPointsQueryKey(submitPointsRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1SubmissionsSubmitPoints>>> = ({ signal }) => postApiV1SubmissionsSubmitPoints(submitPointsRequest, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsSubmitPoints>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type PostApiV1SubmissionsSubmitPointsQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1SubmissionsSubmitPoints>>>
export type PostApiV1SubmissionsSubmitPointsQueryError = unknown


export function usePostApiV1SubmissionsSubmitPoints<TData = Awaited<ReturnType<typeof postApiV1SubmissionsSubmitPoints>>, TError = unknown>(
 submitPointsRequest: undefined |  SubmitPointsRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsSubmitPoints>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1SubmissionsSubmitPoints>>,
          TError,
          Awaited<ReturnType<typeof postApiV1SubmissionsSubmitPoints>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1SubmissionsSubmitPoints<TData = Awaited<ReturnType<typeof postApiV1SubmissionsSubmitPoints>>, TError = unknown>(
 submitPointsRequest?: SubmitPointsRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsSubmitPoints>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1SubmissionsSubmitPoints>>,
          TError,
          Awaited<ReturnType<typeof postApiV1SubmissionsSubmitPoints>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1SubmissionsSubmitPoints<TData = Awaited<ReturnType<typeof postApiV1SubmissionsSubmitPoints>>, TError = unknown>(
 submitPointsRequest?: SubmitPointsRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsSubmitPoints>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1SubmissionsSubmitPoints<TData = Awaited<ReturnType<typeof postApiV1SubmissionsSubmitPoints>>, TError = unknown>(
 submitPointsRequest?: SubmitPointsRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsSubmitPoints>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1SubmissionsSubmitPointsQueryOptions(submitPointsRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}


