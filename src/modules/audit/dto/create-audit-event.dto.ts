import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

import type { AuditMetadataValue, AuditTargetType } from "../entities/audit-event.record";
import type { UserRole } from "../../users/types/user-role.type";

export class CreateAuditEventDto {
  @ApiProperty({ example: "user_patient_001" })
  @IsString()
  @MaxLength(100)
  actorUserId!: string;

  @ApiProperty({ example: "patient", enum: ["patient", "psychologist", "practice_manager", "admin", "system"] })
  @IsString()
  @IsIn(["patient", "psychologist", "practice_manager", "admin", "system"])
  actorRole!: UserRole | "system";

  @ApiProperty({ example: "chat_message_posted" })
  @IsString()
  @MaxLength(120)
  action!: string;

  @ApiProperty({ example: "appointment", enum: ["auth", "appointment", "booking_request", "referral_document", "system"] })
  @IsString()
  @IsIn(["auth", "appointment", "booking_request", "referral_document", "system"])
  targetType!: AuditTargetType;

  @ApiProperty({ example: "appt_open_001" })
  @IsString()
  @MaxLength(120)
  targetId!: string;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, AuditMetadataValue>;
}
