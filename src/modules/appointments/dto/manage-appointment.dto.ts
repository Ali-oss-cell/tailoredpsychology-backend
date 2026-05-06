import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsISO8601, IsOptional } from "class-validator";

export class ManageAppointmentDto {
  @ApiProperty({ enum: ["cancel", "reschedule"] })
  @IsIn(["cancel", "reschedule"])
  action!: "cancel" | "reschedule";

  @ApiProperty({
    required: false,
    description: "Required when action is reschedule",
    example: "2026-10-24T13:00:00.000Z",
  })
  @IsOptional()
  @IsISO8601()
  scheduledStartAt?: string;
}
