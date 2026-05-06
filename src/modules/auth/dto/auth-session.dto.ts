import { ApiProperty } from "@nestjs/swagger";

import { CurrentUserDto } from "./current-user.dto";

export class AuthSessionDto {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  accessToken!: string;

  @ApiProperty({ example: "Bearer" })
  tokenType!: "Bearer";

  @ApiProperty({ example: 3600 })
  expiresInSeconds!: number;

  @ApiProperty({ type: CurrentUserDto })
  user!: CurrentUserDto;
}
