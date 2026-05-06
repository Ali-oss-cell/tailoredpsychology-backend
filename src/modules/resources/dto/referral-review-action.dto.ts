import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class ReferralReviewActionDto {
  @ApiPropertyOptional({ example: "Referral date and provider details verified." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ example: "Escalate to intake coordinator for next step." })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
