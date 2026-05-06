import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";

export class GetReferralQueueQueryDto {
  @ApiPropertyOptional({ enum: ["received", "review_needed", "approved", "rejected", "info_requested"] })
  @IsOptional()
  @IsString()
  @IsIn(["received", "review_needed", "approved", "rejected", "info_requested"])
  status?: "received" | "review_needed" | "approved" | "rejected" | "info_requested";

  @ApiPropertyOptional({ enum: ["all", "unreviewed", "mine"] })
  @IsOptional()
  @IsString()
  @IsIn(["all", "unreviewed", "mine"])
  owner?: "all" | "unreviewed" | "mine";

  @ApiPropertyOptional({ enum: ["all", "overdue", "on-track"] })
  @IsOptional()
  @IsString()
  @IsIn(["all", "overdue", "on-track"])
  overdue?: "all" | "overdue" | "on-track";
}
