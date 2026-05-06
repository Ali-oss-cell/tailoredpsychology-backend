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
exports.ExportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const create_data_export_response_dto_1 = require("./dto/create-data-export-response.dto");
const data_export_status_dto_1 = require("./dto/data-export-status.dto");
const exports_service_1 = require("./exports.service");
let ExportsController = class ExportsController {
    exportsService;
    constructor(exportsService) {
        this.exportsService = exportsService;
    }
    createExport(user) {
        return this.exportsService.createPatientDataExport(user);
    }
    getExportStatus(user, jobId) {
        return this.exportsService.getPatientDataExportStatus(user, jobId);
    }
    async downloadExport(user, jobId, res) {
        const { buffer, fileName, contentType } = await this.exportsService.getPatientDataExportDownload(user, jobId);
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.send(buffer);
    }
    createPsychologistExport(user, psychologistId, patientId) {
        return this.exportsService.createPsychologistPatientDataExport(user, psychologistId, patientId);
    }
    getPsychologistExportStatus(user, psychologistId, patientId, jobId) {
        return this.exportsService.getPsychologistPatientDataExportStatus(user, psychologistId, patientId, jobId);
    }
    async downloadPsychologistExport(user, psychologistId, patientId, jobId, res) {
        const { buffer, fileName, contentType } = await this.exportsService.getPsychologistPatientDataExportDownload(user, psychologistId, patientId, jobId);
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.send(buffer);
    }
};
exports.ExportsController = ExportsController;
__decorate([
    (0, common_1.Post)("patients/me/data-export"),
    (0, swagger_1.ApiOperation)({ summary: "Request asynchronous patient data export job (PDF package)" }),
    (0, swagger_1.ApiCreatedResponse)({ type: create_data_export_response_dto_1.CreateDataExportResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "createExport", null);
__decorate([
    (0, common_1.Get)("patients/me/data-export/:jobId"),
    (0, swagger_1.ApiOperation)({ summary: "Get patient data export job status" }),
    (0, swagger_1.ApiOkResponse)({ type: data_export_status_dto_1.DataExportStatusDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("jobId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "getExportStatus", null);
__decorate([
    (0, common_1.Get)("patients/me/data-export/:jobId/download"),
    (0, swagger_1.ApiOperation)({ summary: "Download generated patient data export file" }),
    (0, swagger_1.ApiProduces)("application/pdf"),
    (0, common_1.Header)("Cache-Control", "no-store"),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("jobId")),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "downloadExport", null);
__decorate([
    (0, common_1.Post)("psychologists/:id/patients/:patientId/data-export"),
    (0, swagger_1.ApiOperation)({ summary: "Request asynchronous patient data export job by assigned psychologist" }),
    (0, swagger_1.ApiCreatedResponse)({ type: create_data_export_response_dto_1.CreateDataExportResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("patientId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "createPsychologistExport", null);
__decorate([
    (0, common_1.Get)("psychologists/:id/patients/:patientId/data-export/:jobId"),
    (0, swagger_1.ApiOperation)({ summary: "Get psychologist-requested patient export status" }),
    (0, swagger_1.ApiOkResponse)({ type: data_export_status_dto_1.DataExportStatusDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("patientId")),
    __param(3, (0, common_1.Param)("jobId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "getPsychologistExportStatus", null);
__decorate([
    (0, common_1.Get)("psychologists/:id/patients/:patientId/data-export/:jobId/download"),
    (0, swagger_1.ApiOperation)({ summary: "Download psychologist-requested patient export PDF" }),
    (0, swagger_1.ApiProduces)("application/pdf"),
    (0, common_1.Header)("Cache-Control", "no-store"),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("patientId")),
    __param(3, (0, common_1.Param)("jobId")),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "downloadPsychologistExport", null);
exports.ExportsController = ExportsController = __decorate([
    (0, swagger_1.ApiTags)("exports"),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [exports_service_1.ExportsService])
], ExportsController);
//# sourceMappingURL=exports.controller.js.map