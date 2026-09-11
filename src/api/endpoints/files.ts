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
  GetApiV1FilesParams,
  PostApiV1FilesUploadBody,
  PostApiV1FilesUploadBulkBody
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

export const postApiV1FilesUpload = (
    postApiV1FilesUploadBody?: PostApiV1FilesUploadBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {

      const formData = new FormData();
if(postApiV1FilesUploadBody?.File !== undefined) {
 formData.append(`File`, postApiV1FilesUploadBody.File);
 }
if(postApiV1FilesUploadBody?.DisplayName !== undefined) {
 formData.append(`DisplayName`, postApiV1FilesUploadBody.DisplayName);
 }
if(postApiV1FilesUploadBody?.Title !== undefined) {
 formData.append(`Title`, postApiV1FilesUploadBody.Title);
 }
if(postApiV1FilesUploadBody?.Description !== undefined) {
 formData.append(`Description`, postApiV1FilesUploadBody.Description);
 }
if(postApiV1FilesUploadBody?.Note !== undefined) {
 formData.append(`Note`, postApiV1FilesUploadBody.Note);
 }
if(postApiV1FilesUploadBody?.Category !== undefined) {
 formData.append(`Category`, postApiV1FilesUploadBody.Category);
 }
if(postApiV1FilesUploadBody?.EntityType !== undefined) {
 formData.append(`EntityType`, postApiV1FilesUploadBody.EntityType);
 }
if(postApiV1FilesUploadBody?.EntityId !== undefined) {
 formData.append(`EntityId`, postApiV1FilesUploadBody.EntityId);
 }
if(postApiV1FilesUploadBody?.Visibility !== undefined) {
 formData.append(`Visibility`, postApiV1FilesUploadBody.Visibility);
 }

      return mainInstance<void>(
      {url: `/api/v1/files/upload`, method: 'POST',
      headers: {'Content-Type': 'multipart/form-data', },
       data: formData, signal
    },
      options);
    }




export const getPostApiV1FilesUploadMutationKey = () => ['postApiV1FilesUpload'] as const;

export const getPostApiV1FilesUploadMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1FilesUpload>>, TError,PostApiV1FilesUploadMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1FilesUpload>>, TError,PostApiV1FilesUploadMutationVariables, TContext> => {

const mutationKey = getPostApiV1FilesUploadMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1FilesUpload>>, PostApiV1FilesUploadMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1FilesUpload(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1FilesUploadMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1FilesUpload>>>
    export type PostApiV1FilesUploadMutationBody = PostApiV1FilesUploadBody | undefined
    export type PostApiV1FilesUploadMutationError = unknown
    export type PostApiV1FilesUploadMutationVariables = {data?: PostApiV1FilesUploadBody}

    export const usePostApiV1FilesUpload = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1FilesUpload>>, TError,PostApiV1FilesUploadMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1FilesUpload>>,
        TError,
        PostApiV1FilesUploadMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1FilesUploadMutationOptions(options), queryClient);
    }
    export const postApiV1FilesUploadBulk = (
    postApiV1FilesUploadBulkBody?: PostApiV1FilesUploadBulkBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {

      const formData = new FormData();
if(postApiV1FilesUploadBulkBody?.files !== undefined) {
 postApiV1FilesUploadBulkBody?.files.forEach(value => formData.append(`files`, value));
 }
if(postApiV1FilesUploadBulkBody?.displayName !== undefined) {
 formData.append(`displayName`, postApiV1FilesUploadBulkBody.displayName);
 }
if(postApiV1FilesUploadBulkBody?.title !== undefined) {
 formData.append(`title`, postApiV1FilesUploadBulkBody.title);
 }
if(postApiV1FilesUploadBulkBody?.description !== undefined) {
 formData.append(`description`, postApiV1FilesUploadBulkBody.description);
 }
if(postApiV1FilesUploadBulkBody?.note !== undefined) {
 formData.append(`note`, postApiV1FilesUploadBulkBody.note);
 }
if(postApiV1FilesUploadBulkBody?.category !== undefined) {
 formData.append(`category`, postApiV1FilesUploadBulkBody.category);
 }
if(postApiV1FilesUploadBulkBody?.entityType !== undefined) {
 formData.append(`entityType`, postApiV1FilesUploadBulkBody.entityType);
 }
if(postApiV1FilesUploadBulkBody?.entityId !== undefined) {
 formData.append(`entityId`, postApiV1FilesUploadBulkBody.entityId);
 }
if(postApiV1FilesUploadBulkBody?.visibility !== undefined) {
 formData.append(`visibility`, postApiV1FilesUploadBulkBody.visibility);
 }

      return mainInstance<void>(
      {url: `/api/v1/files/upload-bulk`, method: 'POST',
      headers: {'Content-Type': 'multipart/form-data', },
       data: formData, signal
    },
      options);
    }




export const getPostApiV1FilesUploadBulkMutationKey = () => ['postApiV1FilesUploadBulk'] as const;

export const getPostApiV1FilesUploadBulkMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>, TError,PostApiV1FilesUploadBulkMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>, TError,PostApiV1FilesUploadBulkMutationVariables, TContext> => {

const mutationKey = getPostApiV1FilesUploadBulkMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>, PostApiV1FilesUploadBulkMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1FilesUploadBulk(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1FilesUploadBulkMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>>
    export type PostApiV1FilesUploadBulkMutationBody = PostApiV1FilesUploadBulkBody | undefined
    export type PostApiV1FilesUploadBulkMutationError = unknown
    export type PostApiV1FilesUploadBulkMutationVariables = {data?: PostApiV1FilesUploadBulkBody}

    export const usePostApiV1FilesUploadBulk = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>, TError,PostApiV1FilesUploadBulkMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>,
        TError,
        PostApiV1FilesUploadBulkMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1FilesUploadBulkMutationOptions(options), queryClient);
    }
    export const getApiV1Files = (
    params?: GetApiV1FilesParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/files`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetApiV1FilesQueryKey = (params?: GetApiV1FilesParams,) => {
    return [
    `/api/v1/files`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetApiV1FilesQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1Files>>, TError = unknown>(params?: GetApiV1FilesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Files>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1FilesQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1Files>>> = ({ signal }) => getApiV1Files(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1Files>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1FilesQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1Files>>>
export type GetApiV1FilesQueryError = unknown


export function useGetApiV1Files<TData = Awaited<ReturnType<typeof getApiV1Files>>, TError = unknown>(
 params: undefined |  GetApiV1FilesParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Files>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1Files>>,
          TError,
          Awaited<ReturnType<typeof getApiV1Files>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1Files<TData = Awaited<ReturnType<typeof getApiV1Files>>, TError = unknown>(
 params?: GetApiV1FilesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Files>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1Files>>,
          TError,
          Awaited<ReturnType<typeof getApiV1Files>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1Files<TData = Awaited<ReturnType<typeof getApiV1Files>>, TError = unknown>(
 params?: GetApiV1FilesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Files>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1Files<TData = Awaited<ReturnType<typeof getApiV1Files>>, TError = unknown>(
 params?: GetApiV1FilesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1Files>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1FilesQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const getApiV1FilesId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/files/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1FilesIdQueryKey = (id: string,) => {
    return [
    `/api/v1/files/${id}`
    ] as const;
    }


export const getGetApiV1FilesIdQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1FilesId>>, TError = unknown>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1FilesId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1FilesIdQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1FilesId>>> = ({ signal }) => getApiV1FilesId(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1FilesId>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1FilesIdQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1FilesId>>>
export type GetApiV1FilesIdQueryError = unknown


export function useGetApiV1FilesId<TData = Awaited<ReturnType<typeof getApiV1FilesId>>, TError = unknown>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1FilesId>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1FilesId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1FilesId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1FilesId<TData = Awaited<ReturnType<typeof getApiV1FilesId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1FilesId>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1FilesId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1FilesId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1FilesId<TData = Awaited<ReturnType<typeof getApiV1FilesId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1FilesId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1FilesId<TData = Awaited<ReturnType<typeof getApiV1FilesId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1FilesId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1FilesIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const deleteApiV1FilesId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/files/${id}`, method: 'DELETE', signal
    },
      options);
    }




