import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class WithdrawConsentDto {
  @ApiProperty({ example: "Patient requested consent withdrawal." })
  @IsString()
  @MinLength(5)
  reason!: string;
}
