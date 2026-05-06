import { ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Patient data access/correction requests (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("supports patient creation and ops triage lifecycle", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");

    const created = await request(app.getHttpServer())
      .post("/api/patients/me/data-requests")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        requestType: "correction",
        details: "Please correct my date of birth in records.",
        requestedCorrection: "DOB should be 1991-03-20",
      });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe("submitted");
    expect(created.body.slaDueAt).toEqual(expect.any(String));

    const mine = await request(app.getHttpServer())
      .get("/api/patients/me/data-requests")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(mine.status).toBe(200);
    expect(Array.isArray(mine.body)).toBe(true);
    expect(mine.body.some((item: { requestId: string }) => item.requestId === created.body.requestId)).toBe(true);

    const assigned = await request(app.getHttpServer())
      .post(`/api/admin/patient-data-requests/${created.body.requestId as string}/actions`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "assign" });
    expect(assigned.status).toBe(201);
    expect(assigned.body.status).toBe("triage_review");
    expect(assigned.body.triageOwnerUserId).toBe("user_admin_001");

    const inReview = await request(app.getHttpServer())
      .post(`/api/admin/patient-data-requests/${created.body.requestId as string}/actions`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "start_review" });
    expect(inReview.status).toBe(201);
    expect(inReview.body.status).toBe("in_progress");

    const fulfilled = await request(app.getHttpServer())
      .post(`/api/admin/patient-data-requests/${created.body.requestId as string}/actions`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "fulfill", notes: "Completed via secure export package." });
    expect(fulfilled.status).toBe(201);
    expect(fulfilled.body.status).toBe("fulfilled");
    expect(fulfilled.body.resolvedAt).toEqual(expect.any(String));
  });

  it("enforces ownership and transition rules", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const patient2Token = await loginAndGetToken(app, "patient2@clink.test", "Patient234!");
    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");

    const created = await request(app.getHttpServer())
      .post("/api/patients/me/data-requests")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        requestType: "access",
        details: "Need all records from this year.",
      });
    expect(created.status).toBe(201);

    const otherPatientDenied = await request(app.getHttpServer())
      .get(`/api/patients/me/data-requests/${created.body.requestId as string}`)
      .set("Authorization", `Bearer ${patient2Token}`);
    expect(otherPatientDenied.status).toBe(403);

    const invalidTransition = await request(app.getHttpServer())
      .post(`/api/admin/patient-data-requests/${created.body.requestId as string}/actions`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "fulfill" });
    expect(invalidTransition.status).toBe(409);
  });
});
