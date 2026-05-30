import { ApiProperty } from "@nestjs/swagger";

export class BookingRequestStatusDto {
  @ApiProperty({ example: "br_000001" })
  bookingRequestId!: string;

  @ApiProperty({ example: "submitted" })
  state!: "pending_payment" | "submitted" | "triage_review" | "matched_pending_confirmation" | "appointment_confirmed" | "payment_abandoned";

  @ApiProperty({ example: "2026-05-12T08:15:00.000Z" })
  lastUpdated!: string;

  @ApiProperty({ example: "Your request is in triage queue." })
  nextAction!: string;

  @ApiProperty({ example: "clinician_001" })
  clinicianId!: string;

  @ApiProperty({ example: "clinician_001_2026-05-12_0900" })
  slotId!: string;

  @ApiProperty({ example: "2026-05-12" })
  appointmentDate!: string;

  @ApiProperty({ required: false, example: "ref_000001" })
  referralDocumentId?: string;
}
