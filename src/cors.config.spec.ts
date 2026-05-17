import { buildCorsOptions, getAllowedCorsOrigins, isOriginAllowed } from "./cors.config";

describe("cors.config", () => {
  const prevCors = process.env.CORS_ORIGINS;
  const prevBase = process.env.BASE_DOMAIN;

  afterEach(() => {
    if (prevCors === undefined) {
      Reflect.deleteProperty(process.env, "CORS_ORIGINS");
    } else {
      process.env.CORS_ORIGINS = prevCors;
    }
    if (prevBase === undefined) {
      Reflect.deleteProperty(process.env, "BASE_DOMAIN");
    } else {
      process.env.BASE_DOMAIN = prevBase;
    }
  });

  it("includes apex and www https origins from BASE_DOMAIN", () => {
    process.env.BASE_DOMAIN = "tailoredpsychology.com.au";
    Reflect.deleteProperty(process.env, "CORS_ORIGINS");
    const origins = getAllowedCorsOrigins();
    expect(origins).toContain("https://tailoredpsychology.com.au");
    expect(origins).toContain("https://www.tailoredpsychology.com.au");
  });

  it("prefers CORS_ORIGINS when set", () => {
    process.env.CORS_ORIGINS = "https://app.example.com,https://www.example.com";
    expect(getAllowedCorsOrigins()).toEqual(["https://app.example.com", "https://www.example.com"]);
  });

  it("allows production site origin for credentialed requests", () => {
    const allowed = getAllowedCorsOrigins();
    expect(isOriginAllowed("https://tailoredpsychology.com.au", allowed)).toBe(true);
    expect(isOriginAllowed("https://evil.example", allowed)).toBe(false);
  });

  it("buildCorsOptions accepts allowed browser origin", async () => {
    const options = buildCorsOptions();
    const originFn = options.origin as (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => void;

    await new Promise<void>((resolve, reject) => {
      originFn("https://tailoredpsychology.com.au", (err, allow) => {
        try {
          expect(err).toBeNull();
          expect(allow).toBe(true);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
});
