import { ApiProperty } from "@nestjs/swagger";

export class PatientRetentionStatusDto {
  @ApiProperty({ example: "user_patient_001" })
  patientId!: string;

  @ApiProperty({ nullable: true, example: "2026-04-28T13:00:00.000Z" })
  deletedAt!: string | null;

  @ApiProperty({ nullable: true, example: "patient requested account deletion" })
  deletionReason!: string | null;

  @ApiProperty({ nullable: true, example: "user_admin_001" })
  deletedByUserId!: string | null;

  @ApiProperty({ example: false })
  legalHoldActive!: boolean;

  @ApiProperty({ nullable: true, example: "complaint under investigation" })
  legalHoldReason!: string | null;

  @ApiProperty({ nullable: true, example: "user_admin_001" })
  legalHoldSetByUserId!: string | null;

  @ApiProperty({ nullable: true, example: "2026-04-28T13:05:00.000Z" })
  legalHoldSetAt!: string | null;

  @ApiProperty({ nullable: true, example: "2033-04-27T13:00:00.000Z" })
  retentionUntil!: string | null;

  @ApiProperty({ nullable: true, example: "2026-04-28T12:00:00.000Z" })
  lastInteractionAt!: string | null;

  @ApiProperty({ nullable: true, example: null })
  purgedAt!: string | null;

  @ApiProperty({ example: false })
  purgeEligible!: boolean;
}
