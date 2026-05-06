import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ReferralQueueItemDto {
  @ApiProperty({ example: "ref_000001" })
  documentId!: string;

  @ApiProperty({ example: "user_patient_001" })
  patientId!: string;

  @ApiProperty({ example: "received", enum: ["received", "review_needed", "approved", "rejected", "info_requested"] })
  status!: "received" | "review_needed" | "approved" | "rejected" | "info_requested";

  @ApiProperty({ example: "referral.pdf" })
  fileName!: string;

  @ApiProperty({ example: 125830 })
  fileSize!: number;

  @ApiProperty({ example: "application/pdf" })
  mimeType!: string;

  @ApiPropertyOptional({ example: "gp_mhtp" })
  sourceType?: string;

  @ApiPropertyOptional({ example: "2026-04-26" })
  referralDate?: string;

  @ApiPropertyOptional({ example: "Patient supplied referral before first consult." })
  notes?: string;

  @ApiProperty({ example: "2026-04-26T15:40:10.000Z" })
  uploadedAt!: string;

  @ApiProperty({ example: "2026-05-10T15:40:10.000Z" })
  dueAt!: string;

  @ApiProperty({ example: false })
  overdue!: boolean;

  @ApiPropertyOptional({ example: "user_admin_001" })
  assignedOwnerUserId?: string;

  @ApiPropertyOptional({ example: "admin_001" })
  reviewedBy?: string;

  @ApiPropertyOptional({ example: "2026-04-27T10:00:00.000Z" })
  reviewedAt?: string;

  @ApiPropertyOptional({ example: "Referral date valid and notes complete." })
  reviewReason?: string;

  @ApiPropertyOptional({ example: "Approved for onboarding queue." })
  reviewNotes?: string;
}
