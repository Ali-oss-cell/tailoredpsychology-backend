import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, MaxLength } from "class-validator";

export class UploadReferralMetadataDto {
  @ApiProperty({ required: false, example: "gp_mhtp" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  sourceType?: string;

  @ApiProperty({ required: false, example: "2026-05-01" })
  @IsOptional()
  @IsDateString()
  referralDate?: string;

  @ApiProperty({ required: false, example: "Referral received from GP." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