export const getDeleteApiV1FilesIdMutationKey = () => ['deleteApiV1FilesId'] as const;

export const getDeleteApiV1FilesIdMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1FilesId>>, TError,DeleteApiV1FilesIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1FilesId>>, TError,DeleteApiV1FilesIdMutationVariables, TContext> => {

const mutationKey = getDeleteApiV1FilesIdMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteApiV1FilesId>>, DeleteApiV1FilesIdMutationVariables> = (props) => {
          const {id} = props ?? {};

          return  deleteApiV1FilesId(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteApiV1FilesIdMutationResult = NonNullable<Awaited<ReturnType<typeof deleteApiV1FilesId>>>

    export type DeleteApiV1FilesIdMutationError = unknown
    export type DeleteApiV1FilesIdMutationVariables = {id: string}

    export const useDeleteApiV1FilesId = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteApiV1FilesId>>, TError,DeleteApiV1FilesIdMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof deleteApiV1FilesId>>,
        TError,
        DeleteApiV1FilesIdMutationVariables,
        TContext
      > => {
      return useMutation(getDeleteApiV1FilesIdMutationOptions(options), queryClient);
    }
    export const getApiV1FilesIdDownload = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/files/${id}/download`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1FilesIdDownloadQueryKey = (id: string,) => {
    return [
    `/api/v1/files/${id}/download`
    ] as const;
    }


export const getGetApiV1FilesIdDownloadQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1FilesIdDownload>>, TError = unknown>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1FilesIdDownload>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1FilesIdDownloadQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1FilesIdDownload>>> = ({ signal }) => getApiV1FilesIdDownload(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1FilesIdDownload>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1FilesIdDownloadQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1FilesIdDownload>>>
export type GetApiV1FilesIdDownloadQueryError = unknown


export function useGetApiV1FilesIdDownload<TData = Awaited<ReturnType<typeof getApiV1FilesIdDownload>>, TError = unknown>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1FilesIdDownload>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1FilesIdDownload>>,
          TError,
          Awaited<ReturnType<typeof getApiV1FilesIdDownload>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1FilesIdDownload<TData = Awaited<ReturnType<typeof getApiV1FilesIdDownload>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1FilesIdDownload>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1FilesIdDownload>>,
          TError,
          Awaited<ReturnType<typeof getApiV1FilesIdDownload>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1FilesIdDownload<TData = Awaited<ReturnType<typeof getApiV1FilesIdDownload>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1FilesIdDownload>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1FilesIdDownload<TData = Awaited<ReturnType<typeof getApiV1FilesIdDownload>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1FilesIdDownload>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1FilesIdDownloadQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






