import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import { AuditModule } from "../audit/audit.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { UsersModule } from "../users/users.module";
import { AppointmentStateScheduler } from "./appointment-state.scheduler";
import { AppointmentStateService } from "./appointment-state.service";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsGateway } from "./appointments.gateway";
import { AppointmentsService } from "./appointments.service";
import { ReadinessRemindersScheduler } from "./readiness-reminders.scheduler";
import { TwilioTokenService } from "./twilio-token.service";

@Module({
  imports: [
    AuditModule,
    AnalyticsModule,
    NotificationsModule,
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("AUTH_JWT_SECRET") ?? "clink-dev-secret",
      }),
    }),
  ],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    AppointmentStateService,
    AppointmentStateScheduler,
    AppointmentsGateway,
    ReadinessRemindersScheduler,
    TwilioTokenService,
  ],
  exports: [AppointmentsService, AppointmentStateService],
})
export class AppointmentsModule {}
