import http from 'node:http';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

// Load .env manually so process.env has the values when building the child env
const envPath = resolve(process.cwd(), '.env');
try {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const raw = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) process.env[key] = raw;
  }
} catch { /* no .env file */ }

const API_PROXY_PORT = Number(process.env.ZENDO_API_PROXY_PORT ?? 8787);
const TARGET_ORIGIN = process.env.ZENDO_API_TARGET_ORIGIN ?? 'https://zendo.cc';
const EXPO_ARGS = ['expo', 'start', '--web', ...process.argv.slice(2)];

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
}

function getBearerTokenDebugInfo(authorizationHeader) {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();
  const tokenParts = token.split('.');

  if (tokenParts.length < 2) {
    return {
      kind: 'opaque',
    };
  }

  try {
    const payload = JSON.parse(decodeBase64Url(tokenParts[1]));

    return {
      kind: 'jwt',
      aud: payload.aud,
      iss: payload.iss,
      azp: payload.azp,
      sub: payload.sub,
      scope: payload.scope,
    };
  } catch {
    return {
      kind: 'unparseable',
    };
  }
}

function setCorsHeaders(response, requestOrigin = '*') {
  response.setHeader('Access-Control-Allow-Origin', requestOrigin);
  response.setHeader('Vary', 'Origin');
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
}

const proxyServer = http.createServer(async (request, response) => {
  const requestOrigin = request.headers.origin ?? '*';
  setCorsHeaders(response, requestOrigin);

  if (!request.url) {
    response.writeHead(400).end('Missing request URL');
    return;
  }

  if (request.method === 'OPTIONS') {
    response.writeHead(204).end();
    return;
  }

  if (!request.url.startsWith('/api/')) {
    response.writeHead(404).end('Not found');
    return;
  }

  const upstreamUrl = new URL(request.url, TARGET_ORIGIN);
  const bearerTokenInfo = getBearerTokenDebugInfo(request.headers.authorization);
  const requestBody = await new Promise((resolve, reject) => {
    const chunks = [];

    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => resolve(chunks.length > 0 ? Buffer.concat(chunks) : undefined));
    request.on('error', reject);
  });

  const upstreamHeaders = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      upstreamHeaders.set(key, value.join(','));
      continue;
    }

    if (key.toLowerCase() === 'host' || key.toLowerCase() === 'origin') {
      continue;
    }

    upstreamHeaders.set(key, value);
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers: upstreamHeaders,
      body: requestBody,
      redirect: 'manual',
    });

    if (bearerTokenInfo) {
      const summary = bearerTokenInfo.kind === 'jwt'
        ? JSON.stringify({
            aud: bearerTokenInfo.aud,
            iss: bearerTokenInfo.iss,
            azp: bearerTokenInfo.azp,
            sub: bearerTokenInfo.sub,
            scope: bearerTokenInfo.scope,
          })
        : bearerTokenInfo.kind;

      console.log(`[zendo-api-proxy] ${request.method} ${request.url} -> ${upstreamResponse.status} token=${summary}`);
    } else {
      console.log(`[zendo-api-proxy] ${request.method} ${request.url} -> ${upstreamResponse.status} token=none`);
    }

    response.statusCode = upstreamResponse.status;

    for (const [key, value] of upstreamResponse.headers.entries()) {
      if (key.toLowerCase() === 'content-encoding' || key.toLowerCase() === 'transfer-encoding' || key.toLowerCase() === 'content-length') {
        continue;
      }

      response.setHeader(key, value);
    }

    setCorsHeaders(response, requestOrigin);

    const arrayBuffer = await upstreamResponse.arrayBuffer();
    response.end(Buffer.from(arrayBuffer));
  } catch (error) {
    response.writeHead(502, {
      'Content-Type': 'application/json',
    });
    response.end(JSON.stringify({
      error: error instanceof Error ? error.message : 'Proxy request failed.',
    }));
  }
});

proxyServer.listen(API_PROXY_PORT, () => {
  console.log(`[zendo-api-proxy] listening on http://localhost:${API_PROXY_PORT}`);
});

const expoProcess = spawn('npx', EXPO_ARGS, {
  stdio: 'inherit',
  env: {
    ...process.env,
    ZENDO_API_PROXY_PORT: String(API_PROXY_PORT),
    EXPO_PUBLIC_ZENDO_API_PROXY_PORT: String(API_PROXY_PORT),
    EXPO_PUBLIC_APP_BASE_URL: process.env.APP_BASE_URL ?? TARGET_ORIGIN,
    EXPO_PUBLIC_AUTH0_DOMAIN: process.env.AUTH0_DOMAIN ?? '',
    EXPO_PUBLIC_AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL ?? '',
    AUTH0_MOBILE_CLIENT_ID: process.env.AUTH0_MOBILE_CLIENT_ID ?? process.env.AUTH0_CLIENT_ID ?? '',
    EXPO_PUBLIC_AUTH0_MOBILE_CLIENT_ID: process.env.AUTH0_MOBILE_CLIENT_ID ?? process.env.AUTH0_CLIENT_ID ?? '',
    AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE ?? '',
    AUTH0_API_AUDIENCE: process.env.AUTH0_API_AUDIENCE ?? '',
    EXPO_PUBLIC_AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE ?? process.env.AUTH0_API_AUDIENCE ?? '',
  },
});

function shutdown(exitCode = 0) {
  proxyServer.close();

  if (!expoProcess.killed) {
    expoProcess.kill('SIGINT');
  }

  process.exit(exitCode);
}

expoProcess.on('exit', (code) => {
  shutdown(code ?? 0);
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));