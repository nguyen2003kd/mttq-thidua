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
  BatchLinkRequest,
  BatchLinkResponse,
  ConfirmFileRequest,
  ConfirmFileUpload200,
  DeleteFile200,
  ErrorResponse,
  FileArrayResponse,
  FileLinkResponse,
  FileListResponse,
  FileMutateBody,
  FileResponse,
  FileUploadBody,
  GetFileContentParams,
  GetFileLinkParams,
  GetFilesParams,
  PresignRequest,
  PresignResponse,
  QuotaResponse,
  RestoreFileResponse,
  UploadMultipleFilesBody
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
 * Admin/system_admin: all files. Regular user: own uploads only.
 * @summary Get all files
 */
export const getFiles = (
    params?: GetFilesParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<FileListResponse>(
      {url: `/api/v1/files`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetFilesQueryKey = (params?: GetFilesParams,) => {
    return [
    `/api/v1/files`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetFilesQueryOptions = <TData = Awaited<ReturnType<typeof getFiles>>, TError = ErrorResponse>(params?: GetFilesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFiles>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetFilesQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getFiles>>> = ({ signal }) => getFiles(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getFiles>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetFilesQueryResult = NonNullable<Awaited<ReturnType<typeof getFiles>>>
export type GetFilesQueryError = ErrorResponse


export function useGetFiles<TData = Awaited<ReturnType<typeof getFiles>>, TError = ErrorResponse>(
 params: undefined |  GetFilesParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFiles>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getFiles>>,
          TError,
          Awaited<ReturnType<typeof getFiles>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetFiles<TData = Awaited<ReturnType<typeof getFiles>>, TError = ErrorResponse>(
 params?: GetFilesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFiles>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getFiles>>,
          TError,
          Awaited<ReturnType<typeof getFiles>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetFiles<TData = Awaited<ReturnType<typeof getFiles>>, TError = ErrorResponse>(
 params?: GetFilesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFiles>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get all files
 */

export function useGetFiles<TData = Awaited<ReturnType<typeof getFiles>>, TError = ErrorResponse>(
 params?: GetFilesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFiles>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetFilesQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Upload a file
 */
export const uploadFile = (
    fileUploadBody: FileUploadBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {

      const formData = new FormData();
formData.append(`file`, fileUploadBody.file);
if(fileUploadBody.title !== undefined && fileUploadBody.title !== null) {
 formData.append(`title`, fileUploadBody.title);
 }
if(fileUploadBody.description !== undefined && fileUploadBody.description !== null) {
 formData.append(`description`, fileUploadBody.description);
 }
if(fileUploadBody.note !== undefined && fileUploadBody.note !== null) {
 formData.append(`note`, fileUploadBody.note);
 }
if(fileUploadBody.is_library !== undefined) {
 formData.append(`is_library`, fileUploadBody.is_library.toString())
 }

      return mainInstance<FileResponse>(
      {url: `/api/v1/files`, method: 'POST',
      headers: {'Content-Type': 'multipart/form-data', },
       data: formData, signal
    },
      options);
    }




export const getUploadFileQueryKey = (fileUploadBody?: FileUploadBody,) => {
    return [
    'POST', `/api/v1/files`, fileUploadBody
    ] as const;
    }


export const getUploadFileQueryOptions = <TData = Awaited<ReturnType<typeof uploadFile>>, TError = ErrorResponse>(fileUploadBody: FileUploadBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof uploadFile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getUploadFileQueryKey(fileUploadBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof uploadFile>>> = ({ signal }) => uploadFile(fileUploadBody, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof uploadFile>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type UploadFileQueryResult = NonNullable<Awaited<ReturnType<typeof uploadFile>>>
export type UploadFileQueryError = ErrorResponse


export function useUploadFile<TData = Awaited<ReturnType<typeof uploadFile>>, TError = ErrorResponse>(
 fileUploadBody: FileUploadBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof uploadFile>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof uploadFile>>,
          TError,
          Awaited<ReturnType<typeof uploadFile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useUploadFile<TData = Awaited<ReturnType<typeof uploadFile>>, TError = ErrorResponse>(
 fileUploadBody: FileUploadBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof uploadFile>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof uploadFile>>,
          TError,
          Awaited<ReturnType<typeof uploadFile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useUploadFile<TData = Awaited<ReturnType<typeof uploadFile>>, TError = ErrorResponse>(
 fileUploadBody: FileUploadBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof uploadFile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Upload a file
 */

export function useUploadFile<TData = Awaited<ReturnType<typeof uploadFile>>, TError = ErrorResponse>(
 fileUploadBody: FileUploadBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof uploadFile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getUploadFileQueryOptions(fileUploadBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Get file by ID
 */
export const getFileById = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<FileResponse>(
      {url: `/api/v1/files/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetFileByIdQueryKey = (id: string,) => {
    return [
    `/api/v1/files/${id}`
    ] as const;
    }


export const getGetFileByIdQueryOptions = <TData = Awaited<ReturnType<typeof getFileById>>, TError = ErrorResponse>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetFileByIdQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getFileById>>> = ({ signal }) => getFileById(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getFileById>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetFileByIdQueryResult = NonNullable<Awaited<ReturnType<typeof getFileById>>>
export type GetFileByIdQueryError = ErrorResponse


export function useGetFileById<TData = Awaited<ReturnType<typeof getFileById>>, TError = ErrorResponse>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileById>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getFileById>>,
          TError,
          Awaited<ReturnType<typeof getFileById>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetFileById<TData = Awaited<ReturnType<typeof getFileById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileById>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getFileById>>,
          TError,
          Awaited<ReturnType<typeof getFileById>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetFileById<TData = Awaited<ReturnType<typeof getFileById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get file by ID
 */

export function useGetFileById<TData = Awaited<ReturnType<typeof getFileById>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileById>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetFileByIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Update file metadata (or replace file)
 */
export const updateFile = (
    id: string,
    fileMutateBody?: FileMutateBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<FileResponse>(
      {url: `/api/v1/files/${id}`, method: 'PUT',
      headers: {'Content-Type': 'application/json', },
      data: fileMutateBody, signal
    },
      options);
    }




export const getUpdateFileQueryKey = (id: string,
    fileMutateBody?: FileMutateBody,) => {
    return [
    'PUT', `/api/v1/files/${id}`, fileMutateBody
    ] as const;
    }


export const getUpdateFileQueryOptions = <TData = Awaited<ReturnType<typeof updateFile>>, TError = ErrorResponse>(id: string,
    fileMutateBody?: FileMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateFile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getUpdateFileQueryKey(id,fileMutateBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof updateFile>>> = ({ signal }) => updateFile(id,fileMutateBody, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof updateFile>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type UpdateFileQueryResult = NonNullable<Awaited<ReturnType<typeof updateFile>>>
export type UpdateFileQueryError = ErrorResponse


export function useUpdateFile<TData = Awaited<ReturnType<typeof updateFile>>, TError = ErrorResponse>(
 id: string,
    fileMutateBody: undefined |  FileMutateBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateFile>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof updateFile>>,
          TError,
          Awaited<ReturnType<typeof updateFile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useUpdateFile<TData = Awaited<ReturnType<typeof updateFile>>, TError = ErrorResponse>(
 id: string,
    fileMutateBody?: FileMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateFile>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof updateFile>>,
          TError,
          Awaited<ReturnType<typeof updateFile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useUpdateFile<TData = Awaited<ReturnType<typeof updateFile>>, TError = ErrorResponse>(
 id: string,
    fileMutateBody?: FileMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateFile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Update file metadata (or replace file)
 */

export function useUpdateFile<TData = Awaited<ReturnType<typeof updateFile>>, TError = ErrorResponse>(
 id: string,
    fileMutateBody?: FileMutateBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof updateFile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getUpdateFileQueryOptions(id,fileMutateBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Delete file
 */
export const deleteFile = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<DeleteFile200>(
      {url: `/api/v1/files/${id}`, method: 'DELETE', signal
    },
      options);
    }




export const getDeleteFileQueryKey = (id: string,) => {
    return [
    'DELETE', `/api/v1/files/${id}`
    ] as const;
    }


export const getDeleteFileQueryOptions = <TData = Awaited<ReturnType<typeof deleteFile>>, TError = ErrorResponse>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteFile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getDeleteFileQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof deleteFile>>> = ({ signal }) => deleteFile(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof deleteFile>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type DeleteFileQueryResult = NonNullable<Awaited<ReturnType<typeof deleteFile>>>
export type DeleteFileQueryError = ErrorResponse


export function useDeleteFile<TData = Awaited<ReturnType<typeof deleteFile>>, TError = ErrorResponse>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteFile>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof deleteFile>>,
          TError,
          Awaited<ReturnType<typeof deleteFile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useDeleteFile<TData = Awaited<ReturnType<typeof deleteFile>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteFile>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof deleteFile>>,
          TError,
          Awaited<ReturnType<typeof deleteFile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useDeleteFile<TData = Awaited<ReturnType<typeof deleteFile>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteFile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Delete file
 */

export function useDeleteFile<TData = Awaited<ReturnType<typeof deleteFile>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof deleteFile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getDeleteFileQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Upload up to 10 files at once. Each file undergoes magic-byte, MIME/extension, and virus scan validation.
 * @summary Upload multiple files
 */
export const uploadMultipleFiles = (
    uploadMultipleFilesBody: UploadMultipleFilesBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {

      const formData = new FormData();
uploadMultipleFilesBody.files.forEach(value => formData.append(`files`, value));
if(uploadMultipleFilesBody.title !== undefined) {
 formData.append(`title`, uploadMultipleFilesBody.title);
 }
if(uploadMultipleFilesBody.description !== undefined) {
 formData.append(`description`, uploadMultipleFilesBody.description);
 }
if(uploadMultipleFilesBody.note !== undefined) {
 formData.append(`note`, uploadMultipleFilesBody.note);
 }
if(uploadMultipleFilesBody.is_library !== undefined) {
 formData.append(`is_library`, uploadMultipleFilesBody.is_library.toString())
 }

      return mainInstance<FileArrayResponse>(
      {url: `/api/v1/files/upload-multiple`, method: 'POST',
      headers: {'Content-Type': 'multipart/form-data', },
       data: formData, signal
    },
      options);
    }




export const getUploadMultipleFilesQueryKey = (uploadMultipleFilesBody?: UploadMultipleFilesBody,) => {
    return [
    'POST', `/api/v1/files/upload-multiple`, uploadMultipleFilesBody
    ] as const;
    }


export const getUploadMultipleFilesQueryOptions = <TData = Awaited<ReturnType<typeof uploadMultipleFiles>>, TError = ErrorResponse>(uploadMultipleFilesBody: UploadMultipleFilesBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof uploadMultipleFiles>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getUploadMultipleFilesQueryKey(uploadMultipleFilesBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof uploadMultipleFiles>>> = ({ signal }) => uploadMultipleFiles(uploadMultipleFilesBody, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof uploadMultipleFiles>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type UploadMultipleFilesQueryResult = NonNullable<Awaited<ReturnType<typeof uploadMultipleFiles>>>
export type UploadMultipleFilesQueryError = ErrorResponse


export function useUploadMultipleFiles<TData = Awaited<ReturnType<typeof uploadMultipleFiles>>, TError = ErrorResponse>(
 uploadMultipleFilesBody: UploadMultipleFilesBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof uploadMultipleFiles>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof uploadMultipleFiles>>,
          TError,
          Awaited<ReturnType<typeof uploadMultipleFiles>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useUploadMultipleFiles<TData = Awaited<ReturnType<typeof uploadMultipleFiles>>, TError = ErrorResponse>(
 uploadMultipleFilesBody: UploadMultipleFilesBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof uploadMultipleFiles>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof uploadMultipleFiles>>,
          TError,
          Awaited<ReturnType<typeof uploadMultipleFiles>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useUploadMultipleFiles<TData = Awaited<ReturnType<typeof uploadMultipleFiles>>, TError = ErrorResponse>(
 uploadMultipleFilesBody: UploadMultipleFilesBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof uploadMultipleFiles>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Upload multiple files
 */

export function useUploadMultipleFiles<TData = Awaited<ReturnType<typeof uploadMultipleFiles>>, TError = ErrorResponse>(
 uploadMultipleFilesBody: UploadMultipleFilesBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof uploadMultipleFiles>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getUploadMultipleFilesQueryOptions(uploadMultipleFilesBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Get storage quota and usage breakdown for the current user
 * @summary Get storage quota
 */
export const getFileQuota = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<QuotaResponse>(
      {url: `/api/v1/files/quota`, method: 'GET', signal
    },
      options);
    }




export const getGetFileQuotaQueryKey = () => {
    return [
    `/api/v1/files/quota`
    ] as const;
    }


export const getGetFileQuotaQueryOptions = <TData = Awaited<ReturnType<typeof getFileQuota>>, TError = ErrorResponse>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileQuota>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetFileQuotaQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getFileQuota>>> = ({ signal }) => getFileQuota(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getFileQuota>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetFileQuotaQueryResult = NonNullable<Awaited<ReturnType<typeof getFileQuota>>>
export type GetFileQuotaQueryError = ErrorResponse


export function useGetFileQuota<TData = Awaited<ReturnType<typeof getFileQuota>>, TError = ErrorResponse>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileQuota>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getFileQuota>>,
          TError,
          Awaited<ReturnType<typeof getFileQuota>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetFileQuota<TData = Awaited<ReturnType<typeof getFileQuota>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileQuota>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getFileQuota>>,
          TError,
          Awaited<ReturnType<typeof getFileQuota>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetFileQuota<TData = Awaited<ReturnType<typeof getFileQuota>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileQuota>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get storage quota
 */

export function useGetFileQuota<TData = Awaited<ReturnType<typeof getFileQuota>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileQuota>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetFileQuotaQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Get a presigned URL for direct MinIO upload (MinIO only)
 * @summary Get presigned upload URL
 */
export const presignFileUpload = (
    presignRequest: PresignRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<PresignResponse>(
      {url: `/api/v1/files/presign`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: presignRequest, signal
    },
      options);
    }




export const getPresignFileUploadQueryKey = (presignRequest?: PresignRequest,) => {
    return [
    'POST', `/api/v1/files/presign`, presignRequest
    ] as const;
    }


export const getPresignFileUploadQueryOptions = <TData = Awaited<ReturnType<typeof presignFileUpload>>, TError = ErrorResponse>(presignRequest: PresignRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof presignFileUpload>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPresignFileUploadQueryKey(presignRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof presignFileUpload>>> = ({ signal }) => presignFileUpload(presignRequest, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof presignFileUpload>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type PresignFileUploadQueryResult = NonNullable<Awaited<ReturnType<typeof presignFileUpload>>>
export type PresignFileUploadQueryError = ErrorResponse


export function usePresignFileUpload<TData = Awaited<ReturnType<typeof presignFileUpload>>, TError = ErrorResponse>(
 presignRequest: PresignRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof presignFileUpload>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof presignFileUpload>>,
          TError,
          Awaited<ReturnType<typeof presignFileUpload>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePresignFileUpload<TData = Awaited<ReturnType<typeof presignFileUpload>>, TError = ErrorResponse>(
 presignRequest: PresignRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof presignFileUpload>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof presignFileUpload>>,
          TError,
          Awaited<ReturnType<typeof presignFileUpload>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePresignFileUpload<TData = Awaited<ReturnType<typeof presignFileUpload>>, TError = ErrorResponse>(
 presignRequest: PresignRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof presignFileUpload>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get presigned upload URL
 */

export function usePresignFileUpload<TData = Awaited<ReturnType<typeof presignFileUpload>>, TError = ErrorResponse>(
 presignRequest: PresignRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof presignFileUpload>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPresignFileUploadQueryOptions(presignRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Confirm a direct MinIO upload and save metadata
 * @summary Confirm direct upload
 */
export const confirmFileUpload = (
    confirmFileRequest: ConfirmFileRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<ConfirmFileUpload200>(
      {url: `/api/v1/files/confirm`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: confirmFileRequest, signal
    },
      options);
    }




export const getConfirmFileUploadQueryKey = (confirmFileRequest?: ConfirmFileRequest,) => {
    return [
    'POST', `/api/v1/files/confirm`, confirmFileRequest
    ] as const;
    }


export const getConfirmFileUploadQueryOptions = <TData = Awaited<ReturnType<typeof confirmFileUpload>>, TError = ErrorResponse>(confirmFileRequest: ConfirmFileRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof confirmFileUpload>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getConfirmFileUploadQueryKey(confirmFileRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof confirmFileUpload>>> = ({ signal }) => confirmFileUpload(confirmFileRequest, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof confirmFileUpload>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ConfirmFileUploadQueryResult = NonNullable<Awaited<ReturnType<typeof confirmFileUpload>>>
export type ConfirmFileUploadQueryError = ErrorResponse


export function useConfirmFileUpload<TData = Awaited<ReturnType<typeof confirmFileUpload>>, TError = ErrorResponse>(
 confirmFileRequest: ConfirmFileRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof confirmFileUpload>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof confirmFileUpload>>,
          TError,
          Awaited<ReturnType<typeof confirmFileUpload>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useConfirmFileUpload<TData = Awaited<ReturnType<typeof confirmFileUpload>>, TError = ErrorResponse>(
 confirmFileRequest: ConfirmFileRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof confirmFileUpload>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof confirmFileUpload>>,
          TError,
          Awaited<ReturnType<typeof confirmFileUpload>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useConfirmFileUpload<TData = Awaited<ReturnType<typeof confirmFileUpload>>, TError = ErrorResponse>(
 confirmFileRequest: ConfirmFileRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof confirmFileUpload>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Confirm direct upload
 */

export function useConfirmFileUpload<TData = Awaited<ReturnType<typeof confirmFileUpload>>, TError = ErrorResponse>(
 confirmFileRequest: ConfirmFileRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof confirmFileUpload>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getConfirmFileUploadQueryOptions(confirmFileRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Stream the file directly or redirect to a signed URL for cloud storage. Use mode=view for preview (inline) or mode=download for download (attachment)
 * @summary Get file content (view or download)
 */
export const getFileContent = (
    id: string,
    params?: GetFileContentParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<Blob>(
      {url: `/api/v1/files/${id}/content`, method: 'GET',
        params,
        responseType: 'blob', signal
    },
      options);
    }




export const getGetFileContentQueryKey = (id: string,
    params?: GetFileContentParams,) => {
    return [
    `/api/v1/files/${id}/content`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetFileContentQueryOptions = <TData = Awaited<ReturnType<typeof getFileContent>>, TError = void | ErrorResponse>(id: string,
    params?: GetFileContentParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileContent>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetFileContentQueryKey(id,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getFileContent>>> = ({ signal }) => getFileContent(id,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getFileContent>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetFileContentQueryResult = NonNullable<Awaited<ReturnType<typeof getFileContent>>>
export type GetFileContentQueryError = void | ErrorResponse


export function useGetFileContent<TData = Awaited<ReturnType<typeof getFileContent>>, TError = void | ErrorResponse>(
 id: string,
    params: undefined |  GetFileContentParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileContent>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getFileContent>>,
          TError,
          Awaited<ReturnType<typeof getFileContent>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetFileContent<TData = Awaited<ReturnType<typeof getFileContent>>, TError = void | ErrorResponse>(
 id: string,
    params?: GetFileContentParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileContent>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getFileContent>>,
          TError,
          Awaited<ReturnType<typeof getFileContent>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetFileContent<TData = Awaited<ReturnType<typeof getFileContent>>, TError = void | ErrorResponse>(
 id: string,
    params?: GetFileContentParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileContent>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get file content (view or download)
 */

export function useGetFileContent<TData = Awaited<ReturnType<typeof getFileContent>>, TError = void | ErrorResponse>(
 id: string,
    params?: GetFileContentParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileContent>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetFileContentQueryOptions(id,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Generate a signed URL for file access. Use mode=view for preview (inline) or mode=download for download (attachment)
 * @summary Get file link (view or download)
 */
export const getFileLink = (
    id: string,
    params?: GetFileLinkParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<FileLinkResponse>(
      {url: `/api/v1/files/${id}/link`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetFileLinkQueryKey = (id: string,
    params?: GetFileLinkParams,) => {
    return [
    `/api/v1/files/${id}/link`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetFileLinkQueryOptions = <TData = Awaited<ReturnType<typeof getFileLink>>, TError = ErrorResponse>(id: string,
    params?: GetFileLinkParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileLink>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetFileLinkQueryKey(id,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getFileLink>>> = ({ signal }) => getFileLink(id,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getFileLink>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetFileLinkQueryResult = NonNullable<Awaited<ReturnType<typeof getFileLink>>>
export type GetFileLinkQueryError = ErrorResponse


export function useGetFileLink<TData = Awaited<ReturnType<typeof getFileLink>>, TError = ErrorResponse>(
 id: string,
    params: undefined |  GetFileLinkParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileLink>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getFileLink>>,
          TError,
          Awaited<ReturnType<typeof getFileLink>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetFileLink<TData = Awaited<ReturnType<typeof getFileLink>>, TError = ErrorResponse>(
 id: string,
    params?: GetFileLinkParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileLink>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getFileLink>>,
          TError,
          Awaited<ReturnType<typeof getFileLink>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetFileLink<TData = Awaited<ReturnType<typeof getFileLink>>, TError = ErrorResponse>(
 id: string,
    params?: GetFileLinkParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileLink>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get file link (view or download)
 */

export function useGetFileLink<TData = Awaited<ReturnType<typeof getFileLink>>, TError = ErrorResponse>(
 id: string,
    params?: GetFileLinkParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getFileLink>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetFileLinkQueryOptions(id,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Restores a soft-deleted file by setting is_deleted = false. The physical file must still exist on disk/storage for it to be usable.
 * @summary Restore a soft-deleted file
 */
export const restoreFile = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<RestoreFileResponse>(
      {url: `/api/v1/files/${id}/restore`, method: 'PUT', signal
    },
      options);
    }




export const getRestoreFileQueryKey = (id: string,) => {
    return [
    'PUT', `/api/v1/files/${id}/restore`
    ] as const;
    }


export const getRestoreFileQueryOptions = <TData = Awaited<ReturnType<typeof restoreFile>>, TError = ErrorResponse>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof restoreFile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getRestoreFileQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof restoreFile>>> = ({ signal }) => restoreFile(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof restoreFile>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type RestoreFileQueryResult = NonNullable<Awaited<ReturnType<typeof restoreFile>>>
export type RestoreFileQueryError = ErrorResponse


export function useRestoreFile<TData = Awaited<ReturnType<typeof restoreFile>>, TError = ErrorResponse>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof restoreFile>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof restoreFile>>,
          TError,
          Awaited<ReturnType<typeof restoreFile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useRestoreFile<TData = Awaited<ReturnType<typeof restoreFile>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof restoreFile>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof restoreFile>>,
          TError,
          Awaited<ReturnType<typeof restoreFile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useRestoreFile<TData = Awaited<ReturnType<typeof restoreFile>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof restoreFile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Restore a soft-deleted file
 */

export function useRestoreFile<TData = Awaited<ReturnType<typeof restoreFile>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof restoreFile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getRestoreFileQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Generate file links for up to 100 file IDs in a single request. Use mode=view for preview (inline) or mode=download for download (attachment)
 * @summary Batch get file links
 */
export const batchLink = (
    batchLinkRequest: BatchLinkRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<BatchLinkResponse>(
      {url: `/api/v1/files/batch-link`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: batchLinkRequest, signal
    },
      options);
    }




export const getBatchLinkQueryKey = (batchLinkRequest?: BatchLinkRequest,) => {
    return [
    'POST', `/api/v1/files/batch-link`, batchLinkRequest
    ] as const;
    }


export const getBatchLinkQueryOptions = <TData = Awaited<ReturnType<typeof batchLink>>, TError = ErrorResponse>(batchLinkRequest: BatchLinkRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof batchLink>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getBatchLinkQueryKey(batchLinkRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof batchLink>>> = ({ signal }) => batchLink(batchLinkRequest, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof batchLink>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type BatchLinkQueryResult = NonNullable<Awaited<ReturnType<typeof batchLink>>>
export type BatchLinkQueryError = ErrorResponse


export function useBatchLink<TData = Awaited<ReturnType<typeof batchLink>>, TError = ErrorResponse>(
 batchLinkRequest: BatchLinkRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof batchLink>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof batchLink>>,
          TError,
          Awaited<ReturnType<typeof batchLink>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBatchLink<TData = Awaited<ReturnType<typeof batchLink>>, TError = ErrorResponse>(
 batchLinkRequest: BatchLinkRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof batchLink>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof batchLink>>,
          TError,
          Awaited<ReturnType<typeof batchLink>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useBatchLink<TData = Awaited<ReturnType<typeof batchLink>>, TError = ErrorResponse>(
 batchLinkRequest: BatchLinkRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof batchLink>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Batch get file links
 */

export function useBatchLink<TData = Awaited<ReturnType<typeof batchLink>>, TError = ErrorResponse>(
 batchLinkRequest: BatchLinkRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof batchLink>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getBatchLinkQueryOptions(batchLinkRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






