import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";

import { AppointmentsService } from "./appointments.service";

@Injectable()
export class ReadinessRemindersScheduler {
  private readonly logger = new Logger(ReadinessRemindersScheduler.name);

  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(process.env.READINESS_REMINDERS_CRON ?? "*/5 * * * *")
  async dispatchReadinessReminders(): Promise<void> {
    const isEnabled = this.configService.get<string>("READINESS_REMINDERS_ENABLED") === "true";
    if (!isEnabled) {
      return;
    }
    try {
      const result = await this.appointmentsService.dispatchReadinessRemindersAsSystem();
      this.logger.log(
        `Readiness reminders dispatched: scanned=${result.scannedAppointments}, sent=${result.dispatchedCount}, escalated=${result.escalatedCount}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Readiness reminder dispatch failed: ${message}`);
    }
  }
}
