import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { USER_ROLES, type UserRole } from "../../users/types/user-role.type";

import { PatientContactProfileDto } from "./patient-contact-profile.dto";
import { PatientDemographicsDto } from "./patient-demographics.dto";
import { ConsentStatusDto } from "./consent-status.dto";

export class CurrentUserDto {
  @ApiProperty({ example: "user_patient_001" })
  id!: string;

  @ApiProperty({ example: "patient@clink.test" })
  email!: string;

  @ApiProperty({ example: "Patient Demo" })
  displayName!: string;

  @ApiProperty({
    description: "ISO timestamp when the user record was last updated.",
    example: "2026-07-10T08:00:00.000Z",
  })
  updatedAt!: string;

  @ApiProperty({ enum: USER_ROLES, example: "patient" })
  role!: UserRole;

  @ApiProperty({
    description:
      "For patients: true when display name and required intake fields (identity + consents) are present in the latest intake draft. Always true for non-patient roles. POST /auth/onboarding-complete is a no-op compatibility endpoint.",
    example: true,
  })
  accountSetupComplete!: boolean;

  @ApiPropertyOptional({
    type: PatientContactProfileDto,
    description: "Present for `patient` role: saved account contact, accessibility, and emergency details.",
  })
  patientContactProfile?: PatientContactProfileDto;

  @ApiPropertyOptional({
    type: PatientDemographicsDto,
    description: "Present for `patient` role: durable DOB, indigenous status, and location from committed intake.",
  })
  patientDemographics?: PatientDemographicsDto;

  @ApiPropertyOptional({
    type: ConsentStatusDto,
    description: "Present for `patient` role: current consent lifecycle status and re-consent requirement.",
  })
  consentStatus?: ConsentStatusDto;
}
