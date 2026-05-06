export const PSYCHOLOGIST_ACCOUNT_STATUSES = ["active", "inactive"] as const;
export type PsychologistAccountStatus = (typeof PSYCHOLOGIST_ACCOUNT_STATUSES)[number];

export type PsychologistAdminProfile = {
  registrationNumber: string;
  providerNumber: string;
  specialties: string[];
  status: PsychologistAccountStatus;
};

export function emptyPsychologistAdminProfile(): PsychologistAdminProfile {
  return {
    registrationNumber: "",
    providerNumber: "",
    specialties: [],
    status: "active",
  };
}
