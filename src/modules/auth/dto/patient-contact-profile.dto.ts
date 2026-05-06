import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

import { PREFERRED_CONTACT_METHODS } from "../../users/types/patient-contact-profile.type";

/** Response shape for `CurrentUserDto.patientContactProfile` (patients only). */
export class PatientContactProfileDto {
  @ApiProperty({ example: "+61 400 000 000" })
  phoneMobile!: string;

  @ApiProperty({ enum: PREFERRED_CONTACT_METHODS, example: "email" })
  preferredContactMethod!: (typeof PREFERRED_CONTACT_METHODS)[number];

  @ApiProperty({ example: "Please use live captions in sessions." })
  accessibilityNotes!: string;

  @ApiProperty({ example: "Jamie Chen" })
  emergencyContactName!: string;

  @ApiProperty({ example: "+61 400 000 001" })
  emergencyContactPhone!: string;

  @ApiProperty({ example: "Partner" })
  emergencyContactRelationship!: string;
}

/** PATCH body: all patient contact fields optional; only provided keys are updated. */
export class PatientContactProfilePatchDto {
  @ApiPropertyOptional({ example: "+61 400 000 000" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phoneMobile?: string;

  @ApiPropertyOptional({ enum: PREFERRED_CONTACT_METHODS })
  @IsOptional()
  @IsIn([...PREFERRED_CONTACT_METHODS])
  preferredContactMethod?: (typeof PREFERRED_CONTACT_METHODS)[number];

  @ApiPropertyOptional({ example: "Please use live captions in sessions." })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  accessibilityNotes?: string;

  @ApiPropertyOptional({ example: "Jamie Chen" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: "+61 400 000 001" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ example: "Partner" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  emergencyContactRelationship?: string;
}
