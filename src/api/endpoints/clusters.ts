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
  AssignClusterWardRequest,
  CreateClusterRequest,
  UpdateClusterRequest
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

export const getApiV1Clusters = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/clusters`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1ClustersQueryKey = () =>
    apiQueryKey({  }, { url: `/api/v1/clusters` });


export const useGetApiV1ClustersQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1Clusters>>, TError = unknown>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Clusters>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  apiQueryKey({  }, { url: `/api/v1/clusters`, queryOptions });



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1Clusters>>> = ({ signal }) => getApiV1Clusters(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1Clusters>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1ClustersQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1Clusters>>>
export type GetApiV1ClustersQueryError = unknown


export function useGetApiV1Clusters<TData = Awaited<ReturnType<typeof getApiV1Clusters>>, TError = unknown>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Clusters>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1Clusters>>,
          TError,
          Awaited<ReturnType<typeof getApiV1Clusters>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1Clusters<TData = Awaited<ReturnType<typeof getApiV1Clusters>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Clusters>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1Clusters>>,
          TError,
          Awaited<ReturnType<typeof getApiV1Clusters>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1Clusters<TData = Awaited<ReturnType<typeof getApiV1Clusters>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Clusters>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1Clusters<TData = Awaited<ReturnType<typeof getApiV1Clusters>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Clusters>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = useGetApiV1ClustersQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const postApiV1Clusters = (
    createClusterRequest?: CreateClusterRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/clusters`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createClusterRequest, signal
    },
      options);
    }




export const getPostApiV1ClustersMutationKey = () => ['postApiV1Clusters'] as const;

export const getPostApiV1ClustersMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1Clusters>>, TError,PostApiV1ClustersMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1Clusters>>, TError,PostApiV1ClustersMutationVariables, TContext> => {

const mutationKey = getPostApiV1ClustersMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1Clusters>>, PostApiV1ClustersMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1Clusters(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1ClustersMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1Clusters>>>
    export type PostApiV1ClustersMutationBody = CreateClusterRequest | undefined
    export type PostApiV1ClustersMutationError = unknown
    export type PostApiV1ClustersMutationVariables = {data?: CreateClusterRequest}

    export const usePostApiV1Clusters = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1Clusters>>, TError,PostApiV1ClustersMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1Clusters>>,
        TError,
        PostApiV1ClustersMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1ClustersMutationOptions(options), queryClient);
    }
    export const getApiV1ClustersAvailableWards = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/clusters/available-wards`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1ClustersAvailableWardsQueryKey = () =>
    apiQueryKey({  }, { url: `/api/v1/clusters/available-wards` });


export const useGetApiV1ClustersAvailableWardsQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1ClustersAvailableWards>>, TError = unknown>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ClustersAvailableWards>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  apiQueryKey({  }, { url: `/api/v1/clusters/available-wards`, queryOptions });



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1ClustersAvailableWards>>> = ({ signal }) => getApiV1ClustersAvailableWards(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1ClustersAvailableWards>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1ClustersAvailableWardsQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1ClustersAvailableWards>>>
export type GetApiV1ClustersAvailableWardsQueryError = unknown


export function useGetApiV1ClustersAvailableWards<TData = Awaited<ReturnType<typeof getApiV1ClustersAvailableWards>>, TError = unknown>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ClustersAvailableWards>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ClustersAvailableWards>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ClustersAvailableWards>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ClustersAvailableWards<TData = Awaited<ReturnType<typeof getApiV1ClustersAvailableWards>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ClustersAvailableWards>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ClustersAvailableWards>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ClustersAvailableWards>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ClustersAvailableWards<TData = Awaited<ReturnType<typeof getApiV1ClustersAvailableWards>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ClustersAvailableWards>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1ClustersAvailableWards<TData = Awaited<ReturnType<typeof getApiV1ClustersAvailableWards>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ClustersAvailableWards>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = useGetApiV1ClustersAvailableWardsQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const getApiV1ClustersId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/clusters/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1ClustersIdQueryKey = (id: string,) =>
    apiQueryKey({ id }, { url: `/api/v1/clusters/${id}` });


export const useGetApiV1ClustersIdQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1ClustersId>>, TError = unknown>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ClustersId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  apiQueryKey({ id }, { url: `/api/v1/clusters/${id}`, queryOptions });



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1ClustersId>>> = ({ signal }) => getApiV1ClustersId(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1ClustersId>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1ClustersIdQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1ClustersId>>>
export type GetApiV1ClustersIdQueryError = unknown


export function useGetApiV1ClustersId<TData = Awaited<ReturnType<typeof getApiV1ClustersId>>, TError = unknown>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ClustersId>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ClustersId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ClustersId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ClustersId<TData = Awaited<ReturnType<typeof getApiV1ClustersId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ClustersId>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ClustersId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ClustersId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ClustersId<TData = Awaited<ReturnType<typeof getApiV1ClustersId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ClustersId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1ClustersId<TData = Awaited<ReturnType<typeof getApiV1ClustersId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ClustersId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = useGetApiV1ClustersIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const putApiV1ClustersId = (
    id: string,
    updateClusterRequest?: UpdateClusterRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/clusters/${id}`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: updateClusterRequest, signal
    },
      options);
    }




export const getPutApiV1ClustersIdMutationKey = () => ['putApiV1ClustersId'] as const;

