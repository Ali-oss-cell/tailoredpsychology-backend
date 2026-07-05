import { ApiProperty } from "@nestjs/swagger";

import { PatientNextSessionDto } from "../../appointments/dto/patient-next-session.dto";
import { PatientJourneyTimelineDto } from "../../appointments/dto/patient-journey-timeline.dto";
import { InvoiceSummaryDto } from "../../billing/dto/invoice-summary.dto";

export class PatientDashboardUserDto {
  @ApiProperty({ example: "user_patient_001" })
  userId!: string;

  @ApiProperty({ example: "Sarah Chen" })
  displayName!: string;
}

export class PatientDashboardBillingDto {
  @ApiProperty({ type: InvoiceSummaryDto, nullable: true })
  latestInvoice!: InvoiceSummaryDto | null;

  @ApiProperty({ example: 0, description: "Count of invoices whose status is not paid" })
  unpaidCount!: number;

  @ApiProperty({ example: 3 })
  invoiceCount!: number;
}

/**
 * Consolidated read model for the patient dashboard: one round trip,
 * one loading state, zero cumulative layout shift on the client.
 */
export class PatientDashboardDto {
  @ApiProperty({ type: PatientDashboardUserDto })
  user!: PatientDashboardUserDto;

  @ApiProperty({ type: PatientNextSessionDto, nullable: true })
  nextSession!: PatientNextSessionDto | null;

  @ApiProperty({ type: PatientJourneyTimelineDto })
  journey!: PatientJourneyTimelineDto;

  @ApiProperty({ type: PatientDashboardBillingDto })
  billing!: PatientDashboardBillingDto;

  @ApiProperty({ description: "Server timestamp for this snapshot (ISO)" })
  generatedAt!: string;
}
