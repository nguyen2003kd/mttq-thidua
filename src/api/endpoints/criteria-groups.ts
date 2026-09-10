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
  ApplyCriteriaGroupRequest,
  CreateCriteriaGroupRequest,
  GetApiV1CriteriaGroupsParams,
  UpdateCriteriaGroupRequest
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

export const postApiV1CriteriaGroups = (
    createCriteriaGroupRequest?: CreateCriteriaGroupRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/criteria-groups`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createCriteriaGroupRequest, signal
    },
      options);
    }




export const getPostApiV1CriteriaGroupsQueryKey = (createCriteriaGroupRequest?: CreateCriteriaGroupRequest,) => {
    return [
    'POST', `/api/v1/criteria-groups`, createCriteriaGroupRequest
    ] as const;
    }


export const getPostApiV1CriteriaGroupsQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1CriteriaGroups>>, TError = unknown>(createCriteriaGroupRequest?: CreateCriteriaGroupRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1CriteriaGroups>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1CriteriaGroupsQueryKey(createCriteriaGroupRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1CriteriaGroups>>> = ({ signal }) => postApiV1CriteriaGroups(createCriteriaGroupRequest, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1CriteriaGroups>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type PostApiV1CriteriaGroupsQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1CriteriaGroups>>>
export type PostApiV1CriteriaGroupsQueryError = unknown


export function usePostApiV1CriteriaGroups<TData = Awaited<ReturnType<typeof postApiV1CriteriaGroups>>, TError = unknown>(
 createCriteriaGroupRequest: undefined |  CreateCriteriaGroupRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1CriteriaGroups>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1CriteriaGroups>>,
          TError,
          Awaited<ReturnType<typeof postApiV1CriteriaGroups>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1CriteriaGroups<TData = Awaited<ReturnType<typeof postApiV1CriteriaGroups>>, TError = unknown>(
 createCriteriaGroupRequest?: CreateCriteriaGroupRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1CriteriaGroups>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1CriteriaGroups>>,
          TError,
          Awaited<ReturnType<typeof postApiV1CriteriaGroups>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1CriteriaGroups<TData = Awaited<ReturnType<typeof postApiV1CriteriaGroups>>, TError = unknown>(
 createCriteriaGroupRequest?: CreateCriteriaGroupRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1CriteriaGroups>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1CriteriaGroups<TData = Awaited<ReturnType<typeof postApiV1CriteriaGroups>>, TError = unknown>(
 createCriteriaGroupRequest?: CreateCriteriaGroupRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1CriteriaGroups>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1CriteriaGroupsQueryOptions(createCriteriaGroupRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}
export const getApiV1CriteriaGroups = (
    params?: GetApiV1CriteriaGroupsParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/criteria-groups`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetApiV1CriteriaGroupsQueryKey = (params?: GetApiV1CriteriaGroupsParams,) => {
    return [
    `/api/v1/criteria-groups`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetApiV1CriteriaGroupsQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1CriteriaGroups>>, TError = unknown>(params?: GetApiV1CriteriaGroupsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroups>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1CriteriaGroupsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1CriteriaGroups>>> = ({ signal }) => getApiV1CriteriaGroups(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroups>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type GetApiV1CriteriaGroupsQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1CriteriaGroups>>>
export type GetApiV1CriteriaGroupsQueryError = unknown


export function useGetApiV1CriteriaGroups<TData = Awaited<ReturnType<typeof getApiV1CriteriaGroups>>, TError = unknown>(
 params: undefined |  GetApiV1CriteriaGroupsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroups>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1CriteriaGroups>>,
          TError,
          Awaited<ReturnType<typeof getApiV1CriteriaGroups>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1CriteriaGroups<TData = Awaited<ReturnType<typeof getApiV1CriteriaGroups>>, TError = unknown>(
 params?: GetApiV1CriteriaGroupsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroups>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1CriteriaGroups>>,
          TError,
          Awaited<ReturnType<typeof getApiV1CriteriaGroups>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1CriteriaGroups<TData = Awaited<ReturnType<typeof getApiV1CriteriaGroups>>, TError = unknown>(
 params?: GetApiV1CriteriaGroupsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroups>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1CriteriaGroups<TData = Awaited<ReturnType<typeof getApiV1CriteriaGroups>>, TError = unknown>(
 params?: GetApiV1CriteriaGroupsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroups>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1CriteriaGroupsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}
export const putApiV1CriteriaGroupsId = (
    id: string,
    updateCriteriaGroupRequest?: UpdateCriteriaGroupRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/criteria-groups/${id}`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: updateCriteriaGroupRequest, signal
    },
      options);
    }




export const getPutApiV1CriteriaGroupsIdQueryKey = (id: string,
    updateCriteriaGroupRequest?: UpdateCriteriaGroupRequest,) => {
    return [
    'PUT', `/api/v1/criteria-groups/${id}`, updateCriteriaGroupRequest
    ] as const;
    }


export const getPutApiV1CriteriaGroupsIdQueryOptions = <TData = Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>, TError = unknown>(id: string,
    updateCriteriaGroupRequest?: UpdateCriteriaGroupRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPutApiV1CriteriaGroupsIdQueryKey(id,updateCriteriaGroupRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>> = ({ signal }) => putApiV1CriteriaGroupsId(id,updateCriteriaGroupRequest, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type PutApiV1CriteriaGroupsIdQueryResult = NonNullable<Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>>
export type PutApiV1CriteriaGroupsIdQueryError = unknown


export function usePutApiV1CriteriaGroupsId<TData = Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>, TError = unknown>(
 id: string,
    updateCriteriaGroupRequest: undefined |  UpdateCriteriaGroupRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>,
          TError,
          Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePutApiV1CriteriaGroupsId<TData = Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>, TError = unknown>(
 id: string,
    updateCriteriaGroupRequest?: UpdateCriteriaGroupRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>,
          TError,
          Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePutApiV1CriteriaGroupsId<TData = Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>, TError = unknown>(
 id: string,
    updateCriteriaGroupRequest?: UpdateCriteriaGroupRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePutApiV1CriteriaGroupsId<TData = Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>, TError = unknown>(
 id: string,
    updateCriteriaGroupRequest?: UpdateCriteriaGroupRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPutApiV1CriteriaGroupsIdQueryOptions(id,updateCriteriaGroupRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}




export const getApiV1CriteriaGroupsId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/criteria-groups/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1CriteriaGroupsIdQueryKey = (id: string,) => {
    return [
    `/api/v1/criteria-groups/${id}`
    ] as const;
    }


export const getGetApiV1CriteriaGroupsIdQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1CriteriaGroupsId>>, TError = unknown>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroupsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1CriteriaGroupsIdQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1CriteriaGroupsId>>> = ({ signal }) => getApiV1CriteriaGroupsId(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroupsId>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type GetApiV1CriteriaGroupsIdQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1CriteriaGroupsId>>>
export type GetApiV1CriteriaGroupsIdQueryError = unknown


export function useGetApiV1CriteriaGroupsId<TData = Awaited<ReturnType<typeof getApiV1CriteriaGroupsId>>, TError = unknown>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroupsId>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1CriteriaGroupsId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1CriteriaGroupsId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1CriteriaGroupsId<TData = Awaited<ReturnType<typeof getApiV1CriteriaGroupsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroupsId>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1CriteriaGroupsId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1CriteriaGroupsId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1CriteriaGroupsId<TData = Awaited<ReturnType<typeof getApiV1CriteriaGroupsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroupsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1CriteriaGroupsId<TData = Awaited<ReturnType<typeof getApiV1CriteriaGroupsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1CriteriaGroupsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1CriteriaGroupsIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const postApiV1CriteriaGroupsApply = (
    applyCriteriaGroupRequest?: ApplyCriteriaGroupRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/criteria-groups/apply`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: applyCriteriaGroupRequest, signal
    },
      options);
    }




export const getPostApiV1CriteriaGroupsApplyQueryKey = (applyCriteriaGroupRequest?: ApplyCriteriaGroupRequest,) => {
    return [
    'POST', `/api/v1/criteria-groups/apply`, applyCriteriaGroupRequest
    ] as const;
    }


export const getPostApiV1CriteriaGroupsApplyQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>, TError = unknown>(applyCriteriaGroupRequest?: ApplyCriteriaGroupRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1CriteriaGroupsApplyQueryKey(applyCriteriaGroupRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>> = ({ signal }) => postApiV1CriteriaGroupsApply(applyCriteriaGroupRequest, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type PostApiV1CriteriaGroupsApplyQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>>
export type PostApiV1CriteriaGroupsApplyQueryError = unknown


export function usePostApiV1CriteriaGroupsApply<TData = Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>, TError = unknown>(
 applyCriteriaGroupRequest: undefined |  ApplyCriteriaGroupRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>,
          TError,
          Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1CriteriaGroupsApply<TData = Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>, TError = unknown>(
 applyCriteriaGroupRequest?: ApplyCriteriaGroupRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>,
          TError,
          Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1CriteriaGroupsApply<TData = Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>, TError = unknown>(
 applyCriteriaGroupRequest?: ApplyCriteriaGroupRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1CriteriaGroupsApply<TData = Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>, TError = unknown>(
 applyCriteriaGroupRequest?: ApplyCriteriaGroupRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1CriteriaGroupsApplyQueryOptions(applyCriteriaGroupRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}


