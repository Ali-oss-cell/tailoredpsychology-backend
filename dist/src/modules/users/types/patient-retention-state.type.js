"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyPatientRetentionState = emptyPatientRetentionState;
function emptyPatientRetentionState() {
    return {
        deletedAt: null,
        deletionReason: null,
        deletedByUserId: null,
        legalHoldActive: false,
        legalHoldReason: null,
        legalHoldSetByUserId: null,
        legalHoldSetAt: null,
        retentionUntil: null,
        purgedAt: null,
        lastInteractionAt: null,
    };
}
//# sourceMappingURL=patient-retention-state.type.js.map