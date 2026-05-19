import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, MaxLength } from "class-validator";

export class ForgotPasswordRequestDto {
  @ApiProperty({ example: "patient@example.com" })
  @IsEmail()
  @MaxLength(320)
  email!: string;
}
