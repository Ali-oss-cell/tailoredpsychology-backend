import type { PatientContactProfile, PreferredContactMethod } from "./types/patient-contact-profile.type";

function needString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function normalizePreferredContact(raw: unknown): PreferredContactMethod | undefined {
  if (raw === "email" || raw === "sms" || raw === "phone") {
    return raw;
  }
  if (typeof raw !== "string") {
    return undefined;
  }
  const l = raw.trim().toLowerCase();
  if (l === "email") return "email";
  if (l === "sms") return "sms";
  if (l === "phone" || l === "phone call") return "phone";
  return undefined;
}

export type IntakeProfileMergePatch = {
  displayName?: string;
  patientContactProfile?: Partial<PatientContactProfile>;
};

/**
 * Maps committed intake draft JSON into user/profile updates.
 * Used after intake commit to align account display name, contact, and telehealth emergency fields with intake.
 */
export function intakeDraftDataToProfileMerge(data: Record<string, unknown>): IntakeProfileMergePatch | null {
  const patientContactProfile: Partial<PatientContactProfile> = {};
  let displayName: string | undefined;

  const pi = data.patientIdentity;
  if (pi && typeof pi === "object") {
    const p = pi as Record<string, unknown>;
    if (needString(p.fullName)) {
      displayName = String(p.fullName).trim();
    }
    if (needString(p.mobile)) {
      patientContactProfile.phoneMobile = String(p.mobile).trim();
    }
    const pcm = normalizePreferredContact(p.preferredContactMethod);
    if (pcm) {
      patientContactProfile.preferredContactMethod = pcm;
    }
  }

  const th = data.telehealthSafety;
  if (th && typeof th === "object") {
    const t = th as Record<string, unknown>;
    if (needString(t.emergencyContactName)) {
      patientContactProfile.emergencyContactName = String(t.emergencyContactName).trim();
    }
    if (needString(t.emergencyContactPhone)) {
      patientContactProfile.emergencyContactPhone = String(t.emergencyContactPhone).trim();
    }
    if (needString(t.emergencyContactRelationship)) {
      patientContactProfile.emergencyContactRelationship = String(t.emergencyContactRelationship).trim();
    }
  }

  const hasContact = Object.keys(patientContactProfile).length > 0;
  if (!displayName && !hasContact) {
    return null;
  }

  const out: IntakeProfileMergePatch = {};
  if (displayName) {
    out.displayName = displayName;
  }
  if (hasContact) {
    out.patientContactProfile = patientContactProfile;
  }
  return out;
}
