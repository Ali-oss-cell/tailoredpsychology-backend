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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const password_crypto_util_1 = require("../auth/password-crypto.util");
const users_repository_1 = require("./users.repository");
let UsersService = class UsersService {
    usersRepository;
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    findByEmail(email) {
        return this.usersRepository.findByEmail(email);
    }
    findById(id) {
        return this.usersRepository.findById(id);
    }
    async updateDisplayName(id, displayName) {
        await this.updateProfile(id, { displayName });
    }
    async updateProfile(id, input) {
        const user = await this.usersRepository.findById(id);
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        await this.usersRepository.updateProfile(id, input);
    }
    async updatePassword(id, password) {
        const user = await this.usersRepository.findById(id);
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        await this.usersRepository.updatePassword(id, password);
    }
    createPatientUser(input) {
        return this.usersRepository.createPatientUser(input);
    }
    listPsychologistUsers() {
        return this.usersRepository.listPsychologistUsers();
    }
    async createPsychologistUser(input) {
        const inviteSecret = `invite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const passwordHash = await (0, password_crypto_util_1.hashPassword)(inviteSecret);
        return this.usersRepository.createPsychologistUser({
            ...input,
            passwordHash,
        });
    }
    async updatePsychologistUser(id, input) {
        const updated = await this.usersRepository.updatePsychologistUser(id, input);
        if (!updated) {
            throw new common_1.NotFoundException("Psychologist user not found");
        }
        return updated;
    }
    async softDeletePatient(input) {
        const retention = await this.usersRepository.softDeletePatient(input);
        if (!retention) {
            throw new common_1.NotFoundException("Patient user not found");
        }
        return retention;
    }
    async restorePatient(patientId) {
        const retention = await this.usersRepository.restorePatient(patientId);
        if (!retention) {
            throw new common_1.NotFoundException("Patient user not found");
        }
        return retention;
    }
    async setPatientLegalHold(input) {
        const retention = await this.usersRepository.setPatientLegalHold(input);
        if (!retention) {
            throw new common_1.NotFoundException("Patient user not found");
        }
        return retention;
    }
    async clearPatientLegalHold(patientId) {
        const retention = await this.usersRepository.clearPatientLegalHold(patientId);
        if (!retention) {
            throw new common_1.NotFoundException("Patient user not found");
        }
        return retention;
    }
    async getPatientRetentionState(patientId) {
        const retention = await this.usersRepository.getPatientRetentionState(patientId);
        if (!retention) {
            throw new common_1.NotFoundException("Patient user not found");
        }
        return retention;
    }
    listPurgeEligiblePatients(nowIso) {
        return this.usersRepository.listPurgeEligiblePatients(nowIso);
    }
    async markPatientPurged(patientId) {
        const retention = await this.usersRepository.markPatientPurged(patientId);
        if (!retention) {
            throw new common_1.NotFoundException("Patient user not found");
        }
        return retention;
    }
    markAccountOnboardingComplete(id) {
        return this.usersRepository.markAccountOnboardingComplete(id);
    }
    mergeCommittedIntakeIntoProfile(patientId, intakeData) {
        return this.usersRepository.mergeCommittedIntakeIntoProfile(patientId, intakeData);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(users_repository_1.USERS_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], UsersService);
//# sourceMappingURL=users.service.js.map