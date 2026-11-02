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
  CreateScoringConfigRequest,
  GetApiV1ScoringConfigsParams,
  UpdateScoringConfigRequest
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

export const getApiV1ScoringConfigs = (
    params?: GetApiV1ScoringConfigsParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/scoring-configs`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetApiV1ScoringConfigsQueryKey = (params?: GetApiV1ScoringConfigsParams,) =>
    apiQueryKey({ params }, { url: `/api/v1/scoring-configs` });


export const useGetApiV1ScoringConfigsQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1ScoringConfigs>>, TError = unknown>(params?: GetApiV1ScoringConfigsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ScoringConfigs>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  apiQueryKey({ params }, { url: `/api/v1/scoring-configs`, queryOptions });



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1ScoringConfigs>>> = ({ signal }) => getApiV1ScoringConfigs(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1ScoringConfigs>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1ScoringConfigsQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1ScoringConfigs>>>
export type GetApiV1ScoringConfigsQueryError = unknown


export function useGetApiV1ScoringConfigs<TData = Awaited<ReturnType<typeof getApiV1ScoringConfigs>>, TError = unknown>(
 params: undefined |  GetApiV1ScoringConfigsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ScoringConfigs>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ScoringConfigs>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ScoringConfigs>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ScoringConfigs<TData = Awaited<ReturnType<typeof getApiV1ScoringConfigs>>, TError = unknown>(
 params?: GetApiV1ScoringConfigsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ScoringConfigs>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ScoringConfigs>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ScoringConfigs>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ScoringConfigs<TData = Awaited<ReturnType<typeof getApiV1ScoringConfigs>>, TError = unknown>(
 params?: GetApiV1ScoringConfigsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ScoringConfigs>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1ScoringConfigs<TData = Awaited<ReturnType<typeof getApiV1ScoringConfigs>>, TError = unknown>(
 params?: GetApiV1ScoringConfigsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ScoringConfigs>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = useGetApiV1ScoringConfigsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const postApiV1ScoringConfigs = (
    createScoringConfigRequest?: CreateScoringConfigRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/scoring-configs`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createScoringConfigRequest, signal
    },
      options);
    }




export const getPostApiV1ScoringConfigsMutationKey = () => ['postApiV1ScoringConfigs'] as const;

export const getPostApiV1ScoringConfigsMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1ScoringConfigs>>, TError,PostApiV1ScoringConfigsMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1ScoringConfigs>>, TError,PostApiV1ScoringConfigsMutationVariables, TContext> => {

const mutationKey = getPostApiV1ScoringConfigsMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1ScoringConfigs>>, PostApiV1ScoringConfigsMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1ScoringConfigs(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1ScoringConfigsMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1ScoringConfigs>>>
    export type PostApiV1ScoringConfigsMutationBody = CreateScoringConfigRequest | undefined
    export type PostApiV1ScoringConfigsMutationError = unknown
    export type PostApiV1ScoringConfigsMutationVariables = {data?: CreateScoringConfigRequest}

    export const usePostApiV1ScoringConfigs = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1ScoringConfigs>>, TError,PostApiV1ScoringConfigsMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1ScoringConfigs>>,
        TError,
        PostApiV1ScoringConfigsMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1ScoringConfigsMutationOptions(options), queryClient);
    }
    export const getApiV1ScoringConfigsId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/scoring-configs/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1ScoringConfigsIdQueryKey = (id: string,) =>
    apiQueryKey({ id }, { url: `/api/v1/scoring-configs/${id}` });


