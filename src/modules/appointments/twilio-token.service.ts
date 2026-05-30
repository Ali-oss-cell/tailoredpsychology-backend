import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Twilio from "twilio";

import { isTwilioVideoConfigured, readTwilioRuntimeConfig } from "./twilio-config.util";

@Injectable()
export class TwilioTokenService {
  constructor(private readonly configService: ConfigService) {}

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
