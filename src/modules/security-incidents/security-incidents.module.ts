import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { SecurityIncidentsController } from "./security-incidents.controller";
import { SecurityIncidentsService } from "./security-incidents.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [SecurityIncidentsController],
  providers: [SecurityIncidentsService],
})
export class SecurityIncidentsModule {}
