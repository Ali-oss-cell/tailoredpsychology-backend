import { ApiProperty } from "@nestjs/swagger";

export class JoinAttemptDecisionDto {
  @ApiProperty({ example: "appt_open_001" })
  appointmentId!: string;

  @ApiProperty({ example: true })
  allowed!: boolean;

  @ApiProperty({ example: "warn_allow", enum: ["warn_allow"] })
  policyMode!: "warn_allow";

  @ApiProperty({ example: "attention", enum: ["ready", "attention", "unknown"] })
  readinessStatus!: "ready" | "attention" | "unknown";

  @ApiProperty({ example: "open", enum: ["locked", "open", "closed"] })
  windowStatus!: "locked" | "open" | "closed";

  @ApiProperty({ type: [String], example: ["readiness_attention"] })
  reasons!: string[];

  @ApiProperty({ example: "2026-04-27T11:00:00.000Z" })
  recordedAt!: string;
}