export const getPutApiV1ClustersIdMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putApiV1ClustersId>>, TError,PutApiV1ClustersIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof putApiV1ClustersId>>, TError,PutApiV1ClustersIdMutationVariables, TContext> => {

const mutationKey = getPutApiV1ClustersIdMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof putApiV1ClustersId>>, PutApiV1ClustersIdMutationVariables> = (props) => {
          const {id,data} = props ?? {};

          return  putApiV1ClustersId(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PutApiV1ClustersIdMutationResult = NonNullable<Awaited<ReturnType<typeof putApiV1ClustersId>>>
    export type PutApiV1ClustersIdMutationBody = UpdateClusterRequest | undefined
    export type PutApiV1ClustersIdMutationError = unknown
    export type PutApiV1ClustersIdMutationVariables = {id: string;data?: UpdateClusterRequest}

    export const usePutApiV1ClustersId = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putApiV1ClustersId>>, TError,PutApiV1ClustersIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof putApiV1ClustersId>>,
        TError,
        PutApiV1ClustersIdMutationVariables,
        TContext
      > => {
      return useMutation(getPutApiV1ClustersIdMutationOptions(options), queryClient);
    }
    export const deleteApiV1ClustersId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/clusters/${id}`, method: 'DELETE', signal
    },
      options);
    }




export const getDeleteApiV1ClustersIdMutationKey = () => ['deleteApiV1ClustersId'] as const;

export const getDeleteApiV1ClustersIdMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1ClustersId>>, TError,DeleteApiV1ClustersIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1ClustersId>>, TError,DeleteApiV1ClustersIdMutationVariables, TContext> => {

const mutationKey = getDeleteApiV1ClustersIdMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteApiV1ClustersId>>, DeleteApiV1ClustersIdMutationVariables> = (props) => {
          const {id} = props ?? {};

          return  deleteApiV1ClustersId(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteApiV1ClustersIdMutationResult = NonNullable<Awaited<ReturnType<typeof deleteApiV1ClustersId>>>

    export type DeleteApiV1ClustersIdMutationError = unknown
    export type DeleteApiV1ClustersIdMutationVariables = {id: string}

    export const useDeleteApiV1ClustersId = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1ClustersId>>, TError,DeleteApiV1ClustersIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteApiV1ClustersId>>,
        TError,
        DeleteApiV1ClustersIdMutationVariables,
        TContext
      > => {
      return useMutation(getDeleteApiV1ClustersIdMutationOptions(options), queryClient);
    }
    export const postApiV1ClustersIdWards = (
    id: string,
    assignClusterWardRequest?: AssignClusterWardRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/clusters/${id}/wards`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: assignClusterWardRequest, signal
    },
      options);
    }




export const getPostApiV1ClustersIdWardsMutationKey = () => ['postApiV1ClustersIdWards'] as const;

export const getPostApiV1ClustersIdWardsMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1ClustersIdWards>>, TError,PostApiV1ClustersIdWardsMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1ClustersIdWards>>, TError,PostApiV1ClustersIdWardsMutationVariables, TContext> => {

const mutationKey = getPostApiV1ClustersIdWardsMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1ClustersIdWards>>, PostApiV1ClustersIdWardsMutationVariables> = (props) => {
          const {id,data} = props ?? {};

          return  postApiV1ClustersIdWards(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1ClustersIdWardsMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1ClustersIdWards>>>
    export type PostApiV1ClustersIdWardsMutationBody = AssignClusterWardRequest | undefined
    export type PostApiV1ClustersIdWardsMutationError = unknown
    export type PostApiV1ClustersIdWardsMutationVariables = {id: string;data?: AssignClusterWardRequest}

    export const usePostApiV1ClustersIdWards = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1ClustersIdWards>>, TError,PostApiV1ClustersIdWardsMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1ClustersIdWards>>,
        TError,
        PostApiV1ClustersIdWardsMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1ClustersIdWardsMutationOptions(options), queryClient);
    }
    export const deleteApiV1ClustersIdWardsWardCode = (
    id: string,
    wardCode: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/clusters/${id}/wards/${wardCode}`, method: 'DELETE', signal
    },
      options);
    }




export const getDeleteApiV1ClustersIdWardsWardCodeMutationKey = () => ['deleteApiV1ClustersIdWardsWardCode'] as const;

export const getDeleteApiV1ClustersIdWardsWardCodeMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1ClustersIdWardsWardCode>>, TError,DeleteApiV1ClustersIdWardsWardCodeMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1ClustersIdWardsWardCode>>, TError,DeleteApiV1ClustersIdWardsWardCodeMutationVariables, TContext> => {

const mutationKey = getDeleteApiV1ClustersIdWardsWardCodeMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteApiV1ClustersIdWardsWardCode>>, DeleteApiV1ClustersIdWardsWardCodeMutationVariables> = (props) => {
          const {id,wardCode} = props ?? {};

          return  deleteApiV1ClustersIdWardsWardCode(id,wardCode,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteApiV1ClustersIdWardsWardCodeMutationResult = NonNullable<Awaited<ReturnType<typeof deleteApiV1ClustersIdWardsWardCode>>>

    export type DeleteApiV1ClustersIdWardsWardCodeMutationError = unknown
    export type DeleteApiV1ClustersIdWardsWardCodeMutationVariables = {id: string;wardCode: string}

    export const useDeleteApiV1ClustersIdWardsWardCode = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1ClustersIdWardsWardCode>>, TError,DeleteApiV1ClustersIdWardsWardCodeMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteApiV1ClustersIdWardsWardCode>>,
        TError,
        DeleteApiV1ClustersIdWardsWardCodeMutationVariables,
        TContext
      > => {
      return useMutation(getDeleteApiV1ClustersIdWardsWardCodeMutationOptions(options), queryClient);
    }
