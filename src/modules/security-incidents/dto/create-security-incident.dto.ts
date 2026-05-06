import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateSecurityIncidentDto {
  @ApiProperty({ example: "Unauthorized record export attempt" })
  @IsString()
  @MinLength(5)
  @MaxLength(180)
  title!: string;

  @ApiProperty({ example: "Multiple failed export-download requests from unusual source IP." })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  summary!: string;

  @ApiProperty({ example: "high", enum: ["low", "medium", "high", "critical"] })
  @IsString()
  @IsIn(["low", "medium", "high", "critical"])
  severity!: "low" | "medium" | "high" | "critical";

  @ApiProperty({ example: "moderate", enum: ["low", "moderate", "severe"] })
  @IsString()
  @IsIn(["low", "moderate", "severe"])
  impact!: "low" | "moderate" | "severe";

  @ApiProperty({ example: true })
  @IsBoolean()
  containsPersonalData!: boolean;

  @ApiPropertyOptional({ example: "2026-04-30T08:30:00.000Z" })
  @IsOptional()
  @IsString()
  detectedAt?: string;
}
