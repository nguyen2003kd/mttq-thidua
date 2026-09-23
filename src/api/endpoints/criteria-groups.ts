/* eslint-disable */
import {
  useMutation,
  useQuery
} from '@tanstack/react-query';
import type {
  DataTag,
  DefinedInitialDataOptions,
  DefinedUseQueryResult,
  MutationFunction,
  QueryClient,
  QueryFunction,
  QueryKey,
  UndefinedInitialDataOptions,
  UseMutationOptions,
  UseMutationResult,
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




export const getPostApiV1CriteriaGroupsMutationKey = () => ['postApiV1CriteriaGroups'] as const;

export const getPostApiV1CriteriaGroupsMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1CriteriaGroups>>, TError,PostApiV1CriteriaGroupsMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1CriteriaGroups>>, TError,PostApiV1CriteriaGroupsMutationVariables, TContext> => {

const mutationKey = getPostApiV1CriteriaGroupsMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1CriteriaGroups>>, PostApiV1CriteriaGroupsMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1CriteriaGroups(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1CriteriaGroupsMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1CriteriaGroups>>>
    export type PostApiV1CriteriaGroupsMutationBody = CreateCriteriaGroupRequest | undefined
    export type PostApiV1CriteriaGroupsMutationError = unknown
    export type PostApiV1CriteriaGroupsMutationVariables = {data?: CreateCriteriaGroupRequest}

    export const usePostApiV1CriteriaGroups = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1CriteriaGroups>>, TError,PostApiV1CriteriaGroupsMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1CriteriaGroups>>,
        TError,
        PostApiV1CriteriaGroupsMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1CriteriaGroupsMutationOptions(options), queryClient);
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




export const getPutApiV1CriteriaGroupsIdMutationKey = () => ['putApiV1CriteriaGroupsId'] as const;

export const getPutApiV1CriteriaGroupsIdMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>, TError,PutApiV1CriteriaGroupsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>, TError,PutApiV1CriteriaGroupsIdMutationVariables, TContext> => {

const mutationKey = getPutApiV1CriteriaGroupsIdMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>, PutApiV1CriteriaGroupsIdMutationVariables> = (props) => {
          const {id,data} = props ?? {};

          return  putApiV1CriteriaGroupsId(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PutApiV1CriteriaGroupsIdMutationResult = NonNullable<Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>>
    export type PutApiV1CriteriaGroupsIdMutationBody = UpdateCriteriaGroupRequest | undefined
    export type PutApiV1CriteriaGroupsIdMutationError = unknown
    export type PutApiV1CriteriaGroupsIdMutationVariables = {id: string;data?: UpdateCriteriaGroupRequest}

    export const usePutApiV1CriteriaGroupsId = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>, TError,PutApiV1CriteriaGroupsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof putApiV1CriteriaGroupsId>>,
        TError,
        PutApiV1CriteriaGroupsIdMutationVariables,
        TContext
      > => {
      return useMutation(getPutApiV1CriteriaGroupsIdMutationOptions(options), queryClient);
    }
    export const deleteApiV1CriteriaGroupsId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/criteria-groups/${id}`, method: 'DELETE', signal
    },
      options);
    }




export const getDeleteApiV1CriteriaGroupsIdMutationKey = () => ['deleteApiV1CriteriaGroupsId'] as const;

export const getDeleteApiV1CriteriaGroupsIdMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1CriteriaGroupsId>>, TError,DeleteApiV1CriteriaGroupsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1CriteriaGroupsId>>, TError,DeleteApiV1CriteriaGroupsIdMutationVariables, TContext> => {

const mutationKey = getDeleteApiV1CriteriaGroupsIdMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteApiV1CriteriaGroupsId>>, DeleteApiV1CriteriaGroupsIdMutationVariables> = (props) => {
          const {id} = props ?? {};

          return  deleteApiV1CriteriaGroupsId(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteApiV1CriteriaGroupsIdMutationResult = NonNullable<Awaited<ReturnType<typeof deleteApiV1CriteriaGroupsId>>>

    export type DeleteApiV1CriteriaGroupsIdMutationError = unknown
    export type DeleteApiV1CriteriaGroupsIdMutationVariables = {id: string}

    export const useDeleteApiV1CriteriaGroupsId = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1CriteriaGroupsId>>, TError,DeleteApiV1CriteriaGroupsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteApiV1CriteriaGroupsId>>,
        TError,
        DeleteApiV1CriteriaGroupsIdMutationVariables,
        TContext
      > => {
      return useMutation(getDeleteApiV1CriteriaGroupsIdMutationOptions(options), queryClient);
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




export const getPostApiV1CriteriaGroupsApplyMutationKey = () => ['postApiV1CriteriaGroupsApply'] as const;

export const getPostApiV1CriteriaGroupsApplyMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>, TError,PostApiV1CriteriaGroupsApplyMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>, TError,PostApiV1CriteriaGroupsApplyMutationVariables, TContext> => {

const mutationKey = getPostApiV1CriteriaGroupsApplyMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>, PostApiV1CriteriaGroupsApplyMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1CriteriaGroupsApply(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1CriteriaGroupsApplyMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>>
    export type PostApiV1CriteriaGroupsApplyMutationBody = ApplyCriteriaGroupRequest | undefined
    export type PostApiV1CriteriaGroupsApplyMutationError = unknown
    export type PostApiV1CriteriaGroupsApplyMutationVariables = {data?: ApplyCriteriaGroupRequest}

    export const usePostApiV1CriteriaGroupsApply = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>, TError,PostApiV1CriteriaGroupsApplyMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1CriteriaGroupsApply>>,
        TError,
        PostApiV1CriteriaGroupsApplyMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1CriteriaGroupsApplyMutationOptions(options), queryClient);
    }
