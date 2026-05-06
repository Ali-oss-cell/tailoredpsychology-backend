import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class PatientDataRequestActionDto {
  @ApiProperty({ example: "assign", enum: ["assign", "start_review", "fulfill", "reject", "cancel"] })
  @IsString()
  @IsIn(["assign", "start_review", "fulfill", "reject", "cancel"])
  action!: "assign" | "start_review" | "fulfill" | "reject" | "cancel";

  @ApiPropertyOptional({ example: "Investigating requested correction details." })
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  notes?: string;

  @ApiPropertyOptional({ example: "Patient withdrew correction request." })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  reason?: string;
}
