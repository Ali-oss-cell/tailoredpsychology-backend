import { ApiProperty } from "@nestjs/swagger";

export class PsychologistPreSessionItemDto {
  @ApiProperty({ example: "appt_br_000001" })
  appointmentId!: string;

  @ApiProperty({ example: "user_patient_001" })
  patientId!: string;

  @ApiProperty({ example: "2026-04-27T11:00:00.000Z" })
  startsAt!: string;

  @ApiProperty({ example: "none" })
  risk!: "none" | "urgent_support_needed";

  @ApiProperty({ example: "linked_referral" })
  referralStatus!: "missing_referral" | "linked_referral";

  @ApiProperty({ example: "committed" })
  intakeState!: "missing" | "draft_in_progress" | "committed";

  @ApiProperty({ example: "attention" })
  readinessStatus!: "ready" | "attention" | "unknown";

  @ApiProperty({ example: "2026-04-27T11:00:00.000Z", required: false })
  readinessUpdatedAt?: string;

  @ApiProperty({ type: [String], example: ["review_intake", "check_referral"] })
  actions!: string[];
}

export class PsychologistPreSessionWorkspaceDto {
  @ApiProperty({ example: "clinician_001" })
  psychologistId!: string;

  @ApiProperty({ type: [PsychologistPreSessionItemDto] })
  items!: PsychologistPreSessionItemDto[];
}
