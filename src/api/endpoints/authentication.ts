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
  ErrorResponse,
  ForgotPasswordSendOtpBody,
  ListSessionsParams,
  LoginBody,
  LoginMobileResponse,
  Logout200,
  LogoutAll200,
  LogoutAllBody,
  PasswordResetBody,
  PasswordResetRequestResponse,
  PasswordResetSubmitResponse,
  ProfileResponse,
  RefreshTokenBody,
  RefreshTokenResponse,
  RegisterBody,
  RegisterResponse,
  RevokeSessionResponse,
  SendConfirmOtpResponse,
  SessionListResponse,
  WebLoginBody,
  WebLoginResponse,
  ZaloLoginBody,
  ZaloLoginResponse
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
 * @summary User registration
 */
export const register = (
    registerBody: RegisterBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<RegisterResponse>(
      {url: `/api/v1/auth/register`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: registerBody, signal
    },
      options);
    }




export const getRegisterQueryKey = (registerBody?: RegisterBody,) => {
    return [
    'POST', `/api/v1/auth/register`, registerBody
    ] as const;
    }


export const getRegisterQueryOptions = <TData = Awaited<ReturnType<typeof register>>, TError = ErrorResponse>(registerBody: RegisterBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof register>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getRegisterQueryKey(registerBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof register>>> = ({ signal }) => register(registerBody, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof register>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type RegisterQueryResult = NonNullable<Awaited<ReturnType<typeof register>>>
export type RegisterQueryError = ErrorResponse


export function useRegister<TData = Awaited<ReturnType<typeof register>>, TError = ErrorResponse>(
 registerBody: RegisterBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof register>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof register>>,
          TError,
          Awaited<ReturnType<typeof register>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useRegister<TData = Awaited<ReturnType<typeof register>>, TError = ErrorResponse>(
 registerBody: RegisterBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof register>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof register>>,
          TError,
          Awaited<ReturnType<typeof register>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useRegister<TData = Awaited<ReturnType<typeof register>>, TError = ErrorResponse>(
 registerBody: RegisterBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof register>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary User registration
 */

export function useRegister<TData = Awaited<ReturnType<typeof register>>, TError = ErrorResponse>(
 registerBody: RegisterBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof register>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getRegisterQueryOptions(registerBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Authenticate mobile app users. Tokens are returned in the response body.
 * @summary Mobile login (Bearer token)
 */
export const loginMobile = (
    loginBody: LoginBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<LoginMobileResponse>(
      {url: `/api/v1/auth/login/mobile`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: loginBody, signal
    },
      options);
    }




export const getLoginMobileQueryKey = (loginBody?: LoginBody,) => {
    return [
    'POST', `/api/v1/auth/login/mobile`, loginBody
    ] as const;
    }


export const getLoginMobileQueryOptions = <TData = Awaited<ReturnType<typeof loginMobile>>, TError = ErrorResponse>(loginBody: LoginBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof loginMobile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getLoginMobileQueryKey(loginBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof loginMobile>>> = ({ signal }) => loginMobile(loginBody, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof loginMobile>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type LoginMobileQueryResult = NonNullable<Awaited<ReturnType<typeof loginMobile>>>
export type LoginMobileQueryError = ErrorResponse


export function useLoginMobile<TData = Awaited<ReturnType<typeof loginMobile>>, TError = ErrorResponse>(
 loginBody: LoginBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof loginMobile>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof loginMobile>>,
          TError,
          Awaited<ReturnType<typeof loginMobile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useLoginMobile<TData = Awaited<ReturnType<typeof loginMobile>>, TError = ErrorResponse>(
 loginBody: LoginBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof loginMobile>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof loginMobile>>,
          TError,
          Awaited<ReturnType<typeof loginMobile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useLoginMobile<TData = Awaited<ReturnType<typeof loginMobile>>, TError = ErrorResponse>(
 loginBody: LoginBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof loginMobile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Mobile login (Bearer token)
 */

export function useLoginMobile<TData = Awaited<ReturnType<typeof loginMobile>>, TError = ErrorResponse>(
 loginBody: LoginBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof loginMobile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getLoginMobileQueryOptions(loginBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Authenticate web users with HttpOnly cookies. Tokens stored in HttpOnly cookies (XSS protection).
 * @summary Web login (HttpOnly Cookie)
 */
export const loginWeb = (
    webLoginBody: WebLoginBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<WebLoginResponse>(
      {url: `/api/v1/auth/login/web`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: webLoginBody, signal
    },
      options);
    }




export const getLoginWebQueryKey = (webLoginBody?: WebLoginBody,) => {
    return [
    'POST', `/api/v1/auth/login/web`, webLoginBody
    ] as const;
    }


export const getLoginWebQueryOptions = <TData = Awaited<ReturnType<typeof loginWeb>>, TError = ErrorResponse>(webLoginBody: WebLoginBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof loginWeb>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getLoginWebQueryKey(webLoginBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof loginWeb>>> = ({ signal }) => loginWeb(webLoginBody, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof loginWeb>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type LoginWebQueryResult = NonNullable<Awaited<ReturnType<typeof loginWeb>>>
export type LoginWebQueryError = ErrorResponse


export function useLoginWeb<TData = Awaited<ReturnType<typeof loginWeb>>, TError = ErrorResponse>(
 webLoginBody: WebLoginBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof loginWeb>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof loginWeb>>,
          TError,
          Awaited<ReturnType<typeof loginWeb>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useLoginWeb<TData = Awaited<ReturnType<typeof loginWeb>>, TError = ErrorResponse>(
 webLoginBody: WebLoginBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof loginWeb>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof loginWeb>>,
          TError,
          Awaited<ReturnType<typeof loginWeb>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useLoginWeb<TData = Awaited<ReturnType<typeof loginWeb>>, TError = ErrorResponse>(
 webLoginBody: WebLoginBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof loginWeb>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Web login (HttpOnly Cookie)
 */

export function useLoginWeb<TData = Awaited<ReturnType<typeof loginWeb>>, TError = ErrorResponse>(
 webLoginBody: WebLoginBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof loginWeb>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getLoginWebQueryOptions(webLoginBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Authenticate Zalo Mini App users via Zalo auth code or Open ID.
 * @summary Zalo Mini App login (Bearer token)
 */
export const loginZalo = (
    zaloLoginBody: ZaloLoginBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<ZaloLoginResponse>(
      {url: `/api/v1/auth/login/zalo`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: zaloLoginBody, signal
    },
      options);
    }




export const getLoginZaloQueryKey = (zaloLoginBody?: ZaloLoginBody,) => {
    return [
    'POST', `/api/v1/auth/login/zalo`, zaloLoginBody
    ] as const;
    }


export const getLoginZaloQueryOptions = <TData = Awaited<ReturnType<typeof loginZalo>>, TError = ErrorResponse>(zaloLoginBody: ZaloLoginBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof loginZalo>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getLoginZaloQueryKey(zaloLoginBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof loginZalo>>> = ({ signal }) => loginZalo(zaloLoginBody, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof loginZalo>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type LoginZaloQueryResult = NonNullable<Awaited<ReturnType<typeof loginZalo>>>
export type LoginZaloQueryError = ErrorResponse


export function useLoginZalo<TData = Awaited<ReturnType<typeof loginZalo>>, TError = ErrorResponse>(
 zaloLoginBody: ZaloLoginBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof loginZalo>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof loginZalo>>,
          TError,
          Awaited<ReturnType<typeof loginZalo>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useLoginZalo<TData = Awaited<ReturnType<typeof loginZalo>>, TError = ErrorResponse>(
 zaloLoginBody: ZaloLoginBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof loginZalo>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof loginZalo>>,
          TError,
          Awaited<ReturnType<typeof loginZalo>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useLoginZalo<TData = Awaited<ReturnType<typeof loginZalo>>, TError = ErrorResponse>(
 zaloLoginBody: ZaloLoginBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof loginZalo>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Zalo Mini App login (Bearer token)
 */

export function useLoginZalo<TData = Awaited<ReturnType<typeof loginZalo>>, TError = ErrorResponse>(
 zaloLoginBody: ZaloLoginBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof loginZalo>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getLoginZaloQueryOptions(zaloLoginBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Get all active sessions for the authenticated user
 * @summary List active sessions
 */
export const listSessions = (
    params?: ListSessionsParams,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<SessionListResponse>(
      {url: `/api/v1/auth/sessions`, method: 'GET',
        params, signal
    },
      options);
    }




export const getListSessionsQueryKey = (params?: ListSessionsParams,) => {
    return [
    `/api/v1/auth/sessions`, ...(params ? [params] : [])
    ] as const;
    }


export const getListSessionsQueryOptions = <TData = Awaited<ReturnType<typeof listSessions>>, TError = ErrorResponse>(params?: ListSessionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSessions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListSessionsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listSessions>>> = ({ signal }) => listSessions(params, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listSessions>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ListSessionsQueryResult = NonNullable<Awaited<ReturnType<typeof listSessions>>>
export type ListSessionsQueryError = ErrorResponse


export function useListSessions<TData = Awaited<ReturnType<typeof listSessions>>, TError = ErrorResponse>(
 params: undefined |  ListSessionsParams, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSessions>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listSessions>>,
          TError,
          Awaited<ReturnType<typeof listSessions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListSessions<TData = Awaited<ReturnType<typeof listSessions>>, TError = ErrorResponse>(
 params?: ListSessionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSessions>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listSessions>>,
          TError,
          Awaited<ReturnType<typeof listSessions>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useListSessions<TData = Awaited<ReturnType<typeof listSessions>>, TError = ErrorResponse>(
 params?: ListSessionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSessions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary List active sessions
 */

export function useListSessions<TData = Awaited<ReturnType<typeof listSessions>>, TError = ErrorResponse>(
 params?: ListSessionsParams, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof listSessions>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getListSessionsQueryOptions(params,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Revoke a specific active session belonging to the authenticated user
 * @summary Revoke a specific session
 */
export const revokeSession = (
    id: string,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<RevokeSessionResponse>(
      {url: `/api/v1/auth/sessions/${id}/revoke`, method: 'POST', signal
    },
      options);
    }




export const getRevokeSessionQueryKey = (id: string,) => {
    return [
    'POST', `/api/v1/auth/sessions/${id}/revoke`
    ] as const;
    }


export const getRevokeSessionQueryOptions = <TData = Awaited<ReturnType<typeof revokeSession>>, TError = ErrorResponse>(id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof revokeSession>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getRevokeSessionQueryKey(id);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof revokeSession>>> = ({ signal }) => revokeSession(id, requestOptions, signal);





   return  { queryKey, queryFn, enabled: id !== null && id !== undefined, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof revokeSession>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type RevokeSessionQueryResult = NonNullable<Awaited<ReturnType<typeof revokeSession>>>
export type RevokeSessionQueryError = ErrorResponse


export function useRevokeSession<TData = Awaited<ReturnType<typeof revokeSession>>, TError = ErrorResponse>(
 id: string, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof revokeSession>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof revokeSession>>,
          TError,
          Awaited<ReturnType<typeof revokeSession>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useRevokeSession<TData = Awaited<ReturnType<typeof revokeSession>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof revokeSession>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof revokeSession>>,
          TError,
          Awaited<ReturnType<typeof revokeSession>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useRevokeSession<TData = Awaited<ReturnType<typeof revokeSession>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof revokeSession>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Revoke a specific session
 */

export function useRevokeSession<TData = Awaited<ReturnType<typeof revokeSession>>, TError = ErrorResponse>(
 id: string, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof revokeSession>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getRevokeSessionQueryOptions(id,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Logout user and invalidate current session
 * @summary Logout user
 */
export const logout = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<Logout200>(
      {url: `/api/v1/auth/logout`, method: 'POST', signal
    },
      options);
    }




export const getLogoutQueryKey = () => {
    return [
    'POST', `/api/v1/auth/logout`
    ] as const;
    }


export const getLogoutQueryOptions = <TData = Awaited<ReturnType<typeof logout>>, TError = ErrorResponse>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof logout>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getLogoutQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof logout>>> = ({ signal }) => logout(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof logout>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type LogoutQueryResult = NonNullable<Awaited<ReturnType<typeof logout>>>
export type LogoutQueryError = ErrorResponse


export function useLogout<TData = Awaited<ReturnType<typeof logout>>, TError = ErrorResponse>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof logout>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof logout>>,
          TError,
          Awaited<ReturnType<typeof logout>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useLogout<TData = Awaited<ReturnType<typeof logout>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof logout>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof logout>>,
          TError,
          Awaited<ReturnType<typeof logout>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useLogout<TData = Awaited<ReturnType<typeof logout>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof logout>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Logout user
 */

export function useLogout<TData = Awaited<ReturnType<typeof logout>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof logout>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getLogoutQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Revoke all active sessions for the authenticated user. Requires password confirmation (confirm_password) or OTP (confirm_otp).
 * @summary Logout all devices
 */
export const logoutAll = (
    logoutAllBody: LogoutAllBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<LogoutAll200>(
      {url: `/api/v1/auth/logout-all`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: logoutAllBody, signal
    },
      options);
    }




export const getLogoutAllQueryKey = (logoutAllBody?: LogoutAllBody,) => {
    return [
    'POST', `/api/v1/auth/logout-all`, logoutAllBody
    ] as const;
    }


export const getLogoutAllQueryOptions = <TData = Awaited<ReturnType<typeof logoutAll>>, TError = ErrorResponse>(logoutAllBody: LogoutAllBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof logoutAll>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getLogoutAllQueryKey(logoutAllBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof logoutAll>>> = ({ signal }) => logoutAll(logoutAllBody, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof logoutAll>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type LogoutAllQueryResult = NonNullable<Awaited<ReturnType<typeof logoutAll>>>
export type LogoutAllQueryError = ErrorResponse


export function useLogoutAll<TData = Awaited<ReturnType<typeof logoutAll>>, TError = ErrorResponse>(
 logoutAllBody: LogoutAllBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof logoutAll>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof logoutAll>>,
          TError,
          Awaited<ReturnType<typeof logoutAll>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useLogoutAll<TData = Awaited<ReturnType<typeof logoutAll>>, TError = ErrorResponse>(
 logoutAllBody: LogoutAllBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof logoutAll>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof logoutAll>>,
          TError,
          Awaited<ReturnType<typeof logoutAll>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useLogoutAll<TData = Awaited<ReturnType<typeof logoutAll>>, TError = ErrorResponse>(
 logoutAllBody: LogoutAllBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof logoutAll>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Logout all devices
 */

export function useLogoutAll<TData = Awaited<ReturnType<typeof logoutAll>>, TError = ErrorResponse>(
 logoutAllBody: LogoutAllBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof logoutAll>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getLogoutAllQueryOptions(logoutAllBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Refresh access token
 */
export const refreshToken = (
    refreshTokenBody?: RefreshTokenBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<RefreshTokenResponse>(
      {url: `/api/v1/auth/refresh`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: refreshTokenBody, signal
    },
      options);
    }




export const getRefreshTokenQueryKey = (refreshTokenBody?: RefreshTokenBody,) => {
    return [
    'POST', `/api/v1/auth/refresh`, refreshTokenBody
    ] as const;
    }


export const getRefreshTokenQueryOptions = <TData = Awaited<ReturnType<typeof refreshToken>>, TError = ErrorResponse>(refreshTokenBody?: RefreshTokenBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof refreshToken>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getRefreshTokenQueryKey(refreshTokenBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof refreshToken>>> = ({ signal }) => refreshToken(refreshTokenBody, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof refreshToken>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type RefreshTokenQueryResult = NonNullable<Awaited<ReturnType<typeof refreshToken>>>
export type RefreshTokenQueryError = ErrorResponse


export function useRefreshToken<TData = Awaited<ReturnType<typeof refreshToken>>, TError = ErrorResponse>(
 refreshTokenBody: undefined |  RefreshTokenBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof refreshToken>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof refreshToken>>,
          TError,
          Awaited<ReturnType<typeof refreshToken>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useRefreshToken<TData = Awaited<ReturnType<typeof refreshToken>>, TError = ErrorResponse>(
 refreshTokenBody?: RefreshTokenBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof refreshToken>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof refreshToken>>,
          TError,
          Awaited<ReturnType<typeof refreshToken>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useRefreshToken<TData = Awaited<ReturnType<typeof refreshToken>>, TError = ErrorResponse>(
 refreshTokenBody?: RefreshTokenBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof refreshToken>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Refresh access token
 */

export function useRefreshToken<TData = Awaited<ReturnType<typeof refreshToken>>, TError = ErrorResponse>(
 refreshTokenBody?: RefreshTokenBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof refreshToken>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getRefreshTokenQueryOptions(refreshTokenBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * @summary Get authenticated user profile
 */
export const getProfile = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<ProfileResponse>(
      {url: `/api/v1/auth/profile`, method: 'GET', signal
    },
      options);
    }




export const getGetProfileQueryKey = () => {
    return [
    `/api/v1/auth/profile`
    ] as const;
    }


export const getGetProfileQueryOptions = <TData = Awaited<ReturnType<typeof getProfile>>, TError = ErrorResponse>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getProfile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetProfileQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getProfile>>> = ({ signal }) => getProfile(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getProfile>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type GetProfileQueryResult = NonNullable<Awaited<ReturnType<typeof getProfile>>>
export type GetProfileQueryError = ErrorResponse


export function useGetProfile<TData = Awaited<ReturnType<typeof getProfile>>, TError = ErrorResponse>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof getProfile>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getProfile>>,
          TError,
          Awaited<ReturnType<typeof getProfile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetProfile<TData = Awaited<ReturnType<typeof getProfile>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getProfile>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getProfile>>,
          TError,
          Awaited<ReturnType<typeof getProfile>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useGetProfile<TData = Awaited<ReturnType<typeof getProfile>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getProfile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Get authenticated user profile
 */

export function useGetProfile<TData = Awaited<ReturnType<typeof getProfile>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof getProfile>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getGetProfileQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Generates a 6-digit OTP, stores it in Redis (TTL 5 min), and sends it to the authenticated user's email.
 * @summary Request a sensitive-action confirmation OTP
 */
export const sendConfirmOtp = (

 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<SendConfirmOtpResponse>(
      {url: `/api/v1/auth/send-confirm-otp`, method: 'POST', signal
    },
      options);
    }




export const getSendConfirmOtpQueryKey = () => {
    return [
    'POST', `/api/v1/auth/send-confirm-otp`
    ] as const;
    }


export const getSendConfirmOtpQueryOptions = <TData = Awaited<ReturnType<typeof sendConfirmOtp>>, TError = ErrorResponse>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof sendConfirmOtp>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getSendConfirmOtpQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof sendConfirmOtp>>> = ({ signal }) => sendConfirmOtp(requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof sendConfirmOtp>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type SendConfirmOtpQueryResult = NonNullable<Awaited<ReturnType<typeof sendConfirmOtp>>>
export type SendConfirmOtpQueryError = ErrorResponse


export function useSendConfirmOtp<TData = Awaited<ReturnType<typeof sendConfirmOtp>>, TError = ErrorResponse>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof sendConfirmOtp>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof sendConfirmOtp>>,
          TError,
          Awaited<ReturnType<typeof sendConfirmOtp>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useSendConfirmOtp<TData = Awaited<ReturnType<typeof sendConfirmOtp>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof sendConfirmOtp>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof sendConfirmOtp>>,
          TError,
          Awaited<ReturnType<typeof sendConfirmOtp>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useSendConfirmOtp<TData = Awaited<ReturnType<typeof sendConfirmOtp>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof sendConfirmOtp>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Request a sensitive-action confirmation OTP
 */

export function useSendConfirmOtp<TData = Awaited<ReturnType<typeof sendConfirmOtp>>, TError = ErrorResponse>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof sendConfirmOtp>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getSendConfirmOtpQueryOptions(options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Send 6-digit OTP code to user email (valid for 10 minutes)
 * @summary Request password reset OTP
 */
export const forgotPasswordSendOtp = (
    forgotPasswordSendOtpBody: ForgotPasswordSendOtpBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<PasswordResetRequestResponse>(
      {url: `/api/v1/auth/forgot-password/send-otp`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: forgotPasswordSendOtpBody, signal
    },
      options);
    }




export const getForgotPasswordSendOtpQueryKey = (forgotPasswordSendOtpBody?: ForgotPasswordSendOtpBody,) => {
    return [
    'POST', `/api/v1/auth/forgot-password/send-otp`, forgotPasswordSendOtpBody
    ] as const;
    }


export const getForgotPasswordSendOtpQueryOptions = <TData = Awaited<ReturnType<typeof forgotPasswordSendOtp>>, TError = ErrorResponse>(forgotPasswordSendOtpBody: ForgotPasswordSendOtpBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof forgotPasswordSendOtp>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getForgotPasswordSendOtpQueryKey(forgotPasswordSendOtpBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof forgotPasswordSendOtp>>> = ({ signal }) => forgotPasswordSendOtp(forgotPasswordSendOtpBody, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof forgotPasswordSendOtp>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ForgotPasswordSendOtpQueryResult = NonNullable<Awaited<ReturnType<typeof forgotPasswordSendOtp>>>
export type ForgotPasswordSendOtpQueryError = ErrorResponse


export function useForgotPasswordSendOtp<TData = Awaited<ReturnType<typeof forgotPasswordSendOtp>>, TError = ErrorResponse>(
 forgotPasswordSendOtpBody: ForgotPasswordSendOtpBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof forgotPasswordSendOtp>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof forgotPasswordSendOtp>>,
          TError,
          Awaited<ReturnType<typeof forgotPasswordSendOtp>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useForgotPasswordSendOtp<TData = Awaited<ReturnType<typeof forgotPasswordSendOtp>>, TError = ErrorResponse>(
 forgotPasswordSendOtpBody: ForgotPasswordSendOtpBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof forgotPasswordSendOtp>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof forgotPasswordSendOtp>>,
          TError,
          Awaited<ReturnType<typeof forgotPasswordSendOtp>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useForgotPasswordSendOtp<TData = Awaited<ReturnType<typeof forgotPasswordSendOtp>>, TError = ErrorResponse>(
 forgotPasswordSendOtpBody: ForgotPasswordSendOtpBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof forgotPasswordSendOtp>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Request password reset OTP
 */

export function useForgotPasswordSendOtp<TData = Awaited<ReturnType<typeof forgotPasswordSendOtp>>, TError = ErrorResponse>(
 forgotPasswordSendOtpBody: ForgotPasswordSendOtpBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof forgotPasswordSendOtp>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getForgotPasswordSendOtpQueryOptions(forgotPasswordSendOtpBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






/**
 * Reset user password after OTP verification
 * @summary Reset password
 */
export const forgotPasswordConfirmReset = (
    passwordResetBody: PasswordResetBody,
 options?: SecondParameter<typeof mainInstance>,signal?: AbortSignal
) => {


      return mainInstance<PasswordResetSubmitResponse>(
      {url: `/api/v1/auth/forgot-password/confirm-reset`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: passwordResetBody, signal
    },
      options);
    }




export const getForgotPasswordConfirmResetQueryKey = (passwordResetBody?: PasswordResetBody,) => {
    return [
    'POST', `/api/v1/auth/forgot-password/confirm-reset`, passwordResetBody
    ] as const;
    }


export const getForgotPasswordConfirmResetQueryOptions = <TData = Awaited<ReturnType<typeof forgotPasswordConfirmReset>>, TError = ErrorResponse>(passwordResetBody: PasswordResetBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof forgotPasswordConfirmReset>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getForgotPasswordConfirmResetQueryKey(passwordResetBody);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof forgotPasswordConfirmReset>>> = ({ signal }) => forgotPasswordConfirmReset(passwordResetBody, requestOptions, signal);





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof forgotPasswordConfirmReset>>, TError, TData> & { queryKey: DataTag<QueryKey, TData, TError> }
}

export type ForgotPasswordConfirmResetQueryResult = NonNullable<Awaited<ReturnType<typeof forgotPasswordConfirmReset>>>
export type ForgotPasswordConfirmResetQueryError = ErrorResponse


export function useForgotPasswordConfirmReset<TData = Awaited<ReturnType<typeof forgotPasswordConfirmReset>>, TError = ErrorResponse>(
 passwordResetBody: PasswordResetBody, options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof forgotPasswordConfirmReset>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof forgotPasswordConfirmReset>>,
          TError,
          Awaited<ReturnType<typeof forgotPasswordConfirmReset>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useForgotPasswordConfirmReset<TData = Awaited<ReturnType<typeof forgotPasswordConfirmReset>>, TError = ErrorResponse>(
 passwordResetBody: PasswordResetBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof forgotPasswordConfirmReset>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof forgotPasswordConfirmReset>>,
          TError,
          Awaited<ReturnType<typeof forgotPasswordConfirmReset>>
        > , 'initialData'
      >, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
export function useForgotPasswordConfirmReset<TData = Awaited<ReturnType<typeof forgotPasswordConfirmReset>>, TError = ErrorResponse>(
 passwordResetBody: PasswordResetBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof forgotPasswordConfirmReset>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }
/**
 * @summary Reset password
 */

export function useForgotPasswordConfirmReset<TData = Awaited<ReturnType<typeof forgotPasswordConfirmReset>>, TError = ErrorResponse>(
 passwordResetBody: PasswordResetBody, options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof forgotPasswordConfirmReset>>, TError, TData>>, request?: SecondParameter<typeof mainInstance>}
 , queryClient?: QueryClient
 ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {

  const queryOptions = getForgotPasswordConfirmResetQueryOptions(passwordResetBody,options)

  const query = useQuery(queryOptions, queryClient) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> };

  return withQueryKey(query, queryOptions.queryKey);
}






