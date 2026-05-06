import { ApiProperty } from "@nestjs/swagger";

export class IntakeDraftDto {
  @ApiProperty({ example: "user_patient_001" })
  patientId!: string;

  @ApiProperty({ example: 3 })
  draftVersion!: number;

  @ApiProperty({ type: "object", additionalProperties: true })
  data!: Record<string, unknown>;

  @ApiProperty({ example: "2026-04-27T10:10:00.000Z" })
  updatedAt!: string;

  @ApiProperty({ example: false })
  committed!: boolean;
}
