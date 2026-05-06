import { ApiProperty } from "@nestjs/swagger";

export class BreakGlassAccessStatusDto {
  @ApiProperty({ example: "user_patient_001" })
  patientId!: string;

  @ApiProperty({ example: true })
  active!: boolean;

  @ApiProperty({ nullable: true, example: "user_admin_001" })
  grantedByUserId!: string | null;

  @ApiProperty({ nullable: true, example: "Urgent clinical safety review requested by on-call lead." })
  justification!: string | null;

  @ApiProperty({ nullable: true, example: "2026-04-30T09:00:00.000Z" })
  grantedAt!: string | null;

  @ApiProperty({ nullable: true, example: "2026-04-30T09:30:00.000Z" })
  expiresAt!: string | null;
}
