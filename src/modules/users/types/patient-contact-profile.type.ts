export const PREFERRED_CONTACT_METHODS = ["email", "sms", "phone"] as const;

export type PreferredContactMethod = (typeof PREFERRED_CONTACT_METHODS)[number];

/** Persisted patient-only contact, accessibility, and emergency details (account settings). */
export type PatientContactProfile = {
  phoneMobile: string;
  preferredContactMethod: PreferredContactMethod;
  accessibilityNotes: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
};

export function emptyPatientContactProfile(): PatientContactProfile {
  return {
    phoneMobile: "",
    preferredContactMethod: "email",
    accessibilityNotes: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  };
}
