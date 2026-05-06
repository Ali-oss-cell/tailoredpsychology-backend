import { ApiProperty } from "@nestjs/swagger";

export class ReadinessReminderDispatchDto {
  @ApiProperty({ example: 12 })
  scannedAppointments!: number;

  @ApiProperty({ example: 4 })
  dispatchedCount!: number;

  @ApiProperty({ example: 1 })
  escalatedCount!: number;
}
