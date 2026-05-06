import { ApiProperty } from "@nestjs/swagger";

export class TelehealthSessionWindowDto {
  @ApiProperty({ example: "appt_000001" })
  appointmentId!: string;

  @ApiProperty({ enum: ["locked", "open", "closed"], example: "locked" })
  status!: "locked" | "open" | "closed";

  @ApiProperty({ example: "2026-05-12T08:30:00.000Z" })
  opensAt!: string;

  @ApiProperty({ example: "2026-05-12T09:50:00.000Z" })
  closesAt!: string;

  @ApiProperty({ example: "2026-05-12T08:10:00.000Z" })
  now!: string;

  @ApiProperty({ example: "Chat opens 30 minutes before session start." })
  reason!: string;
}
