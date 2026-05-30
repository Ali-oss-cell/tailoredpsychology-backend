export type TwilioRuntimeConfig = {
  accountSid: string;
  apiKey: string;
  apiSecret: string;
};

const PLACEHOLDER_ACCOUNT_SID = "AC00000000000000000000000000000000";
const PLACEHOLDER_API_KEY = "SK00000000000000000000000000000000";
const PLACEHOLDER_API_SECRET = "twilio-dev-secret";

export function readTwilioRuntimeConfig(env: NodeJS.ProcessEnv): TwilioRuntimeConfig {
  return {
    accountSid: env.TWILIO_ACCOUNT_SID?.trim() || PLACEHOLDER_ACCOUNT_SID,
    apiKey: env.TWILIO_API_KEY?.trim() || PLACEHOLDER_API_KEY,
    apiSecret: env.TWILIO_API_SECRET?.trim() || PLACEHOLDER_API_SECRET,
  };
}

/** True when real Twilio Video API credentials are configured (not dev placeholders). */
export function isTwilioVideoConfigured(config: TwilioRuntimeConfig): boolean {
  return (
    config.accountSid.startsWith("AC") &&
    config.accountSid !== PLACEHOLDER_ACCOUNT_SID &&
    config.apiKey.startsWith("SK") &&
    config.apiKey !== PLACEHOLDER_API_KEY &&
    config.apiSecret.length > 8 &&
    config.apiSecret !== PLACEHOLDER_API_SECRET
  );
}
