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
  DeleteNotification200,
  ErrorResponse,
  GetNotificationDevices200,
  GetNotificationPreferences200,
  GetNotificationsParams,
  MarkNotificationsAsRead200,
  MarkNotificationsAsReadParams,
  NotificationDeviceRegister,
  NotificationListResponse,
  NotificationMutateBody,
  NotificationPreferenceUpdate,
  NotificationResponse,
  RegisterNotificationDevice200,
  UnreadCountResponse,
  UnregisterNotificationDevice200,
  UpdateNotificationPreferences200
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

/**
 * Returns paginated notifications for the authenticated user, including unread count.
 * @summary Get notifications of current user
 */
export const getNotifications = (
    params?: GetNotificationsParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<NotificationListResponse>(
      {url: `/api/v1/notifications`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetNotificationsQueryKey = (params?: GetNotificationsParams,) => {
    return [
    `/api/v1/notifications`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetNotificationsQueryOptions = <TData = Awaited<ReturnType<typeof getNotifications>>, TError = ErrorResponse>(params?: GetNotificationsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotifications>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetNotificationsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getNotifications>>> = ({ signal }) => getNotifications(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getNotifications>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetNotificationsQueryResult = NonNullable<Awaited<ReturnType<typeof getNotifications>>>
export type GetNotificationsQueryError = ErrorResponse


export function useGetNotifications<TData = Awaited<ReturnType<typeof getNotifications>>, TError = ErrorResponse>(
 params: undefined |  GetNotificationsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotifications>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getNotifications>>,
          TError,
          Awaited<ReturnType<typeof getNotifications>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetNotifications<TData = Awaited<ReturnType<typeof getNotifications>>, TError = ErrorResponse>(
 params?: GetNotificationsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotifications>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getNotifications>>,
          TError,
          Awaited<ReturnType<typeof getNotifications>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetNotifications<TData = Awaited<ReturnType<typeof getNotifications>>, TError = ErrorResponse>(
 params?: GetNotificationsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotifications>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get notifications of current user
 */

export function useGetNotifications<TData = Awaited<ReturnType<typeof getNotifications>>, TError = ErrorResponse>(
 params?: GetNotificationsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotifications>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetNotificationsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Create and send notification
 */
export const createNotification = (
    notificationMutateBody: NotificationMutateBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<NotificationResponse>(
      {url: `/api/v1/notifications`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: notificationMutateBody, signal
    },
      options);
    }




export const getCreateNotificationQueryKey = (notificationMutateBody?: NotificationMutateBody,) => {
    return [
    'POST', `/api/v1/notifications`, notificationMutateBody
    ] as const;
    }


export const getCreateNotificationQueryOptions = <TData = Awaited<ReturnType<typeof createNotification>>, TError = ErrorResponse>(notificationMutateBody: NotificationMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof createNotification>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getCreateNotificationQueryKey(notificationMutateBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof createNotification>>> = ({ signal }) => createNotification(notificationMutateBody, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof createNotification>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type CreateNotificationQueryResult = NonNullable<Awaited<ReturnType<typeof createNotification>>>
export type CreateNotificationQueryError = ErrorResponse


export function useCreateNotification<TData = Awaited<ReturnType<typeof createNotification>>, TError = ErrorResponse>(
 notificationMutateBody: NotificationMutateBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof createNotification>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof createNotification>>,
          TError,
          Awaited<ReturnType<typeof createNotification>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useCreateNotification<TData = Awaited<ReturnType<typeof createNotification>>, TError = ErrorResponse>(
 notificationMutateBody: NotificationMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof createNotification>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof createNotification>>,
          TError,
          Awaited<ReturnType<typeof createNotification>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useCreateNotification<TData = Awaited<ReturnType<typeof createNotification>>, TError = ErrorResponse>(
 notificationMutateBody: NotificationMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof createNotification>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Create and send notification
 */

export function useCreateNotification<TData = Awaited<ReturnType<typeof createNotification>>, TError = ErrorResponse>(
 notificationMutateBody: NotificationMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof createNotification>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getCreateNotificationQueryOptions(notificationMutateBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Get notification by ID
 */
export const getNotificationById = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<NotificationResponse>(
      {url: `/api/v1/notifications/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetNotificationByIdQueryKey = (id: string,) => {
    return [
    `/api/v1/notifications/${id}`
    ] as const;
    }


export const getGetNotificationByIdQueryOptions = <TData = Awaited<ReturnType<typeof getNotificationById>>, TError = ErrorResponse>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotificationById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetNotificationByIdQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getNotificationById>>> = ({ signal }) => getNotificationById(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getNotificationById>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetNotificationByIdQueryResult = NonNullable<Awaited<ReturnType<typeof getNotificationById>>>
export type GetNotificationByIdQueryError = ErrorResponse


export function useGetNotificationById<TData = Awaited<ReturnType<typeof getNotificationById>>, TError = ErrorResponse>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotificationById>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getNotificationById>>,
          TError,
          Awaited<ReturnType<typeof getNotificationById>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetNotificationById<TData = Awaited<ReturnType<typeof getNotificationById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotificationById>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getNotificationById>>,
          TError,
          Awaited<ReturnType<typeof getNotificationById>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetNotificationById<TData = Awaited<ReturnType<typeof getNotificationById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotificationById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get notification by ID
 */

export function useGetNotificationById<TData = Awaited<ReturnType<typeof getNotificationById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotificationById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetNotificationByIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Delete notification
 */
export const deleteNotification = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<DeleteNotification200>(
      {url: `/api/v1/notifications/${id}`, method: 'DELETE', signal
    },
      options);
    }




export const getDeleteNotificationQueryKey = (id: string,) => {
    return [
    'DELETE', `/api/v1/notifications/${id}`
    ] as const;
    }


export const getDeleteNotificationQueryOptions = <TData = Awaited<ReturnType<typeof deleteNotification>>, TError = ErrorResponse>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteNotification>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getDeleteNotificationQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof deleteNotification>>> = ({ signal }) => deleteNotification(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof deleteNotification>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type DeleteNotificationQueryResult = NonNullable<Awaited<ReturnType<typeof deleteNotification>>>
export type DeleteNotificationQueryError = ErrorResponse


export function useDeleteNotification<TData = Awaited<ReturnType<typeof deleteNotification>>, TError = ErrorResponse>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteNotification>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof deleteNotification>>,
          TError,
          Awaited<ReturnType<typeof deleteNotification>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useDeleteNotification<TData = Awaited<ReturnType<typeof deleteNotification>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteNotification>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof deleteNotification>>,
          TError,
          Awaited<ReturnType<typeof deleteNotification>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useDeleteNotification<TData = Awaited<ReturnType<typeof deleteNotification>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteNotification>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Delete notification
 */

export function useDeleteNotification<TData = Awaited<ReturnType<typeof deleteNotification>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteNotification>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getDeleteNotificationQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Get the number of unread notifications for the current user
 * @summary Get unread notification count
 */
export const getUnreadNotificationCount = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<UnreadCountResponse>(
      {url: `/api/v1/notifications/unread-count`, method: 'GET', signal
    },
      options);
    }




export const getGetUnreadNotificationCountQueryKey = () => {
    return [
    `/api/v1/notifications/unread-count`
    ] as const;
    }


export const getGetUnreadNotificationCountQueryOptions = <TData = Awaited<ReturnType<typeof getUnreadNotificationCount>>, TError = ErrorResponse>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUnreadNotificationCount>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetUnreadNotificationCountQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getUnreadNotificationCount>>> = ({ signal }) => getUnreadNotificationCount(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getUnreadNotificationCount>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetUnreadNotificationCountQueryResult = NonNullable<Awaited<ReturnType<typeof getUnreadNotificationCount>>>
export type GetUnreadNotificationCountQueryError = ErrorResponse


export function useGetUnreadNotificationCount<TData = Awaited<ReturnType<typeof getUnreadNotificationCount>>, TError = ErrorResponse>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUnreadNotificationCount>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getUnreadNotificationCount>>,
          TError,
          Awaited<ReturnType<typeof getUnreadNotificationCount>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetUnreadNotificationCount<TData = Awaited<ReturnType<typeof getUnreadNotificationCount>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUnreadNotificationCount>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getUnreadNotificationCount>>,
          TError,
          Awaited<ReturnType<typeof getUnreadNotificationCount>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetUnreadNotificationCount<TData = Awaited<ReturnType<typeof getUnreadNotificationCount>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUnreadNotificationCount>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get unread notification count
 */

export function useGetUnreadNotificationCount<TData = Awaited<ReturnType<typeof getUnreadNotificationCount>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUnreadNotificationCount>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetUnreadNotificationCountQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Subscribe to real-time notifications using Server-Sent Events
 * @summary Subscribe to notifications via SSE
 */
export const subscribeToNotifications = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<string>(
      {url: `/api/v1/notifications/subscribe`, method: 'GET', signal
    },
      options);
    }




export const getSubscribeToNotificationsQueryKey = () => {
    return [
    `/api/v1/notifications/subscribe`
    ] as const;
    }


export const getSubscribeToNotificationsQueryOptions = <TData = Awaited<ReturnType<typeof subscribeToNotifications>>, TError = ErrorResponse>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof subscribeToNotifications>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getSubscribeToNotificationsQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof subscribeToNotifications>>> = ({ signal }) => subscribeToNotifications(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof subscribeToNotifications>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type SubscribeToNotificationsQueryResult = NonNullable<Awaited<ReturnType<typeof subscribeToNotifications>>>
export type SubscribeToNotificationsQueryError = ErrorResponse


export function useSubscribeToNotifications<TData = Awaited<ReturnType<typeof subscribeToNotifications>>, TError = ErrorResponse>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof subscribeToNotifications>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof subscribeToNotifications>>,
          TError,
          Awaited<ReturnType<typeof subscribeToNotifications>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useSubscribeToNotifications<TData = Awaited<ReturnType<typeof subscribeToNotifications>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof subscribeToNotifications>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof subscribeToNotifications>>,
          TError,
          Awaited<ReturnType<typeof subscribeToNotifications>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useSubscribeToNotifications<TData = Awaited<ReturnType<typeof subscribeToNotifications>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof subscribeToNotifications>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Subscribe to notifications via SSE
 */

export function useSubscribeToNotifications<TData = Awaited<ReturnType<typeof subscribeToNotifications>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof subscribeToNotifications>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getSubscribeToNotificationsQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Get notification preferences for the current user
 * @summary Get notification preferences
 */
export const getNotificationPreferences = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<GetNotificationPreferences200>(
      {url: `/api/v1/notifications/preferences`, method: 'GET', signal
    },
      options);
    }




export const getGetNotificationPreferencesQueryKey = () => {
    return [
    `/api/v1/notifications/preferences`
    ] as const;
    }


export const getGetNotificationPreferencesQueryOptions = <TData = Awaited<ReturnType<typeof getNotificationPreferences>>, TError = ErrorResponse>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotificationPreferences>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetNotificationPreferencesQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getNotificationPreferences>>> = ({ signal }) => getNotificationPreferences(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getNotificationPreferences>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetNotificationPreferencesQueryResult = NonNullable<Awaited<ReturnType<typeof getNotificationPreferences>>>
export type GetNotificationPreferencesQueryError = ErrorResponse


export function useGetNotificationPreferences<TData = Awaited<ReturnType<typeof getNotificationPreferences>>, TError = ErrorResponse>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotificationPreferences>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getNotificationPreferences>>,
          TError,
          Awaited<ReturnType<typeof getNotificationPreferences>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetNotificationPreferences<TData = Awaited<ReturnType<typeof getNotificationPreferences>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotificationPreferences>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getNotificationPreferences>>,
          TError,
          Awaited<ReturnType<typeof getNotificationPreferences>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetNotificationPreferences<TData = Awaited<ReturnType<typeof getNotificationPreferences>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotificationPreferences>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get notification preferences
 */

export function useGetNotificationPreferences<TData = Awaited<ReturnType<typeof getNotificationPreferences>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotificationPreferences>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetNotificationPreferencesQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Update notification preferences for the current user
 * @summary Update notification preferences
 */
export const updateNotificationPreferences = (
    notificationPreferenceUpdate: NotificationPreferenceUpdate,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<UpdateNotificationPreferences200>(
      {url: `/api/v1/notifications/preferences`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: notificationPreferenceUpdate, signal
    },
      options);
    }




export const getUpdateNotificationPreferencesQueryKey = (notificationPreferenceUpdate?: NotificationPreferenceUpdate,) => {
    return [
    'PUT', `/api/v1/notifications/preferences`, notificationPreferenceUpdate
    ] as const;
    }


export const getUpdateNotificationPreferencesQueryOptions = <TData = Awaited<ReturnType<typeof updateNotificationPreferences>>, TError = ErrorResponse>(notificationPreferenceUpdate: NotificationPreferenceUpdate, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateNotificationPreferences>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getUpdateNotificationPreferencesQueryKey(notificationPreferenceUpdate);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof updateNotificationPreferences>>> = ({ signal }) => updateNotificationPreferences(notificationPreferenceUpdate, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof updateNotificationPreferences>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type UpdateNotificationPreferencesQueryResult = NonNullable<Awaited<ReturnType<typeof updateNotificationPreferences>>>
export type UpdateNotificationPreferencesQueryError = ErrorResponse


export function useUpdateNotificationPreferences<TData = Awaited<ReturnType<typeof updateNotificationPreferences>>, TError = ErrorResponse>(
 notificationPreferenceUpdate: NotificationPreferenceUpdate, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateNotificationPreferences>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof updateNotificationPreferences>>,
          TError,
          Awaited<ReturnType<typeof updateNotificationPreferences>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useUpdateNotificationPreferences<TData = Awaited<ReturnType<typeof updateNotificationPreferences>>, TError = ErrorResponse>(
 notificationPreferenceUpdate: NotificationPreferenceUpdate, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateNotificationPreferences>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof updateNotificationPreferences>>,
          TError,
          Awaited<ReturnType<typeof updateNotificationPreferences>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useUpdateNotificationPreferences<TData = Awaited<ReturnType<typeof updateNotificationPreferences>>, TError = ErrorResponse>(
 notificationPreferenceUpdate: NotificationPreferenceUpdate, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateNotificationPreferences>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Update notification preferences
 */

export function useUpdateNotificationPreferences<TData = Awaited<ReturnType<typeof updateNotificationPreferences>>, TError = ErrorResponse>(
 notificationPreferenceUpdate: NotificationPreferenceUpdate, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateNotificationPreferences>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getUpdateNotificationPreferencesQueryOptions(notificationPreferenceUpdate,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Mark notifications as read
 */
export const markNotificationsAsRead = (
    params?: MarkNotificationsAsReadParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<MarkNotificationsAsRead200>(
      {url: `/api/v1/notifications/mark-as-read`, method: 'PUT',
        params, signal
    },
      options);
    }




export const getMarkNotificationsAsReadQueryKey = (params?: MarkNotificationsAsReadParams,) => {
    return [
    'PUT', `/api/v1/notifications/mark-as-read`, ...(params ? [params] : [])
    ] as const;
    }


export const getMarkNotificationsAsReadQueryOptions = <TData = Awaited<ReturnType<typeof markNotificationsAsRead>>, TError = ErrorResponse>(params?: MarkNotificationsAsReadParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof markNotificationsAsRead>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getMarkNotificationsAsReadQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof markNotificationsAsRead>>> = ({ signal }) => markNotificationsAsRead(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof markNotificationsAsRead>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type MarkNotificationsAsReadQueryResult = NonNullable<Awaited<ReturnType<typeof markNotificationsAsRead>>>
export type MarkNotificationsAsReadQueryError = ErrorResponse


export function useMarkNotificationsAsRead<TData = Awaited<ReturnType<typeof markNotificationsAsRead>>, TError = ErrorResponse>(
 params: undefined |  MarkNotificationsAsReadParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof markNotificationsAsRead>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof markNotificationsAsRead>>,
          TError,
          Awaited<ReturnType<typeof markNotificationsAsRead>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useMarkNotificationsAsRead<TData = Awaited<ReturnType<typeof markNotificationsAsRead>>, TError = ErrorResponse>(
 params?: MarkNotificationsAsReadParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof markNotificationsAsRead>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof markNotificationsAsRead>>,
          TError,
          Awaited<ReturnType<typeof markNotificationsAsRead>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useMarkNotificationsAsRead<TData = Awaited<ReturnType<typeof markNotificationsAsRead>>, TError = ErrorResponse>(
 params?: MarkNotificationsAsReadParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof markNotificationsAsRead>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Mark notifications as read
 */

export function useMarkNotificationsAsRead<TData = Awaited<ReturnType<typeof markNotificationsAsRead>>, TError = ErrorResponse>(
 params?: MarkNotificationsAsReadParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof markNotificationsAsRead>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getMarkNotificationsAsReadQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Get list of active notification devices for the current user
 * @summary Get user notification devices
 */
export const getNotificationDevices = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<GetNotificationDevices200>(
      {url: `/api/v1/notifications/devices`, method: 'GET', signal
    },
      options);
    }




export const getGetNotificationDevicesQueryKey = () => {
    return [
    `/api/v1/notifications/devices`
    ] as const;
    }


export const getGetNotificationDevicesQueryOptions = <TData = Awaited<ReturnType<typeof getNotificationDevices>>, TError = ErrorResponse>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotificationDevices>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetNotificationDevicesQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getNotificationDevices>>> = ({ signal }) => getNotificationDevices(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getNotificationDevices>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetNotificationDevicesQueryResult = NonNullable<Awaited<ReturnType<typeof getNotificationDevices>>>
export type GetNotificationDevicesQueryError = ErrorResponse


export function useGetNotificationDevices<TData = Awaited<ReturnType<typeof getNotificationDevices>>, TError = ErrorResponse>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotificationDevices>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getNotificationDevices>>,
          TError,
          Awaited<ReturnType<typeof getNotificationDevices>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetNotificationDevices<TData = Awaited<ReturnType<typeof getNotificationDevices>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotificationDevices>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getNotificationDevices>>,
          TError,
          Awaited<ReturnType<typeof getNotificationDevices>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetNotificationDevices<TData = Awaited<ReturnType<typeof getNotificationDevices>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotificationDevices>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get user notification devices
 */

export function useGetNotificationDevices<TData = Awaited<ReturnType<typeof getNotificationDevices>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getNotificationDevices>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetNotificationDevicesQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Register a new device for push notifications
 * @summary Register notification device
 */
export const registerNotificationDevice = (
    notificationDeviceRegister: NotificationDeviceRegister,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<RegisterNotificationDevice200>(
      {url: `/api/v1/notifications/devices`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: notificationDeviceRegister, signal
    },
      options);
    }




export const getRegisterNotificationDeviceQueryKey = (notificationDeviceRegister?: NotificationDeviceRegister,) => {
    return [
    'POST', `/api/v1/notifications/devices`, notificationDeviceRegister
    ] as const;
    }


export const getRegisterNotificationDeviceQueryOptions = <TData = Awaited<ReturnType<typeof registerNotificationDevice>>, TError = ErrorResponse>(notificationDeviceRegister: NotificationDeviceRegister, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof registerNotificationDevice>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getRegisterNotificationDeviceQueryKey(notificationDeviceRegister);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof registerNotificationDevice>>> = ({ signal }) => registerNotificationDevice(notificationDeviceRegister, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof registerNotificationDevice>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type RegisterNotificationDeviceQueryResult = NonNullable<Awaited<ReturnType<typeof registerNotificationDevice>>>
export type RegisterNotificationDeviceQueryError = ErrorResponse


export function useRegisterNotificationDevice<TData = Awaited<ReturnType<typeof registerNotificationDevice>>, TError = ErrorResponse>(
 notificationDeviceRegister: NotificationDeviceRegister, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof registerNotificationDevice>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof registerNotificationDevice>>,
          TError,
          Awaited<ReturnType<typeof registerNotificationDevice>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useRegisterNotificationDevice<TData = Awaited<ReturnType<typeof registerNotificationDevice>>, TError = ErrorResponse>(
 notificationDeviceRegister: NotificationDeviceRegister, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof registerNotificationDevice>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof registerNotificationDevice>>,
          TError,
          Awaited<ReturnType<typeof registerNotificationDevice>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useRegisterNotificationDevice<TData = Awaited<ReturnType<typeof registerNotificationDevice>>, TError = ErrorResponse>(
 notificationDeviceRegister: NotificationDeviceRegister, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof registerNotificationDevice>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Register notification device
 */

export function useRegisterNotificationDevice<TData = Awaited<ReturnType<typeof registerNotificationDevice>>, TError = ErrorResponse>(
 notificationDeviceRegister: NotificationDeviceRegister, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof registerNotificationDevice>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getRegisterNotificationDeviceQueryOptions(notificationDeviceRegister,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Deactivate a notification device for the current user
 * @summary Remove notification device
 */
export const unregisterNotificationDevice = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<UnregisterNotificationDevice200>(
      {url: `/api/v1/notifications/devices/${id}`, method: 'DELETE', signal
    },
      options);
    }




export const getUnregisterNotificationDeviceQueryKey = (id: string,) => {
    return [
    'DELETE', `/api/v1/notifications/devices/${id}`
    ] as const;
    }


export const getUnregisterNotificationDeviceQueryOptions = <TData = Awaited<ReturnType<typeof unregisterNotificationDevice>>, TError = ErrorResponse>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof unregisterNotificationDevice>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getUnregisterNotificationDeviceQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof unregisterNotificationDevice>>> = ({ signal }) => unregisterNotificationDevice(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof unregisterNotificationDevice>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type UnregisterNotificationDeviceQueryResult = NonNullable<Awaited<ReturnType<typeof unregisterNotificationDevice>>>
export type UnregisterNotificationDeviceQueryError = ErrorResponse


export function useUnregisterNotificationDevice<TData = Awaited<ReturnType<typeof unregisterNotificationDevice>>, TError = ErrorResponse>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof unregisterNotificationDevice>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof unregisterNotificationDevice>>,
          TError,
          Awaited<ReturnType<typeof unregisterNotificationDevice>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useUnregisterNotificationDevice<TData = Awaited<ReturnType<typeof unregisterNotificationDevice>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof unregisterNotificationDevice>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof unregisterNotificationDevice>>,
          TError,
          Awaited<ReturnType<typeof unregisterNotificationDevice>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useUnregisterNotificationDevice<TData = Awaited<ReturnType<typeof unregisterNotificationDevice>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof unregisterNotificationDevice>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Remove notification device
 */

export function useUnregisterNotificationDevice<TData = Awaited<ReturnType<typeof unregisterNotificationDevice>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof unregisterNotificationDevice>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getUnregisterNotificationDeviceQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






