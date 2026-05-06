import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AppointmentsModule } from "./modules/appointments/appointments.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BillingModule } from "./modules/billing/billing.module";
import { CoreModule } from "./modules/core/core.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { ExportsModule } from "./modules/exports/exports.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { PsychologistNotesModule } from "./modules/psychologist-notes/psychologist-notes.module";
import { ResourcesModule } from "./modules/resources/resources.module";
import { SecurityIncidentsModule } from "./modules/security-incidents/security-incidents.module";
import { ServicesModule } from "./modules/services/services.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CoreModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    AppointmentsModule,
    AnalyticsModule,
    BillingModule,
    ExportsModule,
    ResourcesModule,
    PsychologistNotesModule,
    SecurityIncidentsModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
