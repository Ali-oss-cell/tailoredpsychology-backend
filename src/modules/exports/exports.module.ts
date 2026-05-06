import { Module } from "@nestjs/common";

import { AppointmentsModule } from "../appointments/appointments.module";
import { AuditModule } from "../audit/audit.module";
import { UsersModule } from "../users/users.module";
import { ExportsController } from "./exports.controller";
import { ExportsService } from "./exports.service";

@Module({
  imports: [AuditModule, UsersModule, AppointmentsModule],
  controllers: [ExportsController],
  providers: [ExportsService],
})
export class ExportsModule {}
