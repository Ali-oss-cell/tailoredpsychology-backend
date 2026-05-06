import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class AcceptConsentDto {
  @ApiProperty({ example: "2026-04" })
  @IsString()
  @MinLength(3)
  policyVersion!: string;
}
