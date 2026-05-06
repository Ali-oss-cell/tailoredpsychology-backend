import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateBookingRequestDto {
  @ApiProperty({ example: "clinician_001" })
  @IsString()
  clinicianId!: string;

  @ApiProperty({ example: "clinician_001_2026-05-12_0900" })
  @IsString()
  slotId!: string;

  @ApiProperty({ example: "2026-05-12" })
  @IsDateString()
  appointmentDate!: string;

  @ApiProperty({ required: false, example: "Initial telehealth session for anxiety support" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({ required: false, example: "booking-submit-42" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  idempotencyKey?: string;

  @ApiProperty({ required: false, example: "Australia/Sydney" })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiProperty({ required: false, example: "ref_000001" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  referralDocumentId?: string;
}
