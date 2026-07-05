import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.configService.get<string>("SMTP_HOST")?.trim());
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>("SMTP_HOST")?.trim();
    if (!host) {
      throw new Error("SMTP is not configured");
    }

    const port = Number.parseInt(this.configService.get<string>("SMTP_PORT") ?? "587", 10);
    const user = this.configService.get<string>("SMTP_USER")?.trim();
    const pass = this.configService.get<string>("SMTP_PASS")?.trim();
    const secure =
      this.configService.get<string>("SMTP_SECURE") === "true" || port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    return this.transporter;
  }

  private fromAddress(): string {
    return (
      this.configService.get<string>("SMTP_FROM")?.trim() ||
      this.configService.get<string>("SMTP_USER")?.trim() ||
      "noreply@tailoredpsychology.com.au"
    );
  }

  async sendMail(input: SendMailInput): Promise<void> {
    const transport = this.getTransporter();
    await transport.sendMail({
      from: this.fromAddress(),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const subject = "Reset your Tailored Psychology password";
    const text = [
      "We received a request to reset your Tailored Psychology password.",
      "",
      `Reset your password: ${resetUrl}`,
      "",
      "This link expires in 1 hour. If you did not request a reset, you can ignore this email.",
    ].join("\n");
    const html = [
      "<p>We received a request to reset your Tailored Psychology password.</p>",
      `<p><a href="${resetUrl}">Reset your password</a></p>`,
      "<p>This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>",
    ].join("");

    try {
      await this.sendMail({ to, subject, text, html });
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${to}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
