import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength, ValidateNested } from "class-validator";

import { PatientContactProfilePatchDto } from "./patient-contact-profile.dto";

export class UpdateProfileDto {
  @ApiProperty({ example: "Sarah Chen" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;

  @ApiPropertyOptional({ type: PatientContactProfilePatchDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatientContactProfilePatchDto)
  patientContactProfile?: PatientContactProfilePatchDto;
}
