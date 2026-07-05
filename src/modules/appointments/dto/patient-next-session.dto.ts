import { ApiProperty } from "@nestjs/swagger";

import { PatientAppointmentSummaryDto } from "./patient-appointment-summary.dto";

export class SessionWindowSnapshotDto {
  @ApiProperty({ enum: ["locked", "open", "closed"] })
  status!: "locked" | "open" | "closed";

  @ApiProperty({ description: "ISO timestamp when the join/chat window opens" })
  opensAt!: string;

  @ApiProperty({ description: "ISO timestamp when the join/chat window closes" })
  closesAt!: string;
}

/**
 * Next upcoming session for the patient dashboard, including a
 * side-effect-free join window snapshot (unlike `getSessionWindow`,
 * reading this never records analytics events).
 */
export class PatientNextSessionDto extends PatientAppointmentSummaryDto {
  @ApiProperty({ type: SessionWindowSnapshotDto })
  window!: SessionWindowSnapshotDto;
}
