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
  CreateUserRequest,
  GetApiV1UsersParams,
  ResetPasswordRequest,
  UpdateUserRequest
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

export const getApiV1Users = (
    params?: GetApiV1UsersParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/users`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetApiV1UsersQueryKey = (params?: GetApiV1UsersParams,) => {
    return [
    `/api/v1/users`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetApiV1UsersQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1Users>>, TError = unknown>(params?: GetApiV1UsersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Users>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1UsersQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1Users>>> = ({ signal }) => getApiV1Users(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1Users>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1UsersQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1Users>>>
export type GetApiV1UsersQueryError = unknown


export function useGetApiV1Users<TData = Awaited<ReturnType<typeof getApiV1Users>>, TError = unknown>(
 params: undefined |  GetApiV1UsersParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Users>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1Users>>,
          TError,
          Awaited<ReturnType<typeof getApiV1Users>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1Users<TData = Awaited<ReturnType<typeof getApiV1Users>>, TError = unknown>(
 params?: GetApiV1UsersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Users>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1Users>>,
          TError,
          Awaited<ReturnType<typeof getApiV1Users>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1Users<TData = Awaited<ReturnType<typeof getApiV1Users>>, TError = unknown>(
 params?: GetApiV1UsersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Users>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1Users<TData = Awaited<ReturnType<typeof getApiV1Users>>, TError = unknown>(
 params?: GetApiV1UsersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Users>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1UsersQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const postApiV1Users = (
    createUserRequest?: CreateUserRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/users`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createUserRequest, signal
    },
      options);
    }




export const getPostApiV1UsersQueryKey = (createUserRequest?: CreateUserRequest,) => {
    return [
    'POST', `/api/v1/users`, createUserRequest
    ] as const;
    }


