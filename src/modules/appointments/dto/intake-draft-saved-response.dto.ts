import { ApiProperty } from "@nestjs/swagger";

export class IntakeDraftSavedResponseDto {
  @ApiProperty({ example: "user_patient_001" })
  patientId!: string;

  @ApiProperty({ example: 4 })
  draftVersion!: number;

  @ApiProperty({ example: "2026-04-27T10:20:00.000Z" })
  updatedAt!: string;

  @ApiProperty({ example: true })
  saved!: boolean;
}
