import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

import type { AuthenticatedUser } from './auth-context';

WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEY = 'zendo.auth.session';

type AuthConfig = {
  auth0ClientId: string;
  auth0Domain: string;
  auth0IssuerBaseUrl: string;
  auth0Audience?: string;
};

export type NativeAuthSession = {
  accessToken: string;
  expiresAt?: number;
  refreshToken?: string;
  user: AuthenticatedUser;
};

function isWebRuntime() {
  return Platform.OS === 'web' && typeof window !== 'undefined';
}

function getAuthConfig(): AuthConfig {
  // On web, EXPO_PUBLIC_* vars are injected at bundle time by web-dev.mjs
  // On native, Constants.expoConfig.extra is populated from app.config.ts at build time
  const extra = Constants.expoConfig?.extra ?? {};

  const auth0ClientId =
    (isWebRuntime() ? process.env.EXPO_PUBLIC_AUTH0_MOBILE_CLIENT_ID : null) ||
    extra.auth0ClientId ||
    '';
  const auth0Domain =
    (isWebRuntime() ? process.env.EXPO_PUBLIC_AUTH0_DOMAIN : null) ||
    extra.auth0Domain ||
    '';
  const auth0IssuerBaseUrl =
    (isWebRuntime() ? process.env.EXPO_PUBLIC_AUTH0_ISSUER_BASE_URL : null) ||
    extra.auth0IssuerBaseUrl ||
    '';
  const auth0Audience =
    ((isWebRuntime() ? process.env.EXPO_PUBLIC_AUTH0_AUDIENCE : null) ||
    extra.auth0Audience ||
    '').trim() || undefined;

  if (!auth0ClientId || !auth0Domain || !auth0IssuerBaseUrl) {
    throw new Error(
      'Missing Auth0 config. Set AUTH0_DOMAIN, AUTH0_ISSUER_BASE_URL, and AUTH0_MOBILE_CLIENT_ID in .env.',
    );
  }

  return { auth0ClientId, auth0Domain, auth0IssuerBaseUrl, auth0Audience };
}

async function getDiscoveryDocument() {
  const config = getAuthConfig();
  return AuthSession.fetchDiscoveryAsync(config.auth0IssuerBaseUrl);
}

async function fetchUserInfo(userInfoEndpoint: string | undefined, accessToken: string) {
  if (!userInfoEndpoint) {
    return {} as AuthenticatedUser;
  }

  const response = await fetch(userInfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Unable to load Auth0 profile.');
  }

  return response.json() as Promise<AuthenticatedUser>;
}

function getRedirectUri() {
  return AuthSession.makeRedirectUri({
    scheme: 'zendo',
    path: 'auth/callback',
  });
}

async function clearWebRuntimeState() {
  if (!isWebRuntime()) {
    return;
  }

  window.localStorage.clear();
  window.sessionStorage.clear();

  if (typeof window.caches !== 'undefined') {
    const cacheKeys = await window.caches.keys();
    await Promise.all(cacheKeys.map((cacheKey) => window.caches.delete(cacheKey)));
  }
}

async function persistNativeSession(session: NativeAuthSession | null) {
  if (isWebRuntime()) {
    if (!session) {
      await clearWebRuntimeState();
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return;
  }

  if (!session) {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    return;
  }

  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
}

export async function loadNativeSession() {
  if (isWebRuntime()) {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    console.log('[loadNativeSession] web, rawValue present:', !!rawValue);

    if (!rawValue) {
      return null;
    }

    const session = JSON.parse(rawValue) as NativeAuthSession;
    const now = Math.floor(Date.now() / 1000);
    console.log('[loadNativeSession] web session:', {
      hasRefreshToken: !!session.refreshToken,
      expiresAt: session.expiresAt,
      now,
      isExpired: session.expiresAt ? session.expiresAt <= now : false,
    });

    if (!session.refreshToken && session.expiresAt && session.expiresAt <= now) {
      console.log('[loadNativeSession] web: session expired, clearing');
      await persistNativeSession(null);
      return null;
    }

    if (session.refreshToken && session.expiresAt && session.expiresAt - now <= 60) {
      console.log('[loadNativeSession] web: refreshing token');
      return refreshNativeSession(session);
    }

    return session;
  }

  const rawValue = await SecureStore.getItemAsync(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  const session = JSON.parse(rawValue) as NativeAuthSession;

  if (!session.refreshToken && session.expiresAt && session.expiresAt <= Math.floor(Date.now() / 1000)) {
    await persistNativeSession(null);
    return null;
  }

  if (session.refreshToken && session.expiresAt && session.expiresAt - Math.floor(Date.now() / 1000) <= 60) {
    return refreshNativeSession(session);
  }

  return session;
}

export async function refreshNativeSession(session: NativeAuthSession) {
  if (!session.refreshToken) {
    return session;
  }

  const config = getAuthConfig();
  const discovery = await getDiscoveryDocument();
  const tokenResponse = await AuthSession.refreshAsync(
    {
      clientId: config.auth0ClientId,
      refreshToken: session.refreshToken,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
    },
    discovery,
  );

  const nextSession: NativeAuthSession = {
    accessToken: tokenResponse.accessToken ?? session.accessToken,
    refreshToken: tokenResponse.refreshToken ?? session.refreshToken,
    expiresAt: tokenResponse.expiresIn
      ? Math.floor(Date.now() / 1000) + tokenResponse.expiresIn
      : session.expiresAt,
    user: session.user,
  };

  await persistNativeSession(nextSession);
  return nextSession;
}

export async function startNativeLogin(mode: 'login' | 'signup') {
  const config = getAuthConfig();
  const discovery = await getDiscoveryDocument();
  const redirectUri = getRedirectUri();

  console.log('[auth] startNativeLogin', { mode, clientId: config.auth0ClientId, redirectUri });

  const request = new AuthSession.AuthRequest({
    clientId: config.auth0ClientId,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    scopes: ['openid', 'profile', 'email', 'offline_access'],
    extraParams: {
      ...(config.auth0Audience ? { audience: config.auth0Audience } : {}),
      ...(mode === 'signup' ? { screen_hint: 'signup' } : {}),
    },
  });

  const result = await request.promptAsync(discovery);

  if (result.type !== 'success' || !result.params.code) {
    return null;
  }

  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId: config.auth0ClientId,
      code: result.params.code,
      redirectUri,
      extraParams: {
        code_verifier: request.codeVerifier ?? '',
      },
    },
    discovery,
  );

  if (!tokenResponse.accessToken) {
    throw new Error('Auth0 login completed without an access token.');
  }

  const user = await fetchUserInfo(discovery.userInfoEndpoint, tokenResponse.accessToken);
  const session: NativeAuthSession = {
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken,
    expiresAt: tokenResponse.expiresIn ? Math.floor(Date.now() / 1000) + tokenResponse.expiresIn : undefined,
    user,
  };

  await persistNativeSession(session);
  return session;
}

export async function clearNativeSession() {
  await persistNativeSession(null);
}

export async function startWebLogin(mode: 'login' | 'signup') {
  return startNativeLogin(mode);
}

export async function startWebLogout() {
  await clearNativeSession();

  if (!isWebRuntime()) {
    return;
  }

  const config = getAuthConfig();
  const returnTo = `${window.location.origin}${window.location.pathname}`;

  window.location.assign(`https://${config.auth0Domain}/v2/logout?client_id=${encodeURIComponent(config.auth0ClientId)}&returnTo=${encodeURIComponent(returnTo)}`);
}