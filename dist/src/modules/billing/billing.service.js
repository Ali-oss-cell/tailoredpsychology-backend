"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
let BillingService = class BillingService {
    invoices = [
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
    listInvoicesForUser(user) {
        if (user.role !== "patient") {
            throw new common_1.ForbiddenException("Only patients can access billing invoices");
        }
        return this.invoices
            .filter((row) => row.patientId === user.sub)
            .map(({ invoiceId, issuedDate, amountLabel, status }) => ({ invoiceId, issuedDate, amountLabel, status }));
    }
    getInvoiceDownload(user, invoiceId) {
        if (user.role !== "patient") {
            throw new common_1.ForbiddenException("Only patients can download invoices");
        }
        const invoice = this.invoices.find((row) => row.invoiceId === invoiceId && row.patientId === user.sub);
        if (!invoice) {
            throw new common_1.NotFoundException("Invoice not found");
        }
        const body = [
            "Clink — Invoice (development document)",
            `Invoice ID: ${invoice.invoiceId}`,
            `Issued: ${invoice.issuedDate}`,
            `Amount: ${invoice.amountLabel}`,
            `Status: ${invoice.status}`,
            "",
            "This file is a placeholder download until PDF storage is integrated.",
        ].join("\n");
        return {
            buffer: Buffer.from(body, "utf-8"),
            fileName: `${invoice.invoiceId}.txt`,
            contentType: "text/plain; charset=utf-8",
        };
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)()
], BillingService);
//# sourceMappingURL=billing.service.js.map