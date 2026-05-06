import { Injectable } from "@nestjs/common";

import { DatabaseService } from "../core/database.service";

import type { UserRecord } from "./entities/user-record";
import type { PatientRetentionState } from "./types/patient-retention-state.type";
import type {
  CreatePsychologistUserInput,
  PatientLegalHoldInput,
  PatientSoftDeleteInput,
  UpdatePsychologistUserInput,
  UpdateUserProfileInput,
  UsersRepository,
} from "./users.repository";
import { UsersPgRepository } from "./users.pg-repository";
import { UsersStubRepository } from "./users.stub-repository";

@Injectable()
export class UsersDelegatingRepository implements UsersRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly stubRepository: UsersStubRepository,
    private readonly pgRepository: UsersPgRepository,
  ) {}

  private impl(): UsersRepository {
    return this.databaseService.isEnabled() ? this.pgRepository : this.stubRepository;
  }

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.impl().findByEmail(email);
  }

  findById(id: string): Promise<UserRecord | null> {
    return this.impl().findById(id);
  }

  updateDisplayName(id: string, displayName: string): Promise<void> {
    return this.impl().updateDisplayName(id, displayName);
  }

  updateProfile(id: string, input: UpdateUserProfileInput): Promise<void> {
    return this.impl().updateProfile(id, input);
  }

  updatePassword(id: string, password: string): Promise<void> {
    return this.impl().updatePassword(id, password);
  }

  markAccountOnboardingComplete(id: string): Promise<void> {
    return this.impl().markAccountOnboardingComplete(id);
  }

  createPatientUser(input: { email: string; displayName: string; password: string }): Promise<UserRecord> {
    return this.impl().createPatientUser(input);
  }

  listPsychologistUsers(): Promise<UserRecord[]> {
    return this.impl().listPsychologistUsers();
  }

  createPsychologistUser(input: CreatePsychologistUserInput): Promise<UserRecord> {
    return this.impl().createPsychologistUser(input);
  }

  updatePsychologistUser(id: string, input: UpdatePsychologistUserInput): Promise<UserRecord | null> {
    return this.impl().updatePsychologistUser(id, input);
  }

  softDeletePatient(input: PatientSoftDeleteInput): Promise<PatientRetentionState | null> {
    return this.impl().softDeletePatient(input);
  }

  restorePatient(patientId: string): Promise<PatientRetentionState | null> {
    return this.impl().restorePatient(patientId);
  }

  setPatientLegalHold(input: PatientLegalHoldInput): Promise<PatientRetentionState | null> {
    return this.impl().setPatientLegalHold(input);
  }

  clearPatientLegalHold(patientId: string): Promise<PatientRetentionState | null> {
    return this.impl().clearPatientLegalHold(patientId);
  }

  getPatientRetentionState(patientId: string): Promise<PatientRetentionState | null> {
    return this.impl().getPatientRetentionState(patientId);
  }

  listPurgeEligiblePatients(nowIso: string): Promise<Array<{ patientId: string; retention: PatientRetentionState }>> {
    return this.impl().listPurgeEligiblePatients(nowIso);
  }

  markPatientPurged(patientId: string): Promise<PatientRetentionState | null> {
    return this.impl().markPatientPurged(patientId);
  }

  mergeCommittedIntakeIntoProfile(patientId: string, intakeData: Record<string, unknown>): Promise<void> {
    return this.impl().mergeCommittedIntakeIntoProfile(patientId, intakeData);
  }
}
