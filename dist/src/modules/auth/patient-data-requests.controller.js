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
exports.PatientDataRequestsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
const create_patient_data_request_dto_1 = require("./dto/create-patient-data-request.dto");
const patient_data_request_action_dto_1 = require("./dto/patient-data-request-action.dto");
const patient_data_request_dto_1 = require("./dto/patient-data-request.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const patient_data_requests_service_1 = require("./patient-data-requests.service");
let PatientDataRequestsController = class PatientDataRequestsController {
    requestsService;
    constructor(requestsService) {
        this.requestsService = requestsService;
    }
    createOwnRequest(user, dto) {
        return this.requestsService.createForPatient(user, dto);
    }
    listOwnRequests(user) {
        return this.requestsService.listForPatient(user);
    }
    getOwnRequest(user, requestId) {
        return this.requestsService.getForPatient(user, requestId);
    }
    listOpsQueue(user) {
        return this.requestsService.listForOps(user);
    }
    applyOpsAction(user, requestId, dto) {
        return this.requestsService.applyAction(user, requestId, dto);
    }
};
exports.PatientDataRequestsController = PatientDataRequestsController;
__decorate([
    (0, common_1.Post)("patients/me/data-requests"),
    (0, swagger_1.ApiOperation)({ summary: "Create patient data access/correction request" }),
    (0, swagger_1.ApiCreatedResponse)({ type: patient_data_request_dto_1.PatientDataRequestDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_patient_data_request_dto_1.CreatePatientDataRequestDto]),
    __metadata("design:returntype", Promise)
], PatientDataRequestsController.prototype, "createOwnRequest", null);
__decorate([
    (0, common_1.Get)("patients/me/data-requests"),
    (0, swagger_1.ApiOperation)({ summary: "List own data access/correction requests" }),
    (0, swagger_1.ApiOkResponse)({ type: [patient_data_request_dto_1.PatientDataRequestDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PatientDataRequestsController.prototype, "listOwnRequests", null);
__decorate([
    (0, common_1.Get)("patients/me/data-requests/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Get own data request details" }),
    (0, swagger_1.ApiOkResponse)({ type: patient_data_request_dto_1.PatientDataRequestDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PatientDataRequestsController.prototype, "getOwnRequest", null);
__decorate([
    (0, common_1.Get)("admin/patient-data-requests"),
    (0, swagger_1.ApiOperation)({ summary: "List patient data requests queue for admin/practice_manager" }),
    (0, swagger_1.ApiOkResponse)({ type: [patient_data_request_dto_1.PatientDataRequestDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PatientDataRequestsController.prototype, "listOpsQueue", null);
__decorate([
    (0, common_1.Post)("admin/patient-data-requests/:id/actions"),
    (0, swagger_1.ApiOperation)({ summary: "Apply triage action for patient data request" }),
    (0, swagger_1.ApiCreatedResponse)({ type: patient_data_request_dto_1.PatientDataRequestDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, patient_data_request_action_dto_1.PatientDataRequestActionDto]),
    __metadata("design:returntype", Promise)
], PatientDataRequestsController.prototype, "applyOpsAction", null);
exports.PatientDataRequestsController = PatientDataRequestsController = __decorate([
    (0, swagger_1.ApiTags)("patient-data-requests"),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [patient_data_requests_service_1.PatientDataRequestsService])
], PatientDataRequestsController);
//# sourceMappingURL=patient-data-requests.controller.js.map