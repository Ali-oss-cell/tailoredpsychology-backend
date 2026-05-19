import { ApiProperty } from "@nestjs/swagger";

export class PatientJourneyTimelineStepDto {
  @ApiProperty({ example: "intake_started" })
  key!:
    | "intake_started"
    | "intake_submitted"
    | "booking_requested"
    | "booking_confirmed"
    | "session_started"
    | "session_completed"
    | "session_no_show"
    | "invoice_downloaded";

  @ApiProperty({ example: "done" })
  status!: "pending" | "done";

  @ApiProperty({ example: "2026-04-27T11:00:00.000Z", required: false })
  occurredAt?: string;

  @ApiProperty({ example: "Intake started" })
  label!: string;
}

export class PatientJourneyTimelineDto {
  @ApiProperty({ example: "user_patient_001" })
  patientId!: string;

  @ApiProperty({ type: [PatientJourneyTimelineStepDto] })
  steps!: PatientJourneyTimelineStepDto[];
}
