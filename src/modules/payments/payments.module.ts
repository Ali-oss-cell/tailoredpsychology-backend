import { Module } from "@nestjs/common";

import { AnalyticsModule } from "../analytics/analytics.module";
import { AppointmentsModule } from "../appointments/appointments.module";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { UsersModule } from "../users/users.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { StripeClientService } from "./stripe-client.service";

@Module({
  imports: [AuthModule, AppointmentsModule, UsersModule, NotificationsModule, AnalyticsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeClientService],
  exports: [PaymentsService, StripeClientService],
})
export class PaymentsModule {}
