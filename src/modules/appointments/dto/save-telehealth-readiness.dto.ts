import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsIn, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class SaveTelehealthReadinessCheckDto {
  @ApiProperty({ example: "camera", enum: ["camera", "microphone", "network", "session_window"] })
  @IsIn(["camera", "microphone", "network", "session_window"])
  key!: "camera" | "microphone" | "network" | "session_window";

  @ApiProperty({ example: "pass", enum: ["pass", "review"] })
  @IsIn(["pass", "review"])
  status!: "pass" | "review";

  @ApiProperty({ example: "Camera access is available." })
  @IsString()
  message!: string;
}

export class SaveTelehealthReadinessDto {
  @ApiProperty({ example: "attention", enum: ["ready", "attention"] })
  @IsIn(["ready", "attention"])
  overallStatus!: "ready" | "attention";

  @ApiProperty({ type: [SaveTelehealthReadinessCheckDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveTelehealthReadinessCheckDto)
  checks!: SaveTelehealthReadinessCheckDto[];
}
