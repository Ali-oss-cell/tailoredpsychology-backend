import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class GetIntakeQueueQueryDto {
  @ApiPropertyOptional({ example: "submitted" })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  state?: string;

  @ApiPropertyOptional({ example: "urgent_support_needed" })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  risk?: string;

  @ApiPropertyOptional({ example: "missing_referral" })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  referralStatus?: string;

  @ApiPropertyOptional({ example: "yes" })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  medicareUncertain?: string;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsInt()
  @Min(0)
  staleHours?: number;

  @ApiPropertyOptional({ example: "clinician_001" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  assignedClinicianId?: string;
}
