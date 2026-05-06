import { ApiProperty } from "@nestjs/swagger";

export class CreateDataExportResponseDto {
  @ApiProperty({ example: "exp_000001" })
  jobId!: string;

  @ApiProperty({ example: "queued", enum: ["queued", "processing", "ready", "failed"] })
  status!: "queued" | "processing" | "ready" | "failed";
}
