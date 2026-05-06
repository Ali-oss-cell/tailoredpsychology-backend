import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

export class GetPsychologistWorkspaceQueryDto {
  @ApiPropertyOptional({ enum: ["ready", "attention", "unknown"] })
  @IsOptional()
  @IsIn(["ready", "attention", "unknown"])
  readinessStatus?: "ready" | "attention" | "unknown";

  @ApiPropertyOptional({ example: 15, description: "Only include items with readiness older than this threshold or missing." })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24 * 60)
  staleMinutes?: number;

  @ApiPropertyOptional({ enum: ["startsAt", "readinessUpdatedAt", "readinessStatus"], default: "startsAt" })
  @IsOptional()
  @IsIn(["startsAt", "readinessUpdatedAt", "readinessStatus"])
  sortBy?: "startsAt" | "readinessUpdatedAt" | "readinessStatus";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "asc" })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc";
}
