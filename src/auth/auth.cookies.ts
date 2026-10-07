import { CookieOptions, Request, Response } from 'express';

export const ACCESS_TOKEN_COOKIE = 'cc_access_token';
export const ID_TOKEN_COOKIE = 'cc_id_token';
export const REFRESH_TOKEN_COOKIE = 'cc_refresh_token';
export const USERNAME_COOKIE = 'cc_username';
export const ACCESS_EXPIRES_COOKIE = 'cc_access_expires_at';

// Must match the Cognito app client's refresh token expiration (5 days).
const REFRESH_TOKEN_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

export function readCookie(request: Request, name: string): string | undefined {
  const cookies = request.cookies as Record<string, string> | undefined;

  return cookies?.[name];
}

export function setAuthCookies(
  response: Response,
  tokens: {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    expiresIn?: number;
  },
  email: string,
  rememberMe = false,
): void {
  const baseOptions = baseCookieOptions();

  const tokenMaxAge = tokens.expiresIn ? tokens.expiresIn * 1000 : undefined;

  response.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseOptions,
    ...(tokenMaxAge ? { maxAge: tokenMaxAge } : {}),
  });

  // Readable by the frontend so it can refresh before the token expires.
  // Contains only a timestamp, not a secret.
  response.cookie(
    ACCESS_EXPIRES_COOKIE,
    String(Date.now() + (tokens.expiresIn ?? 3600) * 1000),
    {
      ...baseOptions,
      httpOnly: false,
      ...(tokenMaxAge ? { maxAge: tokenMaxAge } : {}),
    },
  );

  if (tokens.idToken) {
    response.cookie(ID_TOKEN_COOKIE, tokens.idToken, {
      ...baseOptions,
      ...(tokenMaxAge ? { maxAge: tokenMaxAge } : {}),
    });
  }

  if (tokens.refreshToken) {
    response.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...baseOptions,
      ...(rememberMe ? { maxAge: REFRESH_TOKEN_MAX_AGE_MS } : {}),
    });
  }

  response.cookie(USERNAME_COOKIE, email, {
    ...baseOptions,
    ...(rememberMe ? { maxAge: REFRESH_TOKEN_MAX_AGE_MS } : {}),
  });
}

export function clearAuthCookies(response: Response): void {
  const options = baseCookieOptions();

  response.clearCookie(ACCESS_TOKEN_COOKIE, options);

  response.clearCookie(ACCESS_EXPIRES_COOKIE, {
    ...options,
    httpOnly: false,
  });

  response.clearCookie(ID_TOKEN_COOKIE, options);

  response.clearCookie(REFRESH_TOKEN_COOKIE, options);

  response.clearCookie(USERNAME_COOKIE, options);
}
