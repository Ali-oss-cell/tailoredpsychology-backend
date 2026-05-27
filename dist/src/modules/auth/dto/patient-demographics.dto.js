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
exports.PatientDemographicsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
/** Response shape for `CurrentUserDto.patientDemographics` (patients only). */
class PatientDemographicsDto {
    dateOfBirth;
    indigenousStatus;
    state;
    suburb;
}
exports.PatientDemographicsDto = PatientDemographicsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "1990-03-15" }),
    __metadata("design:type", String)
], PatientDemographicsDto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "neither" }),
    __metadata("design:type", String)
], PatientDemographicsDto.prototype, "indigenousStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "NSW" }),
    __metadata("design:type", String)
], PatientDemographicsDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Sydney" }),
    __metadata("design:type", String)
], PatientDemographicsDto.prototype, "suburb", void 0);
//# sourceMappingURL=patient-demographics.dto.js.map