import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class PatientRetentionReasonDto {
  @ApiProperty({ example: "patient requested account deletion" })
  @IsString()
  @MinLength(3)
  @MaxLength(400)
  reason!: string;
}
