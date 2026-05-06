import { ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { AppModule } from "../src/app.module";

describe("Availability (e2e)", () => {
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

  it("GET /api/clinicians/availability returns clinician slots", async () => {
    const response = await request(app.getHttpServer()).get("/api/clinicians/availability").query({
      startDate: "2026-05-01",
      endDate: "2026-05-03",
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].clinicianId).toEqual(expect.any(String));
    expect(Array.isArray(response.body[0].slots)).toBe(true);
  });

  it("GET /api/clinicians/availability rejects invalid range", async () => {
    const response = await request(app.getHttpServer()).get("/api/clinicians/availability").query({
      startDate: "2026-06-10",
      endDate: "2026-05-01",
    });

    expect(response.status).toBe(400);
  });

  it("GET /api/clinicians/availability filters by clinicianId", async () => {
    const response = await request(app.getHttpServer()).get("/api/clinicians/availability").query({
      startDate: "2026-05-01",
      endDate: "2026-05-02",
      clinicianId: "clinician_002",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].clinicianId).toBe("clinician_002");
  });

  it("GET /api/clinicians/availability returns 404 for unknown clinicianId", async () => {
    const response = await request(app.getHttpServer()).get("/api/clinicians/availability").query({
      startDate: "2026-05-01",
      endDate: "2026-05-02",
      clinicianId: "clinician_999",
    });

    expect(response.status).toBe(404);
  });

  it("GET /api/clinicians/availability rejects invalid timezone", async () => {
    const response = await request(app.getHttpServer()).get("/api/clinicians/availability").query({
      startDate: "2026-05-01",
      endDate: "2026-05-02",
      timezone: "Mars/Phobos",
    });

    expect(response.status).toBe(400);
  });

  it("GET /api/clinicians/availability normalizes datetimes by timezone", async () => {
    const response = await request(app.getHttpServer()).get("/api/clinicians/availability").query({
      startDate: "2026-05-01T13:30:00.000Z",
      endDate: "2026-05-01T14:00:00.000Z",
      timezone: "Australia/Sydney",
      clinicianId: "clinician_001",
    });

    expect(response.status).toBe(200);
    expect(response.body[0].slots[0].date).toBe("2026-05-01");
  });
});
