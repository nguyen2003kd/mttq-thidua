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
  AddSupplementaryCriteriaRequest,
  ApprovalRequest,
  FinalizeSubmissionRequest,
  GetApiV1SubmissionResultsResultIdHistoriesParams,
  GetApiV1SubmissionsScoreHistoriesParams,
  GetApiV1SubmissionsSubmissionIdApprovalHistoriesParams,
  PostApiV1SubmissionsForwardBody,
  PostApiV1SubmissionsRequestRevisionBody
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

export const postApiV1SubmissionsApprove = (
    approvalRequest?: ApprovalRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/submissions/approve`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: approvalRequest, signal
    },
      options);
    }




export const getPostApiV1SubmissionsApproveMutationKey = () => ['postApiV1SubmissionsApprove'] as const;

export const getPostApiV1SubmissionsApproveMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>, TError,PostApiV1SubmissionsApproveMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>, TError,PostApiV1SubmissionsApproveMutationVariables, TContext> => {

const mutationKey = getPostApiV1SubmissionsApproveMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>, PostApiV1SubmissionsApproveMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1SubmissionsApprove(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1SubmissionsApproveMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>>
    export type PostApiV1SubmissionsApproveMutationBody = ApprovalRequest | undefined
    export type PostApiV1SubmissionsApproveMutationError = unknown
    export type PostApiV1SubmissionsApproveMutationVariables = {data?: ApprovalRequest}

    export const usePostApiV1SubmissionsApprove = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>, TError,PostApiV1SubmissionsApproveMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>,
        TError,
        PostApiV1SubmissionsApproveMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1SubmissionsApproveMutationOptions(options), queryClient);
    }
    export const postApiV1SubmissionsForward = (
    postApiV1SubmissionsForwardBody?: PostApiV1SubmissionsForwardBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {

      const formData = new FormData();
if(postApiV1SubmissionsForwardBody?.SubmissionId !== undefined) {
 formData.append(`SubmissionId`, postApiV1SubmissionsForwardBody.SubmissionId);
 }
if(postApiV1SubmissionsForwardBody?.Explanation !== undefined) {
 formData.append(`Explanation`, postApiV1SubmissionsForwardBody.Explanation);
 }
if(postApiV1SubmissionsForwardBody?.Files !== undefined) {
 postApiV1SubmissionsForwardBody?.Files.forEach(value => formData.append(`Files`, value));
 }

      return mainInstance<void>(
      {url: `/api/v1/submissions/forward`, method: 'POST',
      headers: {'Content-Type': 'multipart/form-data', },
       data: formData, signal
    },
      options);
    }




export const getPostApiV1SubmissionsForwardMutationKey = () => ['postApiV1SubmissionsForward'] as const;

export const getPostApiV1SubmissionsForwardMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1SubmissionsForward>>, TError,PostApiV1SubmissionsForwardMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1SubmissionsForward>>, TError,PostApiV1SubmissionsForwardMutationVariables, TContext> => {

const mutationKey = getPostApiV1SubmissionsForwardMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1SubmissionsForward>>, PostApiV1SubmissionsForwardMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1SubmissionsForward(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1SubmissionsForwardMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1SubmissionsForward>>>
    export type PostApiV1SubmissionsForwardMutationBody = PostApiV1SubmissionsForwardBody | undefined
    export type PostApiV1SubmissionsForwardMutationError = unknown
    export type PostApiV1SubmissionsForwardMutationVariables = {data?: PostApiV1SubmissionsForwardBody}

    export const usePostApiV1SubmissionsForward = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1SubmissionsForward>>, TError,PostApiV1SubmissionsForwardMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1SubmissionsForward>>,
        TError,
        PostApiV1SubmissionsForwardMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1SubmissionsForwardMutationOptions(options), queryClient);
    }
    export const postApiV1SubmissionsRequestRevision = (
    postApiV1SubmissionsRequestRevisionBody?: PostApiV1SubmissionsRequestRevisionBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {

      const formData = new FormData();
if(postApiV1SubmissionsRequestRevisionBody?.SubmissionId !== undefined) {
 formData.append(`SubmissionId`, postApiV1SubmissionsRequestRevisionBody.SubmissionId);
 }
if(postApiV1SubmissionsRequestRevisionBody?.Reason !== undefined) {
 formData.append(`Reason`, postApiV1SubmissionsRequestRevisionBody.Reason);
 }
if(postApiV1SubmissionsRequestRevisionBody?.SubmissionResultIds !== undefined) {
 postApiV1SubmissionsRequestRevisionBody?.SubmissionResultIds.forEach(value => formData.append(`SubmissionResultIds`, value));
 }
if(postApiV1SubmissionsRequestRevisionBody?.Files !== undefined) {
 postApiV1SubmissionsRequestRevisionBody?.Files.forEach(value => formData.append(`Files`, value));
 }

      return mainInstance<void>(
      {url: `/api/v1/submissions/request-revision`, method: 'POST',
      headers: {'Content-Type': 'multipart/form-data', },
       data: formData, signal
    },
      options);
    }




export const getPostApiV1SubmissionsRequestRevisionMutationKey = () => ['postApiV1SubmissionsRequestRevision'] as const;

export const getPostApiV1SubmissionsRequestRevisionMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1SubmissionsRequestRevision>>, TError,PostApiV1SubmissionsRequestRevisionMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1SubmissionsRequestRevision>>, TError,PostApiV1SubmissionsRequestRevisionMutationVariables, TContext> => {

const mutationKey = getPostApiV1SubmissionsRequestRevisionMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1SubmissionsRequestRevision>>, PostApiV1SubmissionsRequestRevisionMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1SubmissionsRequestRevision(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1SubmissionsRequestRevisionMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1SubmissionsRequestRevision>>>
    export type PostApiV1SubmissionsRequestRevisionMutationBody = PostApiV1SubmissionsRequestRevisionBody | undefined
    export type PostApiV1SubmissionsRequestRevisionMutationError = unknown
    export type PostApiV1SubmissionsRequestRevisionMutationVariables = {data?: PostApiV1SubmissionsRequestRevisionBody}

    export const usePostApiV1SubmissionsRequestRevision = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1SubmissionsRequestRevision>>, TError,PostApiV1SubmissionsRequestRevisionMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1SubmissionsRequestRevision>>,
        TError,
        PostApiV1SubmissionsRequestRevisionMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1SubmissionsRequestRevisionMutationOptions(options), queryClient);
    }
    export const postApiV1SubmissionsSupplementaryCriteria = (
    addSupplementaryCriteriaRequest?: AddSupplementaryCriteriaRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/submissions/supplementary-criteria`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: addSupplementaryCriteriaRequest, signal
    },
      options);
    }




