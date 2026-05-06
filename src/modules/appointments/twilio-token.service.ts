import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Twilio from "twilio";

@Injectable()
export class TwilioTokenService {
  constructor(private readonly configService: ConfigService) {}

  createAppointmentToken(params: {
    appointmentId: string;
    identity: string;
    role: "patient" | "psychologist" | "practice_manager" | "admin";
  }): { accessToken: string; roomName: string; expiresAt: string } {
    const accountSid = this.configService.get<string>("TWILIO_ACCOUNT_SID") ?? "AC00000000000000000000000000000000";
    const apiKey = this.configService.get<string>("TWILIO_API_KEY") ?? "SK00000000000000000000000000000000";
    const apiSecret = this.configService.get<string>("TWILIO_API_SECRET") ?? "twilio-dev-secret";

    const ttlSeconds = 3600;
    const roomName = `clink_${params.appointmentId}`;
    const token = new Twilio.jwt.AccessToken(accountSid, apiKey, apiSecret, {
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
}
