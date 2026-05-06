import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class DataExportStatusDto {
  @ApiProperty({ example: "exp_000001" })
  jobId!: string;

  @ApiProperty({ example: "ready", enum: ["queued", "processing", "ready", "failed"] })
  status!: "queued" | "processing" | "ready" | "failed";

  @ApiPropertyOptional({ example: "2026-04-28T12:00:00.000Z" })
  requestedAt?: string;

  @ApiPropertyOptional({ example: "2026-04-28T12:00:01.000Z" })
  completedAt?: string;

  @ApiPropertyOptional({ example: "2026-04-29T12:00:00.000Z" })
  expiresAt?: string;
}
