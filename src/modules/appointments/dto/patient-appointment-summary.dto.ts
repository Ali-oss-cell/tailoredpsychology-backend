import { ApiProperty } from "@nestjs/swagger";

export class PatientAppointmentSummaryDto {
  @ApiProperty()
  appointmentId!: string;

  @ApiProperty({ example: "clinician_001" })
  clinicianId!: string;

  @ApiProperty()
  clinicianName!: string;

  @ApiProperty({ example: "Clinical psychology consultation" })
  sessionTypeLabel!: string;

  @ApiProperty()
  scheduledStartAt!: string;

  @ApiProperty()
  scheduledEndAt!: string;

  @ApiProperty({ enum: ["scheduled", "in_progress", "completed", "cancelled", "no_show"] })
  status!: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";

  @ApiProperty({ example: "Scheduled" })
  statusLabel!: string;
}

export class PatientAppointmentsListResponseDto {
  @ApiProperty({ type: [PatientAppointmentSummaryDto] })
  upcoming!: PatientAppointmentSummaryDto[];

  @ApiProperty({ type: [PatientAppointmentSummaryDto] })
  past!: PatientAppointmentSummaryDto[];
}
