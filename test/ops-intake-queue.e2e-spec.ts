import { ValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Ops intake queue (e2e)", () => {
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

  it("blocks patient from reading intake queue", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .get("/api/ops/intake-queue")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it("returns queue items for manager and supports risk filter", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const latestDraft = await request(app.getHttpServer())
      .get("/api/patients/user_patient_001/intake-latest")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(latestDraft.status).toBe(200);
    await request(app.getHttpServer())
      .post("/api/patients/user_patient_001/intake-delta")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        baseVersion: latestDraft.body.draftVersion as number,
        delta: {
          careContext: { riskFlag: "urgent_support_needed" },
          medicarePath: { hasMhtp: "unsure" },
        },
      });

    const managerToken = await loginAndGetToken(app, "manager@clink.test", "Manager123!");
    const response = await request(app.getHttpServer())
      .get("/api/ops/intake-queue")
      .query({ risk: "urgent_support_needed" })
      .set("Authorization", `Bearer ${managerToken}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("assigns queue item and filters by assignedClinicianId", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    await request(app.getHttpServer())
      .post("/api/booking-requests")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        clinicianId: "clinician_001",
        slotId: "clinician_001_2026-05-12_0900",
        appointmentDate: "2026-05-12",
        timezone: "Australia/Sydney",
        idempotencyKey: "ops-assign-case",
      });

    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");
    const clinicians = await request(app.getHttpServer())
      .get("/api/ops/intake-queue/assignable-clinicians")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(clinicians.status).toBe(200);
    const assignableClinicianId = (clinicians.body as Array<{ clinicianId: string }>)[0]?.clinicianId;
    expect(assignableClinicianId).toBeDefined();

    const list = await request(app.getHttpServer())
      .get("/api/ops/intake-queue")
      .set("Authorization", `Bearer ${adminToken}`);
    const queueItemId = (list.body as Array<{ queueItemId: string }>).find((item) =>
      item.queueItemId.startsWith("booking_request:"),
    )?.queueItemId;
    expect(queueItemId).toBeDefined();

    const assign = await request(app.getHttpServer())
      .post(`/api/ops/intake-queue/${encodeURIComponent(queueItemId ?? "")}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ assignedClinicianId: assignableClinicianId });
    expect(assign.status).toBe(201);
    expect(assign.body.assignedClinicianId).toBe(assignableClinicianId);

    const filtered = await request(app.getHttpServer())
      .get("/api/ops/intake-queue")
      .query({ assignedClinicianId: assignableClinicianId })
      .set("Authorization", `Bearer ${adminToken}`);
    expect(filtered.status).toBe(200);
    expect(
      (filtered.body as Array<{ assignedClinicianId?: string }>).some(
        (item) => item.assignedClinicianId === assignableClinicianId,
      ),
    ).toBe(true);
  });

  it("rejects assignment to unknown clinician id", async () => {
    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");
    const list = await request(app.getHttpServer())
      .get("/api/ops/intake-queue")
      .set("Authorization", `Bearer ${adminToken}`);
    const queueItemId = (list.body as Array<{ queueItemId: string }>)[0]?.queueItemId;
    expect(queueItemId).toBeDefined();

    const assign = await request(app.getHttpServer())
      .post(`/api/ops/intake-queue/${encodeURIComponent(queueItemId ?? "")}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ assignedClinicianId: "not_a_real_clinician" });
    expect(assign.status).toBe(400);
  });
});