export const getPostApiV1UsersQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1Users>>, TError = unknown>(createUserRequest?: CreateUserRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1Users>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1UsersQueryKey(createUserRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1Users>>> = ({ signal }) => postApiV1Users(createUserRequest, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1Users>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type PostApiV1UsersQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1Users>>>
export type PostApiV1UsersQueryError = unknown


export function usePostApiV1Users<TData = Awaited<ReturnType<typeof postApiV1Users>>, TError = unknown>(
 createUserRequest: undefined |  CreateUserRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1Users>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1Users>>,
          TError,
          Awaited<ReturnType<typeof postApiV1Users>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1Users<TData = Awaited<ReturnType<typeof postApiV1Users>>, TError = unknown>(
 createUserRequest?: CreateUserRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1Users>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1Users>>,
          TError,
          Awaited<ReturnType<typeof postApiV1Users>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1Users<TData = Awaited<ReturnType<typeof postApiV1Users>>, TError = unknown>(
 createUserRequest?: CreateUserRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1Users>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1Users<TData = Awaited<ReturnType<typeof postApiV1Users>>, TError = unknown>(
 createUserRequest?: CreateUserRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1Users>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1UsersQueryOptions(createUserRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const getApiV1UsersId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/users/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1UsersIdQueryKey = (id: string,) => {
    return [
    `/api/v1/users/${id}`
    ] as const;
    }


export const getGetApiV1UsersIdQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1UsersId>>, TError = unknown>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1UsersId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1UsersIdQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1UsersId>>> = ({ signal }) => getApiV1UsersId(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1UsersId>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1UsersIdQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1UsersId>>>
export type GetApiV1UsersIdQueryError = unknown


export function useGetApiV1UsersId<TData = Awaited<ReturnType<typeof getApiV1UsersId>>, TError = unknown>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1UsersId>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1UsersId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1UsersId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1UsersId<TData = Awaited<ReturnType<typeof getApiV1UsersId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1UsersId>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1UsersId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1UsersId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1UsersId<TData = Awaited<ReturnType<typeof getApiV1UsersId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1UsersId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1UsersId<TData = Awaited<ReturnType<typeof getApiV1UsersId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1UsersId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1UsersIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const putApiV1UsersId = (
    id: string,
    updateUserRequest?: UpdateUserRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/users/${id}`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: updateUserRequest, signal
    },
      options);
    }




export const getPutApiV1UsersIdQueryKey = (id: string,
    updateUserRequest?: UpdateUserRequest,) => {
    return [
    'PUT', `/api/v1/users/${id}`, updateUserRequest
    ] as const;
    }


export const getPutApiV1UsersIdQueryOptions = <TData = Awaited<ReturnType<typeof putApiV1UsersId>>, TError = unknown>(id: string,
    updateUserRequest?: UpdateUserRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof putApiV1UsersId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPutApiV1UsersIdQueryKey(id,updateUserRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof putApiV1UsersId>>> = ({ signal }) => putApiV1UsersId(id,updateUserRequest, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof putApiV1UsersId>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type PutApiV1UsersIdQueryResult = NonNullable<Awaited<ReturnType<typeof putApiV1UsersId>>>
export type PutApiV1UsersIdQueryError = unknown


export function usePutApiV1UsersId<TData = Awaited<ReturnType<typeof putApiV1UsersId>>, TError = unknown>(
 id: string,
    updateUserRequest: undefined |  UpdateUserRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof putApiV1UsersId>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof putApiV1UsersId>>,
          TError,
          Awaited<ReturnType<typeof putApiV1UsersId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePutApiV1UsersId<TData = Awaited<ReturnType<typeof putApiV1UsersId>>, TError = unknown>(
 id: string,
    updateUserRequest?: UpdateUserRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof putApiV1UsersId>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof putApiV1UsersId>>,
          TError,
          Awaited<ReturnType<typeof putApiV1UsersId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePutApiV1UsersId<TData = Awaited<ReturnType<typeof putApiV1UsersId>>, TError = unknown>(
 id: string,
    updateUserRequest?: UpdateUserRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof putApiV1UsersId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePutApiV1UsersId<TData = Awaited<ReturnType<typeof putApiV1UsersId>>, TError = unknown>(
 id: string,
    updateUserRequest?: UpdateUserRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof putApiV1UsersId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPutApiV1UsersIdQueryOptions(id,updateUserRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const deleteApiV1UsersId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/users/${id}`, method: 'DELETE', signal
    },
      options);
    }




export const getDeleteApiV1UsersIdQueryKey = (id: string,) => {
    return [
    'DELETE', `/api/v1/users/${id}`
    ] as const;
    }


export const getDeleteApiV1UsersIdQueryOptions = <TData = Awaited<ReturnType<typeof deleteApiV1UsersId>>, TError = unknown>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteApiV1UsersId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getDeleteApiV1UsersIdQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof deleteApiV1UsersId>>> = ({ signal }) => deleteApiV1UsersId(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof deleteApiV1UsersId>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type DeleteApiV1UsersIdQueryResult = NonNullable<Awaited<ReturnType<typeof deleteApiV1UsersId>>>
export type DeleteApiV1UsersIdQueryError = unknown


export function useDeleteApiV1UsersId<TData = Awaited<ReturnType<typeof deleteApiV1UsersId>>, TError = unknown>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteApiV1UsersId>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof deleteApiV1UsersId>>,
          TError,
          Awaited<ReturnType<typeof deleteApiV1UsersId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useDeleteApiV1UsersId<TData = Awaited<ReturnType<typeof deleteApiV1UsersId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteApiV1UsersId>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof deleteApiV1UsersId>>,
          TError,
          Awaited<ReturnType<typeof deleteApiV1UsersId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useDeleteApiV1UsersId<TData = Awaited<ReturnType<typeof deleteApiV1UsersId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteApiV1UsersId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useDeleteApiV1UsersId<TData = Awaited<ReturnType<typeof deleteApiV1UsersId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteApiV1UsersId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getDeleteApiV1UsersIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const postApiV1UsersIdResetPassword = (
    id: string,
    resetPasswordRequest?: ResetPasswordRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/users/${id}/reset-password`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: resetPasswordRequest, signal
    },
      options);
    }




export const getPostApiV1UsersIdResetPasswordQueryKey = (id: string,
    resetPasswordRequest?: ResetPasswordRequest,) => {
    return [
    'POST', `/api/v1/users/${id}/reset-password`, resetPasswordRequest
    ] as const;
    }


export const getPostApiV1UsersIdResetPasswordQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>, TError = unknown>(id: string,
    resetPasswordRequest?: ResetPasswordRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1UsersIdResetPasswordQueryKey(id,resetPasswordRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>> = ({ signal }) => postApiV1UsersIdResetPassword(id,resetPasswordRequest, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type PostApiV1UsersIdResetPasswordQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>>
export type PostApiV1UsersIdResetPasswordQueryError = unknown


export function usePostApiV1UsersIdResetPassword<TData = Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>, TError = unknown>(
 id: string,
    resetPasswordRequest: undefined |  ResetPasswordRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>,
          TError,
          Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1UsersIdResetPassword<TData = Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>, TError = unknown>(
 id: string,
    resetPasswordRequest?: ResetPasswordRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>,
          TError,
          Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1UsersIdResetPassword<TData = Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>, TError = unknown>(
 id: string,
    resetPasswordRequest?: ResetPasswordRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1UsersIdResetPassword<TData = Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>, TError = unknown>(
 id: string,
    resetPasswordRequest?: ResetPasswordRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1UsersIdResetPasswordQueryOptions(id,resetPasswordRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






