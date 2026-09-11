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




export const getPostApiV1UsersMutationKey = () => ['postApiV1Users'] as const;

export const getPostApiV1UsersMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1Users>>, TError,PostApiV1UsersMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1Users>>, TError,PostApiV1UsersMutationVariables, TContext> => {

const mutationKey = getPostApiV1UsersMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1Users>>, PostApiV1UsersMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1Users(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1UsersMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1Users>>>
    export type PostApiV1UsersMutationBody = CreateUserRequest | undefined
    export type PostApiV1UsersMutationError = unknown
    export type PostApiV1UsersMutationVariables = {data?: CreateUserRequest}

    export const usePostApiV1Users = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1Users>>, TError,PostApiV1UsersMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1Users>>,
        TError,
        PostApiV1UsersMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1UsersMutationOptions(options), queryClient);
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




export const getPutApiV1UsersIdMutationKey = () => ['putApiV1UsersId'] as const;

export const getPutApiV1UsersIdMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putApiV1UsersId>>, TError,PutApiV1UsersIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof putApiV1UsersId>>, TError,PutApiV1UsersIdMutationVariables, TContext> => {

const mutationKey = getPutApiV1UsersIdMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof putApiV1UsersId>>, PutApiV1UsersIdMutationVariables> = (props) => {
          const {id,data} = props ?? {};

          return  putApiV1UsersId(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PutApiV1UsersIdMutationResult = NonNullable<Awaited<ReturnType<typeof putApiV1UsersId>>>
    export type PutApiV1UsersIdMutationBody = UpdateUserRequest | undefined
    export type PutApiV1UsersIdMutationError = unknown
    export type PutApiV1UsersIdMutationVariables = {id: string;data?: UpdateUserRequest}

    export const usePutApiV1UsersId = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putApiV1UsersId>>, TError,PutApiV1UsersIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof putApiV1UsersId>>,
        TError,
        PutApiV1UsersIdMutationVariables,
        TContext
      > => {
      return useMutation(getPutApiV1UsersIdMutationOptions(options), queryClient);
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




export const getDeleteApiV1UsersIdMutationKey = () => ['deleteApiV1UsersId'] as const;

export const getDeleteApiV1UsersIdMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1UsersId>>, TError,DeleteApiV1UsersIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1UsersId>>, TError,DeleteApiV1UsersIdMutationVariables, TContext> => {

const mutationKey = getDeleteApiV1UsersIdMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteApiV1UsersId>>, DeleteApiV1UsersIdMutationVariables> = (props) => {
          const {id} = props ?? {};

          return  deleteApiV1UsersId(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteApiV1UsersIdMutationResult = NonNullable<Awaited<ReturnType<typeof deleteApiV1UsersId>>>

    export type DeleteApiV1UsersIdMutationError = unknown
    export type DeleteApiV1UsersIdMutationVariables = {id: string}

    export const useDeleteApiV1UsersId = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1UsersId>>, TError,DeleteApiV1UsersIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteApiV1UsersId>>,
        TError,
        DeleteApiV1UsersIdMutationVariables,
        TContext
      > => {
      return useMutation(getDeleteApiV1UsersIdMutationOptions(options), queryClient);
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




export const getPostApiV1UsersIdResetPasswordMutationKey = () => ['postApiV1UsersIdResetPassword'] as const;

export const getPostApiV1UsersIdResetPasswordMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>, TError,PostApiV1UsersIdResetPasswordMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>, TError,PostApiV1UsersIdResetPasswordMutationVariables, TContext> => {

const mutationKey = getPostApiV1UsersIdResetPasswordMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>, PostApiV1UsersIdResetPasswordMutationVariables> = (props) => {
          const {id,data} = props ?? {};

          return  postApiV1UsersIdResetPassword(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1UsersIdResetPasswordMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>>
    export type PostApiV1UsersIdResetPasswordMutationBody = ResetPasswordRequest | undefined
    export type PostApiV1UsersIdResetPasswordMutationError = unknown
    export type PostApiV1UsersIdResetPasswordMutationVariables = {id: string;data?: ResetPasswordRequest}

    export const usePostApiV1UsersIdResetPassword = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>, TError,PostApiV1UsersIdResetPasswordMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1UsersIdResetPassword>>,
        TError,
        PostApiV1UsersIdResetPasswordMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1UsersIdResetPasswordMutationOptions(options), queryClient);
    }
