import type { UserRecord } from "./entities/user-record";
import type { PatientContactProfile } from "./types/patient-contact-profile.type";
import type { PatientRetentionState } from "./types/patient-retention-state.type";
import type { PsychologistAccountStatus } from "./types/psychologist-admin-profile.type";

export const USERS_REPOSITORY = Symbol("USERS_REPOSITORY");

export type UpdateUserProfileInput = {
  displayName: string;
  patientContactProfile?: Partial<PatientContactProfile>;
};

export type CreatePsychologistUserInput = {
  email: string;
  displayName: string;
  passwordHash: string;
  registrationNumber: string;
  providerNumber: string;
  specialties: string[];
  status: PsychologistAccountStatus;
};

export type UpdatePsychologistUserInput = {
  displayName: string;
  registrationNumber: string;
  providerNumber: string;
  specialties: string[];
  status: PsychologistAccountStatus;
};

export type PatientSoftDeleteInput = {
  patientId: string;
  actorUserId: string;
  reason: string;
};

export type PatientLegalHoldInput = {
  patientId: string;
  actorUserId: string;
  reason: string;
};

export interface UsersRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  updateDisplayName(id: string, displayName: string): Promise<void>;
  updateProfile(id: string, input: UpdateUserProfileInput): Promise<void>;
  updatePassword(id: string, password: string): Promise<void>;
  markAccountOnboardingComplete(id: string): Promise<void>;
  createPatientUser(input: { email: string; displayName: string; password: string }): Promise<UserRecord>;
  listPsychologistUsers(): Promise<UserRecord[]>;
  createPsychologistUser(input: CreatePsychologistUserInput): Promise<UserRecord>;
  updatePsychologistUser(id: string, input: UpdatePsychologistUserInput): Promise<UserRecord | null>;
  softDeletePatient(input: PatientSoftDeleteInput): Promise<PatientRetentionState | null>;
  restorePatient(patientId: string): Promise<PatientRetentionState | null>;
  setPatientLegalHold(input: PatientLegalHoldInput): Promise<PatientRetentionState | null>;
  clearPatientLegalHold(patientId: string): Promise<PatientRetentionState | null>;
  getPatientRetentionState(patientId: string): Promise<PatientRetentionState | null>;
  listPurgeEligiblePatients(nowIso: string): Promise<Array<{ patientId: string; retention: PatientRetentionState }>>;
  markPatientPurged(patientId: string): Promise<PatientRetentionState | null>;
  /** After intake commit: merge identity, contact, and telehealth emergency fields from draft into stored profile. */
  mergeCommittedIntakeIntoProfile(patientId: string, intakeData: Record<string, unknown>): Promise<void>;
}

