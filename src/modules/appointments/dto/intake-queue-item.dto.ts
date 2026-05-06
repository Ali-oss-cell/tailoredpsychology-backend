import { ApiProperty } from "@nestjs/swagger";

export class IntakeQueueItemDto {
  @ApiProperty({ example: "booking_request:br_000001" })
  queueItemId!: string;

  @ApiProperty({ example: "booking_request" })
  sourceType!: "booking_request" | "intake_draft";

  @ApiProperty({ example: "br_000001" })
  sourceId!: string;

  @ApiProperty({ example: "user_patient_001" })
  patientId!: string;

  @ApiProperty({ example: "submitted" })
  state!: string;

  @ApiProperty({ example: "urgent_support_needed" })
  risk!: "none" | "urgent_support_needed";

  @ApiProperty({ example: "missing_referral" })
  referralStatus!: "missing_referral" | "linked_referral";

  @ApiProperty({ example: true })
  medicareUncertain!: boolean;

  @ApiProperty({ example: "clinician_001", required: false })
  assignedClinicianId?: string;

  @ApiProperty({ example: "2026-04-27T11:00:00.000Z" })
  updatedAt!: string;
}
