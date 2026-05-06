import { ApiProperty } from "@nestjs/swagger";

export class SessionSummaryDto {
  @ApiProperty({ example: "appt_open_001" })
  sessionId!: string;

  @ApiProperty({ example: "2026-05-01T10:00:00.000Z" })
  scheduledStartAt!: string;

  @ApiProperty({ example: "2026-05-01T10:50:00.000Z" })
  scheduledEndAt!: string;

  @ApiProperty({ example: "scheduled", enum: ["scheduled", "in_progress", "completed", "cancelled", "no_show"] })
  status!: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";

  @ApiProperty({ example: "clinician_001" })
  clinicianId!: string;

  @ApiProperty({ example: "user_patient_001" })
  patientId!: string;
}
