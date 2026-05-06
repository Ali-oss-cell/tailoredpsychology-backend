import { ApiProperty } from "@nestjs/swagger";

export class JoinSessionTokenDto {
  @ApiProperty({ example: "appt_open_001" })
  appointmentId!: string;

  @ApiProperty({ example: "clink_appt_open_001" })
  roomName!: string;

  @ApiProperty({ example: "user_patient_001" })
  participantIdentity!: string;

  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: "2026-04-27T11:00:00.000Z" })
  expiresAt!: string;

  @ApiProperty({ example: "warn_allow", enum: ["warn_allow"] })
  policyMode!: "warn_allow";

  @ApiProperty({ type: [String], example: ["readiness_attention"] })
  warnings!: string[];
}
