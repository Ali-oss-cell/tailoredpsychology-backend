import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsIn, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateAdminPsychologistUserDto {
  @ApiProperty({ example: "Dr Updated Psychologist" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;

  @ApiProperty({ example: "PSY-AHPRA-222" })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  registrationNumber!: string;

  @ApiProperty({ example: "PRV-222222" })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  providerNumber!: string;

  @ApiProperty({ example: ["cbt", "couples"] })
  @IsArray()
  @IsString({ each: true })
  specialties!: string[];

  @ApiProperty({ example: "inactive", enum: ["active", "inactive"] })
  @IsIn(["active", "inactive"])
  status!: "active" | "inactive";
}
