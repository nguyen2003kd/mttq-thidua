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
  DeleteUser200,
  ErrorResponse,
  GetUsersParams,
  ResetPasswordResponse,
  UserCreateBody,
  UserListResponse,
  UserResponse,
  UserUpdateBody
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
 * Retrieve paginated list of users. Admin only.
 * @summary Get all users
 */
export const getUsers = (
    params?: GetUsersParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<UserListResponse>(
      {url: `/api/v1/users`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetUsersQueryKey = (params?: GetUsersParams,) => {
    return [
    `/api/v1/users`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetUsersQueryOptions = <TData = Awaited<ReturnType<typeof getUsers>>, TError = ErrorResponse>(params?: GetUsersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUsers>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetUsersQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getUsers>>> = ({ signal }) => getUsers(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getUsers>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetUsersQueryResult = NonNullable<Awaited<ReturnType<typeof getUsers>>>
export type GetUsersQueryError = ErrorResponse


export function useGetUsers<TData = Awaited<ReturnType<typeof getUsers>>, TError = ErrorResponse>(
 params: undefined |  GetUsersParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUsers>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getUsers>>,
          TError,
          Awaited<ReturnType<typeof getUsers>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetUsers<TData = Awaited<ReturnType<typeof getUsers>>, TError = ErrorResponse>(
 params?: GetUsersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUsers>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getUsers>>,
          TError,
          Awaited<ReturnType<typeof getUsers>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetUsers<TData = Awaited<ReturnType<typeof getUsers>>, TError = ErrorResponse>(
 params?: GetUsersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUsers>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get all users
 */

export function useGetUsers<TData = Awaited<ReturnType<typeof getUsers>>, TError = ErrorResponse>(
 params?: GetUsersParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUsers>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetUsersQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Create a user
 */
export const createUser = (
    userCreateBody: UserCreateBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<UserResponse>(
      {url: `/api/v1/users`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: userCreateBody, signal
    },
      options);
    }




export const getCreateUserQueryKey = (userCreateBody?: UserCreateBody,) => {
    return [
    'POST', `/api/v1/users`, userCreateBody
    ] as const;
    }


export const getCreateUserQueryOptions = <TData = Awaited<ReturnType<typeof createUser>>, TError = ErrorResponse>(userCreateBody: UserCreateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof createUser>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getCreateUserQueryKey(userCreateBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof createUser>>> = ({ signal }) => createUser(userCreateBody, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof createUser>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type CreateUserQueryResult = NonNullable<Awaited<ReturnType<typeof createUser>>>
export type CreateUserQueryError = ErrorResponse


export function useCreateUser<TData = Awaited<ReturnType<typeof createUser>>, TError = ErrorResponse>(
 userCreateBody: UserCreateBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof createUser>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof createUser>>,
          TError,
          Awaited<ReturnType<typeof createUser>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useCreateUser<TData = Awaited<ReturnType<typeof createUser>>, TError = ErrorResponse>(
 userCreateBody: UserCreateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof createUser>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof createUser>>,
          TError,
          Awaited<ReturnType<typeof createUser>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useCreateUser<TData = Awaited<ReturnType<typeof createUser>>, TError = ErrorResponse>(
 userCreateBody: UserCreateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof createUser>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Create a user
 */

export function useCreateUser<TData = Awaited<ReturnType<typeof createUser>>, TError = ErrorResponse>(
 userCreateBody: UserCreateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof createUser>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getCreateUserQueryOptions(userCreateBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Users may only access their own record; admins can access any.
 * @summary Get user by ID
 */
export const getUserById = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<UserResponse>(
      {url: `/api/v1/users/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetUserByIdQueryKey = (id: string,) => {
    return [
    `/api/v1/users/${id}`
    ] as const;
    }


export const getGetUserByIdQueryOptions = <TData = Awaited<ReturnType<typeof getUserById>>, TError = ErrorResponse>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetUserByIdQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getUserById>>> = ({ signal }) => getUserById(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getUserById>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetUserByIdQueryResult = NonNullable<Awaited<ReturnType<typeof getUserById>>>
export type GetUserByIdQueryError = ErrorResponse


export function useGetUserById<TData = Awaited<ReturnType<typeof getUserById>>, TError = ErrorResponse>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserById>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getUserById>>,
          TError,
          Awaited<ReturnType<typeof getUserById>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetUserById<TData = Awaited<ReturnType<typeof getUserById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserById>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getUserById>>,
          TError,
          Awaited<ReturnType<typeof getUserById>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetUserById<TData = Awaited<ReturnType<typeof getUserById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get user by ID
 */

export function useGetUserById<TData = Awaited<ReturnType<typeof getUserById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetUserByIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Update user
 */
export const updateUser = (
    id: string,
    userUpdateBody?: UserUpdateBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<UserResponse>(
      {url: `/api/v1/users/${id}`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: userUpdateBody, signal
    },
      options);
    }




export const getUpdateUserQueryKey = (id: string,
    userUpdateBody?: UserUpdateBody,) => {
    return [
    'PUT', `/api/v1/users/${id}`, userUpdateBody
    ] as const;
    }


export const getUpdateUserQueryOptions = <TData = Awaited<ReturnType<typeof updateUser>>, TError = ErrorResponse>(id: string,
    userUpdateBody?: UserUpdateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateUser>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getUpdateUserQueryKey(id,userUpdateBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof updateUser>>> = ({ signal }) => updateUser(id,userUpdateBody, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof updateUser>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type UpdateUserQueryResult = NonNullable<Awaited<ReturnType<typeof updateUser>>>
export type UpdateUserQueryError = ErrorResponse


export function useUpdateUser<TData = Awaited<ReturnType<typeof updateUser>>, TError = ErrorResponse>(
 id: string,
    userUpdateBody: undefined |  UserUpdateBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateUser>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof updateUser>>,
          TError,
          Awaited<ReturnType<typeof updateUser>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useUpdateUser<TData = Awaited<ReturnType<typeof updateUser>>, TError = ErrorResponse>(
 id: string,
    userUpdateBody?: UserUpdateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateUser>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof updateUser>>,
          TError,
          Awaited<ReturnType<typeof updateUser>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useUpdateUser<TData = Awaited<ReturnType<typeof updateUser>>, TError = ErrorResponse>(
 id: string,
    userUpdateBody?: UserUpdateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateUser>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Update user
 */

export function useUpdateUser<TData = Awaited<ReturnType<typeof updateUser>>, TError = ErrorResponse>(
 id: string,
    userUpdateBody?: UserUpdateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateUser>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getUpdateUserQueryOptions(id,userUpdateBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Delete user
 */
export const deleteUser = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<DeleteUser200>(
      {url: `/api/v1/users/${id}`, method: 'DELETE', signal
    },
      options);
    }




export const getDeleteUserQueryKey = (id: string,) => {
    return [
    'DELETE', `/api/v1/users/${id}`
    ] as const;
    }


export const getDeleteUserQueryOptions = <TData = Awaited<ReturnType<typeof deleteUser>>, TError = ErrorResponse>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteUser>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getDeleteUserQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof deleteUser>>> = ({ signal }) => deleteUser(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof deleteUser>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type DeleteUserQueryResult = NonNullable<Awaited<ReturnType<typeof deleteUser>>>
export type DeleteUserQueryError = ErrorResponse


export function useDeleteUser<TData = Awaited<ReturnType<typeof deleteUser>>, TError = ErrorResponse>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteUser>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof deleteUser>>,
          TError,
          Awaited<ReturnType<typeof deleteUser>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useDeleteUser<TData = Awaited<ReturnType<typeof deleteUser>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteUser>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof deleteUser>>,
          TError,
          Awaited<ReturnType<typeof deleteUser>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useDeleteUser<TData = Awaited<ReturnType<typeof deleteUser>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteUser>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Delete user
 */

export function useDeleteUser<TData = Awaited<ReturnType<typeof deleteUser>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteUser>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getDeleteUserQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Reset user password to default value. Admin only.
 * @summary Reset user password to default
 */
export const adminResetUserPassword = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<ResetPasswordResponse>(
      {url: `/api/v1/users/${id}/reset-password`, method: 'PUT', signal
    },
      options);
    }




export const getAdminResetUserPasswordQueryKey = (id: string,) => {
    return [
    'PUT', `/api/v1/users/${id}/reset-password`
    ] as const;
    }


export const getAdminResetUserPasswordQueryOptions = <TData = Awaited<ReturnType<typeof adminResetUserPassword>>, TError = ErrorResponse>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof adminResetUserPassword>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getAdminResetUserPasswordQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof adminResetUserPassword>>> = ({ signal }) => adminResetUserPassword(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof adminResetUserPassword>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type AdminResetUserPasswordQueryResult = NonNullable<Awaited<ReturnType<typeof adminResetUserPassword>>>
export type AdminResetUserPasswordQueryError = ErrorResponse


export function useAdminResetUserPassword<TData = Awaited<ReturnType<typeof adminResetUserPassword>>, TError = ErrorResponse>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof adminResetUserPassword>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof adminResetUserPassword>>,
          TError,
          Awaited<ReturnType<typeof adminResetUserPassword>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useAdminResetUserPassword<TData = Awaited<ReturnType<typeof adminResetUserPassword>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof adminResetUserPassword>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof adminResetUserPassword>>,
          TError,
          Awaited<ReturnType<typeof adminResetUserPassword>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useAdminResetUserPassword<TData = Awaited<ReturnType<typeof adminResetUserPassword>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof adminResetUserPassword>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Reset user password to default
 */

export function useAdminResetUserPassword<TData = Awaited<ReturnType<typeof adminResetUserPassword>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof adminResetUserPassword>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getAdminResetUserPasswordQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






