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
  PostApiV1ResultPublicationsPublishBody
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

export const getApiV1ResultPublicationsOverview = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/result-publications/overview`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1ResultPublicationsOverviewQueryKey = () => {
    return [
    `/api/v1/result-publications/overview`
    ] as const;
    }


export const getGetApiV1ResultPublicationsOverviewQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsOverview>>, TError = unknown>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsOverview>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1ResultPublicationsOverviewQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1ResultPublicationsOverview>>> = ({ signal }) => getApiV1ResultPublicationsOverview(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsOverview>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1ResultPublicationsOverviewQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1ResultPublicationsOverview>>>
export type GetApiV1ResultPublicationsOverviewQueryError = unknown


export function useGetApiV1ResultPublicationsOverview<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsOverview>>, TError = unknown>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsOverview>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ResultPublicationsOverview>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ResultPublicationsOverview>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ResultPublicationsOverview<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsOverview>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsOverview>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ResultPublicationsOverview>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ResultPublicationsOverview>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ResultPublicationsOverview<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsOverview>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsOverview>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1ResultPublicationsOverview<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsOverview>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsOverview>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1ResultPublicationsOverviewQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const getApiV1ResultPublicationsCriteriaGroups = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/result-publications/criteria-groups`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1ResultPublicationsCriteriaGroupsQueryKey = () => {
    return [
    `/api/v1/result-publications/criteria-groups`
    ] as const;
    }


export const getGetApiV1ResultPublicationsCriteriaGroupsQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroups>>, TError = unknown>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroups>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1ResultPublicationsCriteriaGroupsQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroups>>> = ({ signal }) => getApiV1ResultPublicationsCriteriaGroups(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroups>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1ResultPublicationsCriteriaGroupsQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroups>>>
export type GetApiV1ResultPublicationsCriteriaGroupsQueryError = unknown


export function useGetApiV1ResultPublicationsCriteriaGroups<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroups>>, TError = unknown>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroups>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroups>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroups>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ResultPublicationsCriteriaGroups<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroups>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroups>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroups>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroups>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ResultPublicationsCriteriaGroups<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroups>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroups>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1ResultPublicationsCriteriaGroups<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroups>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroups>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1ResultPublicationsCriteriaGroupsQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const getApiV1ResultPublicationsCriteriaGroupsId = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/result-publications/criteria-groups/${id}`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1ResultPublicationsCriteriaGroupsIdQueryKey = (id: string,) => {
    return [
    `/api/v1/result-publications/criteria-groups/${id}`
    ] as const;
    }


export const getGetApiV1ResultPublicationsCriteriaGroupsIdQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroupsId>>, TError = unknown>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroupsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1ResultPublicationsCriteriaGroupsIdQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroupsId>>> = ({ signal }) => getApiV1ResultPublicationsCriteriaGroupsId(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroupsId>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1ResultPublicationsCriteriaGroupsIdQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroupsId>>>
export type GetApiV1ResultPublicationsCriteriaGroupsIdQueryError = unknown


export function useGetApiV1ResultPublicationsCriteriaGroupsId<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroupsId>>, TError = unknown>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroupsId>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroupsId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroupsId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ResultPublicationsCriteriaGroupsId<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroupsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroupsId>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroupsId>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroupsId>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ResultPublicationsCriteriaGroupsId<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroupsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroupsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1ResultPublicationsCriteriaGroupsId<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroupsId>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsCriteriaGroupsId>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1ResultPublicationsCriteriaGroupsIdQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const getApiV1ResultPublicationsPreview = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/result-publications/preview`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1ResultPublicationsPreviewQueryKey = () => {
    return [
    `/api/v1/result-publications/preview`
    ] as const;
    }


export const getGetApiV1ResultPublicationsPreviewQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsPreview>>, TError = unknown>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsPreview>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1ResultPublicationsPreviewQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1ResultPublicationsPreview>>> = ({ signal }) => getApiV1ResultPublicationsPreview(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsPreview>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1ResultPublicationsPreviewQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1ResultPublicationsPreview>>>
export type GetApiV1ResultPublicationsPreviewQueryError = unknown


export function useGetApiV1ResultPublicationsPreview<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsPreview>>, TError = unknown>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsPreview>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ResultPublicationsPreview>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ResultPublicationsPreview>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ResultPublicationsPreview<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsPreview>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsPreview>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1ResultPublicationsPreview>>,
          TError,
          Awaited<ReturnType<typeof getApiV1ResultPublicationsPreview>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1ResultPublicationsPreview<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsPreview>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsPreview>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1ResultPublicationsPreview<TData = Awaited<ReturnType<typeof getApiV1ResultPublicationsPreview>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1ResultPublicationsPreview>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1ResultPublicationsPreviewQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const postApiV1ResultPublicationsPublish = (
    postApiV1ResultPublicationsPublishBody?: PostApiV1ResultPublicationsPublishBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {

      const formData = new FormData();
if(postApiV1ResultPublicationsPublishBody?.Note !== undefined) {
 formData.append(`Note`, postApiV1ResultPublicationsPublishBody.Note);
 }
if(postApiV1ResultPublicationsPublishBody?.File !== undefined) {
 formData.append(`File`, postApiV1ResultPublicationsPublishBody.File);
 }

      return mainInstance<void>(
      {url: `/api/v1/result-publications/publish`, method: 'POST',
      headers: {'Content-Type': 'multipart/form-data', },
       data: formData, signal
    },
      options);
    }




export const getPostApiV1ResultPublicationsPublishMutationKey = () => ['postApiV1ResultPublicationsPublish'] as const;

export const getPostApiV1ResultPublicationsPublishMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1ResultPublicationsPublish>>, TError,PostApiV1ResultPublicationsPublishMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1ResultPublicationsPublish>>, TError,PostApiV1ResultPublicationsPublishMutationVariables, TContext> => {

const mutationKey = getPostApiV1ResultPublicationsPublishMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1ResultPublicationsPublish>>, PostApiV1ResultPublicationsPublishMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1ResultPublicationsPublish(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1ResultPublicationsPublishMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1ResultPublicationsPublish>>>
    export type PostApiV1ResultPublicationsPublishMutationBody = PostApiV1ResultPublicationsPublishBody | undefined
    export type PostApiV1ResultPublicationsPublishMutationError = unknown
    export type PostApiV1ResultPublicationsPublishMutationVariables = {data?: PostApiV1ResultPublicationsPublishBody}

    export const usePostApiV1ResultPublicationsPublish = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1ResultPublicationsPublish>>, TError,PostApiV1ResultPublicationsPublishMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1ResultPublicationsPublish>>,
        TError,
        PostApiV1ResultPublicationsPublishMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1ResultPublicationsPublishMutationOptions(options), queryClient);
    }
