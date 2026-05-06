import { ApiProperty } from "@nestjs/swagger";

export class IntakeAssignableClinicianDto {
  @ApiProperty({ example: "user_psychologist_001" })
  clinicianId!: string;

  @ApiProperty({ example: "Psychologist Demo" })
  displayName!: string;

  @ApiProperty({ example: ["anxiety", "stress"] })
  specialties!: string[];
}
