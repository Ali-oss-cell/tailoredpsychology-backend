import { isTwilioVideoConfigured, readTwilioRuntimeConfig } from "./twilio-config.util";

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
});
