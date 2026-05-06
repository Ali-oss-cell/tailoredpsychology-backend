"use strict";

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.addColumns("psychologist_profile_bio", {
    profile_image_url: { type: "text" },
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropColumns("psychologist_profile_bio", ["profile_image_url"], { ifExists: true });
};
