import { ApiProperty } from "@nestjs/swagger";

export class PatientCareClinicianDto {
  @ApiProperty({ example: "clinician_001" })
  clinicianId!: string;

  @ApiProperty({ example: "user_psychologist_001", description: "Auth user id for the psychologist account" })
  psychologistUserId!: string;

  @ApiProperty({ example: "Avery Mitchell" })
  displayName!: string;

  @ApiProperty({ example: "PSY-AHPRA-001", required: false })
  registrationNumber?: string;

  @ApiProperty({ example: "PRV-100001", required: false })
  providerNumber?: string;

  @ApiProperty({ example: ["anxiety", "stress"], type: [String] })
  specialties!: string[];

  @ApiProperty({ required: false, example: "CBT and trauma-informed care." })
  bio?: string;

  @ApiProperty({ required: false, example: "https://cdn.example.com/psy.jpg" })
  profileImageUrl?: string;

  @ApiProperty({ example: "active" })
  accountStatus!: "active" | "inactive" | "unknown";

  @ApiProperty({ example: "2026-05-10T10:00:00.000Z", required: false, description: "Next scheduled or in-progress session" })
  nextSessionAt?: string;

  @ApiProperty({ example: "2026-04-20T10:00:00.000Z", required: false, description: "Most recent past session in history" })
  lastSessionAt?: string;
}
