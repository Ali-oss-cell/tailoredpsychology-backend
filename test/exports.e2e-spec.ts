import { ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Patient data export (e2e)", () => {
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

  it("supports request -> status -> download for patient", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");

    const created = await request(app.getHttpServer())
      .post("/api/patients/me/data-export")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(created.status).toBe(201);
    expect(created.body.jobId).toEqual(expect.stringMatching(/^exp_/));
    const jobId = created.body.jobId as string;

    let status = await request(app.getHttpServer())
      .get(`/api/patients/me/data-export/${jobId}`)
      .set("Authorization", `Bearer ${patientToken}`);
    expect(status.status).toBe(200);
    expect(["queued", "processing", "ready"]).toContain(status.body.status);

    for (let i = 0; i < 10; i += 1) {
      status = await request(app.getHttpServer())
        .get(`/api/patients/me/data-export/${jobId}`)
        .set("Authorization", `Bearer ${patientToken}`);
      if (status.body.status === "ready") break;
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    expect(status.body.status).toBe("ready");
    const download = await request(app.getHttpServer())
      .get(`/api/patients/me/data-export/${jobId}/download`)
      .set("Authorization", `Bearer ${patientToken}`);
    expect(download.status).toBe(200);
    expect(download.headers["content-type"]).toContain("application/pdf");
  });

  it("denies non-patient role", async () => {
    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");
    const response = await request(app.getHttpServer())
      .post("/api/patients/me/data-export")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(response.status).toBe(403);
  });

  it("blocks export while legal hold is active", async () => {
    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const patientId = "user_patient_001";

    const hold = await request(app.getHttpServer())
      .post(`/api/admin/patients/${patientId}/legal-hold`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Compliance freeze for legal matter" });
    expect(hold.status).toBe(201);

    const blocked = await request(app.getHttpServer())
      .post("/api/patients/me/data-export")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(blocked.status).toBe(409);

    const unhold = await request(app.getHttpServer())
      .post(`/api/admin/patients/${patientId}/legal-hold/remove`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send();
    expect(unhold.status).toBe(201);
  });

  it("supports psychologist-requested export for assigned patient", async () => {
    const psychologistToken = await loginAndGetToken(app, "psychologist@clink.test", "Psych123!");
    const patientId = "user_patient_001";

    const created = await request(app.getHttpServer())
      .post(`/api/psychologists/user_psychologist_001/patients/${patientId}/data-export`)
      .set("Authorization", `Bearer ${psychologistToken}`);
    expect(created.status).toBe(201);
    const jobId = created.body.jobId as string;
    expect(jobId).toMatch(/^exp_/);

    let status = await request(app.getHttpServer())
      .get(`/api/psychologists/user_psychologist_001/patients/${patientId}/data-export/${jobId}`)
      .set("Authorization", `Bearer ${psychologistToken}`);
    expect(status.status).toBe(200);

    for (let i = 0; i < 10; i += 1) {
      status = await request(app.getHttpServer())
        .get(`/api/psychologists/user_psychologist_001/patients/${patientId}/data-export/${jobId}`)
        .set("Authorization", `Bearer ${psychologistToken}`);
      if (status.body.status === "ready") break;
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    const download = await request(app.getHttpServer())
      .get(`/api/psychologists/user_psychologist_001/patients/${patientId}/data-export/${jobId}/download`)
      .set("Authorization", `Bearer ${psychologistToken}`);
    expect(download.status).toBe(200);
    expect(download.headers["content-type"]).toContain("application/pdf");
  });
});
