import { ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Booking requests (e2e)", () => {
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

  it("POST /api/booking-requests creates request for patient", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");

    const response = await request(app.getHttpServer())
      .post("/api/booking-requests")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clinicianId: "clinician_001",
        slotId: "clinician_001_2026-05-12_0900",
        appointmentDate: "2026-05-12",
        idempotencyKey: "req-1",
        referralDocumentId: "ref_000001",
      });

    expect(response.status).toBe(201);
    expect(response.body.bookingRequestId).toEqual(expect.stringMatching(/^br_/));
    expect(response.body.idempotentReplay).toBe(false);
  });

  it("GET /api/booking-requests/:id/status returns linked referral document id", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const create = await request(app.getHttpServer())
      .post("/api/booking-requests")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clinicianId: "clinician_001",
        slotId: "clinician_001_2026-05-15_0900",
        appointmentDate: "2026-05-15",
        referralDocumentId: "ref_009999",
      });

    const status = await request(app.getHttpServer())
      .get(`/api/booking-requests/${create.body.bookingRequestId}/status`)
      .set("Authorization", `Bearer ${token}`);

    expect(status.status).toBe(200);
    expect(status.body.referralDocumentId).toBe("ref_009999");
  });

  it("POST /api/booking-requests returns 401 without auth", async () => {
    const response = await request(app.getHttpServer()).post("/api/booking-requests").send({
      clinicianId: "clinician_001",
      slotId: "clinician_001_2026-05-12_1000",
      appointmentDate: "2026-05-12",
    });

    expect(response.status).toBe(401);
  });

  it("POST /api/booking-requests returns 403 for non-patient role", async () => {
    const token = await loginAndGetToken(app, "psychologist@clink.test", "Psych123!");

    const response = await request(app.getHttpServer())
      .post("/api/booking-requests")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clinicianId: "clinician_001",
        slotId: "clinician_001_2026-05-12_1400",
        appointmentDate: "2026-05-12",
      });

    expect(response.status).toBe(403);
  });

  it("POST /api/booking-requests returns 409 for invalid slot", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");

    const response = await request(app.getHttpServer())
      .post("/api/booking-requests")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clinicianId: "clinician_001",
        slotId: "clinician_001_2026-05-12_2359",
        appointmentDate: "2026-05-12",
      });

    expect(response.status).toBe(409);
  });

  it("POST /api/booking-requests replays by idempotency key", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const payload = {
      clinicianId: "clinician_002",
      slotId: "clinician_002_2026-05-13_0900",
      appointmentDate: "2026-05-13",
      idempotencyKey: "req-2",
    };

    const first = await request(app.getHttpServer())
      .post("/api/booking-requests")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);
    const second = await request(app.getHttpServer())
      .post("/api/booking-requests")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.bookingRequestId).toBe(first.body.bookingRequestId);
    expect(second.body.idempotentReplay).toBe(true);
  });

  it("POST /api/booking-requests allows only one concurrent same-slot request", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const payload = {
      clinicianId: "clinician_002",
      slotId: "clinician_002_2026-05-19_1000",
      appointmentDate: "2026-05-19",
    };

    const [first, second] = await Promise.all([
      request(app.getHttpServer()).post("/api/booking-requests").set("Authorization", `Bearer ${token}`).send(payload),
      request(app.getHttpServer()).post("/api/booking-requests").set("Authorization", `Bearer ${token}`).send(payload),
    ]);

    const statuses = [first.status, second.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409]);
    const conflict = first.status === 409 ? first : second;
    expect(conflict.body.message).toBe("Selected slot is no longer available");
  });

  it("GET /api/booking-requests/:id/status blocks another patient", async () => {
    const ownerToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const otherPatientToken = await loginAndGetToken(app, "patient2@clink.test", "Patient234!");

    const create = await request(app.getHttpServer())
      .post("/api/booking-requests")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        clinicianId: "clinician_003",
        slotId: "clinician_003_2026-05-14_0900",
        appointmentDate: "2026-05-14",
      });

    const status = await request(app.getHttpServer())
      .get(`/api/booking-requests/${create.body.bookingRequestId}/status`)
      .set("Authorization", `Bearer ${otherPatientToken}`);

    expect(status.status).toBe(403);
  });
});
