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
  DeletePermission200,
  ErrorResponse,
  GetPermissionsParams,
  PermissionListResponse,
  PermissionMutateBody,
  PermissionResponse
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
 * @summary Get all permissions
 */
export const getPermissions = (
    params?: GetPermissionsParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<PermissionListResponse>(
      {url: `/api/v1/permissions`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetPermissionsQueryKey = (params?: GetPermissionsParams,) => {
    return [
    `/api/v1/permissions`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetPermissionsQueryOptions = <TData = Awaited<ReturnType<typeof getPermissions>>, TError = ErrorResponse>(params?: GetPermissionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPermissions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetPermissionsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getPermissions>>> = ({ signal }) => getPermissions(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getPermissions>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetPermissionsQueryResult = NonNullable<Awaited<ReturnType<typeof getPermissions>>>
export type GetPermissionsQueryError = ErrorResponse


export function useGetPermissions<TData = Awaited<ReturnType<typeof getPermissions>>, TError = ErrorResponse>(
 params: undefined |  GetPermissionsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPermissions>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getPermissions>>,
          TError,
          Awaited<ReturnType<typeof getPermissions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetPermissions<TData = Awaited<ReturnType<typeof getPermissions>>, TError = ErrorResponse>(
 params?: GetPermissionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPermissions>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getPermissions>>,
          TError,
          Awaited<ReturnType<typeof getPermissions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetPermissions<TData = Awaited<ReturnType<typeof getPermissions>>, TError = ErrorResponse>(
 params?: GetPermissionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPermissions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get all permissions
 */

export function useGetPermissions<TData = Awaited<ReturnType<typeof getPermissions>>, TError = ErrorResponse>(
 params?: GetPermissionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPermissions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetPermissionsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Create a permission
 */
export const createPermission = (
    permissionMutateBody: PermissionMutateBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<PermissionResponse>(
      {url: `/api/v1/permissions`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: permissionMutateBody, signal
    },
      options);
    }




export const getCreatePermissionQueryKey = (permissionMutateBody?: PermissionMutateBody,) => {
    return [
    'POST', `/api/v1/permissions`, permissionMutateBody
    ] as const;
    }


export const getCreatePermissionQueryOptions = <TData = Awaited<ReturnType<typeof createPermission>>, TError = ErrorResponse>(permissionMutateBody: PermissionMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof createPermission>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getCreatePermissionQueryKey(permissionMutateBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof createPermission>>> = ({ signal }) => createPermission(permissionMutateBody, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof createPermission>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type CreatePermissionQueryResult = NonNullable<Awaited<ReturnType<typeof createPermission>>>
export type CreatePermissionQueryError = ErrorResponse


export function useCreatePermission<TData = Awaited<ReturnType<typeof createPermission>>, TError = ErrorResponse>(
 permissionMutateBody: PermissionMutateBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof createPermission>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof createPermission>>,
          TError,
          Awaited<ReturnType<typeof createPermission>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useCreatePermission<TData = Awaited<ReturnType<typeof createPermission>>, TError = ErrorResponse>(
 permissionMutateBody: PermissionMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof createPermission>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof createPermission>>,
          TError,
          Awaited<ReturnType<typeof createPermission>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useCreatePermission<TData = Awaited<ReturnType<typeof createPermission>>, TError = ErrorResponse>(
 permissionMutateBody: PermissionMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof createPermission>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Create a permission
 */

export function useCreatePermission<TData = Awaited<ReturnType<typeof createPermission>>, TError = ErrorResponse>(
 permissionMutateBody: PermissionMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof createPermission>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getCreatePermissionQueryOptions(permissionMutateBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Get permission by ID
 */
export const getPermissionById = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<PermissionResponse>(
      {url: `/api/v1/permissions/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetPermissionByIdQueryKey = (id: string,) => {
    return [
    `/api/v1/permissions/${id}`
    ] as const;
    }


export const getGetPermissionByIdQueryOptions = <TData = Awaited<ReturnType<typeof getPermissionById>>, TError = ErrorResponse>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPermissionById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetPermissionByIdQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getPermissionById>>> = ({ signal }) => getPermissionById(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getPermissionById>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetPermissionByIdQueryResult = NonNullable<Awaited<ReturnType<typeof getPermissionById>>>
export type GetPermissionByIdQueryError = ErrorResponse


export function useGetPermissionById<TData = Awaited<ReturnType<typeof getPermissionById>>, TError = ErrorResponse>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPermissionById>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getPermissionById>>,
          TError,
          Awaited<ReturnType<typeof getPermissionById>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetPermissionById<TData = Awaited<ReturnType<typeof getPermissionById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPermissionById>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getPermissionById>>,
          TError,
          Awaited<ReturnType<typeof getPermissionById>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetPermissionById<TData = Awaited<ReturnType<typeof getPermissionById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPermissionById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get permission by ID
 */

export function useGetPermissionById<TData = Awaited<ReturnType<typeof getPermissionById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getPermissionById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetPermissionByIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Delete permission
 */
export const deletePermission = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<DeletePermission200>(
      {url: `/api/v1/permissions/${id}`, method: 'DELETE', signal
    },
      options);
    }




export const getDeletePermissionQueryKey = (id: string,) => {
    return [
    'DELETE', `/api/v1/permissions/${id}`
    ] as const;
    }


export const getDeletePermissionQueryOptions = <TData = Awaited<ReturnType<typeof deletePermission>>, TError = ErrorResponse>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deletePermission>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getDeletePermissionQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof deletePermission>>> = ({ signal }) => deletePermission(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof deletePermission>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type DeletePermissionQueryResult = NonNullable<Awaited<ReturnType<typeof deletePermission>>>
export type DeletePermissionQueryError = ErrorResponse


export function useDeletePermission<TData = Awaited<ReturnType<typeof deletePermission>>, TError = ErrorResponse>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof deletePermission>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof deletePermission>>,
          TError,
          Awaited<ReturnType<typeof deletePermission>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useDeletePermission<TData = Awaited<ReturnType<typeof deletePermission>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deletePermission>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof deletePermission>>,
          TError,
          Awaited<ReturnType<typeof deletePermission>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useDeletePermission<TData = Awaited<ReturnType<typeof deletePermission>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deletePermission>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Delete permission
 */

export function useDeletePermission<TData = Awaited<ReturnType<typeof deletePermission>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deletePermission>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getDeletePermissionQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






