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




export const getPostApiV1AuthLoginWebQueryKey = (loginRequest?: LoginRequest,) => {
    return [
    'POST', `/api/v1/auth/login/web`, loginRequest
    ] as const;
    }


export const getPostApiV1AuthLoginWebQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>, TError = unknown>(loginRequest?: LoginRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1AuthLoginWebQueryKey(loginRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>> = ({ signal }) => postApiV1AuthLoginWeb(loginRequest, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type PostApiV1AuthLoginWebQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>>
export type PostApiV1AuthLoginWebQueryError = unknown


export function usePostApiV1AuthLoginWeb<TData = Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>, TError = unknown>(
 loginRequest: undefined |  LoginRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthLoginWeb<TData = Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>, TError = unknown>(
 loginRequest?: LoginRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthLoginWeb<TData = Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>, TError = unknown>(
 loginRequest?: LoginRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1AuthLoginWeb<TData = Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>, TError = unknown>(
 loginRequest?: LoginRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLoginWeb>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1AuthLoginWebQueryOptions(loginRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
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




export const getPostApiV1AuthLoginMobileQueryKey = (mobileLoginRequest?: MobileLoginRequest,) => {
    return [
    'POST', `/api/v1/auth/login/mobile`, mobileLoginRequest
    ] as const;
    }


export const getPostApiV1AuthLoginMobileQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>, TError = unknown>(mobileLoginRequest?: MobileLoginRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1AuthLoginMobileQueryKey(mobileLoginRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>> = ({ signal }) => postApiV1AuthLoginMobile(mobileLoginRequest, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type PostApiV1AuthLoginMobileQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>>
export type PostApiV1AuthLoginMobileQueryError = unknown


export function usePostApiV1AuthLoginMobile<TData = Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>, TError = unknown>(
 mobileLoginRequest: undefined |  MobileLoginRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthLoginMobile<TData = Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>, TError = unknown>(
 mobileLoginRequest?: MobileLoginRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthLoginMobile<TData = Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>, TError = unknown>(
 mobileLoginRequest?: MobileLoginRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1AuthLoginMobile<TData = Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>, TError = unknown>(
 mobileLoginRequest?: MobileLoginRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLoginMobile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1AuthLoginMobileQueryOptions(mobileLoginRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
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




export const getPostApiV1AuthLoginZaloQueryKey = (zaloLoginRequest?: ZaloLoginRequest,) => {
    return [
    'POST', `/api/v1/auth/login/zalo`, zaloLoginRequest
    ] as const;
    }


export const getPostApiV1AuthLoginZaloQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>, TError = unknown>(zaloLoginRequest?: ZaloLoginRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1AuthLoginZaloQueryKey(zaloLoginRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>> = ({ signal }) => postApiV1AuthLoginZalo(zaloLoginRequest, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type PostApiV1AuthLoginZaloQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>>
export type PostApiV1AuthLoginZaloQueryError = unknown


export function usePostApiV1AuthLoginZalo<TData = Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>, TError = unknown>(
 zaloLoginRequest: undefined |  ZaloLoginRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthLoginZalo<TData = Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>, TError = unknown>(
 zaloLoginRequest?: ZaloLoginRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthLoginZalo<TData = Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>, TError = unknown>(
 zaloLoginRequest?: ZaloLoginRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1AuthLoginZalo<TData = Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>, TError = unknown>(
 zaloLoginRequest?: ZaloLoginRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLoginZalo>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1AuthLoginZaloQueryOptions(zaloLoginRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
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




export const getPostApiV1AuthRegisterQueryKey = (registerRequest?: RegisterRequest,) => {
    return [
    'POST', `/api/v1/auth/register`, registerRequest
    ] as const;
    }


export const getPostApiV1AuthRegisterQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1AuthRegister>>, TError = unknown>(registerRequest?: RegisterRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthRegister>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1AuthRegisterQueryKey(registerRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1AuthRegister>>> = ({ signal }) => postApiV1AuthRegister(registerRequest, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthRegister>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}
export type PostApiV1AuthRegisterQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthRegister>>>
export type PostApiV1AuthRegisterQueryError = unknown


export function usePostApiV1AuthRegister<TData = Awaited<ReturnType<typeof postApiV1AuthRegister>>, TError = unknown>(
 registerRequest: undefined |  RegisterRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthRegister>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthRegister>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthRegister>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthRegister<TData = Awaited<ReturnType<typeof postApiV1AuthRegister>>, TError = unknown>(
 registerRequest?: RegisterRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthRegister>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthRegister>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthRegister>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthRegister<TData = Awaited<ReturnType<typeof postApiV1AuthRegister>>, TError = unknown>(
 registerRequest?: RegisterRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthRegister>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1AuthRegister<TData = Awaited<ReturnType<typeof postApiV1AuthRegister>>, TError = unknown>(
 registerRequest?: RegisterRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthRegister>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1AuthRegisterQueryOptions(registerRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
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




export const getPostApiV1AuthRefreshQueryKey = (refreshTokenRequest?: RefreshTokenRequest,) => {
    return [
    'POST', `/api/v1/auth/refresh`, refreshTokenRequest
    ] as const;
    }


export const getPostApiV1AuthRefreshQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1AuthRefresh>>, TError = unknown>(refreshTokenRequest?: RefreshTokenRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthRefresh>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1AuthRefreshQueryKey(refreshTokenRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1AuthRefresh>>> = ({ signal }) => postApiV1AuthRefresh(refreshTokenRequest, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthRefresh>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type PostApiV1AuthRefreshQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthRefresh>>>
export type PostApiV1AuthRefreshQueryError = unknown


export function usePostApiV1AuthRefresh<TData = Awaited<ReturnType<typeof postApiV1AuthRefresh>>, TError = unknown>(
 refreshTokenRequest: undefined |  RefreshTokenRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthRefresh>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthRefresh>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthRefresh>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthRefresh<TData = Awaited<ReturnType<typeof postApiV1AuthRefresh>>, TError = unknown>(
 refreshTokenRequest?: RefreshTokenRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthRefresh>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthRefresh>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthRefresh>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthRefresh<TData = Awaited<ReturnType<typeof postApiV1AuthRefresh>>, TError = unknown>(
 refreshTokenRequest?: RefreshTokenRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthRefresh>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1AuthRefresh<TData = Awaited<ReturnType<typeof postApiV1AuthRefresh>>, TError = unknown>(
 refreshTokenRequest?: RefreshTokenRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthRefresh>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1AuthRefreshQueryOptions(refreshTokenRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const postApiV1AuthLogout = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/auth/logout`, method: 'POST', signal
    },
      options);
    }




export const getPostApiV1AuthLogoutQueryKey = () => {
    return [
    'POST', `/api/v1/auth/logout`
    ] as const;
    }


export const getPostApiV1AuthLogoutQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1AuthLogout>>, TError = unknown>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLogout>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1AuthLogoutQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1AuthLogout>>> = ({ signal }) => postApiV1AuthLogout(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLogout>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type PostApiV1AuthLogoutQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthLogout>>>
export type PostApiV1AuthLogoutQueryError = unknown


export function usePostApiV1AuthLogout<TData = Awaited<ReturnType<typeof postApiV1AuthLogout>>, TError = unknown>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLogout>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthLogout>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthLogout>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthLogout<TData = Awaited<ReturnType<typeof postApiV1AuthLogout>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLogout>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthLogout>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthLogout>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthLogout<TData = Awaited<ReturnType<typeof postApiV1AuthLogout>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLogout>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1AuthLogout<TData = Awaited<ReturnType<typeof postApiV1AuthLogout>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLogout>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1AuthLogoutQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






export const postApiV1AuthLogoutAll = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<void>(
      {url: `/api/v1/auth/logout-all`, method: 'POST', signal
    },
      options);
    }




export const getPostApiV1AuthLogoutAllQueryKey = () => {
    return [
    'POST', `/api/v1/auth/logout-all`
    ] as const;
    }


export const getPostApiV1AuthLogoutAllQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>, TError = unknown>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1AuthLogoutAllQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>> = ({ signal }) => postApiV1AuthLogoutAll(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type PostApiV1AuthLogoutAllQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>>
export type PostApiV1AuthLogoutAllQueryError = unknown


export function usePostApiV1AuthLogoutAll<TData = Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>, TError = unknown>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthLogoutAll<TData = Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthLogoutAll<TData = Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1AuthLogoutAll<TData = Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>, TError = unknown>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthLogoutAll>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1AuthLogoutAllQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
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




export const getPostApiV1AuthForgotPasswordRequestQueryKey = (forgotPasswordRequestRequest?: ForgotPasswordRequestRequest,) => {
    return [
    'POST', `/api/v1/auth/forgot-password/request`, forgotPasswordRequestRequest
    ] as const;
    }


export const getPostApiV1AuthForgotPasswordRequestQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>, TError = unknown>(forgotPasswordRequestRequest?: ForgotPasswordRequestRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1AuthForgotPasswordRequestQueryKey(forgotPasswordRequestRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>> = ({ signal }) => postApiV1AuthForgotPasswordRequest(forgotPasswordRequestRequest, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type PostApiV1AuthForgotPasswordRequestQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>>
export type PostApiV1AuthForgotPasswordRequestQueryError = unknown


export function usePostApiV1AuthForgotPasswordRequest<TData = Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>, TError = unknown>(
 forgotPasswordRequestRequest: undefined |  ForgotPasswordRequestRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthForgotPasswordRequest<TData = Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>, TError = unknown>(
 forgotPasswordRequestRequest?: ForgotPasswordRequestRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthForgotPasswordRequest<TData = Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>, TError = unknown>(
 forgotPasswordRequestRequest?: ForgotPasswordRequestRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1AuthForgotPasswordRequest<TData = Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>, TError = unknown>(
 forgotPasswordRequestRequest?: ForgotPasswordRequestRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordRequest>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1AuthForgotPasswordRequestQueryOptions(forgotPasswordRequestRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
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




export const getPostApiV1AuthForgotPasswordSubmitQueryKey = (forgotPasswordSubmitRequest?: ForgotPasswordSubmitRequest,) => {
    return [
    'POST', `/api/v1/auth/forgot-password/submit`, forgotPasswordSubmitRequest
    ] as const;
    }


export const getPostApiV1AuthForgotPasswordSubmitQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>, TError = unknown>(forgotPasswordSubmitRequest?: ForgotPasswordSubmitRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1AuthForgotPasswordSubmitQueryKey(forgotPasswordSubmitRequest);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>> = ({ signal }) => postApiV1AuthForgotPasswordSubmit(forgotPasswordSubmitRequest, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type PostApiV1AuthForgotPasswordSubmitQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>>
export type PostApiV1AuthForgotPasswordSubmitQueryError = unknown


export function usePostApiV1AuthForgotPasswordSubmit<TData = Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>, TError = unknown>(
 forgotPasswordSubmitRequest: undefined |  ForgotPasswordSubmitRequest, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthForgotPasswordSubmit<TData = Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>, TError = unknown>(
 forgotPasswordSubmitRequest?: ForgotPasswordSubmitRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthForgotPasswordSubmit<TData = Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>, TError = unknown>(
 forgotPasswordSubmitRequest?: ForgotPasswordSubmitRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1AuthForgotPasswordSubmit<TData = Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>, TError = unknown>(
 forgotPasswordSubmitRequest?: ForgotPasswordSubmitRequest, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthForgotPasswordSubmit>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1AuthForgotPasswordSubmitQueryOptions(forgotPasswordSubmitRequest,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
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




export const getPostApiV1AuthSessionsIdRevokeQueryKey = (id: string,) => {
    return [
    'POST', `/api/v1/auth/sessions/${id}/revoke`
    ] as const;
    }


export const getPostApiV1AuthSessionsIdRevokeQueryOptions = <TData = Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>, TError = unknown>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getPostApiV1AuthSessionsIdRevokeQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>> = ({ signal }) => postApiV1AuthSessionsIdRevoke(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type PostApiV1AuthSessionsIdRevokeQueryResult = NonNullable<Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>>
export type PostApiV1AuthSessionsIdRevokeQueryError = unknown


export function usePostApiV1AuthSessionsIdRevoke<TData = Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>, TError = unknown>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthSessionsIdRevoke<TData = Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>,
          TError,
          Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function usePostApiV1AuthSessionsIdRevoke<TData = Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

export function usePostApiV1AuthSessionsIdRevoke<TData = Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>, TError = unknown>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof postApiV1AuthSessionsIdRevoke>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getPostApiV1AuthSessionsIdRevokeQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}


