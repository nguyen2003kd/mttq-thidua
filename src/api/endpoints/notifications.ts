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
  GetApiV1NotificationsParams
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

export const getApiV1NotificationsStream = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/notifications/stream`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1NotificationsStreamQueryKey = () => {
    return [
    `/api/v1/notifications/stream`
    ] as const;
    }


export const getGetApiV1NotificationsStreamQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1NotificationsStream>>, TError = unknown>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1NotificationsStream>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1NotificationsStreamQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1NotificationsStream>>> = ({ signal }) => getApiV1NotificationsStream(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1NotificationsStream>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1NotificationsStreamQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1NotificationsStream>>>
export type GetApiV1NotificationsStreamQueryError = unknown


export function useGetApiV1NotificationsStream<TData = Awaited<ReturnType<typeof getApiV1NotificationsStream>>, TError = unknown>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1NotificationsStream>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1NotificationsStream>>,
          TError,
          Awaited<ReturnType<typeof getApiV1NotificationsStream>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1NotificationsStream<TData = Awaited<ReturnType<typeof getApiV1NotificationsStream>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1NotificationsStream>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1NotificationsStream>>,
          TError,
          Awaited<ReturnType<typeof getApiV1NotificationsStream>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1NotificationsStream<TData = Awaited<ReturnType<typeof getApiV1NotificationsStream>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1NotificationsStream>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1NotificationsStream<TData = Awaited<ReturnType<typeof getApiV1NotificationsStream>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1NotificationsStream>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1NotificationsStreamQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const getApiV1Notifications = (
    params?: GetApiV1NotificationsParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/notifications`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetApiV1NotificationsQueryKey = (params?: GetApiV1NotificationsParams,) => {
    return [
    `/api/v1/notifications`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetApiV1NotificationsQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1Notifications>>, TError = unknown>(params?: GetApiV1NotificationsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Notifications>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1NotificationsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1Notifications>>> = ({ signal }) => getApiV1Notifications(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1Notifications>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1NotificationsQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1Notifications>>>
export type GetApiV1NotificationsQueryError = unknown


export function useGetApiV1Notifications<TData = Awaited<ReturnType<typeof getApiV1Notifications>>, TError = unknown>(
 params: undefined |  GetApiV1NotificationsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Notifications>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1Notifications>>,
          TError,
          Awaited<ReturnType<typeof getApiV1Notifications>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1Notifications<TData = Awaited<ReturnType<typeof getApiV1Notifications>>, TError = unknown>(
 params?: GetApiV1NotificationsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Notifications>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1Notifications>>,
          TError,
          Awaited<ReturnType<typeof getApiV1Notifications>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1Notifications<TData = Awaited<ReturnType<typeof getApiV1Notifications>>, TError = unknown>(
 params?: GetApiV1NotificationsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Notifications>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1Notifications<TData = Awaited<ReturnType<typeof getApiV1Notifications>>, TError = unknown>(
 params?: GetApiV1NotificationsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Notifications>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1NotificationsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const getApiV1NotificationsUnreadCount = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/notifications/unread-count`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1NotificationsUnreadCountQueryKey = () => {
    return [
    `/api/v1/notifications/unread-count`
    ] as const;
    }


export const getGetApiV1NotificationsUnreadCountQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1NotificationsUnreadCount>>, TError = unknown>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1NotificationsUnreadCount>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1NotificationsUnreadCountQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1NotificationsUnreadCount>>> = ({ signal }) => getApiV1NotificationsUnreadCount(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1NotificationsUnreadCount>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1NotificationsUnreadCountQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1NotificationsUnreadCount>>>
export type GetApiV1NotificationsUnreadCountQueryError = unknown


export function useGetApiV1NotificationsUnreadCount<TData = Awaited<ReturnType<typeof getApiV1NotificationsUnreadCount>>, TError = unknown>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1NotificationsUnreadCount>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1NotificationsUnreadCount>>,
          TError,
          Awaited<ReturnType<typeof getApiV1NotificationsUnreadCount>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1NotificationsUnreadCount<TData = Awaited<ReturnType<typeof getApiV1NotificationsUnreadCount>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1NotificationsUnreadCount>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1NotificationsUnreadCount>>,
          TError,
          Awaited<ReturnType<typeof getApiV1NotificationsUnreadCount>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1NotificationsUnreadCount<TData = Awaited<ReturnType<typeof getApiV1NotificationsUnreadCount>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1NotificationsUnreadCount>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1NotificationsUnreadCount<TData = Awaited<ReturnType<typeof getApiV1NotificationsUnreadCount>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1NotificationsUnreadCount>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1NotificationsUnreadCountQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const postApiV1NotificationsMessageIdRead = (
    messageId: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/notifications/${messageId}/read`, method: 'POST', signal
    },
      options);
    }




export const getPostApiV1NotificationsMessageIdReadMutationKey = () => ['postApiV1NotificationsMessageIdRead'] as const;

export const getPostApiV1NotificationsMessageIdReadMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1NotificationsMessageIdRead>>, TError,PostApiV1NotificationsMessageIdReadMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1NotificationsMessageIdRead>>, TError,PostApiV1NotificationsMessageIdReadMutationVariables, TContext> => {

const mutationKey = getPostApiV1NotificationsMessageIdReadMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1NotificationsMessageIdRead>>, PostApiV1NotificationsMessageIdReadMutationVariables> = (props) => {
          const {messageId} = props ?? {};

          return  postApiV1NotificationsMessageIdRead(messageId,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1NotificationsMessageIdReadMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1NotificationsMessageIdRead>>>

    export type PostApiV1NotificationsMessageIdReadMutationError = unknown
    export type PostApiV1NotificationsMessageIdReadMutationVariables = {messageId: string}

    export const usePostApiV1NotificationsMessageIdRead = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1NotificationsMessageIdRead>>, TError,PostApiV1NotificationsMessageIdReadMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1NotificationsMessageIdRead>>,
        TError,
        PostApiV1NotificationsMessageIdReadMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1NotificationsMessageIdReadMutationOptions(options), queryClient);
    }
    export const postApiV1NotificationsReadAll = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/notifications/read-all`, method: 'POST', signal
    },
      options);
    }




export const getPostApiV1NotificationsReadAllMutationKey = () => ['postApiV1NotificationsReadAll'] as const;

export const getPostApiV1NotificationsReadAllMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1NotificationsReadAll>>, TError,void, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1NotificationsReadAll>>, TError,void, TContext> => {

const mutationKey = getPostApiV1NotificationsReadAllMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1NotificationsReadAll>>, void> = () => {


          return  postApiV1NotificationsReadAll(requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1NotificationsReadAllMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1NotificationsReadAll>>>

    export type PostApiV1NotificationsReadAllMutationError = unknown


    export const usePostApiV1NotificationsReadAll = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1NotificationsReadAll>>, TError,void, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1NotificationsReadAll>>,
        TError,
        void,
        TContext
      > => {
      return useMutation(getPostApiV1NotificationsReadAllMutationOptions(options), queryClient);
    }
