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
  CreatePeriodRequest,
  GetApiV1PeriodsParams,
  UpdatePeriodRequest
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

export const postApiV1Periods = (
    createPeriodRequest?: CreatePeriodRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/periods`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createPeriodRequest, signal
    },
      options);
    }




export const getPostApiV1PeriodsMutationKey = () => ['postApiV1Periods'] as const;

export const getPostApiV1PeriodsMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1Periods>>, TError,PostApiV1PeriodsMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1Periods>>, TError,PostApiV1PeriodsMutationVariables, TContext> => {

const mutationKey = getPostApiV1PeriodsMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1Periods>>, PostApiV1PeriodsMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1Periods(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1PeriodsMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1Periods>>>
    export type PostApiV1PeriodsMutationBody = CreatePeriodRequest | undefined
    export type PostApiV1PeriodsMutationError = unknown
    export type PostApiV1PeriodsMutationVariables = {data?: CreatePeriodRequest}

    export const usePostApiV1Periods = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1Periods>>, TError,PostApiV1PeriodsMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1Periods>>,
        TError,
        PostApiV1PeriodsMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1PeriodsMutationOptions(options), queryClient);
    }
    export const getApiV1Periods = (
    params?: GetApiV1PeriodsParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/periods`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetApiV1PeriodsQueryKey = (params?: GetApiV1PeriodsParams,) => {
    return [
    `/api/v1/periods`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetApiV1PeriodsQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1Periods>>, TError = unknown>(params?: GetApiV1PeriodsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Periods>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1PeriodsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1Periods>>> = ({ signal }) => getApiV1Periods(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1Periods>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1PeriodsQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1Periods>>>
export type GetApiV1PeriodsQueryError = unknown


export function useGetApiV1Periods<TData = Awaited<ReturnType<typeof getApiV1Periods>>, TError = unknown>(
 params: undefined |  GetApiV1PeriodsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Periods>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1Periods>>,
          TError,
          Awaited<ReturnType<typeof getApiV1Periods>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1Periods<TData = Awaited<ReturnType<typeof getApiV1Periods>>, TError = unknown>(
 params?: GetApiV1PeriodsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Periods>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1Periods>>,
          TError,
          Awaited<ReturnType<typeof getApiV1Periods>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1Periods<TData = Awaited<ReturnType<typeof getApiV1Periods>>, TError = unknown>(
 params?: GetApiV1PeriodsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Periods>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1Periods<TData = Awaited<ReturnType<typeof getApiV1Periods>>, TError = unknown>(
 params?: GetApiV1PeriodsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Periods>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1PeriodsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const getApiV1PeriodsId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/periods/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1PeriodsIdQueryKey = (id: string,) => {
    return [
    `/api/v1/periods/${id}`
    ] as const;
    }


export const getGetApiV1PeriodsIdQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1PeriodsId>>, TError = unknown>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1PeriodsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1PeriodsIdQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1PeriodsId>>> = ({ signal }) => getApiV1PeriodsId(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1PeriodsId>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1PeriodsIdQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1PeriodsId>>>
export type GetApiV1PeriodsIdQueryError = unknown


export function useGetApiV1PeriodsId<TData = Awaited<ReturnType<typeof getApiV1PeriodsId>>, TError = unknown>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1PeriodsId>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1PeriodsId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1PeriodsId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1PeriodsId<TData = Awaited<ReturnType<typeof getApiV1PeriodsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1PeriodsId>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1PeriodsId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1PeriodsId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1PeriodsId<TData = Awaited<ReturnType<typeof getApiV1PeriodsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1PeriodsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1PeriodsId<TData = Awaited<ReturnType<typeof getApiV1PeriodsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1PeriodsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1PeriodsIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const putApiV1PeriodsId = (
    id: string,
    updatePeriodRequest?: UpdatePeriodRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/periods/${id}`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: updatePeriodRequest, signal
    },
      options);
    }




export const getPutApiV1PeriodsIdMutationKey = () => ['putApiV1PeriodsId'] as const;

export const getPutApiV1PeriodsIdMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putApiV1PeriodsId>>, TError,PutApiV1PeriodsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof putApiV1PeriodsId>>, TError,PutApiV1PeriodsIdMutationVariables, TContext> => {

const mutationKey = getPutApiV1PeriodsIdMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof putApiV1PeriodsId>>, PutApiV1PeriodsIdMutationVariables> = (props) => {
          const {id,data} = props ?? {};

          return  putApiV1PeriodsId(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PutApiV1PeriodsIdMutationResult = NonNullable<Awaited<ReturnType<typeof putApiV1PeriodsId>>>
    export type PutApiV1PeriodsIdMutationBody = UpdatePeriodRequest | undefined
    export type PutApiV1PeriodsIdMutationError = unknown
    export type PutApiV1PeriodsIdMutationVariables = {id: string;data?: UpdatePeriodRequest}

    export const usePutApiV1PeriodsId = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putApiV1PeriodsId>>, TError,PutApiV1PeriodsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof putApiV1PeriodsId>>,
        TError,
        PutApiV1PeriodsIdMutationVariables,
        TContext
      > => {
      return useMutation(getPutApiV1PeriodsIdMutationOptions(options), queryClient);
    }
    export const deleteApiV1PeriodsId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/periods/${id}`, method: 'DELETE', signal
    },
      options);
    }




export const getDeleteApiV1PeriodsIdMutationKey = () => ['deleteApiV1PeriodsId'] as const;

export const getDeleteApiV1PeriodsIdMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1PeriodsId>>, TError,DeleteApiV1PeriodsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1PeriodsId>>, TError,DeleteApiV1PeriodsIdMutationVariables, TContext> => {

const mutationKey = getDeleteApiV1PeriodsIdMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteApiV1PeriodsId>>, DeleteApiV1PeriodsIdMutationVariables> = (props) => {
          const {id} = props ?? {};

          return  deleteApiV1PeriodsId(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteApiV1PeriodsIdMutationResult = NonNullable<Awaited<ReturnType<typeof deleteApiV1PeriodsId>>>

    export type DeleteApiV1PeriodsIdMutationError = unknown
    export type DeleteApiV1PeriodsIdMutationVariables = {id: string}

    export const useDeleteApiV1PeriodsId = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1PeriodsId>>, TError,DeleteApiV1PeriodsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteApiV1PeriodsId>>,
        TError,
        DeleteApiV1PeriodsIdMutationVariables,
        TContext
      > => {
      return useMutation(getDeleteApiV1PeriodsIdMutationOptions(options), queryClient);
    }
