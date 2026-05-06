/**
 * After `node-pg-migrate`, run `prisma migrate deploy`. If the DB already has
 * schema but no Prisma history (P3005), mark the baseline migration applied
 * then deploy again. Idempotent for CI and local repeat runs.
 */
const { execSync } = require("node:child_process");
const path = require("node:path");

const BASELINE = "20250502120000_baseline_schema_via_node_pg_migrate";
const root = path.join(__dirname, "..");

function run(cmd) {
  try {
    execSync(cmd, { cwd: root, stdio: "inherit", env: process.env });
    return 0;
  } catch (e) {
    return e.status ?? 1;
  }
}

function capture(cmd) {
  try {
    const out = execSync(cmd, { cwd: root, encoding: "utf8", env: process.env });
    return { ok: true, out };
  } catch (e) {
    const stdout = typeof e.stdout === "string" ? e.stdout : e.stdout?.toString?.() ?? "";
    const stderr = typeof e.stderr === "string" ? e.stderr : e.stderr?.toString?.() ?? "";
    const out = `${stdout}${stderr}${e.message || ""}`;
    return { ok: false, out, status: e.status };
  }
}

const first = capture("npx prisma migrate deploy");
if (first.ok) {
  process.exit(0);
}

if (!first.out.includes("P3005")) {
  console.error(first.out);
  process.exit(first.status ?? 1);
}

const resolveOut = capture(`npx prisma migrate resolve --applied "${BASELINE}"`);
if (!resolveOut.ok && !resolveOut.out.includes("P3008")) {
  console.error(resolveOut.out);
  process.exit(resolveOut.status ?? 1);
}

process.exit(run("npx prisma migrate deploy"));
