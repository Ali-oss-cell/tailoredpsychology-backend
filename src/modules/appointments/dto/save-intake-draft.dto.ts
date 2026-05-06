import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsObject, IsOptional, Min } from "class-validator";

export class SaveIntakeDraftDto {
  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  baseVersion?: number;

  @ApiProperty({ type: "object", additionalProperties: true })
  @IsObject()
  delta!: Record<string, unknown>;
}
