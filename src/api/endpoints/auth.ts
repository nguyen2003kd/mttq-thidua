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
  ChangePasswordRequest,
  ForgotPasswordRequestRequest,
  ForgotPasswordSubmitRequest,
  GetApiV1AuthSessionsParams,
  LoginRequest,
  MobileLoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ZaloLoginRequest
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

export const postApiV1AuthLoginWeb = (
    loginRequest?: LoginRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/auth/login/web`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: loginRequest, signal
    },
      options);
    }




export const getPostApiV1AuthLoginWebMutationKey = () => ['postApiV1AuthLoginWeb'] as const;

export const getPostApiV1AuthLoginWebMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>, TError,PostApiV1AuthLoginWebMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>, TError,PostApiV1AuthLoginWebMutationVariables, TContext> => {

const mutationKey = getPostApiV1AuthLoginWebMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>, PostApiV1AuthLoginWebMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1AuthLoginWeb(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1AuthLoginWebMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>>
    export type PostApiV1AuthLoginWebMutationBody = LoginRequest | undefined
    export type PostApiV1AuthLoginWebMutationError = unknown
    export type PostApiV1AuthLoginWebMutationVariables = {data?: LoginRequest}

    export const usePostApiV1AuthLoginWeb = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>, TError,PostApiV1AuthLoginWebMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>,
        TError,
        PostApiV1AuthLoginWebMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1AuthLoginWebMutationOptions(options), queryClient);
    }
    export const postApiV1AuthLoginMobile = (
    mobileLoginRequest?: MobileLoginRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/auth/login/mobile`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: mobileLoginRequest, signal
    },
      options);
    }




export const getPostApiV1AuthLoginMobileMutationKey = () => ['postApiV1AuthLoginMobile'] as const;

export const getPostApiV1AuthLoginMobileMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>, TError,PostApiV1AuthLoginMobileMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>, TError,PostApiV1AuthLoginMobileMutationVariables, TContext> => {

const mutationKey = getPostApiV1AuthLoginMobileMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>, PostApiV1AuthLoginMobileMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1AuthLoginMobile(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1AuthLoginMobileMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>>
    export type PostApiV1AuthLoginMobileMutationBody = MobileLoginRequest | undefined
    export type PostApiV1AuthLoginMobileMutationError = unknown
    export type PostApiV1AuthLoginMobileMutationVariables = {data?: MobileLoginRequest}

    export const usePostApiV1AuthLoginMobile = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>, TError,PostApiV1AuthLoginMobileMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>,
        TError,
        PostApiV1AuthLoginMobileMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1AuthLoginMobileMutationOptions(options), queryClient);
    }
    export const postApiV1AuthLoginZalo = (
    zaloLoginRequest?: ZaloLoginRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/auth/login/zalo`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: zaloLoginRequest, signal
    },
      options);
    }




export const getPostApiV1AuthLoginZaloMutationKey = () => ['postApiV1AuthLoginZalo'] as const;

export const getPostApiV1AuthLoginZaloMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>, TError,PostApiV1AuthLoginZaloMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>, TError,PostApiV1AuthLoginZaloMutationVariables, TContext> => {

const mutationKey = getPostApiV1AuthLoginZaloMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>, PostApiV1AuthLoginZaloMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1AuthLoginZalo(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1AuthLoginZaloMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>>
    export type PostApiV1AuthLoginZaloMutationBody = ZaloLoginRequest | undefined
    export type PostApiV1AuthLoginZaloMutationError = unknown
    export type PostApiV1AuthLoginZaloMutationVariables = {data?: ZaloLoginRequest}

    export const usePostApiV1AuthLoginZalo = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>, TError,PostApiV1AuthLoginZaloMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>,
        TError,
        PostApiV1AuthLoginZaloMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1AuthLoginZaloMutationOptions(options), queryClient);
    }
    export const postApiV1AuthRegister = (
    registerRequest?: RegisterRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/auth/register`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: registerRequest, signal
    },
      options);
    }




export const getPostApiV1AuthRegisterMutationKey = () => ['postApiV1AuthRegister'] as const;

