import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Twilio from "twilio";

import {
  describeTwilioConfigProblems,
  isTwilioVideoConfigured,
  readTwilioRuntimeConfig,
  verifyTwilioVideoCredentials,
} from "./twilio-config.util";

@Injectable()
export class TwilioTokenService implements OnModuleInit {
  private readonly logger = new Logger(TwilioTokenService.name);
  private credentialError: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const config = this.readConfig();
    if (!isTwilioVideoConfigured(config)) {
      this.logger.warn("Twilio Video not configured — telehealth join tokens will be rejected.");
      return;
    }

    const formatProblems = describeTwilioConfigProblems(config);
    if (formatProblems.length > 0) {
      this.credentialError = formatProblems.join(" ");
      this.logger.error(`Twilio Video misconfigured: ${this.credentialError}`);
      return;
    }

    const verified = await verifyTwilioVideoCredentials(config);
    if (!verified.ok) {
      this.credentialError = verified.message;
      this.logger.error(`Twilio Video credential check failed: ${verified.message}`);
      return;
    }

    this.logger.log("Twilio Video credentials verified.");
  }

  isConfigured(): boolean {
    return isTwilioVideoConfigured(this.readConfig());
  }

  createAppointmentToken(params: {
    appointmentId: string;
    identity: string;
    role: "patient" | "psychologist" | "practice_manager" | "admin";
  }): { accessToken: string; roomName: string; expiresAt: string } {
    const config = this.readConfig();
    if (!isTwilioVideoConfigured(config)) {
      throw new ServiceUnavailableException(
        "Telehealth video is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_API_KEY, and TWILIO_API_SECRET on the backend.",
      );
    }
    if (this.credentialError) {
      throw new ServiceUnavailableException(this.credentialError);
    }

    const ttlSeconds = 3600;
    const roomName = `clink_${params.appointmentId}`;
    const token = new Twilio.jwt.AccessToken(config.accountSid, config.apiKey, config.apiSecret, {
      identity: params.identity,
      ttl: ttlSeconds,
    });
    token.addGrant(new Twilio.jwt.AccessToken.VideoGrant({ room: roomName }));
    return {
      accessToken: token.toJwt(),
      roomName,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    };
  }

  private readConfig() {
    return readTwilioRuntimeConfig({
      TWILIO_ACCOUNT_SID: this.configService.get<string>("TWILIO_ACCOUNT_SID"),
      TWILIO_API_KEY: this.configService.get<string>("TWILIO_API_KEY"),
      TWILIO_API_SECRET: this.configService.get<string>("TWILIO_API_SECRET"),
    });
  }
}
