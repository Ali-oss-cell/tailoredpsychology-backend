import { ApiProperty } from "@nestjs/swagger";

class TelehealthTrendMetricsDto {
  @ApiProperty({ example: 22 })
  totalJoinAttempts!: number;

  @ApiProperty({ example: 8 })
  warnedJoinCount!: number;

  @ApiProperty({ example: 36 })
  warnedJoinRate!: number;

  @ApiProperty({ example: 2 })
  failedJoinCount!: number;

  @ApiProperty({ example: 4 })
  lateJoinCount!: number;

  @ApiProperty({ example: 63 })
  recoveryRate!: number;
}

class TelehealthClinicianBreakdownDto {
  @ApiProperty({ example: "clinician_001" })
  clinicianId!: string;

  @ApiProperty({ example: 15 })
  totalJoinAttempts!: number;

  @ApiProperty({ example: 6 })
  warnedJoinCount!: number;

  @ApiProperty({ example: 40 })
  warnedJoinRate!: number;

  @ApiProperty({ example: 3 })
  failedJoinCount!: number;

  @ApiProperty({ example: 53 })
  recoveryRate!: number;
}

export class TelehealthInsightsDto {
  @ApiProperty({ example: 120 })
  totalJoinAttempts!: number;

  @ApiProperty({ example: 42 })
  warnedJoinCount!: number;

  @ApiProperty({ example: 35 })
  warnedJoinRate!: number;

  @ApiProperty({ example: 9 })
  failedJoinCount!: number;

  @ApiProperty({ example: 18 })
  lateJoinCount!: number;

  @ApiProperty({ example: 71 })
  recoveryRate!: number;

  @ApiProperty({ type: TelehealthTrendMetricsDto })
  last24h!: TelehealthTrendMetricsDto;

  @ApiProperty({ type: TelehealthTrendMetricsDto })
  last7d!: TelehealthTrendMetricsDto;

  @ApiProperty({ type: [TelehealthClinicianBreakdownDto] })
  clinicianBreakdown!: TelehealthClinicianBreakdownDto[];
}
