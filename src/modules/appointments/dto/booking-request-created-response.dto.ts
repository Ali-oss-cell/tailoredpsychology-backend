import { ApiProperty } from "@nestjs/swagger";

export class BookingRequestCreatedResponseDto {
  @ApiProperty({ example: "br_000001" })
  bookingRequestId!: string;

  @ApiProperty({ example: "submitted" })
  state!: "submitted" | "triage_review" | "matched_pending_confirmation" | "appointment_confirmed";

  @ApiProperty({ example: "2026-05-12T08:15:00.000Z" })
  createdAt!: string;

  @ApiProperty({ example: false })
  idempotentReplay!: boolean;
}
