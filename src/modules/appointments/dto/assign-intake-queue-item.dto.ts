import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class AssignIntakeQueueItemDto {
  @ApiProperty({ example: "clinician_002" })
  @IsString()
  @MaxLength(80)
  assignedClinicianId!: string;
}
