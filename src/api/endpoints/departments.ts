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
  CreateDepartmentRequest,
  GetApiV1DepartmentsParams,
  UpdateDepartmentRequest
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

export const postApiV1Departments = (
    createDepartmentRequest?: CreateDepartmentRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/departments`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: createDepartmentRequest, signal
    },
      options);
    }




export const getPostApiV1DepartmentsMutationKey = () => ['postApiV1Departments'] as const;

export const getPostApiV1DepartmentsMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1Departments>>, TError,PostApiV1DepartmentsMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1Departments>>, TError,PostApiV1DepartmentsMutationVariables, TContext> => {

const mutationKey = getPostApiV1DepartmentsMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1Departments>>, PostApiV1DepartmentsMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1Departments(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1DepartmentsMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1Departments>>>
    export type PostApiV1DepartmentsMutationBody = CreateDepartmentRequest | undefined
    export type PostApiV1DepartmentsMutationError = unknown
    export type PostApiV1DepartmentsMutationVariables = {data?: CreateDepartmentRequest}

    export const usePostApiV1Departments = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1Departments>>, TError,PostApiV1DepartmentsMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1Departments>>,
        TError,
        PostApiV1DepartmentsMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1DepartmentsMutationOptions(options), queryClient);
    }
    export const getApiV1Departments = (
    params?: GetApiV1DepartmentsParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/departments`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetApiV1DepartmentsQueryKey = (params?: GetApiV1DepartmentsParams,) => {
    return [
    `/api/v1/departments`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetApiV1DepartmentsQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1Departments>>, TError = unknown>(params?: GetApiV1DepartmentsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Departments>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1DepartmentsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1Departments>>> = ({ signal }) => getApiV1Departments(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1Departments>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1DepartmentsQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1Departments>>>
export type GetApiV1DepartmentsQueryError = unknown


export function useGetApiV1Departments<TData = Awaited<ReturnType<typeof getApiV1Departments>>, TError = unknown>(
 params: undefined |  GetApiV1DepartmentsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Departments>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1Departments>>,
          TError,
          Awaited<ReturnType<typeof getApiV1Departments>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1Departments<TData = Awaited<ReturnType<typeof getApiV1Departments>>, TError = unknown>(
 params?: GetApiV1DepartmentsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Departments>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1Departments>>,
          TError,
          Awaited<ReturnType<typeof getApiV1Departments>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1Departments<TData = Awaited<ReturnType<typeof getApiV1Departments>>, TError = unknown>(
 params?: GetApiV1DepartmentsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Departments>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1Departments<TData = Awaited<ReturnType<typeof getApiV1Departments>>, TError = unknown>(
 params?: GetApiV1DepartmentsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Departments>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1DepartmentsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const putApiV1DepartmentsId = (
    id: string,
    updateDepartmentRequest?: UpdateDepartmentRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/departments/${id}`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: updateDepartmentRequest, signal
    },
      options);
    }




export const getPutApiV1DepartmentsIdMutationKey = () => ['putApiV1DepartmentsId'] as const;

export const getPutApiV1DepartmentsIdMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putApiV1DepartmentsId>>, TError,PutApiV1DepartmentsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof putApiV1DepartmentsId>>, TError,PutApiV1DepartmentsIdMutationVariables, TContext> => {

const mutationKey = getPutApiV1DepartmentsIdMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof putApiV1DepartmentsId>>, PutApiV1DepartmentsIdMutationVariables> = (props) => {
          const {id,data} = props ?? {};

          return  putApiV1DepartmentsId(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PutApiV1DepartmentsIdMutationResult = NonNullable<Awaited<ReturnType<typeof putApiV1DepartmentsId>>>
    export type PutApiV1DepartmentsIdMutationBody = UpdateDepartmentRequest | undefined
    export type PutApiV1DepartmentsIdMutationError = unknown
    export type PutApiV1DepartmentsIdMutationVariables = {id: string;data?: UpdateDepartmentRequest}

    export const usePutApiV1DepartmentsId = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof putApiV1DepartmentsId>>, TError,PutApiV1DepartmentsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof putApiV1DepartmentsId>>,
        TError,
        PutApiV1DepartmentsIdMutationVariables,
        TContext
      > => {
      return useMutation(getPutApiV1DepartmentsIdMutationOptions(options), queryClient);
    }
    export const deleteApiV1DepartmentsId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/departments/${id}`, method: 'DELETE', signal
    },
      options);
    }




export const getDeleteApiV1DepartmentsIdMutationKey = () => ['deleteApiV1DepartmentsId'] as const;

export const getDeleteApiV1DepartmentsIdMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1DepartmentsId>>, TError,DeleteApiV1DepartmentsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1DepartmentsId>>, TError,DeleteApiV1DepartmentsIdMutationVariables, TContext> => {

const mutationKey = getDeleteApiV1DepartmentsIdMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteApiV1DepartmentsId>>, DeleteApiV1DepartmentsIdMutationVariables> = (props) => {
          const {id} = props ?? {};

          return  deleteApiV1DepartmentsId(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteApiV1DepartmentsIdMutationResult = NonNullable<Awaited<ReturnType<typeof deleteApiV1DepartmentsId>>>

    export type DeleteApiV1DepartmentsIdMutationError = unknown
    export type DeleteApiV1DepartmentsIdMutationVariables = {id: string}

    export const useDeleteApiV1DepartmentsId = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1DepartmentsId>>, TError,DeleteApiV1DepartmentsIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteApiV1DepartmentsId>>,
        TError,
        DeleteApiV1DepartmentsIdMutationVariables,
        TContext
      > => {
      return useMutation(getDeleteApiV1DepartmentsIdMutationOptions(options), queryClient);
    }
    export const getApiV1DepartmentsId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/departments/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1DepartmentsIdQueryKey = (id: string,) => {
    return [
    `/api/v1/departments/${id}`
    ] as const;
    }


export const getGetApiV1DepartmentsIdQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1DepartmentsId>>, TError = unknown>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1DepartmentsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1DepartmentsIdQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1DepartmentsId>>> = ({ signal }) => getApiV1DepartmentsId(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1DepartmentsId>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1DepartmentsIdQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1DepartmentsId>>>
export type GetApiV1DepartmentsIdQueryError = unknown


export function useGetApiV1DepartmentsId<TData = Awaited<ReturnType<typeof getApiV1DepartmentsId>>, TError = unknown>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1DepartmentsId>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1DepartmentsId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1DepartmentsId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1DepartmentsId<TData = Awaited<ReturnType<typeof getApiV1DepartmentsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1DepartmentsId>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1DepartmentsId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1DepartmentsId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1DepartmentsId<TData = Awaited<ReturnType<typeof getApiV1DepartmentsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1DepartmentsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1DepartmentsId<TData = Awaited<ReturnType<typeof getApiV1DepartmentsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1DepartmentsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1DepartmentsIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const getApiV1DepartmentsAll = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/departments/all`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1DepartmentsAllQueryKey = () => {
    return [
    `/api/v1/departments/all`
    ] as const;
    }


export const getGetApiV1DepartmentsAllQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1DepartmentsAll>>, TError = unknown>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1DepartmentsAll>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1DepartmentsAllQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1DepartmentsAll>>> = ({ signal }) => getApiV1DepartmentsAll(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1DepartmentsAll>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1DepartmentsAllQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1DepartmentsAll>>>
export type GetApiV1DepartmentsAllQueryError = unknown


export function useGetApiV1DepartmentsAll<TData = Awaited<ReturnType<typeof getApiV1DepartmentsAll>>, TError = unknown>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1DepartmentsAll>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1DepartmentsAll>>,
          TError,
          Awaited<ReturnType<typeof getApiV1DepartmentsAll>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1DepartmentsAll<TData = Awaited<ReturnType<typeof getApiV1DepartmentsAll>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1DepartmentsAll>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1DepartmentsAll>>,
          TError,
          Awaited<ReturnType<typeof getApiV1DepartmentsAll>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1DepartmentsAll<TData = Awaited<ReturnType<typeof getApiV1DepartmentsAll>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1DepartmentsAll>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1DepartmentsAll<TData = Awaited<ReturnType<typeof getApiV1DepartmentsAll>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1DepartmentsAll>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1DepartmentsAllQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const getApiV1DepartmentsIdMembers = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/departments/${id}/members`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1DepartmentsIdMembersQueryKey = (id: string,) => {
    return [
    `/api/v1/departments/${id}/members`
    ] as const;
    }


export const getGetApiV1DepartmentsIdMembersQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1DepartmentsIdMembers>>, TError = unknown>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1DepartmentsIdMembers>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1DepartmentsIdMembersQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1DepartmentsIdMembers>>> = ({ signal }) => getApiV1DepartmentsIdMembers(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1DepartmentsIdMembers>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1DepartmentsIdMembersQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1DepartmentsIdMembers>>>
export type GetApiV1DepartmentsIdMembersQueryError = unknown


export function useGetApiV1DepartmentsIdMembers<TData = Awaited<ReturnType<typeof getApiV1DepartmentsIdMembers>>, TError = unknown>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1DepartmentsIdMembers>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1DepartmentsIdMembers>>,
          TError,
          Awaited<ReturnType<typeof getApiV1DepartmentsIdMembers>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1DepartmentsIdMembers<TData = Awaited<ReturnType<typeof getApiV1DepartmentsIdMembers>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1DepartmentsIdMembers>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1DepartmentsIdMembers>>,
          TError,
          Awaited<ReturnType<typeof getApiV1DepartmentsIdMembers>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1DepartmentsIdMembers<TData = Awaited<ReturnType<typeof getApiV1DepartmentsIdMembers>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1DepartmentsIdMembers>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1DepartmentsIdMembers<TData = Awaited<ReturnType<typeof getApiV1DepartmentsIdMembers>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1DepartmentsIdMembers>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1DepartmentsIdMembersQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const deleteApiV1DepartmentsIdMembersUserId = (
    id: string,
    userId: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/departments/${id}/members/${userId}`, method: 'DELETE', signal
    },
      options);
    }




export const getDeleteApiV1DepartmentsIdMembersUserIdMutationKey = () => ['deleteApiV1DepartmentsIdMembersUserId'] as const;

export const getDeleteApiV1DepartmentsIdMembersUserIdMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1DepartmentsIdMembersUserId>>, TError,DeleteApiV1DepartmentsIdMembersUserIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1DepartmentsIdMembersUserId>>, TError,DeleteApiV1DepartmentsIdMembersUserIdMutationVariables, TContext> => {

const mutationKey = getDeleteApiV1DepartmentsIdMembersUserIdMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteApiV1DepartmentsIdMembersUserId>>, DeleteApiV1DepartmentsIdMembersUserIdMutationVariables> = (props) => {
          const {id,userId} = props ?? {};

          return  deleteApiV1DepartmentsIdMembersUserId(id,userId,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteApiV1DepartmentsIdMembersUserIdMutationResult = NonNullable<Awaited<ReturnType<typeof deleteApiV1DepartmentsIdMembersUserId>>>

    export type DeleteApiV1DepartmentsIdMembersUserIdMutationError = unknown
    export type DeleteApiV1DepartmentsIdMembersUserIdMutationVariables = {id: string;userId: string}

    export const useDeleteApiV1DepartmentsIdMembersUserId = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1DepartmentsIdMembersUserId>>, TError,DeleteApiV1DepartmentsIdMembersUserIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteApiV1DepartmentsIdMembersUserId>>,
        TError,
        DeleteApiV1DepartmentsIdMembersUserIdMutationVariables,
        TContext
      > => {
      return useMutation(getDeleteApiV1DepartmentsIdMembersUserIdMutationOptions(options), queryClient);
    }
