import { ApiProperty } from "@nestjs/swagger";

export class AvailabilitySlotDto {
  @ApiProperty({ example: "slot_2026-05-02_0900" })
  slotId!: string;

  @ApiProperty({ example: "2026-05-02" })
  date!: string;

  @ApiProperty({ example: "09:00" })
  startTime!: string;

  @ApiProperty({ example: "09:50" })
  endTime!: string;

  @ApiProperty({ example: true })
  available!: boolean;
}
