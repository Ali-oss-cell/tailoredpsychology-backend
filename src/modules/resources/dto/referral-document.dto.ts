import { ApiProperty } from "@nestjs/swagger";

export class ReferralDocumentDto {
  @ApiProperty({ example: "ref_000001" })
  documentId!: string;

  @ApiProperty({ example: "received", enum: ["received", "review_needed", "approved", "rejected", "info_requested"] })
  status!: "received" | "review_needed" | "approved" | "rejected" | "info_requested";

  @ApiProperty({ example: "referral.pdf" })
  fileName!: string;

  @ApiProperty({ example: 125830 })
  fileSize!: number;

  @ApiProperty({ example: "application/pdf" })
  mimeType!: string;

  @ApiProperty({ example: "2026-04-26T15:40:10.000Z" })
  uploadedAt!: string;
}
