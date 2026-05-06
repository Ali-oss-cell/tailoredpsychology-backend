import { hashPassword, passwordNeedsRehash, verifyPassword } from "./password-crypto.util";

describe("password-crypto.util", () => {
  it("verifies a freshly hashed password", async () => {
    const plain = "MySecurePassphrase9!";
    const stored = await hashPassword(plain);
    expect(stored.startsWith("$argon2id$")).toBe(true);
    await expect(verifyPassword(plain, stored)).resolves.toBe(true);
    await expect(verifyPassword("wrong", stored)).resolves.toBe(false);
    expect(passwordNeedsRehash(stored)).toBe(false);
  });

  it("verifies known legacy scrypt hash and marks for rehash", async () => {
    const stored =
      "v1.scrypt$ba28a228b4c5280a239504e4fa336daf$db669618667957621db39e516f79ac420f6399da990ccef198a298cf3add5731176c0caa3b85ec2e3c87deac6f4414997f757e816dab698c801c48acc3848769";
    await expect(verifyPassword("Patient123!", stored)).resolves.toBe(true);
    await expect(verifyPassword("Patient123?", stored)).resolves.toBe(false);
    expect(passwordNeedsRehash(stored)).toBe(true);
  });

  it("rejects non-prefixed legacy plaintext", async () => {
    await expect(verifyPassword("secret", "plaintext")).resolves.toBe(false);
    expect(passwordNeedsRehash("plaintext")).toBe(true);
  });
});
