import type { PatientContactProfile } from "../types/patient-contact-profile.type";
import type { PatientDemographics } from "../types/patient-demographics.type";
import type { PatientRetentionState } from "../types/patient-retention-state.type";
import type { PsychologistAdminProfile } from "../types/psychologist-admin-profile.type";
import type { UserRole } from "../types/user-role.type";

export type UserRecord = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  /** Password hash from `password-crypto.util` (Argon2id; legacy scrypt tolerated for migration). */
  password: string;
  /** Legacy stub field; patient completion is derived from intake draft + display name in AuthService. */
  accountOnboardingComplete: boolean;
  /** Present for `patient` role: clinic contact, accessibility, and emergency details. */
  patientContactProfile?: PatientContactProfile;
  /** Present for `patient` role: DOB, indigenous status, state/suburb from intake. */
  patientDemographics?: PatientDemographics;
  /** Present for `patient` role: deletion/legal-hold/retention policy state. */
  patientRetention?: PatientRetentionState;
  /** Present for `psychologist` role in admin management surfaces. */
  psychologistAdminProfile?: PsychologistAdminProfile;
};