export const getPostApiV1AuthRegisterMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthRegister>>, TError,PostApiV1AuthRegisterMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthRegister>>, TError,PostApiV1AuthRegisterMutationVariables, TContext> => {

const mutationKey = getPostApiV1AuthRegisterMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1AuthRegister>>, PostApiV1AuthRegisterMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1AuthRegister(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1AuthRegisterMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthRegister>>>
    export type PostApiV1AuthRegisterMutationBody = RegisterRequest | undefined
    export type PostApiV1AuthRegisterMutationError = unknown
    export type PostApiV1AuthRegisterMutationVariables = {data?: RegisterRequest}

    export const usePostApiV1AuthRegister = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthRegister>>, TError,PostApiV1AuthRegisterMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1AuthRegister>>,
        TError,
        PostApiV1AuthRegisterMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1AuthRegisterMutationOptions(options), queryClient);
    }
    export const postApiV1AuthRefresh = (
    refreshTokenRequest?: RefreshTokenRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/auth/refresh`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: refreshTokenRequest, signal
    },
      options);
    }




export const getPostApiV1AuthRefreshMutationKey = () => ['postApiV1AuthRefresh'] as const;

export const getPostApiV1AuthRefreshMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthRefresh>>, TError,PostApiV1AuthRefreshMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthRefresh>>, TError,PostApiV1AuthRefreshMutationVariables, TContext> => {

const mutationKey = getPostApiV1AuthRefreshMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1AuthRefresh>>, PostApiV1AuthRefreshMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1AuthRefresh(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1AuthRefreshMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthRefresh>>>
    export type PostApiV1AuthRefreshMutationBody = RefreshTokenRequest | undefined
    export type PostApiV1AuthRefreshMutationError = unknown
    export type PostApiV1AuthRefreshMutationVariables = {data?: RefreshTokenRequest}

    export const usePostApiV1AuthRefresh = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthRefresh>>, TError,PostApiV1AuthRefreshMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1AuthRefresh>>,
        TError,
        PostApiV1AuthRefreshMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1AuthRefreshMutationOptions(options), queryClient);
    }
    export const postApiV1AuthLogout = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/auth/logout`, method: 'POST', signal
    },
      options);
    }




export const getPostApiV1AuthLogoutMutationKey = () => ['postApiV1AuthLogout'] as const;

export const getPostApiV1AuthLogoutMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthLogout>>, TError,void, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthLogout>>, TError,void, TContext> => {

const mutationKey = getPostApiV1AuthLogoutMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1AuthLogout>>, void> = () => {


          return  postApiV1AuthLogout(requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1AuthLogoutMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthLogout>>>

    export type PostApiV1AuthLogoutMutationError = unknown


    export const usePostApiV1AuthLogout = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthLogout>>, TError,void, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1AuthLogout>>,
        TError,
        void,
        TContext
      > => {
      return useMutation(getPostApiV1AuthLogoutMutationOptions(options), queryClient);
    }
    export const postApiV1AuthLogoutAll = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/auth/logout-all`, method: 'POST', signal
    },
      options);
    }




export const getPostApiV1AuthLogoutAllMutationKey = () => ['postApiV1AuthLogoutAll'] as const;

export const getPostApiV1AuthLogoutAllMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>, TError,void, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>, TError,void, TContext> => {

const mutationKey = getPostApiV1AuthLogoutAllMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>, void> = () => {


          return  postApiV1AuthLogoutAll(requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1AuthLogoutAllMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>>

    export type PostApiV1AuthLogoutAllMutationError = unknown


    export const usePostApiV1AuthLogoutAll = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>, TError,void, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>,
        TError,
        void,
        TContext
      > => {
      return useMutation(getPostApiV1AuthLogoutAllMutationOptions(options), queryClient);
    }
    export const getApiV1AuthProfile = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/auth/profile`, method: 'GET', signal
    },
      options);
    }




export const getGetApiV1AuthProfileQueryKey = () => {
    return [
    `/api/v1/auth/profile`
    ] as const;
    }


