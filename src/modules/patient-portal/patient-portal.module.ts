import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import { AppointmentsModule } from "../appointments/appointments.module";
import { AuthModule } from "../auth/auth.module";
import { BillingModule } from "../billing/billing.module";
import { UsersModule } from "../users/users.module";
import { PatientPortalController } from "./patient-portal.controller";
import { PatientPortalService } from "./patient-portal.service";
import { PortalGateway } from "./portal.gateway";

@Module({
  imports: [
    AuthModule,
    AppointmentsModule,
    BillingModule,
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("AUTH_JWT_SECRET") ?? "clink-dev-secret",
      }),
    }),
  ],
  controllers: [PatientPortalController],
  providers: [PatientPortalService, PortalGateway],
  exports: [PatientPortalService, PortalGateway],
})
export class PatientPortalModule {}
