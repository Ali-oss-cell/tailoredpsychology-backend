"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PSYCHOLOGIST_ACCOUNT_STATUSES = void 0;
exports.emptyPsychologistAdminProfile = emptyPsychologistAdminProfile;
exports.PSYCHOLOGIST_ACCOUNT_STATUSES = ["active", "inactive"];
function emptyPsychologistAdminProfile() {
    return {
        registrationNumber: "",
        providerNumber: "",
        specialties: [],
        status: "active",
    };
}
//# sourceMappingURL=psychologist-admin-profile.type.js.map