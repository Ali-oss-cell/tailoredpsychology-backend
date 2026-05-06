import { ApiProperty } from "@nestjs/swagger";

export class PsychologistPatientContextDto {
  @ApiProperty({ example: "user_psychologist_001" })
  psychologistId!: string;

  @ApiProperty({ example: "user_patient_001" })
  patientId!: string;

  @ApiProperty({ example: "Patient Demo" })
  patientDisplayName!: string;

  @ApiProperty({ example: "high", enum: ["low", "medium", "high"] })
  riskLevel!: "low" | "medium" | "high";

  @ApiProperty({ example: "linked_referral", enum: ["missing_referral", "linked_referral"] })
  referralStatus!: "missing_referral" | "linked_referral";

  @ApiProperty({ example: "attention", enum: ["ready", "attention", "unknown"] })
  readinessStatus!: "ready" | "attention" | "unknown";

  @ApiProperty({ example: ["session_trend_stable", "follow_up_recommended"] })
  careSignals!: string[];
}
