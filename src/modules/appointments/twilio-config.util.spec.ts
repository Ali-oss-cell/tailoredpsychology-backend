import {
  describeTwilioConfigProblems,
  isTwilioVideoConfigured,
  readTwilioRuntimeConfig,
} from "./twilio-config.util";

describe("twilio-config.util", () => {
  it("detects placeholder credentials as not configured", () => {
    const config = readTwilioRuntimeConfig({});
    expect(isTwilioVideoConfigured(config)).toBe(false);
  });

  it("detects real-looking credentials as configured", () => {
    const config = readTwilioRuntimeConfig({
      TWILIO_ACCOUNT_SID: "AC1234567890abcdef1234567890abcdef",
      TWILIO_API_KEY: "SK1234567890abcdef1234567890abcdef",
      TWILIO_API_SECRET: "super-secret-value",
    });
    expect(isTwilioVideoConfigured(config)).toBe(true);
  });

  it("strips surrounding quotes from env values", () => {
    const config = readTwilioRuntimeConfig({
      TWILIO_ACCOUNT_SID: '"AC1234567890abcdef1234567890abcdef"',
      TWILIO_API_KEY: "'SK1234567890abcdef1234567890abcdef'",
    });
    expect(config.accountSid.startsWith("AC")).toBe(true);
    expect(config.apiKey.startsWith("SK")).toBe(true);
  });

  it("flags auth token used as api secret", () => {
    const problems = describeTwilioConfigProblems({
      accountSid: "AC1234567890abcdef1234567890abcdef",
      apiKey: "SK1234567890abcdef1234567890abcdef",
      apiSecret: "a1b2c3d4e5f6789012345678901234ab",
    });
    expect(problems.some((p) => p.includes("Auth Token"))).toBe(true);
  });
});
