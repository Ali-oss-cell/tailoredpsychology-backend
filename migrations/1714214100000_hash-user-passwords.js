"use strict";

/**
 * Replaces legacy plaintext demo passwords with scrypt hashes (`v1.scrypt$...` format).
 * Idempotent: skips rows already using the new prefix.
 *
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  const rows = [
    {
      email: "patient@clink.test",
      hash: "v1.scrypt$ba28a228b4c5280a239504e4fa336daf$db669618667957621db39e516f79ac420f6399da990ccef198a298cf3add5731176c0caa3b85ec2e3c87deac6f4414997f757e816dab698c801c48acc3848769",
    },
    {
      email: "psychologist@clink.test",
      hash: "v1.scrypt$3b40c3f67827d86af2a9dc7a0cbab21d$440cfc4e49fe8531e20c1d6771d8e980d9a9135d119727091c8ee54756c0763c7dfa1511d095b7e5259dc62647eec9853326db4be46d65fe06fd278ff453d89f",
    },
    {
      email: "patient2@clink.test",
      hash: "v1.scrypt$c6fe6e989d7a0d32b11a467f0d94e64e$ee53f730c5a6233cf89123398ad11a9a240dd3033aedab3bbbcf96550b5f48a569866ff72246b7cfffe8eb49eaedc72ac979b5ff83f92e1b5daf5b00ebc8f84c",
    },
    {
      email: "manager@clink.test",
      hash: "v1.scrypt$578f81e83b88cc7f0016e6530e623da7$386b659a39f172bf931f72fd17af1a1ace46fc10d3f33ad40299312ea4de8cf65d1a5d98787fda4c884cca073ec9e6592c4d36a9c08783c79d5ab4008380ba89",
    },
    {
      email: "admin@clink.test",
      hash: "v1.scrypt$87f26d9f5f062a10cc4b1471dc2e30dd$3d38c774949c1c317fca8ec9564f34d6a9937c2747ae6914b0ec18c2eaed6b91704ac11beb1d4142e7af800b239bdb9420610b8aed7e36808c758b8025bdd40c",
    },
  ];
  for (const row of rows) {
    pgm.sql(
      `UPDATE users SET password = '${row.hash}', updated_at = now() WHERE lower(email) = lower('${row.email}') AND password NOT LIKE 'v1.scrypt$%';`,
    );
  }
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = () => {
  // Intentionally empty: do not restore plaintext passwords.
};
