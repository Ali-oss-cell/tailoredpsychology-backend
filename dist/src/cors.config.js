"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllowedCorsOrigins = getAllowedCorsOrigins;
exports.isOriginAllowed = isOriginAllowed;
exports.buildCorsOptions = buildCorsOptions;
/**
 * Browser origins allowed to call the API with cookies (`credentials: include`).
 * Override with comma-separated `CORS_ORIGINS` in production if needed.
 */
function getAllowedCorsOrigins() {
    const fromEnv = process.env.CORS_ORIGINS?.split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    if (fromEnv && fromEnv.length > 0) {
        return fromEnv;
    }
    const baseDomain = process.env.BASE_DOMAIN?.trim();
    const fromBase = baseDomain
        ? [`https://${baseDomain}`, `https://www.${baseDomain}`, `http://${baseDomain}`, `http://www.${baseDomain}`]
        : [];
    return [
        ...fromBase,
        "https://tailoredpsychology.com.au",
        "https://www.tailoredpsychology.com.au",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ];
}
function isOriginAllowed(origin, allowed) {
    if (!origin) {
        return true;
    }
    return allowed.includes(origin);
}
function buildCorsOptions() {
    const allowedOrigins = getAllowedCorsOrigins();
    return {
        origin: (origin, callback) => {
            if (isOriginAllowed(origin, allowedOrigins)) {
                callback(null, true);
                return;
            }
            callback(null, false);
        },
        credentials: true,
        methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
        exposedHeaders: ["Content-Disposition"],
        optionsSuccessStatus: 204,
        preflightContinue: false,
    };
}
//# sourceMappingURL=cors.config.js.map