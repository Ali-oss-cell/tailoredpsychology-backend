import { Controller, Get, Header, Param, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { BillingService } from "./billing.service";
import { InvoiceSummaryDto } from "./dto/invoice-summary.dto";

@ApiTags("billing")
@Controller("billing")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("invoices")
  @ApiOperation({ summary: "List invoices for the authenticated patient" })
  @ApiOkResponse({ type: [InvoiceSummaryDto] })
  listInvoices(@CurrentUser() user: AuthJwtPayload): Promise<InvoiceSummaryDto[]> {
    return this.billingService.listInvoicesForUser(user);
  }

  @Get("invoices/:invoiceId/download")
  @ApiOperation({ summary: "Download invoice as PDF" })
  @ApiProduces("application/pdf")
  @Header("Cache-Control", "no-store")
  async downloadInvoice(
    @CurrentUser() user: AuthJwtPayload,
    @Param("invoiceId") invoiceId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, fileName, contentType } = await this.billingService.getInvoiceDownload(user, invoiceId);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(buffer);
  }
}
