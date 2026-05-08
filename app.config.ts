import 'dotenv/config';

import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Zendo AI Tasks Goals',
  slug: 'task-list-live',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  scheme: 'zendo',
  web: {
    favicon: './assets/favicon.png',
    name: 'Zendo AI Tasks Goals',
    shortName: 'Zendo',
  },
  ios: {
    supportsTablet: true,
  },
  plugins: ['expo-web-browser', 'expo-secure-store'],
  extra: {
    appBaseUrl: process.env.APP_BASE_URL ?? 'https://zendo.cc',
    auth0Domain: process.env.AUTH0_DOMAIN ?? '',
    auth0IssuerBaseUrl: process.env.AUTH0_ISSUER_BASE_URL ?? '',
    auth0ClientId: process.env.AUTH0_MOBILE_CLIENT_ID ?? '',
    auth0Audience: process.env.AUTH0_AUDIENCE ?? process.env.AUTH0_API_AUDIENCE ?? '',
  },
};

export default config;