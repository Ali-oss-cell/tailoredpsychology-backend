import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class UpdatePsychologistProfileDto {
  @ApiProperty({ required: false, example: "Psychologist Demo Updated" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  displayName?: string;

  @ApiProperty({ required: false, example: "PSY-AHPRA-001" })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiProperty({ required: false, example: "PRV-100001" })
  @IsOptional()
  @IsString()
  providerNumber?: string;

  @ApiProperty({ required: false, example: ["anxiety", "stress"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiProperty({ required: false, example: "active", enum: ["active", "inactive"] })
  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: "active" | "inactive";

  @ApiProperty({ required: false, example: "Updated professional bio." })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false, example: "https://images.clink.test/psychologist/profile-001.jpg" })
  @IsOptional()
  @IsString()
  profileImageUrl?: string;
}
