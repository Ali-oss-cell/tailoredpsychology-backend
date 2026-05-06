import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreatePatientDataRequestDto {
  @ApiProperty({ example: "access", enum: ["access", "correction"] })
  @IsString()
  @IsIn(["access", "correction"])
  requestType!: "access" | "correction";

  @ApiProperty({ example: "Please provide a copy of all records for this calendar year." })
  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  details!: string;

  @ApiProperty({ required: false, example: "Correct DOB to 1991-03-20." })
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  requestedCorrection?: string;
}
