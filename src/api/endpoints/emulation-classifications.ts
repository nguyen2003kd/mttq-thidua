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
  CreateEmulationClassificationRequest,
  GetApiV1EmulationClassificationsParams,
  UpdateEmulationClassificationRequest
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

export const postApiV1EmulationClassifications = (
    createEmulationClassificationRequest?: CreateEmulationClassificationRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/emulation-classifications`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createEmulationClassificationRequest, signal
    },
      options);
    }




export const getPostApiV1EmulationClassificationsMutationKey = () => ['postApiV1EmulationClassifications'] as const;

export const getPostApiV1EmulationClassificationsMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1EmulationClassifications>>, TError,PostApiV1EmulationClassificationsMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1EmulationClassifications>>, TError,PostApiV1EmulationClassificationsMutationVariables, TContext> => {

const mutationKey = getPostApiV1EmulationClassificationsMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1EmulationClassifications>>, PostApiV1EmulationClassificationsMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1EmulationClassifications(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1EmulationClassificationsMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1EmulationClassifications>>>
    export type PostApiV1EmulationClassificationsMutationBody = CreateEmulationClassificationRequest | undefined
    export type PostApiV1EmulationClassificationsMutationError = unknown
    export type PostApiV1EmulationClassificationsMutationVariables = {data?: CreateEmulationClassificationRequest}

    export const usePostApiV1EmulationClassifications = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1EmulationClassifications>>, TError,PostApiV1EmulationClassificationsMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1EmulationClassifications>>,
        TError,
        PostApiV1EmulationClassificationsMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1EmulationClassificationsMutationOptions(options), queryClient);
    }
    export const getApiV1EmulationClassifications = (
    params?: GetApiV1EmulationClassificationsParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/emulation-classifications`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetApiV1EmulationClassificationsQueryKey = (params?: GetApiV1EmulationClassificationsParams,) => {
    return [
    `/api/v1/emulation-classifications`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetApiV1EmulationClassificationsQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1EmulationClassifications>>, TError = unknown>(params?: GetApiV1EmulationClassificationsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1EmulationClassifications>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1EmulationClassificationsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1EmulationClassifications>>> = ({ signal }) => getApiV1EmulationClassifications(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1EmulationClassifications>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1EmulationClassificationsQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1EmulationClassifications>>>
export type GetApiV1EmulationClassificationsQueryError = unknown


export function useGetApiV1EmulationClassifications<TData = Awaited<ReturnType<typeof getApiV1EmulationClassifications>>, TError = unknown>(
 params: undefined |  GetApiV1EmulationClassificationsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1EmulationClassifications>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1EmulationClassifications>>,
          TError,
          Awaited<ReturnType<typeof getApiV1EmulationClassifications>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1EmulationClassifications<TData = Awaited<ReturnType<typeof getApiV1EmulationClassifications>>, TError = unknown>(
 params?: GetApiV1EmulationClassificationsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1EmulationClassifications>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1EmulationClassifications>>,
          TError,
          Awaited<ReturnType<typeof getApiV1EmulationClassifications>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1EmulationClassifications<TData = Awaited<ReturnType<typeof getApiV1EmulationClassifications>>, TError = unknown>(
 params?: GetApiV1EmulationClassificationsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1EmulationClassifications>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1EmulationClassifications<TData = Awaited<ReturnType<typeof getApiV1EmulationClassifications>>, TError = unknown>(
 params?: GetApiV1EmulationClassificationsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1EmulationClassifications>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1EmulationClassificationsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const getApiV1EmulationClassificationsId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/emulation-classifications/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1EmulationClassificationsIdQueryKey = (id: string,) => {
    return [
    `/api/v1/emulation-classifications/${id}`
    ] as const;
    }


export const getGetApiV1EmulationClassificationsIdQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1EmulationClassificationsId>>, TError = unknown>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1EmulationClassificationsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1EmulationClassificationsIdQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1EmulationClassificationsId>>> = ({ signal }) => getApiV1EmulationClassificationsId(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1EmulationClassificationsId>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1EmulationClassificationsIdQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1EmulationClassificationsId>>>
export type GetApiV1EmulationClassificationsIdQueryError = unknown


export function useGetApiV1EmulationClassificationsId<TData = Awaited<ReturnType<typeof getApiV1EmulationClassificationsId>>, TError = unknown>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1EmulationClassificationsId>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1EmulationClassificationsId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1EmulationClassificationsId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1EmulationClassificationsId<TData = Awaited<ReturnType<typeof getApiV1EmulationClassificationsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1EmulationClassificationsId>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1EmulationClassificationsId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1EmulationClassificationsId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1EmulationClassificationsId<TData = Awaited<ReturnType<typeof getApiV1EmulationClassificationsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1EmulationClassificationsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1EmulationClassificationsId<TData = Awaited<ReturnType<typeof getApiV1EmulationClassificationsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1EmulationClassificationsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1EmulationClassificationsIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const putApiV1EmulationClassificationsId = (
    id: string,
    updateEmulationClassificationRequest?: UpdateEmulationClassificationRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/emulation-classifications/${id}`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: updateEmulationClassificationRequest, signal
    },
      options);
    }




export const getPutApiV1EmulationClassificationsIdMutationKey = () => ['putApiV1EmulationClassificationsId'] as const;

export const getPutApiV1EmulationClassificationsIdMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putApiV1EmulationClassificationsId>>, TError,PutApiV1EmulationClassificationsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof putApiV1EmulationClassificationsId>>, TError,PutApiV1EmulationClassificationsIdMutationVariables, TContext> => {

const mutationKey = getPutApiV1EmulationClassificationsIdMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof putApiV1EmulationClassificationsId>>, PutApiV1EmulationClassificationsIdMutationVariables> = (props) => {
          const {id,data} = props ?? {};

          return  putApiV1EmulationClassificationsId(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PutApiV1EmulationClassificationsIdMutationResult = NonNullable<Awaited<ReturnType<typeof putApiV1EmulationClassificationsId>>>
    export type PutApiV1EmulationClassificationsIdMutationBody = UpdateEmulationClassificationRequest | undefined
    export type PutApiV1EmulationClassificationsIdMutationError = unknown
    export type PutApiV1EmulationClassificationsIdMutationVariables = {id: string;data?: UpdateEmulationClassificationRequest}

    export const usePutApiV1EmulationClassificationsId = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putApiV1EmulationClassificationsId>>, TError,PutApiV1EmulationClassificationsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof putApiV1EmulationClassificationsId>>,
        TError,
        PutApiV1EmulationClassificationsIdMutationVariables,
        TContext
      > => {
      return useMutation(getPutApiV1EmulationClassificationsIdMutationOptions(options), queryClient);
    }
    export const deleteApiV1EmulationClassificationsId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/emulation-classifications/${id}`, method: 'DELETE', signal
    },
      options);
    }




export const getDeleteApiV1EmulationClassificationsIdMutationKey = () => ['deleteApiV1EmulationClassificationsId'] as const;

export const getDeleteApiV1EmulationClassificationsIdMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1EmulationClassificationsId>>, TError,DeleteApiV1EmulationClassificationsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1EmulationClassificationsId>>, TError,DeleteApiV1EmulationClassificationsIdMutationVariables, TContext> => {

const mutationKey = getDeleteApiV1EmulationClassificationsIdMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteApiV1EmulationClassificationsId>>, DeleteApiV1EmulationClassificationsIdMutationVariables> = (props) => {
          const {id} = props ?? {};

          return  deleteApiV1EmulationClassificationsId(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteApiV1EmulationClassificationsIdMutationResult = NonNullable<Awaited<ReturnType<typeof deleteApiV1EmulationClassificationsId>>>

    export type DeleteApiV1EmulationClassificationsIdMutationError = unknown
    export type DeleteApiV1EmulationClassificationsIdMutationVariables = {id: string}

    export const useDeleteApiV1EmulationClassificationsId = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1EmulationClassificationsId>>, TError,DeleteApiV1EmulationClassificationsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteApiV1EmulationClassificationsId>>,
        TError,
        DeleteApiV1EmulationClassificationsIdMutationVariables,
        TContext
      > => {
      return useMutation(getDeleteApiV1EmulationClassificationsIdMutationOptions(options), queryClient);
    }
