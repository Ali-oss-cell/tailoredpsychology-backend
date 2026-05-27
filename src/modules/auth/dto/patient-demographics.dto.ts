import { ApiProperty } from "@nestjs/swagger";

/** Response shape for `CurrentUserDto.patientDemographics` (patients only). */
export class PatientDemographicsDto {
  @ApiProperty({ example: "1990-03-15" })
  dateOfBirth!: string;

  @ApiProperty({ example: "neither" })
  indigenousStatus!: string;

  @ApiProperty({ example: "NSW" })
  state!: string;

  @ApiProperty({ example: "Sydney" })
  suburb!: string;
}
