import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsISO8601, IsOptional, IsString, MaxLength } from "class-validator";

import type { AuditTargetType } from "../entities/audit-event.record";

export class GetAuditEventsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  action?: string;

  @ApiPropertyOptional({ enum: ["auth", "appointment", "booking_request", "referral_document", "system"] })
  @IsOptional()
  @IsString()
  targetType?: AuditTargetType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  targetId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  actorUserId?: string;

  @ApiPropertyOptional({ example: "2026-04-26T10:00:00.000Z" })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ example: "2026-04-27T10:00:00.000Z" })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
