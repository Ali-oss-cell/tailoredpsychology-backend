import { ApiProperty } from "@nestjs/swagger";

export class PatientDataRequestDto {
  @ApiProperty({ example: "pdr_001" })
  requestId!: string;

  @ApiProperty({ example: "user_patient_001" })
  patientId!: string;

  @ApiProperty({ example: "access", enum: ["access", "correction"] })
  requestType!: "access" | "correction";

  @ApiProperty({ example: "submitted", enum: ["submitted", "triage_review", "in_progress", "fulfilled", "rejected", "cancelled"] })
  status!: "submitted" | "triage_review" | "in_progress" | "fulfilled" | "rejected" | "cancelled";

  @ApiProperty({ example: "Please provide a copy of all records for this calendar year." })
  details!: string;

  @ApiProperty({ required: false, example: "Correct DOB to 1991-03-20." })
  requestedCorrection?: string;

  @ApiProperty({ required: false, example: "user_admin_001" })
  triageOwnerUserId?: string;

  @ApiProperty({ required: false, example: "Request fulfilled in secure export job exp_123." })
  resolutionNotes?: string;

  @ApiProperty({ example: "2026-05-02T12:00:00.000Z" })
  slaDueAt!: string;

  @ApiProperty({ required: false, example: "2026-04-30T12:00:00.000Z" })
  triagedAt?: string;

  @ApiProperty({ required: false, example: "2026-05-01T11:00:00.000Z" })
  resolvedAt?: string;

  @ApiProperty({ example: "2026-04-30T10:00:00.000Z" })
  createdAt!: string;

  @ApiProperty({ example: "2026-04-30T10:30:00.000Z" })
  updatedAt!: string;
}
