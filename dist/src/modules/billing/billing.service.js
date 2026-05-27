"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const minimal_pdf_util_1 = require("../../common/minimal-pdf.util");
const analytics_service_1 = require("../analytics/analytics.service");
const database_service_1 = require("../core/database.service");
const prisma_service_1 = require("../prisma/prisma.service");
let BillingService = class BillingService {
    databaseService;
    prisma;
    analyticsService;
    seedInvoices = [
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
    constructor(databaseService, prisma, analyticsService) {
        this.databaseService = databaseService;
        this.prisma = prisma;
        this.analyticsService = analyticsService;
    }
    formatAmount(cents) {
        return `$${(cents / 100).toFixed(2)}`;
    }
    formatIssuedDate(iso) {
        return new Date(iso).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
        });
    }
    async ensurePatientInvoiceSeeds(patientId) {
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
    async listFromDatabase(patientId) {
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
    listFromMemory(patientId) {
        return this.seedInvoices
            .filter((row) => row.patientId === patientId)
            .map(({ invoiceId, issuedDate, amountLabel, status }) => ({ invoiceId, issuedDate, amountLabel, status }));
    }
    async resolveInvoice(patientId, invoiceId) {
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
    async listInvoicesForUser(user) {
        if (user.role !== "patient") {
            throw new common_1.ForbiddenException("Only patients can access billing invoices");
        }
        if (this.databaseService.isEnabled()) {
            return this.listFromDatabase(user.sub);
        }
        return this.listFromMemory(user.sub);
    }
    async getInvoiceDownload(user, invoiceId) {
        if (user.role !== "patient") {
            throw new common_1.ForbiddenException("Only patients can download invoices");
        }
        const invoice = await this.resolveInvoice(user.sub, invoiceId);
        if (!invoice) {
            throw new common_1.NotFoundException("Invoice not found");
        }
        await this.analyticsService.recordEvent({
            name: "invoice_downloaded",
            actorUserId: user.sub,
            actorRole: user.role,
            targetId: user.sub,
            idempotencyKey: `invoice_downloaded:${invoiceId}:${user.sub}`,
            metadata: { invoiceId },
        });
        const lines = [
            "Tailored Psychology",
            "Tax invoice / receipt",
            "",
            `Invoice ID: ${invoice.invoiceId}`,
            `Issued: ${invoice.issuedDate}`,
            `Amount: ${invoice.amountLabel}`,
            `Status: ${invoice.status}`,
            "",
            "Generated by the patient portal. Retain for your records.",
            "Rebate eligibility is determined by Medicare and your referrer.",
        ];
        return {
            buffer: (0, minimal_pdf_util_1.buildMinimalPdf)(lines),
            fileName: `${invoice.invoiceId}.pdf`,
            contentType: "application/pdf",
        };
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        prisma_service_1.PrismaService,
        analytics_service_1.AnalyticsService])
], BillingService);
//# sourceMappingURL=billing.service.js.map