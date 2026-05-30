import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import Stripe from "stripe";

type StripeClient = InstanceType<typeof Stripe>;

@Injectable()
export class StripeClientService implements OnModuleInit {
  private readonly logger = new Logger(StripeClientService.name);
  private client: StripeClient | null = null;

  onModuleInit(): void {
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secretKey) {
      this.logger.warn("STRIPE_SECRET_KEY is not set — booking payments use dev auto-confirm fallback.");
      return;
    }
    this.client = new Stripe(secretKey);
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  getClient(): StripeClient {
    if (!this.client) {
      throw new Error("Stripe is not configured");
    }
    return this.client;
  }

  getWebhookSecret(): string | undefined {
    return process.env.STRIPE_WEBHOOK_SECRET?.trim() || undefined;
  }

  getSessionFeeCents(): number {
    const raw = process.env.STRIPE_SESSION_FEE_CENTS?.trim();
    const parsed = raw ? Number.parseInt(raw, 10) : 22_000;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 22_000;
  }

  getPublicAppUrl(): string {
    return (
      process.env.PUBLIC_APP_URL?.trim() ||
      (process.env.BASE_DOMAIN ? `https://${process.env.BASE_DOMAIN}` : "http://localhost:3000")
    ).replace(/\/$/, "");
  }
}
