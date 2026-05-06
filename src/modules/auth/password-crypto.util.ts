import { scryptSync, timingSafeEqual } from "node:crypto";

import argon2 from "argon2";

const LEGACY_SCRYPT_PREFIX = "v1.scrypt$";
const ARGON_PREFIX = "$argon2";
const ARGON_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};
const LEGACY_SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const;

export async function hashPassword(plain: string): Promise<string> {
  return await argon2.hash(plain, ARGON_OPTIONS);
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (stored.startsWith(ARGON_PREFIX)) {
    try {
      return await argon2.verify(stored, plain);
    } catch {
      return false;
    }
  }
  if (stored.startsWith(LEGACY_SCRYPT_PREFIX)) {
    return verifyLegacyScrypt(plain, stored);
  }
  return false;
}

export function passwordNeedsRehash(stored: string): boolean {
  if (!stored.startsWith(ARGON_PREFIX)) {
    return true;
  }
  return argon2.needsRehash(stored, ARGON_OPTIONS);
}

function verifyLegacyScrypt(plain: string, stored: string): boolean {
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
  let actual: Buffer;
  try {
    actual = scryptSync(plain, salt, expected.length, LEGACY_SCRYPT_PARAMS);
  } catch {
    return false;
  }
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
