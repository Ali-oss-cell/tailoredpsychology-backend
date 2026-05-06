import { ApiProperty } from "@nestjs/swagger";

import type { AuditMetadataValue, AuditTargetType } from "../entities/audit-event.record";
import type { UserRole } from "../../users/types/user-role.type";

export class AuditEventDto {
  @ApiProperty()
  eventId!: string;

  @ApiProperty()
  actorUserId!: string;

  @ApiProperty({ enum: ["patient", "psychologist", "practice_manager", "admin", "system"] })
  actorRole!: UserRole | "system";

  @ApiProperty()
  action!: string;

  @ApiProperty({ enum: ["auth", "appointment", "booking_request", "referral_document", "system"] })
  targetType!: AuditTargetType;

  @ApiProperty()
  targetId!: string;

  @ApiProperty({ type: "object", additionalProperties: true })
  metadata!: Record<string, AuditMetadataValue>;

  @ApiProperty()
  occurredAt!: string;
}
