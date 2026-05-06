import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsObject, IsOptional, IsString, MinLength } from "class-validator";

export class UpdatePsychologistNoteDto {
  @ApiProperty({ required: false, example: "ready_for_signoff", enum: ["draft", "ready_for_signoff"] })
  @IsOptional()
  @IsIn(["draft", "ready_for_signoff"])
  status?: "draft" | "ready_for_signoff";

  @ApiProperty({ required: false, example: "Updated note body." })
  @IsOptional()
  @IsString()
  @MinLength(3)
  body?: string;

  @ApiPropertyOptional({ type: () => Object })
  @IsOptional()
  @IsObject()
  clinicalDataset?: Record<string, unknown>;
}
