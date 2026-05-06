import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateJoinAttemptDto {
  @ApiProperty({ example: "video", enum: ["video", "chat"] })
  @IsIn(["video", "chat"])
  channel!: "video" | "chat";

  @ApiPropertyOptional({ example: "Patient confirmed warning modal before joining." })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  acknowledgementNote?: string;

  @ApiPropertyOptional({ example: "Patient reported device issue; proceeding with support." })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  overrideReason?: string;
}
