import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { buildInvoicePdf } from "../../common/invoice-pdf.util";
import { AuditService } from "../audit/audit.service";
import { AnalyticsService } from "../analytics/analytics.service";
import { DatabaseService } from "../core/database.service";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { PrismaService } from "../prisma/prisma.service";
import { InvoiceSummaryDto } from "./dto/invoice-summary.dto";

type InvoiceSeed = InvoiceSummaryDto & { patientId: string; issuedAtIso: string; amountCents: number };

@Injectable()
export class BillingService {
  private readonly seedInvoices: InvoiceSeed[] = [
    {
      invoiceId: "INV-1042",
      patientId: "user_patient_001",
      issuedDate: "Oct 24, 2026",
      issuedAtIso: "2026-10-24T00:00:00.000Z",
      amountLabel: "$220.00",
      amountCents: 22_000,
      status: "Paid",
    },
    {
      invoiceId: "INV-1031",
      patientId: "user_patient_001",
      issuedDate: "Oct 10, 2026",
      issuedAtIso: "2026-10-10T00:00:00.000Z",
      amountLabel: "$220.00",
      amountCents: 22_000,
      status: "Paid",
    },
    {
      invoiceId: "INV-1020",
      patientId: "user_patient_001",
      issuedDate: "Sep 29, 2026",
      issuedAtIso: "2026-09-29T00:00:00.000Z",
      amountLabel: "$220.00",
      amountCents: 22_000,
      status: "Pending",
    },
  ];

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
    private readonly auditService: AuditService,
  ) {}

  private formatAmount(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  private formatIssuedDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  private async ensurePatientInvoiceSeeds(patientId: string): Promise<void> {
    if (!this.databaseService.isEnabled()) {
      return;
    }
    const count = await this.prisma.patient_invoices.count({ where: { patient_id: patientId } });
    if (count > 0) {
      return;
    }
    const seeds = this.seedInvoices.filter((row) => row.patientId === patientId);
    if (seeds.length === 0) {
      return;
    }
    await this.prisma.patient_invoices.createMany({
      data: seeds.map((row) => ({
        invoice_id: row.invoiceId,
        patient_id: row.patientId,
        issued_at: new Date(row.issuedAtIso),
        amount_cents: row.amountCents,
        status: row.status,
      })),
      skipDuplicates: true,
    });
  }

  private async listFromDatabase(patientId: string): Promise<InvoiceSummaryDto[]> {
    await this.ensurePatientInvoiceSeeds(patientId);
    const rows = await this.prisma.patient_invoices.findMany({
      where: { patient_id: patientId },
      orderBy: { issued_at: "desc" },
    });
    return rows.map((row) => ({
      invoiceId: row.invoice_id,
      issuedDate: this.formatIssuedDate(row.issued_at.toISOString()),
      amountLabel: this.formatAmount(row.amount_cents),
      status: row.status,
    }));
  }

  private listFromMemory(patientId: string): InvoiceSummaryDto[] {
    return this.seedInvoices
      .filter((row) => row.patientId === patientId)
      .map(({ invoiceId, issuedDate, amountLabel, status }) => ({ invoiceId, issuedDate, amountLabel, status }));
  }

  private async resolveInvoice(
    patientId: string,
    invoiceId: string,
  ): Promise<{ invoiceId: string; issuedDate: string; amountLabel: string; status: string } | null> {
    if (this.databaseService.isEnabled()) {
      await this.ensurePatientInvoiceSeeds(patientId);
      const row = await this.prisma.patient_invoices.findFirst({
        where: { invoice_id: invoiceId, patient_id: patientId },
      });
      if (!row) {
        return null;
      }
      return {
        invoiceId: row.invoice_id,
        issuedDate: this.formatIssuedDate(row.issued_at.toISOString()),
        amountLabel: this.formatAmount(row.amount_cents),
        status: row.status,
      };
    }
    const seed = this.seedInvoices.find((row) => row.invoiceId === invoiceId && row.patientId === patientId);
    if (!seed) {
      return null;
    }
    return {
      invoiceId: seed.invoiceId,
      issuedDate: seed.issuedDate,
      amountLabel: seed.amountLabel,
      status: seed.status,
    };
  }

  async listInvoicesForUser(user: AuthJwtPayload): Promise<InvoiceSummaryDto[]> {
    if (user.role !== "patient") {
      throw new ForbiddenException("Only patients can access billing invoices");
    }
    if (this.databaseService.isEnabled()) {
      return this.listFromDatabase(user.sub);
    }
    return this.listFromMemory(user.sub);
  }

  async getInvoiceDownload(
    user: AuthJwtPayload,
    invoiceId: string,
  ): Promise<{ buffer: Buffer; fileName: string; contentType: string }> {
    if (user.role !== "patient") {
      throw new ForbiddenException("Only patients can download invoices");
    }
    const invoice = await this.resolveInvoice(user.sub, invoiceId);
    if (!invoice) {
      throw new NotFoundException("Invoice not found");
    }

    await this.analyticsService.recordEvent({
      name: "invoice_downloaded",
      actorUserId: user.sub,
      actorRole: user.role,
      targetId: user.sub,
      idempotencyKey: `invoice_downloaded:${invoiceId}:${user.sub}`,
      metadata: { invoiceId },
    });

    await this.auditService.recordEvent({
      actorUserId: user.sub,
      actorRole: user.role,
      action: "invoice_downloaded",
      targetType: "system",
      targetId: invoiceId,
      metadata: { patientId: user.sub, status: invoice.status },
    });

    return {
      buffer: buildInvoicePdf({
        invoiceId: invoice.invoiceId,
        issuedDate: invoice.issuedDate,
        amountLabel: invoice.amountLabel,
        status: invoice.status,
      }),
      fileName: `${invoice.invoiceId}.pdf`,
      contentType: "application/pdf",
    };
  }
}
