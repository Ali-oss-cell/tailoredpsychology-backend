import type { ExecutionContext } from "@nestjs/common";
import type { ThrottlerModuleOptions } from "@nestjs/throttler";
import type { Request } from "express";

import { THROTTLE_DEFAULT } from "./throttle.constants";

const DEFAULT_TTL_MS = 60_000;
const DEFAULT_LIMIT = 100;
const DEFAULT_AUTH_LIMIT = 10;
const DEFAULT_BOOKING_LIMIT = 30;

export function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

export function getThrottleTtlMs(): number {
  return parsePositiveInt(process.env.THROTTLE_TTL, DEFAULT_TTL_MS);
}

export function getThrottleLimit(): number {
  return parsePositiveInt(process.env.THROTTLE_LIMIT, DEFAULT_LIMIT);
}

export function getThrottleAuthLimit(): number {
  return parsePositiveInt(process.env.THROTTLE_AUTH_LIMIT, DEFAULT_AUTH_LIMIT);
}

export function getThrottleBookingLimit(): number {
  return parsePositiveInt(process.env.THROTTLE_BOOKING_LIMIT, DEFAULT_BOOKING_LIMIT);
}

export function shouldTrustProxy(): boolean {
  return parseBoolean(process.env.THROTTLE_TRUST_PROXY, true);
}

export function resolveClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || req.ip || "unknown";
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0]?.split(",")[0]?.trim() || req.ip || "unknown";
  }
  if (req.ips.length > 0) {
    return req.ips[0] ?? req.ip ?? "unknown";
  }
  return req.ip ?? "unknown";
}

export function buildThrottlerModuleOptions(): ThrottlerModuleOptions {
  return {
    throttlers: [
      {
        name: THROTTLE_DEFAULT,
        ttl: getThrottleTtlMs(),
        limit: getThrottleLimit(),
      },
    ],
    getTracker: (req: Record<string, unknown>, _context: ExecutionContext) =>
      resolveClientIp(req as unknown as Request),
  };
}

export function authThrottleOptions() {
  return {
    [THROTTLE_DEFAULT]: {
      ttl: getThrottleTtlMs(),
      limit: getThrottleAuthLimit(),
    },
  };
}

export function bookingThrottleOptions() {
  return {
    [THROTTLE_DEFAULT]: {
      ttl: getThrottleTtlMs(),
      limit: getThrottleBookingLimit(),
    },
  };
}
