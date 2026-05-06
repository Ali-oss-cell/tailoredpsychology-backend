"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Verifies PostgreSQL has expected tables and migration history after `npm run db:migrate`.
 * Usage: DATABASE_URL=postgres://... npm run db:verify
 */
const pg_1 = require("pg");
/** Tables created across baseline + follow-on migrations (public schema). */
const REQUIRED_TABLES = [
    "analytics_events",
    "appointments",
    "audit_events",
    "booking_idempotency",
    "booking_requests",
    "chat_messages",
    "chat_presence",
    "intake_drafts",
    "intake_queue_assignments",
    "notification_preferences",
    "notifications",
    "patient_consents",
    "patient_data_requests",
    "patient_profiles",
    "psychologist_notes",
    "psychologist_profile_bio",
    "psychologist_profiles",
    "referral_documents",
    "security_incidents",
    "session_videos",
    "telehealth_readiness",
    "users",
].sort();
async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl?.trim()) {
        console.error("DATABASE_URL is not set. Export it and re-run (see backend/docs/DATA_AND_RELATIONSHIPS.md).");
        process.exit(1);
    }
    const client = new pg_1.Client({ connectionString: databaseUrl });
    await client.connect();
    try {
        const { rows } = await client.query(`select tablename from pg_tables where schemaname = 'public' and tablename = any($1::text[])`, [REQUIRED_TABLES]);
        const found = new Set(rows.map((r) => r.tablename));
        const missing = REQUIRED_TABLES.filter((t) => !found.has(t));
        if (missing.length > 0) {
            console.error("Missing tables (run migrations?):", missing.join(", "));
            process.exit(1);
        }
        try {
            const applied = await client.query("select count(*)::text as n from pgmigrations");
            const n = Number.parseInt(applied.rows[0]?.n ?? "0", 10);
            if (n < 1) {
                console.error("pgmigrations has no rows — run npm run db:migrate.");
                process.exit(1);
            }
        }
        catch {
            console.warn("Could not read pgmigrations (optional check). Table list matched.");
        }
        console.log(`OK: ${REQUIRED_TABLES.length} expected tables present in public schema.`);
        process.exit(0);
    }
    finally {
        await client.end();
    }
}
void main().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=verify-database-schema.js.map