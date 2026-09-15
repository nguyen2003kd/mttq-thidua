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
  BulkCreateCriteriaRequest,
  BulkUpdateCriteriaStatusRequest,
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




export const getPostApiV1CriteriaMutationKey = () => ['postApiV1Criteria'] as const;

export const getPostApiV1CriteriaMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1Criteria>>, TError,PostApiV1CriteriaMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1Criteria>>, TError,PostApiV1CriteriaMutationVariables, TContext> => {

const mutationKey = getPostApiV1CriteriaMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1Criteria>>, PostApiV1CriteriaMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1Criteria(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1CriteriaMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1Criteria>>>
    export type PostApiV1CriteriaMutationBody = CreateCriteriaRequest | undefined
    export type PostApiV1CriteriaMutationError = unknown
    export type PostApiV1CriteriaMutationVariables = {data?: CreateCriteriaRequest}

    export const usePostApiV1Criteria = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1Criteria>>, TError,PostApiV1CriteriaMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1Criteria>>,
        TError,
        PostApiV1CriteriaMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1CriteriaMutationOptions(options), queryClient);
    }
    export const postApiV1CriteriaBulk = (
    bulkCreateCriteriaRequest?: BulkCreateCriteriaRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/criteria/bulk`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: bulkCreateCriteriaRequest, signal
    },
      options);
    }




export const getPostApiV1CriteriaBulkMutationKey = () => ['postApiV1CriteriaBulk'] as const;

export const getPostApiV1CriteriaBulkMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1CriteriaBulk>>, TError,PostApiV1CriteriaBulkMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1CriteriaBulk>>, TError,PostApiV1CriteriaBulkMutationVariables, TContext> => {

const mutationKey = getPostApiV1CriteriaBulkMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1CriteriaBulk>>, PostApiV1CriteriaBulkMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1CriteriaBulk(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1CriteriaBulkMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1CriteriaBulk>>>
    export type PostApiV1CriteriaBulkMutationBody = BulkCreateCriteriaRequest | undefined
    export type PostApiV1CriteriaBulkMutationError = unknown
    export type PostApiV1CriteriaBulkMutationVariables = {data?: BulkCreateCriteriaRequest}

    export const usePostApiV1CriteriaBulk = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1CriteriaBulk>>, TError,PostApiV1CriteriaBulkMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1CriteriaBulk>>,
        TError,
        PostApiV1CriteriaBulkMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1CriteriaBulkMutationOptions(options), queryClient);
    }
    export const putApiV1CriteriaBulk = (
    bulkUpdateCriteriaStatusRequest?: BulkUpdateCriteriaStatusRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/criteria/bulk`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: bulkUpdateCriteriaStatusRequest, signal
    },
      options);
    }




export const getPutApiV1CriteriaBulkMutationKey = () => ['putApiV1CriteriaBulk'] as const;

export const getPutApiV1CriteriaBulkMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putApiV1CriteriaBulk>>, TError,PutApiV1CriteriaBulkMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof putApiV1CriteriaBulk>>, TError,PutApiV1CriteriaBulkMutationVariables, TContext> => {

const mutationKey = getPutApiV1CriteriaBulkMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof putApiV1CriteriaBulk>>, PutApiV1CriteriaBulkMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  putApiV1CriteriaBulk(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PutApiV1CriteriaBulkMutationResult = NonNullable<Awaited<ReturnType<typeof putApiV1CriteriaBulk>>>
    export type PutApiV1CriteriaBulkMutationBody = BulkUpdateCriteriaStatusRequest | undefined
    export type PutApiV1CriteriaBulkMutationError = unknown
    export type PutApiV1CriteriaBulkMutationVariables = {data?: BulkUpdateCriteriaStatusRequest}

    export const usePutApiV1CriteriaBulk = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putApiV1CriteriaBulk>>, TError,PutApiV1CriteriaBulkMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof putApiV1CriteriaBulk>>,
        TError,
        PutApiV1CriteriaBulkMutationVariables,
        TContext
      > => {
      return useMutation(getPutApiV1CriteriaBulkMutationOptions(options), queryClient);
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




export const getPutApiV1CriteriaIdMutationKey = () => ['putApiV1CriteriaId'] as const;

export const getPutApiV1CriteriaIdMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putApiV1CriteriaId>>, TError,PutApiV1CriteriaIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof putApiV1CriteriaId>>, TError,PutApiV1CriteriaIdMutationVariables, TContext> => {

const mutationKey = getPutApiV1CriteriaIdMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof putApiV1CriteriaId>>, PutApiV1CriteriaIdMutationVariables> = (props) => {
          const {id,data} = props ?? {};

          return  putApiV1CriteriaId(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PutApiV1CriteriaIdMutationResult = NonNullable<Awaited<ReturnType<typeof putApiV1CriteriaId>>>
    export type PutApiV1CriteriaIdMutationBody = UpdateCriteriaRequest | undefined
    export type PutApiV1CriteriaIdMutationError = unknown
    export type PutApiV1CriteriaIdMutationVariables = {id: string;data?: UpdateCriteriaRequest}

    export const usePutApiV1CriteriaId = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putApiV1CriteriaId>>, TError,PutApiV1CriteriaIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof putApiV1CriteriaId>>,
        TError,
        PutApiV1CriteriaIdMutationVariables,
        TContext
      > => {
      return useMutation(getPutApiV1CriteriaIdMutationOptions(options), queryClient);
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






