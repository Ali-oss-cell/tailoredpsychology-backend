import { ApiProperty } from "@nestjs/swagger";

import { AvailabilitySlotDto } from "./availability-slot.dto";

export class ClinicianAvailabilityResponseDto {
  @ApiProperty({ example: "clinician_001" })
  clinicianId!: string;

  @ApiProperty({ example: "Avery Mitchell" })
  clinicianName!: string;

  @ApiProperty({ type: [AvailabilitySlotDto] })
  slots!: AvailabilitySlotDto[];

  @ApiProperty({ required: false, example: ["anxiety", "stress"], type: [String], description: "From psychologist_profiles when DB is enabled" })
  specialties?: string[];

  @ApiProperty({ required: false, example: "Therapy focus: anxiety and CBT." })
  bio?: string;

  @ApiProperty({ required: false, example: "https://cdn.example.com/psy.jpg" })
  profileImageUrl?: string;
}
