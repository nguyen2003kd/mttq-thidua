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
  DeleteUserRoleById200,
  ErrorResponse,
  UserRoleListResponse,
  UserRoleMutateBody,
  UserRoleResponse
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
 * Retrieve a list of user-role assignments with pagination, filtering and sorting
 * @summary Get user-role assignments
 */
export const getUserRoles = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<UserRoleListResponse>(
      {url: `/api/v1/user-roles`, method: 'GET', signal
    },
      options);
    }




export const getGetUserRolesQueryKey = () => {
    return [
    `/api/v1/user-roles`
    ] as const;
    }


export const getGetUserRolesQueryOptions = <TData = Awaited<ReturnType<typeof getUserRoles>>, TError = ErrorResponse>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserRoles>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetUserRolesQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getUserRoles>>> = ({ signal }) => getUserRoles(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getUserRoles>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetUserRolesQueryResult = NonNullable<Awaited<ReturnType<typeof getUserRoles>>>
export type GetUserRolesQueryError = ErrorResponse


export function useGetUserRoles<TData = Awaited<ReturnType<typeof getUserRoles>>, TError = ErrorResponse>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserRoles>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getUserRoles>>,
          TError,
          Awaited<ReturnType<typeof getUserRoles>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetUserRoles<TData = Awaited<ReturnType<typeof getUserRoles>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserRoles>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getUserRoles>>,
          TError,
          Awaited<ReturnType<typeof getUserRoles>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetUserRoles<TData = Awaited<ReturnType<typeof getUserRoles>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserRoles>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get user-role assignments
 */

export function useGetUserRoles<TData = Awaited<ReturnType<typeof getUserRoles>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserRoles>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetUserRolesQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Create a new user-role assignment
 * @summary Assign a role to a user
 */
export const assignRoleToUser = (
    userRoleMutateBody: UserRoleMutateBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<UserRoleResponse>(
      {url: `/api/v1/user-roles`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: userRoleMutateBody, signal
    },
      options);
    }




export const getAssignRoleToUserQueryKey = (userRoleMutateBody?: UserRoleMutateBody,) => {
    return [
    'POST', `/api/v1/user-roles`, userRoleMutateBody
    ] as const;
    }


export const getAssignRoleToUserQueryOptions = <TData = Awaited<ReturnType<typeof assignRoleToUser>>, TError = ErrorResponse>(userRoleMutateBody: UserRoleMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof assignRoleToUser>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getAssignRoleToUserQueryKey(userRoleMutateBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof assignRoleToUser>>> = ({ signal }) => assignRoleToUser(userRoleMutateBody, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof assignRoleToUser>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type AssignRoleToUserQueryResult = NonNullable<Awaited<ReturnType<typeof assignRoleToUser>>>
export type AssignRoleToUserQueryError = ErrorResponse


export function useAssignRoleToUser<TData = Awaited<ReturnType<typeof assignRoleToUser>>, TError = ErrorResponse>(
 userRoleMutateBody: UserRoleMutateBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof assignRoleToUser>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof assignRoleToUser>>,
          TError,
          Awaited<ReturnType<typeof assignRoleToUser>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useAssignRoleToUser<TData = Awaited<ReturnType<typeof assignRoleToUser>>, TError = ErrorResponse>(
 userRoleMutateBody: UserRoleMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof assignRoleToUser>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof assignRoleToUser>>,
          TError,
          Awaited<ReturnType<typeof assignRoleToUser>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useAssignRoleToUser<TData = Awaited<ReturnType<typeof assignRoleToUser>>, TError = ErrorResponse>(
 userRoleMutateBody: UserRoleMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof assignRoleToUser>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Assign a role to a user
 */

export function useAssignRoleToUser<TData = Awaited<ReturnType<typeof assignRoleToUser>>, TError = ErrorResponse>(
 userRoleMutateBody: UserRoleMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof assignRoleToUser>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getAssignRoleToUserQueryOptions(userRoleMutateBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Retrieve a single user-role assignment by its ID
 * @summary Get user-role assignment by ID
 */
export const getUserRoleById = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<UserRoleResponse>(
      {url: `/api/v1/user-roles/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetUserRoleByIdQueryKey = (id: string,) => {
    return [
    `/api/v1/user-roles/${id}`
    ] as const;
    }


export const getGetUserRoleByIdQueryOptions = <TData = Awaited<ReturnType<typeof getUserRoleById>>, TError = ErrorResponse>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserRoleById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetUserRoleByIdQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getUserRoleById>>> = ({ signal }) => getUserRoleById(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getUserRoleById>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetUserRoleByIdQueryResult = NonNullable<Awaited<ReturnType<typeof getUserRoleById>>>
export type GetUserRoleByIdQueryError = ErrorResponse


export function useGetUserRoleById<TData = Awaited<ReturnType<typeof getUserRoleById>>, TError = ErrorResponse>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserRoleById>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getUserRoleById>>,
          TError,
          Awaited<ReturnType<typeof getUserRoleById>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetUserRoleById<TData = Awaited<ReturnType<typeof getUserRoleById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserRoleById>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getUserRoleById>>,
          TError,
          Awaited<ReturnType<typeof getUserRoleById>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetUserRoleById<TData = Awaited<ReturnType<typeof getUserRoleById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserRoleById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get user-role assignment by ID
 */

export function useGetUserRoleById<TData = Awaited<ReturnType<typeof getUserRoleById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getUserRoleById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetUserRoleByIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Update a user-role assignment
 * @summary Update user-role assignment by ID
 */
export const updateUserRoleById = (
    id: string,
    userRoleMutateBody?: UserRoleMutateBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<UserRoleResponse>(
      {url: `/api/v1/user-roles/${id}`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: userRoleMutateBody, signal
    },
      options);
    }




export const getUpdateUserRoleByIdQueryKey = (id: string,
    userRoleMutateBody?: UserRoleMutateBody,) => {
    return [
    'PUT', `/api/v1/user-roles/${id}`, userRoleMutateBody
    ] as const;
    }


export const getUpdateUserRoleByIdQueryOptions = <TData = Awaited<ReturnType<typeof updateUserRoleById>>, TError = ErrorResponse>(id: string,
    userRoleMutateBody?: UserRoleMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateUserRoleById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getUpdateUserRoleByIdQueryKey(id,userRoleMutateBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof updateUserRoleById>>> = ({ signal }) => updateUserRoleById(id,userRoleMutateBody, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof updateUserRoleById>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type UpdateUserRoleByIdQueryResult = NonNullable<Awaited<ReturnType<typeof updateUserRoleById>>>
export type UpdateUserRoleByIdQueryError = ErrorResponse


export function useUpdateUserRoleById<TData = Awaited<ReturnType<typeof updateUserRoleById>>, TError = ErrorResponse>(
 id: string,
    userRoleMutateBody: undefined |  UserRoleMutateBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateUserRoleById>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof updateUserRoleById>>,
          TError,
          Awaited<ReturnType<typeof updateUserRoleById>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useUpdateUserRoleById<TData = Awaited<ReturnType<typeof updateUserRoleById>>, TError = ErrorResponse>(
 id: string,
    userRoleMutateBody?: UserRoleMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateUserRoleById>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof updateUserRoleById>>,
          TError,
          Awaited<ReturnType<typeof updateUserRoleById>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useUpdateUserRoleById<TData = Awaited<ReturnType<typeof updateUserRoleById>>, TError = ErrorResponse>(
 id: string,
    userRoleMutateBody?: UserRoleMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateUserRoleById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Update user-role assignment by ID
 */

export function useUpdateUserRoleById<TData = Awaited<ReturnType<typeof updateUserRoleById>>, TError = ErrorResponse>(
 id: string,
    userRoleMutateBody?: UserRoleMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateUserRoleById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getUpdateUserRoleByIdQueryOptions(id,userRoleMutateBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Delete a user-role assignment (revoke role from user)
 * @summary Delete user-role assignment by ID
 */
export const deleteUserRoleById = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<DeleteUserRoleById200>(
      {url: `/api/v1/user-roles/${id}`, method: 'DELETE', signal
    },
      options);
    }




export const getDeleteUserRoleByIdQueryKey = (id: string,) => {
    return [
    'DELETE', `/api/v1/user-roles/${id}`
    ] as const;
    }


export const getDeleteUserRoleByIdQueryOptions = <TData = Awaited<ReturnType<typeof deleteUserRoleById>>, TError = ErrorResponse>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteUserRoleById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getDeleteUserRoleByIdQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof deleteUserRoleById>>> = ({ signal }) => deleteUserRoleById(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof deleteUserRoleById>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type DeleteUserRoleByIdQueryResult = NonNullable<Awaited<ReturnType<typeof deleteUserRoleById>>>
export type DeleteUserRoleByIdQueryError = ErrorResponse


export function useDeleteUserRoleById<TData = Awaited<ReturnType<typeof deleteUserRoleById>>, TError = ErrorResponse>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteUserRoleById>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof deleteUserRoleById>>,
          TError,
          Awaited<ReturnType<typeof deleteUserRoleById>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useDeleteUserRoleById<TData = Awaited<ReturnType<typeof deleteUserRoleById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteUserRoleById>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof deleteUserRoleById>>,
          TError,
          Awaited<ReturnType<typeof deleteUserRoleById>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useDeleteUserRoleById<TData = Awaited<ReturnType<typeof deleteUserRoleById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteUserRoleById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Delete user-role assignment by ID
 */

export function useDeleteUserRoleById<TData = Awaited<ReturnType<typeof deleteUserRoleById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteUserRoleById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getDeleteUserRoleByIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






