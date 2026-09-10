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




export const getPostApiV1FilesUploadQueryKey = (postApiV1FilesUploadBody?: PostApiV1FilesUploadBody,) => {
    return [
    'POST', `/api/v1/files/upload`, postApiV1FilesUploadBody
    ] as const;
    }


export const getPostApiV1FilesUploadQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1FilesUpload>>, TError = unknown>(postApiV1FilesUploadBody?: PostApiV1FilesUploadBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1FilesUpload>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1FilesUploadQueryKey(postApiV1FilesUploadBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1FilesUpload>>> = ({ signal }) => postApiV1FilesUpload(postApiV1FilesUploadBody, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1FilesUpload>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type PostApiV1FilesUploadQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1FilesUpload>>>
export type PostApiV1FilesUploadQueryError = unknown


export function usePostApiV1FilesUpload<TData = Awaited<ReturnType<typeof postApiV1FilesUpload>>, TError = unknown>(
 postApiV1FilesUploadBody: undefined |  PostApiV1FilesUploadBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1FilesUpload>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1FilesUpload>>,
          TError,
          Awaited<ReturnType<typeof postApiV1FilesUpload>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1FilesUpload<TData = Awaited<ReturnType<typeof postApiV1FilesUpload>>, TError = unknown>(
 postApiV1FilesUploadBody?: PostApiV1FilesUploadBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1FilesUpload>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1FilesUpload>>,
          TError,
          Awaited<ReturnType<typeof postApiV1FilesUpload>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1FilesUpload<TData = Awaited<ReturnType<typeof postApiV1FilesUpload>>, TError = unknown>(
 postApiV1FilesUploadBody?: PostApiV1FilesUploadBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1FilesUpload>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1FilesUpload<TData = Awaited<ReturnType<typeof postApiV1FilesUpload>>, TError = unknown>(
 postApiV1FilesUploadBody?: PostApiV1FilesUploadBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1FilesUpload>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1FilesUploadQueryOptions(postApiV1FilesUploadBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
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




export const getPostApiV1FilesUploadBulkQueryKey = (postApiV1FilesUploadBulkBody?: PostApiV1FilesUploadBulkBody,) => {
    return [
    'POST', `/api/v1/files/upload-bulk`, postApiV1FilesUploadBulkBody
    ] as const;
    }


export const getPostApiV1FilesUploadBulkQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>, TError = unknown>(postApiV1FilesUploadBulkBody?: PostApiV1FilesUploadBulkBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1FilesUploadBulkQueryKey(postApiV1FilesUploadBulkBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>> = ({ signal }) => postApiV1FilesUploadBulk(postApiV1FilesUploadBulkBody, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type PostApiV1FilesUploadBulkQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>>
export type PostApiV1FilesUploadBulkQueryError = unknown


export function usePostApiV1FilesUploadBulk<TData = Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>, TError = unknown>(
 postApiV1FilesUploadBulkBody: undefined |  PostApiV1FilesUploadBulkBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>,
          TError,
          Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1FilesUploadBulk<TData = Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>, TError = unknown>(
 postApiV1FilesUploadBulkBody?: PostApiV1FilesUploadBulkBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>,
          TError,
          Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1FilesUploadBulk<TData = Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>, TError = unknown>(
 postApiV1FilesUploadBulkBody?: PostApiV1FilesUploadBulkBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1FilesUploadBulk<TData = Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>, TError = unknown>(
 postApiV1FilesUploadBulkBody?: PostApiV1FilesUploadBulkBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1FilesUploadBulk>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1FilesUploadBulkQueryOptions(postApiV1FilesUploadBulkBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
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




export const getDeleteApiV1FilesIdQueryKey = (id: string,) => {
    return [
    'DELETE', `/api/v1/files/${id}`
    ] as const;
    }


export const getDeleteApiV1FilesIdQueryOptions = <TData = Awaited<ReturnType<typeof deleteApiV1FilesId>>, TError = unknown>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteApiV1FilesId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getDeleteApiV1FilesIdQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof deleteApiV1FilesId>>> = ({ signal }) => deleteApiV1FilesId(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof deleteApiV1FilesId>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type DeleteApiV1FilesIdQueryResult = NonNullable<Awaited<ReturnType<typeof deleteApiV1FilesId>>>
export type DeleteApiV1FilesIdQueryError = unknown


export function useDeleteApiV1FilesId<TData = Awaited<ReturnType<typeof deleteApiV1FilesId>>, TError = unknown>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteApiV1FilesId>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof deleteApiV1FilesId>>,
          TError,
          Awaited<ReturnType<typeof deleteApiV1FilesId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useDeleteApiV1FilesId<TData = Awaited<ReturnType<typeof deleteApiV1FilesId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteApiV1FilesId>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof deleteApiV1FilesId>>,
          TError,
          Awaited<ReturnType<typeof deleteApiV1FilesId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useDeleteApiV1FilesId<TData = Awaited<ReturnType<typeof deleteApiV1FilesId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteApiV1FilesId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useDeleteApiV1FilesId<TData = Awaited<ReturnType<typeof deleteApiV1FilesId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteApiV1FilesId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getDeleteApiV1FilesIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
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






