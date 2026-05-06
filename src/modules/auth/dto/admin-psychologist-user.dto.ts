import { ApiProperty } from "@nestjs/swagger";

export class AdminPsychologistUserDto {
  @ApiProperty({ example: "user_psychologist_001" })
  id!: string;

  @ApiProperty({ example: "psychologist@clink.test" })
  email!: string;

  @ApiProperty({ example: "Psychologist Demo" })
  displayName!: string;

  @ApiProperty({ example: "PSY-AHPRA-001" })
  registrationNumber!: string;

  @ApiProperty({ example: "PRV-100001" })
  providerNumber!: string;

  @ApiProperty({ example: ["anxiety", "stress"] })
  specialties!: string[];

  @ApiProperty({ example: "active", enum: ["active", "inactive"] })
  status!: "active" | "inactive";
}
