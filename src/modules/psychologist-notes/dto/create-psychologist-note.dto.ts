import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsObject, IsOptional, IsString, MinLength } from "class-validator";

export class CreatePsychologistNoteDto {
  @ApiProperty({ example: "user_patient_001" })
  @IsString()
  patientId!: string;

  @ApiProperty({ example: "appt_open_001" })
  @IsString()
  sessionId!: string;

  @ApiProperty({ example: "draft", enum: ["draft", "ready_for_signoff"] })
  @IsIn(["draft", "ready_for_signoff"])
  status!: "draft" | "ready_for_signoff";

  @ApiProperty({ example: "Client reported improved sleep quality." })
  @IsString()
  @MinLength(3)
  body!: string;

  @ApiPropertyOptional({ type: () => Object })
  @IsOptional()
  @IsObject()
  clinicalDataset?: Record<string, unknown>;
}
