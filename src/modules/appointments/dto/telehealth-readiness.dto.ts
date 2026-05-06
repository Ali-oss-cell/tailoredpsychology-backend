import { ApiProperty } from "@nestjs/swagger";

class TelehealthReadinessCheckDto {
  @ApiProperty({ example: "camera" })
  key!: "camera" | "microphone" | "network" | "session_window";

  @ApiProperty({ example: "review", enum: ["pass", "review"] })
  status!: "pass" | "review";

  @ApiProperty({ example: "Camera permission will be requested when joining session." })
  message!: string;
}

export class TelehealthReadinessDto {
  @ApiProperty({ example: "appt_open_001" })
  appointmentId!: string;

  @ApiProperty({ example: "attention", enum: ["ready", "attention"] })
  overallStatus!: "ready" | "attention";

  @ApiProperty({ type: [TelehealthReadinessCheckDto] })
  checks!: TelehealthReadinessCheckDto[];

  @ApiProperty({ example: "Complete checks before joining your telehealth session." })
  guidance!: string;

  @ApiProperty({ example: "2026-04-27T11:00:00.000Z" })
  updatedAt!: string;
}
