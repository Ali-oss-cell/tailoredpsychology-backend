import { ApiProperty } from "@nestjs/swagger";

export class PsychologistProfileDto {
  @ApiProperty({ example: "user_psychologist_001" })
  psychologistId!: string;

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

  @ApiProperty({ example: "Therapy focus: anxiety and stress management." })
  bio!: string;

  @ApiProperty({ example: "https://images.clink.test/psychologist/profile-001.jpg", required: false })
  profileImageUrl?: string;
}
