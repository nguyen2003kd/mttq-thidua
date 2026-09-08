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
  DeleteRole200,
  ErrorResponse,
  GetRolesParams,
  RoleListResponse,
  RoleMutateBody,
  RoleResponse
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
 * @summary Get all roles
 */
export const getRoles = (
    params?: GetRolesParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<RoleListResponse>(
      {url: `/api/v1/roles`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetRolesQueryKey = (params?: GetRolesParams,) => {
    return [
    `/api/v1/roles`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetRolesQueryOptions = <TData = Awaited<ReturnType<typeof getRoles>>, TError = ErrorResponse>(params?: GetRolesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRoles>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetRolesQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getRoles>>> = ({ signal }) => getRoles(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getRoles>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetRolesQueryResult = NonNullable<Awaited<ReturnType<typeof getRoles>>>
export type GetRolesQueryError = ErrorResponse


export function useGetRoles<TData = Awaited<ReturnType<typeof getRoles>>, TError = ErrorResponse>(
 params: undefined |  GetRolesParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRoles>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getRoles>>,
          TError,
          Awaited<ReturnType<typeof getRoles>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetRoles<TData = Awaited<ReturnType<typeof getRoles>>, TError = ErrorResponse>(
 params?: GetRolesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRoles>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getRoles>>,
          TError,
          Awaited<ReturnType<typeof getRoles>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetRoles<TData = Awaited<ReturnType<typeof getRoles>>, TError = ErrorResponse>(
 params?: GetRolesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRoles>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get all roles
 */

export function useGetRoles<TData = Awaited<ReturnType<typeof getRoles>>, TError = ErrorResponse>(
 params?: GetRolesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRoles>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetRolesQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Create a role
 */
export const createRole = (
    roleMutateBody: RoleMutateBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<RoleResponse>(
      {url: `/api/v1/roles`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: roleMutateBody, signal
    },
      options);
    }




export const getCreateRoleQueryKey = (roleMutateBody?: RoleMutateBody,) => {
    return [
    'POST', `/api/v1/roles`, roleMutateBody
    ] as const;
    }


export const getCreateRoleQueryOptions = <TData = Awaited<ReturnType<typeof createRole>>, TError = ErrorResponse>(roleMutateBody: RoleMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof createRole>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getCreateRoleQueryKey(roleMutateBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof createRole>>> = ({ signal }) => createRole(roleMutateBody, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof createRole>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type CreateRoleQueryResult = NonNullable<Awaited<ReturnType<typeof createRole>>>
export type CreateRoleQueryError = ErrorResponse


export function useCreateRole<TData = Awaited<ReturnType<typeof createRole>>, TError = ErrorResponse>(
 roleMutateBody: RoleMutateBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof createRole>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof createRole>>,
          TError,
          Awaited<ReturnType<typeof createRole>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useCreateRole<TData = Awaited<ReturnType<typeof createRole>>, TError = ErrorResponse>(
 roleMutateBody: RoleMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof createRole>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof createRole>>,
          TError,
          Awaited<ReturnType<typeof createRole>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useCreateRole<TData = Awaited<ReturnType<typeof createRole>>, TError = ErrorResponse>(
 roleMutateBody: RoleMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof createRole>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Create a role
 */

export function useCreateRole<TData = Awaited<ReturnType<typeof createRole>>, TError = ErrorResponse>(
 roleMutateBody: RoleMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof createRole>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getCreateRoleQueryOptions(roleMutateBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Get role by ID
 */
export const getRoleById = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<RoleResponse>(
      {url: `/api/v1/roles/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetRoleByIdQueryKey = (id: string,) => {
    return [
    `/api/v1/roles/${id}`
    ] as const;
    }


export const getGetRoleByIdQueryOptions = <TData = Awaited<ReturnType<typeof getRoleById>>, TError = ErrorResponse>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRoleById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetRoleByIdQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getRoleById>>> = ({ signal }) => getRoleById(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getRoleById>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetRoleByIdQueryResult = NonNullable<Awaited<ReturnType<typeof getRoleById>>>
export type GetRoleByIdQueryError = ErrorResponse


export function useGetRoleById<TData = Awaited<ReturnType<typeof getRoleById>>, TError = ErrorResponse>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRoleById>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getRoleById>>,
          TError,
          Awaited<ReturnType<typeof getRoleById>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetRoleById<TData = Awaited<ReturnType<typeof getRoleById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRoleById>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getRoleById>>,
          TError,
          Awaited<ReturnType<typeof getRoleById>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetRoleById<TData = Awaited<ReturnType<typeof getRoleById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRoleById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get role by ID
 */

export function useGetRoleById<TData = Awaited<ReturnType<typeof getRoleById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRoleById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetRoleByIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Update role
 */
export const updateRole = (
    id: string,
    roleMutateBody?: RoleMutateBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<RoleResponse>(
      {url: `/api/v1/roles/${id}`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: roleMutateBody, signal
    },
      options);
    }




export const getUpdateRoleQueryKey = (id: string,
    roleMutateBody?: RoleMutateBody,) => {
    return [
    'PUT', `/api/v1/roles/${id}`, roleMutateBody
    ] as const;
    }


export const getUpdateRoleQueryOptions = <TData = Awaited<ReturnType<typeof updateRole>>, TError = ErrorResponse>(id: string,
    roleMutateBody?: RoleMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateRole>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getUpdateRoleQueryKey(id,roleMutateBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof updateRole>>> = ({ signal }) => updateRole(id,roleMutateBody, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof updateRole>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type UpdateRoleQueryResult = NonNullable<Awaited<ReturnType<typeof updateRole>>>
export type UpdateRoleQueryError = ErrorResponse


export function useUpdateRole<TData = Awaited<ReturnType<typeof updateRole>>, TError = ErrorResponse>(
 id: string,
    roleMutateBody: undefined |  RoleMutateBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateRole>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof updateRole>>,
          TError,
          Awaited<ReturnType<typeof updateRole>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useUpdateRole<TData = Awaited<ReturnType<typeof updateRole>>, TError = ErrorResponse>(
 id: string,
    roleMutateBody?: RoleMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateRole>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof updateRole>>,
          TError,
          Awaited<ReturnType<typeof updateRole>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useUpdateRole<TData = Awaited<ReturnType<typeof updateRole>>, TError = ErrorResponse>(
 id: string,
    roleMutateBody?: RoleMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateRole>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Update role
 */

export function useUpdateRole<TData = Awaited<ReturnType<typeof updateRole>>, TError = ErrorResponse>(
 id: string,
    roleMutateBody?: RoleMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateRole>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getUpdateRoleQueryOptions(id,roleMutateBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Delete role
 */
export const deleteRole = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<DeleteRole200>(
      {url: `/api/v1/roles/${id}`, method: 'DELETE', signal
    },
      options);
    }




export const getDeleteRoleQueryKey = (id: string,) => {
    return [
    'DELETE', `/api/v1/roles/${id}`
    ] as const;
    }


export const getDeleteRoleQueryOptions = <TData = Awaited<ReturnType<typeof deleteRole>>, TError = ErrorResponse>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteRole>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getDeleteRoleQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof deleteRole>>> = ({ signal }) => deleteRole(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof deleteRole>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type DeleteRoleQueryResult = NonNullable<Awaited<ReturnType<typeof deleteRole>>>
export type DeleteRoleQueryError = ErrorResponse


export function useDeleteRole<TData = Awaited<ReturnType<typeof deleteRole>>, TError = ErrorResponse>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteRole>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof deleteRole>>,
          TError,
          Awaited<ReturnType<typeof deleteRole>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useDeleteRole<TData = Awaited<ReturnType<typeof deleteRole>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteRole>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof deleteRole>>,
          TError,
          Awaited<ReturnType<typeof deleteRole>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useDeleteRole<TData = Awaited<ReturnType<typeof deleteRole>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteRole>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Delete role
 */

export function useDeleteRole<TData = Awaited<ReturnType<typeof deleteRole>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteRole>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getDeleteRoleQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






