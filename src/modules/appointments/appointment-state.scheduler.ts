import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";

import { AppointmentStateService } from "./appointment-state.service";

/**
 * Closes out stale sessions so status is never left as "scheduled" forever:
 * - scheduled + end passed without a join → no_show
 * - in_progress + end passed → completed
 * Opt-in via APPOINTMENT_STATE_SWEEP_ENABLED=true (mirrors readiness reminders).
 */
@Injectable()
export class AppointmentStateScheduler {
  private readonly logger = new Logger(AppointmentStateScheduler.name);

  constructor(
    private readonly appointmentStateService: AppointmentStateService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(process.env.APPOINTMENT_STATE_SWEEP_CRON ?? "*/5 * * * *")
  async sweep(): Promise<void> {
    const isEnabled = this.configService.get<string>("APPOINTMENT_STATE_SWEEP_ENABLED") === "true";
    if (!isEnabled) {
      return;
    }
    try {
      const result = await this.appointmentStateService.runSweep();
      if (result.noShows > 0 || result.completed > 0) {
        this.logger.log(`Appointment state sweep: no_shows=${result.noShows}, completed=${result.completed}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Appointment state sweep failed: ${message}`);
    }
  }
}
