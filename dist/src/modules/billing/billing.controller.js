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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const billing_service_1 = require("./billing.service");
const invoice_summary_dto_1 = require("./dto/invoice-summary.dto");
let BillingController = class BillingController {
    billingService;
    constructor(billingService) {
        this.billingService = billingService;
    }
    listInvoices(user) {
        return this.billingService.listInvoicesForUser(user);
    }
    downloadInvoice(user, invoiceId, res) {
        const { buffer, fileName, contentType } = this.billingService.getInvoiceDownload(user, invoiceId);
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.send(buffer);
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Get)("invoices"),
    (0, swagger_1.ApiOperation)({ summary: "List invoices for the authenticated patient" }),
    (0, swagger_1.ApiOkResponse)({ type: [invoice_summary_dto_1.InvoiceSummaryDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Array)
], BillingController.prototype, "listInvoices", null);
__decorate([
    (0, common_1.Get)("invoices/:invoiceId/download"),
    (0, swagger_1.ApiOperation)({ summary: "Download invoice document (placeholder text file in current build)" }),
    (0, swagger_1.ApiProduces)("text/plain"),
    (0, common_1.Header)("Cache-Control", "no-store"),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("invoiceId")),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "downloadInvoice", null);
exports.BillingController = BillingController = __decorate([
    (0, swagger_1.ApiTags)("billing"),
    (0, common_1.Controller)("billing"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map