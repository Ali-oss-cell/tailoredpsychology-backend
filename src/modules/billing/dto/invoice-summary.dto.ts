import { ApiProperty } from "@nestjs/swagger";

export class InvoiceSummaryDto {
  @ApiProperty({ example: "INV-1042" })
  invoiceId!: string;

  @ApiProperty({ example: "2026-10-24" })
  issuedDate!: string;

  @ApiProperty({ example: "$220.00" })
  amountLabel!: string;

  @ApiProperty({ example: "Paid" })
  status!: string;
}
