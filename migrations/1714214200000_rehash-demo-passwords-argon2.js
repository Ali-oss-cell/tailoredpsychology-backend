"use strict";

/**
 * Upgrades demo users to Argon2id hashes.
 * Idempotent: rows already using `$argon2id$...` are skipped.
 *
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  const rows = [
    {
      email: "patient@clink.test",
      hash: "$argon2id$v=19$m=19456,t=2,p=1$SAnCqXx//k8DBFUjbtMAbQ$kxTakLr/H8P4TzdT33/ylXKNmojL7jUvVenA4SJuS4Q",
    },
    {
      email: "psychologist@clink.test",
      hash: "$argon2id$v=19$m=19456,t=2,p=1$OLypc/hC+/QU3O/QcpDvCg$O0Ca5AP+G8KQ1z7x4lFzfaBRGZPCF+k7YmGTe4rXTLM",
    },
    {
      email: "patient2@clink.test",
      hash: "$argon2id$v=19$m=19456,t=2,p=1$NoxgV7oyri7dMPWSkOC9EA$6bldXm4Ifppti/hGPtFWIP5WrMV1s6Lw7VUz2WM4w20",
    },
    {
      email: "manager@clink.test",
      hash: "$argon2id$v=19$m=19456,t=2,p=1$qpjuJy+QuAk7/4AnQY4pLQ$Epi7GRCpXav3lxNg9/RMMtal7plwq6upBy0Ct83c2YM",
    },
    {
      email: "admin@clink.test",
      hash: "$argon2id$v=19$m=19456,t=2,p=1$OXkJN5Y18gSO+ggmYG85yQ$u5PIeWNI4nBBgv1gltew4MYy5lburJ7ZEpQy+D1beYs",
    },
  ];

  for (const row of rows) {
    pgm.sql(
      `UPDATE users SET password = '${row.hash}', updated_at = now() WHERE lower(email) = lower('${row.email}') AND password NOT LIKE '$argon2id$%';`,
    );
  }
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = () => {
  // Intentionally empty: no rollback to weaker password formats.
};