export const getGetApiV1AuthProfileQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1AuthProfile>>, TError = unknown>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1AuthProfile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1AuthProfileQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1AuthProfile>>> = ({ signal }) => getApiV1AuthProfile(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1AuthProfile>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1AuthProfileQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1AuthProfile>>>
export type GetApiV1AuthProfileQueryError = unknown


export function useGetApiV1AuthProfile<TData = Awaited<ReturnType<typeof getApiV1AuthProfile>>, TError = unknown>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1AuthProfile>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1AuthProfile>>,
          TError,
          Awaited<ReturnType<typeof getApiV1AuthProfile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1AuthProfile<TData = Awaited<ReturnType<typeof getApiV1AuthProfile>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1AuthProfile>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1AuthProfile>>,
          TError,
          Awaited<ReturnType<typeof getApiV1AuthProfile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1AuthProfile<TData = Awaited<ReturnType<typeof getApiV1AuthProfile>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1AuthProfile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1AuthProfile<TData = Awaited<ReturnType<typeof getApiV1AuthProfile>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1AuthProfile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1AuthProfileQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const postApiV1AuthChangePassword = (
    changePasswordRequest?: ChangePasswordRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/auth/change-password`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: changePasswordRequest, signal
    },
      options);
    }




export const getPostApiV1AuthChangePasswordMutationKey = () => ['postApiV1AuthChangePassword'] as const;

export const getPostApiV1AuthChangePasswordMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthChangePassword>>, TError,PostApiV1AuthChangePasswordMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthChangePassword>>, TError,PostApiV1AuthChangePasswordMutationVariables, TContext> => {

const mutationKey = getPostApiV1AuthChangePasswordMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1AuthChangePassword>>, PostApiV1AuthChangePasswordMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1AuthChangePassword(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1AuthChangePasswordMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthChangePassword>>>
    export type PostApiV1AuthChangePasswordMutationBody = ChangePasswordRequest | undefined
    export type PostApiV1AuthChangePasswordMutationError = unknown
    export type PostApiV1AuthChangePasswordMutationVariables = {data?: ChangePasswordRequest}

    export const usePostApiV1AuthChangePassword = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthChangePassword>>, TError,PostApiV1AuthChangePasswordMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1AuthChangePassword>>,
        TError,
        PostApiV1AuthChangePasswordMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1AuthChangePasswordMutationOptions(options), queryClient);
    }
    export const postApiV1AuthForgotPasswordRequest = (
    forgotPasswordRequestRequest?: ForgotPasswordRequestRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/auth/forgot-password/request`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: forgotPasswordRequestRequest, signal
    },
      options);
    }




export const getPostApiV1AuthForgotPasswordRequestMutationKey = () => ['postApiV1AuthForgotPasswordRequest'] as const;

export const getPostApiV1AuthForgotPasswordRequestMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>, TError,PostApiV1AuthForgotPasswordRequestMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>, TError,PostApiV1AuthForgotPasswordRequestMutationVariables, TContext> => {

const mutationKey = getPostApiV1AuthForgotPasswordRequestMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>, PostApiV1AuthForgotPasswordRequestMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1AuthForgotPasswordRequest(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1AuthForgotPasswordRequestMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>>
    export type PostApiV1AuthForgotPasswordRequestMutationBody = ForgotPasswordRequestRequest | undefined
    export type PostApiV1AuthForgotPasswordRequestMutationError = unknown
    export type PostApiV1AuthForgotPasswordRequestMutationVariables = {data?: ForgotPasswordRequestRequest}

    export const usePostApiV1AuthForgotPasswordRequest = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>, TError,PostApiV1AuthForgotPasswordRequestMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>,
        TError,
        PostApiV1AuthForgotPasswordRequestMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1AuthForgotPasswordRequestMutationOptions(options), queryClient);
    }
    export const postApiV1AuthForgotPasswordSubmit = (
    forgotPasswordSubmitRequest?: ForgotPasswordSubmitRequest,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/auth/forgot-password/submit`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: forgotPasswordSubmitRequest, signal
    },
      options);
    }




export const getPostApiV1AuthForgotPasswordSubmitMutationKey = () => ['postApiV1AuthForgotPasswordSubmit'] as const;

export const getPostApiV1AuthForgotPasswordSubmitMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>, TError,PostApiV1AuthForgotPasswordSubmitMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>, TError,PostApiV1AuthForgotPasswordSubmitMutationVariables, TContext> => {

const mutationKey = getPostApiV1AuthForgotPasswordSubmitMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>, PostApiV1AuthForgotPasswordSubmitMutationVariables> = (props) => {
          const {data} = props ?? {};

          return  postApiV1AuthForgotPasswordSubmit(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1AuthForgotPasswordSubmitMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>>
    export type PostApiV1AuthForgotPasswordSubmitMutationBody = ForgotPasswordSubmitRequest | undefined
    export type PostApiV1AuthForgotPasswordSubmitMutationError = unknown
    export type PostApiV1AuthForgotPasswordSubmitMutationVariables = {data?: ForgotPasswordSubmitRequest}

    export const usePostApiV1AuthForgotPasswordSubmit = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>, TError,PostApiV1AuthForgotPasswordSubmitMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>,
        TError,
        PostApiV1AuthForgotPasswordSubmitMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1AuthForgotPasswordSubmitMutationOptions(options), queryClient);
    }
    export const getApiV1AuthSessions = (
    params?: GetApiV1AuthSessionsParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/auth/sessions`, method: 'GET',
        params, signal
    },
      options);
    }




