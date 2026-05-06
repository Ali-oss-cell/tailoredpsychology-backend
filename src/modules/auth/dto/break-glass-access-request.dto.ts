import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class BreakGlassAccessRequestDto {
  @ApiProperty({ example: "Urgent clinical safety review requested by on-call lead." })
  @IsString()
  @MinLength(10)
  justification!: string;
}
