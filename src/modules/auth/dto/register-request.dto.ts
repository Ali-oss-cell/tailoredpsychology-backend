import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterRequestDto {
  @ApiProperty({ example: "sarah.chen@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Patient123!" })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: "Sarah Chen" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;
}
