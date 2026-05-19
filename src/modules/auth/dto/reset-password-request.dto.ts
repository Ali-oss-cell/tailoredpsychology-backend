import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class ResetPasswordRequestDto {
  @ApiProperty({ example: "prt_base64url_token" })
  @IsString()
  @MinLength(16)
  @MaxLength(512)
  token!: string;

  @ApiProperty({ example: "NewSecurePass1!" })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}
