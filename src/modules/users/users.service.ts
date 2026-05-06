import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { UserRecord } from "./entities/user-record";
import { hashPassword } from "../auth/password-crypto.util";
import type { PatientRetentionState } from "./types/patient-retention-state.type";
import {
  USERS_REPOSITORY,
  type CreatePsychologistUserInput,
  type PatientLegalHoldInput,
  type PatientSoftDeleteInput,
  type UpdatePsychologistUserInput,
  type UpdateUserProfileInput,
  type UsersRepository,
} from "./users.repository";

@Injectable()
export class UsersService {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string): Promise<UserRecord | null> {
    return this.usersRepository.findById(id);
  }

  async updateDisplayName(id: string, displayName: string): Promise<void> {
    await this.updateProfile(id, { displayName });
  }

  async updateProfile(id: string, input: UpdateUserProfileInput): Promise<void> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    await this.usersRepository.updateProfile(id, input);
  }

  async updatePassword(id: string, password: string): Promise<void> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    await this.usersRepository.updatePassword(id, password);
  }

  createPatientUser(input: { email: string; displayName: string; password: string }): Promise<UserRecord> {
    return this.usersRepository.createPatientUser(input);
  }

  listPsychologistUsers(): Promise<UserRecord[]> {
    return this.usersRepository.listPsychologistUsers();
  }

  async createPsychologistUser(input: Omit<CreatePsychologistUserInput, "passwordHash">): Promise<UserRecord> {
    const inviteSecret = `invite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const passwordHash = await hashPassword(inviteSecret);
    return this.usersRepository.createPsychologistUser({
      ...input,
      passwordHash,
    });
  }

  async updatePsychologistUser(id: string, input: UpdatePsychologistUserInput): Promise<UserRecord> {
    const updated = await this.usersRepository.updatePsychologistUser(id, input);
    if (!updated) {
      throw new NotFoundException("Psychologist user not found");
    }
    return updated;
  }

  async softDeletePatient(input: PatientSoftDeleteInput): Promise<PatientRetentionState> {
    const retention = await this.usersRepository.softDeletePatient(input);
    if (!retention) {
      throw new NotFoundException("Patient user not found");
    }
    return retention;
  }

  async restorePatient(patientId: string): Promise<PatientRetentionState> {
    const retention = await this.usersRepository.restorePatient(patientId);
    if (!retention) {
      throw new NotFoundException("Patient user not found");
    }
    return retention;
  }

  async setPatientLegalHold(input: PatientLegalHoldInput): Promise<PatientRetentionState> {
    const retention = await this.usersRepository.setPatientLegalHold(input);
    if (!retention) {
      throw new NotFoundException("Patient user not found");
    }
    return retention;
  }

  async clearPatientLegalHold(patientId: string): Promise<PatientRetentionState> {
    const retention = await this.usersRepository.clearPatientLegalHold(patientId);
    if (!retention) {
      throw new NotFoundException("Patient user not found");
    }
    return retention;
  }

  async getPatientRetentionState(patientId: string): Promise<PatientRetentionState> {
    const retention = await this.usersRepository.getPatientRetentionState(patientId);
    if (!retention) {
      throw new NotFoundException("Patient user not found");
    }
    return retention;
  }

  listPurgeEligiblePatients(nowIso: string): Promise<Array<{ patientId: string; retention: PatientRetentionState }>> {
    return this.usersRepository.listPurgeEligiblePatients(nowIso);
  }

  async markPatientPurged(patientId: string): Promise<PatientRetentionState> {
    const retention = await this.usersRepository.markPatientPurged(patientId);
    if (!retention) {
      throw new NotFoundException("Patient user not found");
    }
    return retention;
  }

  markAccountOnboardingComplete(id: string): Promise<void> {
    return this.usersRepository.markAccountOnboardingComplete(id);
  }

  mergeCommittedIntakeIntoProfile(patientId: string, intakeData: Record<string, unknown>): Promise<void> {
    return this.usersRepository.mergeCommittedIntakeIntoProfile(patientId, intakeData);
  }
}
