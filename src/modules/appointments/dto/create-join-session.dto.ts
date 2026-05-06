import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateJoinSessionDto {
  @ApiProperty({ example: "video", enum: ["video", "chat"] })
  @IsIn(["video", "chat"])
  channel!: "video" | "chat";

  @ApiPropertyOptional({ example: "Clinician proceeding despite warning after verbal confirmation." })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  overrideReason?: string;
}
