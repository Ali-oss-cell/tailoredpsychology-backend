import { Module } from "@nestjs/common";

import { AnalyticsModule } from "../analytics/analytics.module";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";

@Module({
  imports: [AuthModule, AnalyticsModule, AuditModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
