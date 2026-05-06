"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.passwordNeedsRehash = passwordNeedsRehash;
const node_crypto_1 = require("node:crypto");
const argon2_1 = __importDefault(require("argon2"));
const LEGACY_SCRYPT_PREFIX = "v1.scrypt$";
const ARGON_PREFIX = "$argon2";
const ARGON_OPTIONS = {
    type: argon2_1.default.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
};
const LEGACY_SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
async function hashPassword(plain) {
    return await argon2_1.default.hash(plain, ARGON_OPTIONS);
}
async function verifyPassword(plain, stored) {
    if (stored.startsWith(ARGON_PREFIX)) {
        try {
            return await argon2_1.default.verify(stored, plain);
        }
        catch {
            return false;
        }
    }
    if (stored.startsWith(LEGACY_SCRYPT_PREFIX)) {
        return verifyLegacyScrypt(plain, stored);
    }
    return false;
}
function passwordNeedsRehash(stored) {
    if (!stored.startsWith(ARGON_PREFIX)) {
        return true;
    }
    return argon2_1.default.needsRehash(stored, ARGON_OPTIONS);
}
function verifyLegacyScrypt(plain, stored) {
    const rest = stored.slice(LEGACY_SCRYPT_PREFIX.length);
    const dollar = rest.indexOf("$");
    if (dollar <= 0 || dollar >= rest.length - 1) {
        return false;
    }
    const saltHex = rest.slice(0, dollar);
    const keyHex = rest.slice(dollar + 1);
    if (!/^[0-9a-f]+$/i.test(saltHex) || !/^[0-9a-f]+$/i.test(keyHex)) {
        return false;
    }
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(keyHex, "hex");
    if (expected.length === 0) {
        return false;
    }
    let actual;
    try {
        actual = (0, node_crypto_1.scryptSync)(plain, salt, expected.length, LEGACY_SCRYPT_PARAMS);
    }
    catch {
        return false;
    }
    return expected.length === actual.length && (0, node_crypto_1.timingSafeEqual)(expected, actual);
}
//# sourceMappingURL=password-crypto.util.js.map