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
exports.PsychologistNotesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const multer_1 = require("multer");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const create_psychologist_note_dto_1 = require("./dto/create-psychologist-note.dto");
const psychologist_note_dto_1 = require("./dto/psychologist-note.dto");
const psychologist_patient_context_dto_1 = require("./dto/psychologist-patient-context.dto");
const psychologist_profile_dto_1 = require("./dto/psychologist-profile.dto");
const psychologist_referral_dto_1 = require("./dto/psychologist-referral.dto");
const session_video_access_dto_1 = require("./dto/session-video-access.dto");
const session_video_item_dto_1 = require("./dto/session-video-item.dto");
const update_psychologist_note_dto_1 = require("./dto/update-psychologist-note.dto");
const update_psychologist_profile_dto_1 = require("./dto/update-psychologist-profile.dto");
const psychologist_notes_service_1 = require("./psychologist-notes.service");
let PsychologistNotesController = class PsychologistNotesController {
    notesService;
    constructor(notesService) {
        this.notesService = notesService;
    }
    listNotes(user, id) {
        return this.notesService.listNotes(user, id);
    }
    getNote(user, id, noteId) {
        return this.notesService.getNote(user, id, noteId);
    }
    createNote(user, id, dto) {
        return this.notesService.createNote(user, id, dto);
    }
    updateNote(user, id, noteId, dto) {
        return this.notesService.updateNote(user, id, noteId, dto);
    }
    signNote(user, id, noteId) {
        return this.notesService.signNote(user, id, noteId);
    }
    getPatientContext(user, id, patientId) {
        return this.notesService.getPatientContext(user, id, patientId);
    }
    listPsychologistReferrals(user, id) {
        return this.notesService.listPsychologistReferrals(user, id);
    }
    getMyProfile(user) {
        return this.notesService.getMyProfile(user);
    }
    updateMyProfile(user, dto) {
        return this.notesService.updateMyProfile(user, dto);
    }
    uploadMyProfileAvatar(user, file) {
        return this.notesService.uploadMyProfileAvatar(user, file);
    }
    listPsychologistSessionVideos(user, id) {
        return this.notesService.listSessionVideosForPsychologist(user, id);
    }
    listPatientSessionVideos(user, id) {
        return this.notesService.listSessionVideosForPatient(user, id);
    }
    requestVideoAccess(user, videoId) {
        return this.notesService.requestSessionVideoAccess(user, videoId);
    }
};
exports.PsychologistNotesController = PsychologistNotesController;
__decorate([
    (0, common_1.Get)("psychologists/:id/notes"),
    (0, swagger_1.ApiOperation)({ summary: "List psychologist notes queue" }),
    (0, swagger_1.ApiOkResponse)({ type: [psychologist_note_dto_1.PsychologistNoteDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PsychologistNotesController.prototype, "listNotes", null);
__decorate([
    (0, common_1.Get)("psychologists/:id/notes/:noteId"),
    (0, swagger_1.ApiOperation)({ summary: "Get psychologist note detail" }),
    (0, swagger_1.ApiOkResponse)({ type: psychologist_note_dto_1.PsychologistNoteDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("noteId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PsychologistNotesController.prototype, "getNote", null);
__decorate([
    (0, common_1.Post)("psychologists/:id/notes"),
    (0, swagger_1.ApiOperation)({ summary: "Create psychologist note" }),
    (0, swagger_1.ApiCreatedResponse)({ type: psychologist_note_dto_1.PsychologistNoteDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_psychologist_note_dto_1.CreatePsychologistNoteDto]),
    __metadata("design:returntype", Promise)
], PsychologistNotesController.prototype, "createNote", null);
__decorate([
    (0, common_1.Patch)("psychologists/:id/notes/:noteId"),
    (0, swagger_1.ApiOperation)({ summary: "Update psychologist note (draft/ready_for_signoff only)" }),
    (0, swagger_1.ApiOkResponse)({ type: psychologist_note_dto_1.PsychologistNoteDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("noteId")),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_psychologist_note_dto_1.UpdatePsychologistNoteDto]),
    __metadata("design:returntype", Promise)
], PsychologistNotesController.prototype, "updateNote", null);
__decorate([
    (0, common_1.Post)("psychologists/:id/notes/:noteId/sign"),
    (0, swagger_1.ApiOperation)({ summary: "Sign psychologist note and lock edits" }),
    (0, swagger_1.ApiCreatedResponse)({ type: psychologist_note_dto_1.PsychologistNoteDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("noteId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PsychologistNotesController.prototype, "signNote", null);
__decorate([
    (0, common_1.Get)("psychologists/:id/patients/:patientId/context"),
    (0, swagger_1.ApiOperation)({ summary: "Get psychologist patient context packet" }),
    (0, swagger_1.ApiOkResponse)({ type: psychologist_patient_context_dto_1.PsychologistPatientContextDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("patientId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PsychologistNotesController.prototype, "getPatientContext", null);
__decorate([
    (0, common_1.Get)("psychologists/:id/referrals"),
    (0, swagger_1.ApiOperation)({ summary: "List referrals relevant to assigned psychologist patients" }),
    (0, swagger_1.ApiOkResponse)({ type: [psychologist_referral_dto_1.PsychologistReferralDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PsychologistNotesController.prototype, "listPsychologistReferrals", null);
__decorate([
    (0, common_1.Get)("psychologists/me/profile"),
    (0, swagger_1.ApiOperation)({ summary: "Get psychologist own profile details" }),
    (0, swagger_1.ApiOkResponse)({ type: psychologist_profile_dto_1.PsychologistProfileDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PsychologistNotesController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Patch)("psychologists/me/profile"),
    (0, swagger_1.ApiOperation)({ summary: "Update psychologist own profile details" }),
    (0, swagger_1.ApiOkResponse)({ type: psychologist_profile_dto_1.PsychologistProfileDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_psychologist_profile_dto_1.UpdatePsychologistProfileDto]),
    __metadata("design:returntype", Promise)
], PsychologistNotesController.prototype, "updateMyProfile", null);
__decorate([
    (0, common_1.Post)("psychologists/me/profile/avatar"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file", {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 2 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
            cb(ok ? null : new common_1.BadRequestException("Only JPEG, PNG, or WebP images are allowed (max 2MB)."), ok);
        },
    })),
    (0, swagger_1.ApiConsumes)("multipart/form-data"),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            properties: { file: { type: "string", format: "binary" } },
            required: ["file"],
        },
    }),
    (0, swagger_1.ApiOperation)({ summary: "Upload profile photo (JPEG/PNG/WebP, max 2MB); replaces patient-facing image" }),
    (0, swagger_1.ApiOkResponse)({ type: psychologist_profile_dto_1.PsychologistProfileDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PsychologistNotesController.prototype, "uploadMyProfileAvatar", null);
__decorate([
    (0, common_1.Get)("psychologists/:id/session-videos"),
    (0, swagger_1.ApiOperation)({ summary: "List session videos for psychologist" }),
    (0, swagger_1.ApiOkResponse)({ type: [session_video_item_dto_1.SessionVideoItemDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PsychologistNotesController.prototype, "listPsychologistSessionVideos", null);
__decorate([
    (0, common_1.Get)("patients/:id/session-videos"),
    (0, swagger_1.ApiOperation)({ summary: "List session videos for patient" }),
    (0, swagger_1.ApiOkResponse)({ type: [session_video_item_dto_1.SessionVideoItemDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PsychologistNotesController.prototype, "listPatientSessionVideos", null);
__decorate([
    (0, common_1.Get)("session-videos/:videoId/access"),
    (0, swagger_1.ApiOperation)({ summary: "Request short-lived access token for session video download" }),
    (0, swagger_1.ApiOkResponse)({ type: session_video_access_dto_1.SessionVideoAccessDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("videoId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PsychologistNotesController.prototype, "requestVideoAccess", null);
exports.PsychologistNotesController = PsychologistNotesController = __decorate([
    (0, swagger_1.ApiTags)("psychologist-notes"),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [psychologist_notes_service_1.PsychologistNotesService])
], PsychologistNotesController);
//# sourceMappingURL=psychologist-notes.controller.js.map