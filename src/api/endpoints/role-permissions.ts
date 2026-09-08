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
  ErrorResponse,
  GetRolePermissionsParams,
  RolePermissionArrayResponse,
  RolePermissionBulkAssignBody,
  RolePermissionListResponse
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
 * Retrieve a list of role-permission assignments with pagination, filtering and sorting. Admin only.
 * @summary Get role-permission assignments
 */
export const getRolePermissions = (
    params?: GetRolePermissionsParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<RolePermissionListResponse>(
      {url: `/api/v1/role-permissions`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetRolePermissionsQueryKey = (params?: GetRolePermissionsParams,) => {
    return [
    `/api/v1/role-permissions`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetRolePermissionsQueryOptions = <TData = Awaited<ReturnType<typeof getRolePermissions>>, TError = ErrorResponse>(params?: GetRolePermissionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRolePermissions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetRolePermissionsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getRolePermissions>>> = ({ signal }) => getRolePermissions(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getRolePermissions>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetRolePermissionsQueryResult = NonNullable<Awaited<ReturnType<typeof getRolePermissions>>>
export type GetRolePermissionsQueryError = ErrorResponse


export function useGetRolePermissions<TData = Awaited<ReturnType<typeof getRolePermissions>>, TError = ErrorResponse>(
 params: undefined |  GetRolePermissionsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRolePermissions>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getRolePermissions>>,
          TError,
          Awaited<ReturnType<typeof getRolePermissions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetRolePermissions<TData = Awaited<ReturnType<typeof getRolePermissions>>, TError = ErrorResponse>(
 params?: GetRolePermissionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRolePermissions>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getRolePermissions>>,
          TError,
          Awaited<ReturnType<typeof getRolePermissions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetRolePermissions<TData = Awaited<ReturnType<typeof getRolePermissions>>, TError = ErrorResponse>(
 params?: GetRolePermissionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRolePermissions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get role-permission assignments
 */

export function useGetRolePermissions<TData = Awaited<ReturnType<typeof getRolePermissions>>, TError = ErrorResponse>(
 params?: GetRolePermissionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getRolePermissions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetRolePermissionsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Assign multiple permissions to a role at once
 * @summary Bulk assign permissions to a role
 */
export const assignPermissionsToRole = (
    roleId: string,
    rolePermissionBulkAssignBody: RolePermissionBulkAssignBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<RolePermissionArrayResponse>(
      {url: `/api/v1/role-permissions/${roleId}/assign`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: rolePermissionBulkAssignBody, signal
    },
      options);
    }




export const getAssignPermissionsToRoleQueryKey = (roleId: string,
    rolePermissionBulkAssignBody?: RolePermissionBulkAssignBody,) => {
    return [
    'POST', `/api/v1/role-permissions/${roleId}/assign`, rolePermissionBulkAssignBody
    ] as const;
    }


export const getAssignPermissionsToRoleQueryOptions = <TData = Awaited<ReturnType<typeof assignPermissionsToRole>>, TError = ErrorResponse>(roleId: string,
    rolePermissionBulkAssignBody: RolePermissionBulkAssignBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof assignPermissionsToRole>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getAssignPermissionsToRoleQueryKey(roleId,rolePermissionBulkAssignBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof assignPermissionsToRole>>> = ({ signal }) => assignPermissionsToRole(roleId,rolePermissionBulkAssignBody, requestOptions, signal);





   return  { queryKey, queryFn, enabled: roleId !== null && roleId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof assignPermissionsToRole>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type AssignPermissionsToRoleQueryResult = NonNullable<Awaited<ReturnType<typeof assignPermissionsToRole>>>
export type AssignPermissionsToRoleQueryError = ErrorResponse


export function useAssignPermissionsToRole<TData = Awaited<ReturnType<typeof assignPermissionsToRole>>, TError = ErrorResponse>(
 roleId: string,
    rolePermissionBulkAssignBody: RolePermissionBulkAssignBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof assignPermissionsToRole>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof assignPermissionsToRole>>,
          TError,
          Awaited<ReturnType<typeof assignPermissionsToRole>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useAssignPermissionsToRole<TData = Awaited<ReturnType<typeof assignPermissionsToRole>>, TError = ErrorResponse>(
 roleId: string,
    rolePermissionBulkAssignBody: RolePermissionBulkAssignBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof assignPermissionsToRole>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof assignPermissionsToRole>>,
          TError,
          Awaited<ReturnType<typeof assignPermissionsToRole>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useAssignPermissionsToRole<TData = Awaited<ReturnType<typeof assignPermissionsToRole>>, TError = ErrorResponse>(
 roleId: string,
    rolePermissionBulkAssignBody: RolePermissionBulkAssignBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof assignPermissionsToRole>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Bulk assign permissions to a role
 */

export function useAssignPermissionsToRole<TData = Awaited<ReturnType<typeof assignPermissionsToRole>>, TError = ErrorResponse>(
 roleId: string,
    rolePermissionBulkAssignBody: RolePermissionBulkAssignBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof assignPermissionsToRole>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getAssignPermissionsToRoleQueryOptions(roleId,rolePermissionBulkAssignBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Replace all permissions of a role with a new set of permissions
 * @summary Update role permissions
 */
export const updateRolePermissions = (
    roleId: string,
    rolePermissionBulkAssignBody: RolePermissionBulkAssignBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<RolePermissionArrayResponse>(
      {url: `/api/v1/role-permissions/${roleId}/assign`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: rolePermissionBulkAssignBody, signal
    },
      options);
    }




export const getUpdateRolePermissionsQueryKey = (roleId: string,
    rolePermissionBulkAssignBody?: RolePermissionBulkAssignBody,) => {
    return [
    'PUT', `/api/v1/role-permissions/${roleId}/assign`, rolePermissionBulkAssignBody
    ] as const;
    }


export const getUpdateRolePermissionsQueryOptions = <TData = Awaited<ReturnType<typeof updateRolePermissions>>, TError = ErrorResponse>(roleId: string,
    rolePermissionBulkAssignBody: RolePermissionBulkAssignBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateRolePermissions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getUpdateRolePermissionsQueryKey(roleId,rolePermissionBulkAssignBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof updateRolePermissions>>> = ({ signal }) => updateRolePermissions(roleId,rolePermissionBulkAssignBody, requestOptions, signal);





   return  { queryKey, queryFn, enabled: roleId !== null && roleId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof updateRolePermissions>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type UpdateRolePermissionsQueryResult = NonNullable<Awaited<ReturnType<typeof updateRolePermissions>>>
export type UpdateRolePermissionsQueryError = ErrorResponse


export function useUpdateRolePermissions<TData = Awaited<ReturnType<typeof updateRolePermissions>>, TError = ErrorResponse>(
 roleId: string,
    rolePermissionBulkAssignBody: RolePermissionBulkAssignBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateRolePermissions>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof updateRolePermissions>>,
          TError,
          Awaited<ReturnType<typeof updateRolePermissions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useUpdateRolePermissions<TData = Awaited<ReturnType<typeof updateRolePermissions>>, TError = ErrorResponse>(
 roleId: string,
    rolePermissionBulkAssignBody: RolePermissionBulkAssignBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateRolePermissions>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof updateRolePermissions>>,
          TError,
          Awaited<ReturnType<typeof updateRolePermissions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useUpdateRolePermissions<TData = Awaited<ReturnType<typeof updateRolePermissions>>, TError = ErrorResponse>(
 roleId: string,
    rolePermissionBulkAssignBody: RolePermissionBulkAssignBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateRolePermissions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Update role permissions
 */

export function useUpdateRolePermissions<TData = Awaited<ReturnType<typeof updateRolePermissions>>, TError = ErrorResponse>(
 roleId: string,
    rolePermissionBulkAssignBody: RolePermissionBulkAssignBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateRolePermissions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getUpdateRolePermissionsQueryOptions(roleId,rolePermissionBulkAssignBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






