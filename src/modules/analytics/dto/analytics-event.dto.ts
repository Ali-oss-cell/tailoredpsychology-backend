import { ApiProperty } from "@nestjs/swagger";

import type { AnalyticsEventName } from "../entities/analytics-event.record";
import type { UserRole } from "../../users/types/user-role.type";

export class AnalyticsEventDto {
  @ApiProperty()
  eventId!: string;

  @ApiProperty({
    enum: [
      "intake_started",
      "intake_submitted",
      "booking_requested",
      "booking_confirmed",
      "session_started",
      "session_completed",
      "session_no_show",
    ],
  })
  name!: AnalyticsEventName;

  @ApiProperty()
  actorUserId!: string;

  @ApiProperty({ enum: ["patient", "psychologist", "practice_manager", "admin", "system"] })
  actorRole!: UserRole | "system";

  @ApiProperty()
  targetId!: string;

  @ApiProperty()
  occurredAt!: string;

  @ApiProperty({ type: "object", additionalProperties: true })
  metadata!: Record<string, string | number | boolean | null>;

  @ApiProperty({ required: false })
  idempotencyKey?: string;
}
