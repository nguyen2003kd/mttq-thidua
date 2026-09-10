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
  AddSupplementaryCriteriaRequest,
  ApprovalRequest,
  FinalizeSubmissionRequest,
  GetApiV1SubmissionResultsResultIdHistoriesParams,
  GetApiV1SubmissionsSubmissionIdApprovalHistoriesParams
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




export const getPostApiV1SubmissionsApproveQueryKey = (approvalRequest?: ApprovalRequest,) => {
    return [
    'POST', `/api/v1/submissions/approve`, approvalRequest
    ] as const;
    }


export const getPostApiV1SubmissionsApproveQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>, TError = unknown>(approvalRequest?: ApprovalRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1SubmissionsApproveQueryKey(approvalRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>> = ({ signal }) => postApiV1SubmissionsApprove(approvalRequest, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type PostApiV1SubmissionsApproveQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>>
export type PostApiV1SubmissionsApproveQueryError = unknown


export function usePostApiV1SubmissionsApprove<TData = Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>, TError = unknown>(
 approvalRequest: undefined |  ApprovalRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>,
          TError,
          Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1SubmissionsApprove<TData = Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>, TError = unknown>(
 approvalRequest?: ApprovalRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>,
          TError,
          Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1SubmissionsApprove<TData = Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>, TError = unknown>(
 approvalRequest?: ApprovalRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1SubmissionsApprove<TData = Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>, TError = unknown>(
 approvalRequest?: ApprovalRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsApprove>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1SubmissionsApproveQueryOptions(approvalRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
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




export const getPostApiV1SubmissionsSupplementaryCriteriaQueryKey = (addSupplementaryCriteriaRequest?: AddSupplementaryCriteriaRequest,) => {
    return [
    'POST', `/api/v1/submissions/supplementary-criteria`, addSupplementaryCriteriaRequest
    ] as const;
    }


export const getPostApiV1SubmissionsSupplementaryCriteriaQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>, TError = unknown>(addSupplementaryCriteriaRequest?: AddSupplementaryCriteriaRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1SubmissionsSupplementaryCriteriaQueryKey(addSupplementaryCriteriaRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>> = ({ signal }) => postApiV1SubmissionsSupplementaryCriteria(addSupplementaryCriteriaRequest, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type PostApiV1SubmissionsSupplementaryCriteriaQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>>
export type PostApiV1SubmissionsSupplementaryCriteriaQueryError = unknown


export function usePostApiV1SubmissionsSupplementaryCriteria<TData = Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>, TError = unknown>(
 addSupplementaryCriteriaRequest: undefined |  AddSupplementaryCriteriaRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>,
          TError,
          Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1SubmissionsSupplementaryCriteria<TData = Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>, TError = unknown>(
 addSupplementaryCriteriaRequest?: AddSupplementaryCriteriaRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>,
          TError,
          Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1SubmissionsSupplementaryCriteria<TData = Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>, TError = unknown>(
 addSupplementaryCriteriaRequest?: AddSupplementaryCriteriaRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1SubmissionsSupplementaryCriteria<TData = Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>, TError = unknown>(
 addSupplementaryCriteriaRequest?: AddSupplementaryCriteriaRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsSupplementaryCriteria>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1SubmissionsSupplementaryCriteriaQueryOptions(addSupplementaryCriteriaRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
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




export const getPostApiV1SubmissionsFinalizeQueryKey = (finalizeSubmissionRequest?: FinalizeSubmissionRequest,) => {
    return [
    'POST', `/api/v1/submissions/finalize`, finalizeSubmissionRequest
    ] as const;
    }


export const getPostApiV1SubmissionsFinalizeQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>, TError = unknown>(finalizeSubmissionRequest?: FinalizeSubmissionRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1SubmissionsFinalizeQueryKey(finalizeSubmissionRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>> = ({ signal }) => postApiV1SubmissionsFinalize(finalizeSubmissionRequest, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type PostApiV1SubmissionsFinalizeQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>>
export type PostApiV1SubmissionsFinalizeQueryError = unknown


export function usePostApiV1SubmissionsFinalize<TData = Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>, TError = unknown>(
 finalizeSubmissionRequest: undefined |  FinalizeSubmissionRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>,
          TError,
          Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1SubmissionsFinalize<TData = Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>, TError = unknown>(
 finalizeSubmissionRequest?: FinalizeSubmissionRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>,
          TError,
          Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1SubmissionsFinalize<TData = Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>, TError = unknown>(
 finalizeSubmissionRequest?: FinalizeSubmissionRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1SubmissionsFinalize<TData = Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>, TError = unknown>(
 finalizeSubmissionRequest?: FinalizeSubmissionRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1SubmissionsFinalize>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1SubmissionsFinalizeQueryOptions(finalizeSubmissionRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
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


