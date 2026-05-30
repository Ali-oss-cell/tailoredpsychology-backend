import { describeTwilioConfigProblems, isTwilioVideoConfigured, readTwilioRuntimeConfig, verifyTwilioVideoCredentials } from "../src/modules/appointments/twilio-config.util";

async function main(): Promise<void> {
  const config = readTwilioRuntimeConfig(process.env);

  console.log("Twilio Video credential check");
  console.log(`  TWILIO_ACCOUNT_SID: ${config.accountSid.slice(0, 6)}…${config.accountSid.slice(-4)} (${config.accountSid.length} chars)`);
  console.log(`  TWILIO_API_KEY:     ${config.apiKey.slice(0, 6)}…${config.apiKey.slice(-4)} (${config.apiKey.length} chars)`);
  console.log(`  TWILIO_API_SECRET:  ${"*".repeat(Math.min(config.apiSecret.length, 12))} (${config.apiSecret.length} chars)`);

  if (!isTwilioVideoConfigured(config)) {
    console.error("\nFAIL: Twilio env vars are missing or still using dev placeholders.");
    process.exitCode = 1;
    return;
  }

  const formatProblems = describeTwilioConfigProblems(config);
  if (formatProblems.length > 0) {
    console.error("\nFAIL: Likely misconfigured values:");
    for (const problem of formatProblems) {
      console.error(`  - ${problem}`);
    }
    process.exitCode = 1;
    return;
  }

  const verified = await verifyTwilioVideoCredentials(config);
  if (!verified.ok) {
    console.error(`\nFAIL: ${verified.message}`);
    process.exitCode = 1;
    return;
  }

  console.log("\nOK: Twilio Video credentials are valid for this account.");
}

void main();
