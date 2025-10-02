// Toucan is initialized per request in Cloudflare Workers
// This file is kept for consistency but Toucan doesn't need global initialization
export const SENTRY_DSN = "https://676c3d6f11e03ae2b01c5ec3f12b8ac5@o4510122052354048.ingest.us.sentry.io/4510122056613888";
export const SENTRY_CONFIG = {
  dsn: SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: "development",
};