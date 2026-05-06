import { ApiProperty } from "@nestjs/swagger";

export class ChatWindowDto {
  @ApiProperty({ example: "appt_open_001" })
  appointmentId!: string;

  @ApiProperty({ enum: ["locked", "open", "closed"], example: "open" })
  status!: "locked" | "open" | "closed";

  @ApiProperty({ example: "2026-05-12T08:30:00.000Z" })
  opensAt!: string;

  @ApiProperty({ example: "2026-05-12T09:50:00.000Z" })
  closesAt!: string;

  @ApiProperty({ example: "Chat is open for pre-session coordination." })
  reason!: string;

  @ApiProperty({ example: 2 })
  messageCount!: number;
}
