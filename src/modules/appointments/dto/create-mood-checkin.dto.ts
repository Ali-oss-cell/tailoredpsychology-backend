import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateMoodCheckinDto {
  @ApiProperty({ example: "Good" })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  moodLabel!: string;
}
