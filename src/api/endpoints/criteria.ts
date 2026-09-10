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
  CreateCriteriaRequest,
  GetApiV1CriteriaGroupsGroupIdCriteriaParams,
  UpdateCriteriaRequest
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

export const postApiV1Criteria = (
    createCriteriaRequest?: CreateCriteriaRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/criteria`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createCriteriaRequest, signal
    },
      options);
    }




export const getPostApiV1CriteriaQueryKey = (createCriteriaRequest?: CreateCriteriaRequest,) => {
    return [
    'POST', `/api/v1/criteria`, createCriteriaRequest
    ] as const;
    }


export const getPostApiV1CriteriaQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1Criteria>>, TError = unknown>(createCriteriaRequest?: CreateCriteriaRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1Criteria>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1CriteriaQueryKey(createCriteriaRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1Criteria>>> = ({ signal }) => postApiV1Criteria(createCriteriaRequest, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1Criteria>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type PostApiV1CriteriaQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1Criteria>>>
export type PostApiV1CriteriaQueryError = unknown


export function usePostApiV1Criteria<TData = Awaited<ReturnType<typeof postApiV1Criteria>>, TError = unknown>(
 createCriteriaRequest: undefined |  CreateCriteriaRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1Criteria>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1Criteria>>,
          TError,
          Awaited<ReturnType<typeof postApiV1Criteria>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1Criteria<TData = Awaited<ReturnType<typeof postApiV1Criteria>>, TError = unknown>(
 createCriteriaRequest?: CreateCriteriaRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1Criteria>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1Criteria>>,
          TError,
          Awaited<ReturnType<typeof postApiV1Criteria>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1Criteria<TData = Awaited<ReturnType<typeof postApiV1Criteria>>, TError = unknown>(
 createCriteriaRequest?: CreateCriteriaRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1Criteria>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1Criteria<TData = Awaited<ReturnType<typeof postApiV1Criteria>>, TError = unknown>(
 createCriteriaRequest?: CreateCriteriaRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1Criteria>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1CriteriaQueryOptions(createCriteriaRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}
export const putApiV1CriteriaId = (
    id: string,
    updateCriteriaRequest?: UpdateCriteriaRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/criteria/${id}`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: updateCriteriaRequest, signal
    },
      options);
    }




export const getPutApiV1CriteriaIdQueryKey = (id: string,
    updateCriteriaRequest?: UpdateCriteriaRequest,) => {
    return [
    'PUT', `/api/v1/criteria/${id}`, updateCriteriaRequest
    ] as const;
    }


