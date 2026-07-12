import type { Request } from "express";

import {
  authThrottleOptions,
  bookingThrottleOptions,
  buildThrottlerModuleOptions,
  parseBoolean,
  parsePositiveInt,
  resolveClientIp,
  shouldTrustProxy,
} from "./throttle.config";
import { THROTTLE_DEFAULT } from "./throttle.constants";

describe("throttle.config", () => {
  const prevEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...prevEnv };
  });

  it("parses positive integers with fallback", () => {
    expect(parsePositiveInt("120", 100)).toBe(120);
    expect(parsePositiveInt("0", 100)).toBe(100);
    expect(parsePositiveInt("abc", 100)).toBe(100);
    expect(parsePositiveInt(undefined, 100)).toBe(100);
  });

  it("parses booleans with fallback", () => {
    expect(parseBoolean("true", false)).toBe(true);
    expect(parseBoolean("0", true)).toBe(false);
    expect(parseBoolean(undefined, true)).toBe(true);
  });

  it("builds module options from env", () => {
    process.env.THROTTLE_TTL = "30000";
    process.env.THROTTLE_LIMIT = "50";
    const options = buildThrottlerModuleOptions();
    expect(Array.isArray(options)).toBe(false);
    if (!Array.isArray(options)) {
      expect(options.throttlers).toEqual([{ name: THROTTLE_DEFAULT, ttl: 30000, limit: 50 }]);
    }
  });

  it("exposes auth and booking throttle overrides from env", () => {
    process.env.THROTTLE_TTL = "60000";
    process.env.THROTTLE_AUTH_LIMIT = "7";
    process.env.THROTTLE_BOOKING_LIMIT = "20";
    expect(authThrottleOptions()).toEqual({ [THROTTLE_DEFAULT]: { ttl: 60000, limit: 7 } });
    expect(bookingThrottleOptions()).toEqual({ [THROTTLE_DEFAULT]: { ttl: 60000, limit: 20 } });
  });

  it("defaults trust proxy to true", () => {
    Reflect.deleteProperty(process.env, "THROTTLE_TRUST_PROXY");
    expect(shouldTrustProxy()).toBe(true);
  });

  it("prefers the first X-Forwarded-For address", () => {
    const req = {
      headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
      ips: [],
      ip: "127.0.0.1",
    } as Request;
    expect(resolveClientIp(req)).toBe("203.0.113.10");
  });

  it("falls back to req.ip when no forwarded header exists", () => {
    const req = {
      headers: {},
      ips: [],
      ip: "127.0.0.1",
    } as Request;
    expect(resolveClientIp(req)).toBe("127.0.0.1");
  });
});
