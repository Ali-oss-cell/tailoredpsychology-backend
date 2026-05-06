"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intakeDraftDataToProfileMerge = intakeDraftDataToProfileMerge;
function needString(v) {
    return typeof v === "string" && v.trim().length > 0;
}
function normalizePreferredContact(raw) {
    if (raw === "email" || raw === "sms" || raw === "phone") {
        return raw;
    }
    if (typeof raw !== "string") {
        return undefined;
    }
    const l = raw.trim().toLowerCase();
    if (l === "email")
        return "email";
    if (l === "sms")
        return "sms";
    if (l === "phone" || l === "phone call")
        return "phone";
    return undefined;
}
/**
 * Maps committed intake draft JSON into user/profile updates.
 * Used after intake commit to align account display name, contact, and telehealth emergency fields with intake.
 */
function intakeDraftDataToProfileMerge(data) {
    const patientContactProfile = {};
    let displayName;
    const pi = data.patientIdentity;
    if (pi && typeof pi === "object") {
        const p = pi;
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
        const t = th;
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
    const out = {};
    if (displayName) {
        out.displayName = displayName;
    }
    if (hasContact) {
        out.patientContactProfile = patientContactProfile;
    }
    return out;
}
//# sourceMappingURL=intake-profile-merge.util.js.map