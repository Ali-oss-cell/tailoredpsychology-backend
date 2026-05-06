import { ApiProperty } from "@nestjs/swagger";

export class OpsInsightsDto {
  @ApiProperty({ example: 14 })
  queueTotal!: number;

  @ApiProperty({ example: 2 })
  urgentRiskCount!: number;

  @ApiProperty({ example: 5 })
  staleQueueCount!: number;

  @ApiProperty({ example: 24 })
  bookingRequestedCount!: number;

  @ApiProperty({ example: 17 })
  bookingConfirmedCount!: number;

  @ApiProperty({ example: 3 })
  sessionNoShowCount!: number;
}