export const useGetApiV1ScoringConfigsIdQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1ScoringConfigsId>>, TError = unknown>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ScoringConfigsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  apiQueryKey({ id }, { url: `/api/v1/scoring-configs/${id}`, queryOptions });



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1ScoringConfigsId>>> = ({ signal }) => getApiV1ScoringConfigsId(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1ScoringConfigsId>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1ScoringConfigsIdQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1ScoringConfigsId>>>
export type GetApiV1ScoringConfigsIdQueryError = unknown


export function useGetApiV1ScoringConfigsId<TData = Awaited<ReturnType<typeof getApiV1ScoringConfigsId>>, TError = unknown>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ScoringConfigsId>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ScoringConfigsId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ScoringConfigsId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ScoringConfigsId<TData = Awaited<ReturnType<typeof getApiV1ScoringConfigsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ScoringConfigsId>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ScoringConfigsId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ScoringConfigsId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ScoringConfigsId<TData = Awaited<ReturnType<typeof getApiV1ScoringConfigsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ScoringConfigsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1ScoringConfigsId<TData = Awaited<ReturnType<typeof getApiV1ScoringConfigsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ScoringConfigsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = useGetApiV1ScoringConfigsIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const putApiV1ScoringConfigsId = (
    id: string,
    updateScoringConfigRequest?: UpdateScoringConfigRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/scoring-configs/${id}`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: updateScoringConfigRequest, signal
    },
      options);
    }




export const getPutApiV1ScoringConfigsIdMutationKey = () => ['putApiV1ScoringConfigsId'] as const;

export const getPutApiV1ScoringConfigsIdMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putApiV1ScoringConfigsId>>, TError,PutApiV1ScoringConfigsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof putApiV1ScoringConfigsId>>, TError,PutApiV1ScoringConfigsIdMutationVariables, TContext> => {

const mutationKey = getPutApiV1ScoringConfigsIdMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof putApiV1ScoringConfigsId>>, PutApiV1ScoringConfigsIdMutationVariables> = (props) => {
          const {id,data} = props ?? {};

          return  putApiV1ScoringConfigsId(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PutApiV1ScoringConfigsIdMutationResult = NonNullable<Awaited<ReturnType<typeof putApiV1ScoringConfigsId>>>
    export type PutApiV1ScoringConfigsIdMutationBody = UpdateScoringConfigRequest | undefined
    export type PutApiV1ScoringConfigsIdMutationError = unknown
    export type PutApiV1ScoringConfigsIdMutationVariables = {id: string;data?: UpdateScoringConfigRequest}

    export const usePutApiV1ScoringConfigsId = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putApiV1ScoringConfigsId>>, TError,PutApiV1ScoringConfigsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof putApiV1ScoringConfigsId>>,
        TError,
        PutApiV1ScoringConfigsIdMutationVariables,
        TContext
      > => {
      return useMutation(getPutApiV1ScoringConfigsIdMutationOptions(options), queryClient);
    }
    export const deleteApiV1ScoringConfigsId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/scoring-configs/${id}`, method: 'DELETE', signal
    },
      options);
    }




export const getDeleteApiV1ScoringConfigsIdMutationKey = () => ['deleteApiV1ScoringConfigsId'] as const;

export const getDeleteApiV1ScoringConfigsIdMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1ScoringConfigsId>>, TError,DeleteApiV1ScoringConfigsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1ScoringConfigsId>>, TError,DeleteApiV1ScoringConfigsIdMutationVariables, TContext> => {

const mutationKey = getDeleteApiV1ScoringConfigsIdMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteApiV1ScoringConfigsId>>, DeleteApiV1ScoringConfigsIdMutationVariables> = (props) => {
          const {id} = props ?? {};

          return  deleteApiV1ScoringConfigsId(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteApiV1ScoringConfigsIdMutationResult = NonNullable<Awaited<ReturnType<typeof deleteApiV1ScoringConfigsId>>>

    export type DeleteApiV1ScoringConfigsIdMutationError = unknown
    export type DeleteApiV1ScoringConfigsIdMutationVariables = {id: string}

    export const useDeleteApiV1ScoringConfigsId = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1ScoringConfigsId>>, TError,DeleteApiV1ScoringConfigsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteApiV1ScoringConfigsId>>,
        TError,
        DeleteApiV1ScoringConfigsIdMutationVariables,
        TContext
      > => {
      return useMutation(getDeleteApiV1ScoringConfigsIdMutationOptions(options), queryClient);
    }
