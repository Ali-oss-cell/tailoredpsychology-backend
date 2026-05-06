import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

import type { AnalyticsEventName } from "../entities/analytics-event.record";
import type { UserRole } from "../../users/types/user-role.type";

export class CreateAnalyticsEventDto {
  @ApiProperty({
    enum: [
      "intake_started",
      "intake_submitted",
      "booking_requested",
      "booking_confirmed",
      "session_started",
      "session_completed",
      "session_no_show",
      "join_attempted",
      "join_success",
      "join_failed",
      "join_warned",
    ],
  })
  @IsString()
  @IsIn([
    "intake_started",
    "intake_submitted",
    "booking_requested",
    "booking_confirmed",
    "session_started",
    "session_completed",
    "session_no_show",
    "join_attempted",
    "join_success",
    "join_failed",
    "join_warned",
  ])
  name!: AnalyticsEventName;

  @ApiPropertyOptional({ example: "user_patient_001" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  actorUserId?: string;

  @ApiPropertyOptional({ enum: ["patient", "psychologist", "practice_manager", "admin", "system"] })
  @IsOptional()
  @IsString()
  @IsIn(["patient", "psychologist", "practice_manager", "admin", "system"])
  actorRole?: UserRole | "system";

  @ApiProperty({ example: "br_000001" })
  @IsString()
  @MaxLength(120)
  targetId!: string;

  @ApiPropertyOptional({ example: "booking_requested:br_000001" })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  idempotencyKey?: string;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string | number | boolean | null>;
}
