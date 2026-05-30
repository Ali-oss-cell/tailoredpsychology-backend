import Twilio from "twilio";

export type TwilioRuntimeConfig = {
  accountSid: string;
  apiKey: string;
  apiSecret: string;
};

const PLACEHOLDER_ACCOUNT_SID = "AC00000000000000000000000000000000";
const PLACEHOLDER_API_KEY = "SK00000000000000000000000000000000";
const PLACEHOLDER_API_SECRET = "twilio-dev-secret";

function cleanEnvValue(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function readTwilioRuntimeConfig(env: NodeJS.ProcessEnv): TwilioRuntimeConfig {
  return {
    accountSid: cleanEnvValue(env.TWILIO_ACCOUNT_SID) || PLACEHOLDER_ACCOUNT_SID,
    apiKey: cleanEnvValue(env.TWILIO_API_KEY) || PLACEHOLDER_API_KEY,
    apiSecret: cleanEnvValue(env.TWILIO_API_SECRET) || PLACEHOLDER_API_SECRET,
  };
}

/** Human-readable hints when values look swapped or wrong type. */
export function describeTwilioConfigProblems(config: TwilioRuntimeConfig): string[] {
  const problems: string[] = [];
  if (config.apiKey.startsWith("AC")) {
    problems.push("TWILIO_API_KEY looks like an Account SID. Use the API Key SID (starts with SK).");
  }
  if (config.apiSecret.startsWith("SK")) {
    problems.push("TWILIO_API_SECRET looks like an API Key SID. Use the secret shown once when the key was created.");
  }
  if (config.apiSecret.startsWith("AC")) {
    problems.push("TWILIO_API_SECRET looks like an Account SID. Do not use the Auth Token here.");
  }
  if (/^[a-f0-9]{32}$/i.test(config.apiSecret)) {
    problems.push(
      "TWILIO_API_SECRET looks like a Twilio Auth Token. Video tokens require an API Key Secret (from Create API key), not the Auth Token.",
    );
  }
  return problems;
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

export type TwilioVerifyResult = { ok: true } | { ok: false; message: string };

/** Calls Twilio to confirm the API key belongs to the configured account. */
export async function verifyTwilioVideoCredentials(config: TwilioRuntimeConfig): Promise<TwilioVerifyResult> {
  const formatProblems = describeTwilioConfigProblems(config);
  if (formatProblems.length > 0) {
    return { ok: false, message: formatProblems.join(" ") };
  }

  try {
    const client = Twilio(config.apiKey, config.apiSecret, { accountSid: config.accountSid });
    const account = await client.api.accounts(config.accountSid).fetch();
    if (account.sid !== config.accountSid) {
      return {
        ok: false,
        message: "TWILIO_ACCOUNT_SID does not match the account for TWILIO_API_KEY/TWILIO_API_SECRET.",
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      message:
        "Twilio rejected these credentials. Ensure TWILIO_ACCOUNT_SID, TWILIO_API_KEY (SK...), and TWILIO_API_SECRET are from the same Twilio project and were copied completely.",
    };
  }
}
