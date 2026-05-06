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
exports.UsersDelegatingRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../core/database.service");
const users_pg_repository_1 = require("./users.pg-repository");
const users_stub_repository_1 = require("./users.stub-repository");
let UsersDelegatingRepository = class UsersDelegatingRepository {
    databaseService;
    stubRepository;
    pgRepository;
    constructor(databaseService, stubRepository, pgRepository) {
        this.databaseService = databaseService;
        this.stubRepository = stubRepository;
        this.pgRepository = pgRepository;
    }
    impl() {
        return this.databaseService.isEnabled() ? this.pgRepository : this.stubRepository;
    }
    findByEmail(email) {
        return this.impl().findByEmail(email);
    }
    findById(id) {
        return this.impl().findById(id);
    }
    updateDisplayName(id, displayName) {
        return this.impl().updateDisplayName(id, displayName);
    }
    updateProfile(id, input) {
        return this.impl().updateProfile(id, input);
    }
    updatePassword(id, password) {
        return this.impl().updatePassword(id, password);
    }
    markAccountOnboardingComplete(id) {
        return this.impl().markAccountOnboardingComplete(id);
    }
    createPatientUser(input) {
        return this.impl().createPatientUser(input);
    }
    listPsychologistUsers() {
        return this.impl().listPsychologistUsers();
    }
    createPsychologistUser(input) {
        return this.impl().createPsychologistUser(input);
    }
    updatePsychologistUser(id, input) {
        return this.impl().updatePsychologistUser(id, input);
    }
    softDeletePatient(input) {
        return this.impl().softDeletePatient(input);
    }
    restorePatient(patientId) {
        return this.impl().restorePatient(patientId);
    }
    setPatientLegalHold(input) {
        return this.impl().setPatientLegalHold(input);
    }
    clearPatientLegalHold(patientId) {
        return this.impl().clearPatientLegalHold(patientId);
    }
    getPatientRetentionState(patientId) {
        return this.impl().getPatientRetentionState(patientId);
    }
    listPurgeEligiblePatients(nowIso) {
        return this.impl().listPurgeEligiblePatients(nowIso);
    }
    markPatientPurged(patientId) {
        return this.impl().markPatientPurged(patientId);
    }
    mergeCommittedIntakeIntoProfile(patientId, intakeData) {
        return this.impl().mergeCommittedIntakeIntoProfile(patientId, intakeData);
    }
};
exports.UsersDelegatingRepository = UsersDelegatingRepository;
exports.UsersDelegatingRepository = UsersDelegatingRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        users_stub_repository_1.UsersStubRepository,
        users_pg_repository_1.UsersPgRepository])
], UsersDelegatingRepository);
//# sourceMappingURL=users.delegating-repository.js.map