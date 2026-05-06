"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PREFERRED_CONTACT_METHODS = void 0;
exports.emptyPatientContactProfile = emptyPatientContactProfile;
exports.PREFERRED_CONTACT_METHODS = ["email", "sms", "phone"];
function emptyPatientContactProfile() {
    return {
        phoneMobile: "",
        preferredContactMethod: "email",
        accessibilityNotes: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelationship: "",
    };
}
//# sourceMappingURL=patient-contact-profile.type.js.map