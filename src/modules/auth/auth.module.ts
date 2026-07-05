import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { AppointmentsModule } from "../appointments/appointments.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import { AuditModule } from "../audit/audit.module";
import { MailModule } from "../mail/mail.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AdminUsersController } from "./admin-users.controller";
import { AdminPatientRetentionController } from "./admin-patient-retention.controller";
import { AdminOpsController } from "./admin-ops.controller";
import { PatientDataRequestsController } from "./patient-data-requests.controller";
import { AuthService } from "./auth.service";
import { ConsentLifecycleService } from "./consent-lifecycle.service";
import { PasswordResetService } from "./password-reset.service";
import { PatientDataRequestsService } from "./patient-data-requests.service";
import { PatientsMeProfileController } from "./patients-me-profile.controller";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    ConfigModule,
    MailModule,
    AuditModule,
    AnalyticsModule,
    AppointmentsModule,
    NotificationsModule,
    UsersModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("AUTH_JWT_SECRET") ?? "clink-dev-secret",
        signOptions: {
          expiresIn: Number(configService.get<string>("AUTH_JWT_EXPIRES_IN") ?? "3600"),
        },
      }),
    }),
  ],
  controllers: [
    AuthController,
    PatientsMeProfileController,
    AdminUsersController,
    AdminPatientRetentionController,
    AdminOpsController,
    PatientDataRequestsController,
  ],
  providers: [
    AuthService,
    ConsentLifecycleService,
    PasswordResetService,
    PatientDataRequestsService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