export const getPutApiV1CriteriaIdQueryOptions = <TData = Awaited<ReturnType<typeof putApiV1CriteriaId>>, TError = unknown>(id: string,
    updateCriteriaRequest?: UpdateCriteriaRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof putApiV1CriteriaId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPutApiV1CriteriaIdQueryKey(id,updateCriteriaRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof putApiV1CriteriaId>>> = ({ signal }) => putApiV1CriteriaId(id,updateCriteriaRequest, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof putApiV1CriteriaId>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type PutApiV1CriteriaIdQueryResult = NonNullable<Awaited<ReturnType<typeof putApiV1CriteriaId>>>
export type PutApiV1CriteriaIdQueryError = unknown


export function usePutApiV1CriteriaId<TData = Awaited<ReturnType<typeof putApiV1CriteriaId>>, TError = unknown>(
 id: string,
    updateCriteriaRequest: undefined |  UpdateCriteriaRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof putApiV1CriteriaId>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof putApiV1CriteriaId>>,
          TError,
          Awaited<ReturnType<typeof putApiV1CriteriaId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePutApiV1CriteriaId<TData = Awaited<ReturnType<typeof putApiV1CriteriaId>>, TError = unknown>(
 id: string,
    updateCriteriaRequest?: UpdateCriteriaRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof putApiV1CriteriaId>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof putApiV1CriteriaId>>,
          TError,
          Awaited<ReturnType<typeof putApiV1CriteriaId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePutApiV1CriteriaId<TData = Awaited<ReturnType<typeof putApiV1CriteriaId>>, TError = unknown>(
 id: string,
    updateCriteriaRequest?: UpdateCriteriaRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof putApiV1CriteriaId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePutApiV1CriteriaId<TData = Awaited<ReturnType<typeof putApiV1CriteriaId>>, TError = unknown>(
 id: string,
    updateCriteriaRequest?: UpdateCriteriaRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof putApiV1CriteriaId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPutApiV1CriteriaIdQueryOptions(id,updateCriteriaRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}
export const getApiV1CriteriaId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/criteria/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1CriteriaIdQueryKey = (id: string,) => {
    return [
    `/api/v1/criteria/${id}`
    ] as const;
    }


export const getGetApiV1CriteriaIdQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1CriteriaId>>, TError = unknown>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1CriteriaIdQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1CriteriaId>>> = ({ signal }) => getApiV1CriteriaId(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaId>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type GetApiV1CriteriaIdQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1CriteriaId>>>
export type GetApiV1CriteriaIdQueryError = unknown


export function useGetApiV1CriteriaId<TData = Awaited<ReturnType<typeof getApiV1CriteriaId>>, TError = unknown>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaId>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1CriteriaId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1CriteriaId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1CriteriaId<TData = Awaited<ReturnType<typeof getApiV1CriteriaId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaId>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1CriteriaId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1CriteriaId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1CriteriaId<TData = Awaited<ReturnType<typeof getApiV1CriteriaId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1CriteriaId<TData = Awaited<ReturnType<typeof getApiV1CriteriaId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1CriteriaIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}




export const getApiV1CriteriaGroupsGroupIdCriteria = (
    groupId: string,
    params?: GetApiV1CriteriaGroupsGroupIdCriteriaParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/criteria-groups/${groupId}/criteria`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetApiV1CriteriaGroupsGroupIdCriteriaQueryKey = (groupId: string,
    params?: GetApiV1CriteriaGroupsGroupIdCriteriaParams,) => {
    return [
    `/api/v1/criteria-groups/${groupId}/criteria`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetApiV1CriteriaGroupsGroupIdCriteriaQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdCriteria>>, TError = unknown>(groupId: string,
    params?: GetApiV1CriteriaGroupsGroupIdCriteriaParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdCriteria>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1CriteriaGroupsGroupIdCriteriaQueryKey(groupId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdCriteria>>> = ({ signal }) => getApiV1CriteriaGroupsGroupIdCriteria(groupId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: groupId !== null && groupId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdCriteria>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type GetApiV1CriteriaGroupsGroupIdCriteriaQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdCriteria>>>
export type GetApiV1CriteriaGroupsGroupIdCriteriaQueryError = unknown


export function useGetApiV1CriteriaGroupsGroupIdCriteria<TData = Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdCriteria>>, TError = unknown>(
 groupId: string,
    params: undefined |  GetApiV1CriteriaGroupsGroupIdCriteriaParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdCriteria>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdCriteria>>,
          TError,
          Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdCriteria>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1CriteriaGroupsGroupIdCriteria<TData = Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdCriteria>>, TError = unknown>(
 groupId: string,
    params?: GetApiV1CriteriaGroupsGroupIdCriteriaParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdCriteria>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdCriteria>>,
          TError,
          Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdCriteria>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1CriteriaGroupsGroupIdCriteria<TData = Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdCriteria>>, TError = unknown>(
 groupId: string,
    params?: GetApiV1CriteriaGroupsGroupIdCriteriaParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdCriteria>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1CriteriaGroupsGroupIdCriteria<TData = Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdCriteria>>, TError = unknown>(
 groupId: string,
    params?: GetApiV1CriteriaGroupsGroupIdCriteriaParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroupsGroupIdCriteria>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1CriteriaGroupsGroupIdCriteriaQueryOptions(groupId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}


