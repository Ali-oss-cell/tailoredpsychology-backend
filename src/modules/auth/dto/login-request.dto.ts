import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginRequestDto {
  @ApiProperty({ example: "patient@clink.test" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Patient123!" })
  @IsString()
  @MinLength(8)
  password!: string;
}
