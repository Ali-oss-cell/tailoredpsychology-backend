import { ApiProperty } from "@nestjs/swagger";

export class SessionVideoAccessDto {
  @ApiProperty({ example: "video_appt_open_001" })
  videoId!: string;

  @ApiProperty({ example: true })
  canDownload!: boolean;

  @ApiProperty({ required: false, example: "Downloads are restricted to owner patient or assigned psychologist." })
  denialReason?: string;

  @ApiProperty({ required: false, example: "svat_abc123def456" })
  accessToken?: string;

  @ApiProperty({ required: false, example: "2026-04-30T10:00:00.000Z" })
  expiresAt?: string;

  @ApiProperty({ required: false, example: "CLINK CONFIDENTIAL · USER_PATIENT_001 · 2026-04-30" })
  watermarkText?: string;

  @ApiProperty({ required: false, example: "https://api.example.com/api/session-videos/access/svat_abc123def456/download" })
  downloadUrl?: string;
}
