import { ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Patient retention and soft-delete policy (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("supports soft-delete, legal-hold controls, and retention status", async () => {
    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");
    const patientId = "user_patient_002";

    const softDeleted = await request(app.getHttpServer())
      .post(`/api/admin/patients/${patientId}/soft-delete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "patient requested account deletion" });
    expect(softDeleted.status).toBe(201);
    expect(softDeleted.body.deletedAt).toEqual(expect.any(String));
    expect(softDeleted.body.retentionUntil).toEqual(expect.any(String));
    expect(softDeleted.body.legalHoldActive).toBe(false);

    const patientLogin = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "patient2@clink.test", password: "Patient123!" });
    expect(patientLogin.status).toBe(401);

    const hold = await request(app.getHttpServer())
      .post(`/api/admin/patients/${patientId}/legal-hold`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "complaint under review" });
    expect(hold.status).toBe(201);
    expect(hold.body.legalHoldActive).toBe(true);

    const removedHold = await request(app.getHttpServer())
      .post(`/api/admin/patients/${patientId}/legal-hold/remove`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send();
    expect(removedHold.status).toBe(201);
    expect(removedHold.body.legalHoldActive).toBe(false);

    const retentionStatus = await request(app.getHttpServer())
      .get(`/api/admin/patients/${patientId}/retention-status`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(retentionStatus.status).toBe(200);
    expect(retentionStatus.body.patientId).toBe(patientId);

    const purgeEligible = await request(app.getHttpServer())
      .get("/api/admin/patients/purge-eligible")
      .query({ at: "2100-01-01T00:00:00.000Z" })
      .set("Authorization", `Bearer ${adminToken}`);
    expect(purgeEligible.status).toBe(200);
    expect(Array.isArray(purgeEligible.body)).toBe(true);

    const purgeBlocked = await request(app.getHttpServer())
      .post(`/api/admin/patients/${patientId}/purge`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send();
    expect(purgeBlocked.status).toBe(400);
  });

  it("forbids non-admin roles on retention endpoints", async () => {
    const managerToken = await loginAndGetToken(app, "manager@clink.test", "Manager123!");
    const response = await request(app.getHttpServer())
      .post("/api/admin/patients/user_patient_001/soft-delete")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ reason: "not allowed for manager" });
    expect(response.status).toBe(403);
  });

  it("supports break-glass access with mandatory justification while legal hold is active", async () => {
    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");
    const patientId = "user_patient_001";

    const deniedWithoutHold = await request(app.getHttpServer())
      .post(`/api/admin/patients/${patientId}/break-glass-access`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ justification: "Urgent record review request from care lead." });
    expect(deniedWithoutHold.status).toBe(400);

    const hold = await request(app.getHttpServer())
      .post(`/api/admin/patients/${patientId}/legal-hold`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Matter under legal review" });
    expect(hold.status).toBe(201);

    const grant = await request(app.getHttpServer())
      .post(`/api/admin/patients/${patientId}/break-glass-access`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ justification: "Urgent record review request from care lead." });
    expect(grant.status).toBe(201);
    expect(grant.body.active).toBe(true);
    expect(grant.body.justification).toContain("Urgent");

    const status = await request(app.getHttpServer())
      .get(`/api/admin/patients/${patientId}/break-glass-access`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(status.status).toBe(200);
    expect(status.body.active).toBe(true);
    expect(status.body.grantedByUserId).toBe("user_admin_001");

    await request(app.getHttpServer())
      .post(`/api/admin/patients/${patientId}/legal-hold/remove`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send();
  });
});
