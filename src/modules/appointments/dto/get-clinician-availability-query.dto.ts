import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, MaxLength } from "class-validator";

export class GetClinicianAvailabilityQueryDto {
  @ApiProperty({ example: "2026-05-01" })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: "2026-05-31" })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ example: "clinician_001", required: false })
  @IsOptional()
  @IsString()
  clinicianId?: string;

  @ApiProperty({
    example: "Australia/Sydney",
    required: false,
    description: "IANA timezone. Defaults to Australia/Sydney.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}
