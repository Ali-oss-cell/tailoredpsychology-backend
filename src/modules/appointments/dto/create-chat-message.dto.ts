import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class CreateChatMessageDto {
  @ApiProperty({ example: "Hi, I am ready for the session." })
  @IsString()
  @MaxLength(2000)
  message!: string;
}
