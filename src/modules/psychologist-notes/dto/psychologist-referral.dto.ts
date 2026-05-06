import { ApiProperty } from "@nestjs/swagger";

export class PsychologistReferralDto {
  @ApiProperty({ example: "ref_000001" })
  documentId!: string;

  @ApiProperty({ example: "user_patient_001" })
  patientId!: string;

  @ApiProperty({ example: "approved" })
  status!: string;

  @ApiProperty({ example: "gp_mhtp" })
  sourceType!: string;

  @ApiProperty({ example: "2026-05-10T10:00:00.000Z" })
  uploadedAt!: string;

  @ApiProperty({ example: "2026-05-24T10:00:00.000Z" })
  dueAt!: string;
}
