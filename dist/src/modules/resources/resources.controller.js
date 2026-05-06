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
exports.ResourcesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const referral_document_dto_1 = require("./dto/referral-document.dto");
const get_referral_queue_query_dto_1 = require("./dto/get-referral-queue-query.dto");
const referral_queue_item_dto_1 = require("./dto/referral-queue-item.dto");
const referral_review_action_dto_1 = require("./dto/referral-review-action.dto");
const upload_referral_metadata_dto_1 = require("./dto/upload-referral-metadata.dto");
const resources_service_1 = require("./resources.service");
let ResourcesController = class ResourcesController {
    resourcesService;
    constructor(resourcesService) {
        this.resourcesService = resourcesService;
    }
    uploadReferral(user, file, metadata) {
        return this.resourcesService.uploadReferral(user, file, metadata);
    }
    listReferralQueue(user, query) {
        return this.resourcesService.listReferralQueue(user, query);
    }
    approveReferral(user, id, dto) {
        return this.resourcesService.approveReferral(user, id, dto.reason, dto.notes);
    }
    rejectReferral(user, id, dto) {
        return this.resourcesService.rejectReferral(user, id, dto.reason, dto.notes);
    }
    requestReferralInfo(user, id, dto) {
        return this.resourcesService.requestReferralInfo(user, id, dto.reason, dto.notes);
    }
};
exports.ResourcesController = ResourcesController;
__decorate([
    (0, common_1.Post)("documents/referrals"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    (0, swagger_1.ApiConsumes)("multipart/form-data"),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            properties: {
                file: { type: "string", format: "binary" },
                sourceType: { type: "string" },
                referralDate: { type: "string" },
                notes: { type: "string" },
            },
            required: ["file"],
        },
    }),
    (0, swagger_1.ApiOperation)({ summary: "Upload referral PDF and create document metadata" }),
    (0, swagger_1.ApiCreatedResponse)({ type: referral_document_dto_1.ReferralDocumentDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, upload_referral_metadata_dto_1.UploadReferralMetadataDto]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "uploadReferral", null);
__decorate([
    (0, common_1.Get)("ops/referrals"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "List referral verification queue for admin/practice_manager" }),
    (0, swagger_1.ApiOkResponse)({ type: [referral_queue_item_dto_1.ReferralQueueItemDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, get_referral_queue_query_dto_1.GetReferralQueueQueryDto]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "listReferralQueue", null);
__decorate([
    (0, common_1.Post)("ops/referrals/:id/approve"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Approve referral for onboarding eligibility" }),
    (0, swagger_1.ApiCreatedResponse)({ type: referral_queue_item_dto_1.ReferralQueueItemDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, referral_review_action_dto_1.ReferralReviewActionDto]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "approveReferral", null);
__decorate([
    (0, common_1.Post)("ops/referrals/:id/reject"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Reject referral with reason" }),
    (0, swagger_1.ApiCreatedResponse)({ type: referral_queue_item_dto_1.ReferralQueueItemDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, referral_review_action_dto_1.ReferralReviewActionDto]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "rejectReferral", null);
__decorate([
    (0, common_1.Post)("ops/referrals/:id/request-info"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Request additional referral information" }),
    (0, swagger_1.ApiCreatedResponse)({ type: referral_queue_item_dto_1.ReferralQueueItemDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, referral_review_action_dto_1.ReferralReviewActionDto]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "requestReferralInfo", null);
exports.ResourcesController = ResourcesController = __decorate([
    (0, swagger_1.ApiTags)("documents", "ops"),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [resources_service_1.ResourcesService])
], ResourcesController);
//# sourceMappingURL=resources.controller.js.map