export const getGetApiV1AuthSessionsQueryKey = (params?: GetApiV1AuthSessionsParams,) => {
    return [
    `/api/v1/auth/sessions`, ...(params ? [params] : [])
    ] as const;
    }


export const getGetApiV1AuthSessionsQueryOptions = <TData = Awaited<ReturnType<typeof getApiV1AuthSessions>>, TError = unknown>(params?: GetApiV1AuthSessionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1AuthSessions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetApiV1AuthSessionsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getApiV1AuthSessions>>> = ({ signal }) => getApiV1AuthSessions(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getApiV1AuthSessions>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetApiV1AuthSessionsQueryResult = NonNullable<Awaited<ReturnType<typeof getApiV1AuthSessions>>>
export type GetApiV1AuthSessionsQueryError = unknown


export function useGetApiV1AuthSessions<TData = Awaited<ReturnType<typeof getApiV1AuthSessions>>, TError = unknown>(
 params: undefined |  GetApiV1AuthSessionsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1AuthSessions>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1AuthSessions>>,
          TError,
          Awaited<ReturnType<typeof getApiV1AuthSessions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1AuthSessions<TData = Awaited<ReturnType<typeof getApiV1AuthSessions>>, TError = unknown>(
 params?: GetApiV1AuthSessionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1AuthSessions>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getApiV1AuthSessions>>,
          TError,
          Awaited<ReturnType<typeof getApiV1AuthSessions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetApiV1AuthSessions<TData = Awaited<ReturnType<typeof getApiV1AuthSessions>>, TError = unknown>(
 params?: GetApiV1AuthSessionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1AuthSessions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function useGetApiV1AuthSessions<TData = Awaited<ReturnType<typeof getApiV1AuthSessions>>, TError = unknown>(
 params?: GetApiV1AuthSessionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getApiV1AuthSessions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetApiV1AuthSessionsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const postApiV1AuthSessionsIdRevoke = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/auth/sessions/${id}/revoke`, method: 'POST', signal
    },
      options);
    }




export const getPostApiV1AuthSessionsIdRevokeMutationKey = () => ['postApiV1AuthSessionsIdRevoke'] as const;

export const getPostApiV1AuthSessionsIdRevokeMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>, TError,PostApiV1AuthSessionsIdRevokeMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
): UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>, TError,PostApiV1AuthSessionsIdRevokeMutationVariables, TContext> => {

const mutationKey = getPostApiV1AuthSessionsIdRevokeMutationKey();
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>, PostApiV1AuthSessionsIdRevokeMutationVariables> = (props) => {
          const {id} = props ?? {};

          return  postApiV1AuthSessionsIdRevoke(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type PostApiV1AuthSessionsIdRevokeMutationResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>>

    export type PostApiV1AuthSessionsIdRevokeMutationError = unknown
    export type PostApiV1AuthSessionsIdRevokeMutationVariables = {id: string}

    export const usePostApiV1AuthSessionsIdRevoke = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>, TError,PostApiV1AuthSessionsIdRevokeMutationVariables, TContext>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient): UseMutationResult<
        Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>,
        TError,
        PostApiV1AuthSessionsIdRevokeMutationVariables,
        TContext
      > => {
      return useMutation(getPostApiV1AuthSessionsIdRevokeMutationOptions(options), queryClient);
    }