export const getPostApiV1SubmissionsSupplementaryCriteriaMutationKey = () => ['postApiV1SubmissionsSupplementaryCriteria'] as const;

export const getPostApiV1SubmissionsSupplementaryCriteriaMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>, TError,PostApiV1SubmissionsSupplementaryCriteriaMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>, TError,PostApiV1SubmissionsSupplementaryCriteriaMutationVariables, TContext> => {

const mutationKey = getPostApiV1SubmissionsSupplementaryCriteriaMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>, PostApiV1SubmissionsSupplementaryCriteriaMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1SubmissionsSupplementaryCriteria(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1SubmissionsSupplementaryCriteriaMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>>
    export type PostApiV1SubmissionsSupplementaryCriteriaMutationBody = AddSupplementaryCriteriaRequest | undefined
    export type PostApiV1SubmissionsSupplementaryCriteriaMutationError = unknown
    export type PostApiV1SubmissionsSupplementaryCriteriaMutationVariables = {data?: AddSupplementaryCriteriaRequest}

    export const usePostApiV1SubmissionsSupplementaryCriteria = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>, TError,PostApiV1SubmissionsSupplementaryCriteriaMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>,
        TError,
        PostApiV1SubmissionsSupplementaryCriteriaMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1SubmissionsSupplementaryCriteriaMutationOptions(options), queryClient);
    }
    export const postApiV1SubmissionsFinalize = (
    finalizeSubmissionRequest?: FinalizeSubmissionRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/submissions/finalize`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: finalizeSubmissionRequest, signal
    },
      options);
    }




export const getPostApiV1SubmissionsFinalizeMutationKey = () => ['postApiV1SubmissionsFinalize'] as const;

export const getPostApiV1SubmissionsFinalizeMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>, TError,PostApiV1SubmissionsFinalizeMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>, TError,PostApiV1SubmissionsFinalizeMutationVariables, TContext> => {

const mutationKey = getPostApiV1SubmissionsFinalizeMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>, PostApiV1SubmissionsFinalizeMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1SubmissionsFinalize(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1SubmissionsFinalizeMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>>
    export type PostApiV1SubmissionsFinalizeMutationBody = FinalizeSubmissionRequest | undefined
    export type PostApiV1SubmissionsFinalizeMutationError = unknown
    export type PostApiV1SubmissionsFinalizeMutationVariables = {data?: FinalizeSubmissionRequest}

    export const usePostApiV1SubmissionsFinalize = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>, TError,PostApiV1SubmissionsFinalizeMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>,
        TError,
        PostApiV1SubmissionsFinalizeMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1SubmissionsFinalizeMutationOptions(options), queryClient);
    }
    export const getApiV1SubmissionsSubmissionIdApprovalHistories = (
    submissionId: string,
    params?: GetApiV1SubmissionsSubmissionIdApprovalHistoriesParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/submissions/${submissionId}/approval-histories`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetApiV1SubmissionsSubmissionIdApprovalHistoriesQueryKey = (submissionId: string,
    params?: GetApiV1SubmissionsSubmissionIdApprovalHistoriesParams,) => {
    return [
    `/api/v1/submissions/${submissionId}/approval-histories`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetApiV1SubmissionsSubmissionIdApprovalHistoriesQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1SubmissionsSubmissionIdApprovalHistories>>, TError = unknown>(submissionId: string,
    params?: GetApiV1SubmissionsSubmissionIdApprovalHistoriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionsSubmissionIdApprovalHistories>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1SubmissionsSubmissionIdApprovalHistoriesQueryKey(submissionId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1SubmissionsSubmissionIdApprovalHistories>>> = ({ signal }) => getApiV1SubmissionsSubmissionIdApprovalHistories(submissionId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: submissionId !== null && submissionId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionsSubmissionIdApprovalHistories>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1SubmissionsSubmissionIdApprovalHistoriesQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1SubmissionsSubmissionIdApprovalHistories>>>
export type GetApiV1SubmissionsSubmissionIdApprovalHistoriesQueryError = unknown


export function useGetApiV1SubmissionsSubmissionIdApprovalHistories<TData = Awaited<ReturnType<typeof getApiV1SubmissionsSubmissionIdApprovalHistories>>, TError = unknown>(
 submissionId: string,
    params: undefined |  GetApiV1SubmissionsSubmissionIdApprovalHistoriesParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionsSubmissionIdApprovalHistories>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1SubmissionsSubmissionIdApprovalHistories>>,
          TError,
          Awaited<ReturnType<typeof getApiV1SubmissionsSubmissionIdApprovalHistories>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1SubmissionsSubmissionIdApprovalHistories<TData = Awaited<ReturnType<typeof getApiV1SubmissionsSubmissionIdApprovalHistories>>, TError = unknown>(
 submissionId: string,
    params?: GetApiV1SubmissionsSubmissionIdApprovalHistoriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionsSubmissionIdApprovalHistories>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1SubmissionsSubmissionIdApprovalHistories>>,
          TError,
          Awaited<ReturnType<typeof getApiV1SubmissionsSubmissionIdApprovalHistories>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1SubmissionsSubmissionIdApprovalHistories<TData = Awaited<ReturnType<typeof getApiV1SubmissionsSubmissionIdApprovalHistories>>, TError = unknown>(
 submissionId: string,
    params?: GetApiV1SubmissionsSubmissionIdApprovalHistoriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionsSubmissionIdApprovalHistories>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1SubmissionsSubmissionIdApprovalHistories<TData = Awaited<ReturnType<typeof getApiV1SubmissionsSubmissionIdApprovalHistories>>, TError = unknown>(
 submissionId: string,
    params?: GetApiV1SubmissionsSubmissionIdApprovalHistoriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionsSubmissionIdApprovalHistories>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1SubmissionsSubmissionIdApprovalHistoriesQueryOptions(submissionId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const getApiV1SubmissionResultsResultIdHistories = (
    resultId: string,
    params?: GetApiV1SubmissionResultsResultIdHistoriesParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/submission-results/${resultId}/histories`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetApiV1SubmissionResultsResultIdHistoriesQueryKey = (resultId: string,
    params?: GetApiV1SubmissionResultsResultIdHistoriesParams,) => {
    return [
    `/api/v1/submission-results/${resultId}/histories`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetApiV1SubmissionResultsResultIdHistoriesQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1SubmissionResultsResultIdHistories>>, TError = unknown>(resultId: string,
    params?: GetApiV1SubmissionResultsResultIdHistoriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionResultsResultIdHistories>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1SubmissionResultsResultIdHistoriesQueryKey(resultId,params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1SubmissionResultsResultIdHistories>>> = ({ signal }) => getApiV1SubmissionResultsResultIdHistories(resultId,params, requestOptions, signal);





   return  { queryKey, queryFn, enabled: resultId !== null && resultId !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionResultsResultIdHistories>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1SubmissionResultsResultIdHistoriesQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1SubmissionResultsResultIdHistories>>>
export type GetApiV1SubmissionResultsResultIdHistoriesQueryError = unknown


export function useGetApiV1SubmissionResultsResultIdHistories<TData = Awaited<ReturnType<typeof getApiV1SubmissionResultsResultIdHistories>>, TError = unknown>(
 resultId: string,
    params: undefined |  GetApiV1SubmissionResultsResultIdHistoriesParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionResultsResultIdHistories>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1SubmissionResultsResultIdHistories>>,
          TError,
          Awaited<ReturnType<typeof getApiV1SubmissionResultsResultIdHistories>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1SubmissionResultsResultIdHistories<TData = Awaited<ReturnType<typeof getApiV1SubmissionResultsResultIdHistories>>, TError = unknown>(
 resultId: string,
    params?: GetApiV1SubmissionResultsResultIdHistoriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionResultsResultIdHistories>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1SubmissionResultsResultIdHistories>>,
          TError,
          Awaited<ReturnType<typeof getApiV1SubmissionResultsResultIdHistories>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1SubmissionResultsResultIdHistories<TData = Awaited<ReturnType<typeof getApiV1SubmissionResultsResultIdHistories>>, TError = unknown>(
 resultId: string,
    params?: GetApiV1SubmissionResultsResultIdHistoriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionResultsResultIdHistories>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1SubmissionResultsResultIdHistories<TData = Awaited<ReturnType<typeof getApiV1SubmissionResultsResultIdHistories>>, TError = unknown>(
 resultId: string,
    params?: GetApiV1SubmissionResultsResultIdHistoriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionResultsResultIdHistories>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1SubmissionResultsResultIdHistoriesQueryOptions(resultId,params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const getApiV1SubmissionsScoreHistories = (
    params?: GetApiV1SubmissionsScoreHistoriesParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/submissions/score-histories`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetApiV1SubmissionsScoreHistoriesQueryKey = (params?: GetApiV1SubmissionsScoreHistoriesParams,) => {
    return [
    `/api/v1/submissions/score-histories`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetApiV1SubmissionsScoreHistoriesQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1SubmissionsScoreHistories>>, TError = unknown>(params?: GetApiV1SubmissionsScoreHistoriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionsScoreHistories>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1SubmissionsScoreHistoriesQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1SubmissionsScoreHistories>>> = ({ signal }) => getApiV1SubmissionsScoreHistories(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionsScoreHistories>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1SubmissionsScoreHistoriesQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1SubmissionsScoreHistories>>>
export type GetApiV1SubmissionsScoreHistoriesQueryError = unknown


export function useGetApiV1SubmissionsScoreHistories<TData = Awaited<ReturnType<typeof getApiV1SubmissionsScoreHistories>>, TError = unknown>(
 params: undefined |  GetApiV1SubmissionsScoreHistoriesParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionsScoreHistories>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1SubmissionsScoreHistories>>,
          TError,
          Awaited<ReturnType<typeof getApiV1SubmissionsScoreHistories>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1SubmissionsScoreHistories<TData = Awaited<ReturnType<typeof getApiV1SubmissionsScoreHistories>>, TError = unknown>(
 params?: GetApiV1SubmissionsScoreHistoriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionsScoreHistories>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1SubmissionsScoreHistories>>,
          TError,
          Awaited<ReturnType<typeof getApiV1SubmissionsScoreHistories>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1SubmissionsScoreHistories<TData = Awaited<ReturnType<typeof getApiV1SubmissionsScoreHistories>>, TError = unknown>(
 params?: GetApiV1SubmissionsScoreHistoriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionsScoreHistories>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1SubmissionsScoreHistories<TData = Awaited<ReturnType<typeof getApiV1SubmissionsScoreHistories>>, TError = unknown>(
 params?: GetApiV1SubmissionsScoreHistoriesParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1SubmissionsScoreHistories>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1SubmissionsScoreHistoriesQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






