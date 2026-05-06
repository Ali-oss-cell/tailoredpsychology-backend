import { ApiProperty } from "@nestjs/swagger";

export class AppointmentDetailsDto {
  @ApiProperty()
  appointmentId!: string;

  @ApiProperty()
  patientId!: string;

  @ApiProperty()
  clinicianId!: string;

  @ApiProperty()
  scheduledStartAt!: string;

  @ApiProperty()
  scheduledEndAt!: string;

  @ApiProperty({ enum: ["scheduled", "in_progress", "completed", "cancelled", "no_show"] })
  status!: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";

  @ApiProperty({ enum: ["locked", "open", "closed"] })
  chatWindowStatus!: "locked" | "open" | "closed";

  @ApiProperty()
  canJoinNow!: boolean;

  @ApiProperty()
  canManage!: boolean;
}
