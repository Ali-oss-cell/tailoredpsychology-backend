import { ApiProperty } from "@nestjs/swagger";

export type SessionVideoPolicyStatus = "active" | "hold" | "purge_pending";

export class SessionVideoItemDto {
  @ApiProperty({ example: "video_appt_open_001" })
  videoId!: string;

  @ApiProperty({ example: "appt_open_001" })
  sessionId!: string;

  @ApiProperty({ example: "user_patient_001" })
  patientId!: string;

  @ApiProperty({ example: "clinician_001" })
  clinicianId!: string;

  @ApiProperty({ example: "2026-04-28T10:00:00.000Z" })
  sessionDate!: string;

  @ApiProperty({ example: "active", enum: ["active", "hold", "purge_pending"] })
  policyStatus!: SessionVideoPolicyStatus;

  @ApiProperty({ example: true })
  canDownload!: boolean;

  @ApiProperty({ required: false, example: "Downloads blocked while legal hold is active" })
  policyReason?: string;

  @ApiProperty({ example: true })
  watermarkRequired!: boolean;

  @ApiProperty({ example: "CLINK CONFIDENTIAL · USER_PSYCHOLOGIST_001 · 2026-04-30" })
  watermarkText!: string;

  @ApiProperty({ example: true })
  transcriptReady!: boolean;
}
