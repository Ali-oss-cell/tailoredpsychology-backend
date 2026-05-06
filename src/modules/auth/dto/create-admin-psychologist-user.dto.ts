import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateAdminPsychologistUserDto {
  @ApiProperty({ example: "new.psychologist@clink.test" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Dr New Psychologist" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;

  @ApiProperty({ example: "PSY-AHPRA-999" })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  registrationNumber!: string;

  @ApiProperty({ example: "PRV-999999" })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  providerNumber!: string;

  @ApiProperty({ example: ["cbt", "trauma"] })
  @IsArray()
  @IsString({ each: true })
  specialties!: string[];

  @ApiProperty({ example: "active", enum: ["active", "inactive"], required: false })
  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: "active" | "inactive";
}
