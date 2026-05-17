import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

/**
 * Browser origins allowed to call the API with cookies (`credentials: include`).
 * Override with comma-separated `CORS_ORIGINS` in production if needed.
 */
export function getAllowedCorsOrigins(): string[] {
  const fromEnv = process.env.CORS_ORIGINS?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }

  const baseDomain = process.env.BASE_DOMAIN?.trim();
  const fromBase = baseDomain
    ? [`https://${baseDomain}`, `https://www.${baseDomain}`, `http://${baseDomain}`, `http://www.${baseDomain}`]
    : [];

  return [
    ...fromBase,
    "https://tailoredpsychology.com.au",
    "https://www.tailoredpsychology.com.au",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];
}

export function isOriginAllowed(origin: string | undefined, allowed: string[]): boolean {
  if (!origin) {
    return true;
  }
  return allowed.includes(origin);
}

export function buildCorsOptions(): CorsOptions {
  const allowedOrigins = getAllowedCorsOrigins();

  return {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    exposedHeaders: ["Content-Disposition"],
    optionsSuccessStatus: 204,
    preflightContinue: false,
  };
}
